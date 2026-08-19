from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.agent import Agent, AgentStatus
from app.models.user import User
from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.middleware.auth import get_current_user
from app.schemas.agent import AgentCreate, AgentUpdate, AgentResponse, AgentExecuteRequest, AgentExecuteResponse
from app.services.agent_service import execute_llm_request
from app.services.payment_service import calculate_revenue_split

router = APIRouter()

@router.get("")
async def list_agents(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
    category: str | None = None,
    search: str | None = None,
    sort: str = "popular",
    db: AsyncSession = Depends(get_db),
):
    query = select(Agent).where(Agent.status == AgentStatus.ACTIVE, Agent.is_active == True)
    if category:
        query = query.where(Agent.category == category)
    if search:
        query = query.where(Agent.name.ilike(f"%{search}%") | Agent.description.ilike(f"%{search}%"))

    total = await db.scalar(select(func.count()).select_from(query.subquery()))

    if sort == "price":
        query = query.order_by(Agent.price_per_request.asc())
    elif sort == "rating":
        query = query.order_by(Agent.rating.desc())
    else:
        query = query.order_by(Agent.total_requests.desc())

    query = query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    agents = result.scalars().all()

    return {
        "data": [AgentResponse.model_validate(a) for a in agents],
        "pagination": {"page": page, "limit": limit, "total": total, "total_pages": (total + limit - 1) // limit},
    }

@router.get("/my")
async def get_my_agents(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.developer_id == user.id))
    agents = result.scalars().all()
    return [AgentResponse.model_validate(a) for a in agents]

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return AgentResponse.model_validate(agent)

@router.post("", response_model=AgentResponse)
async def create_agent(
    data: AgentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    agent = Agent(
        name=data.name,
        description=data.description,
        category=data.category,
        model=data.model,
        prompt=data.prompt,
        price_per_request=data.price_per_request,
        developer_id=user.id,
        tags=",".join(data.tags) if data.tags else None,
        status=AgentStatus.ACTIVE,
    )
    db.add(agent)
    await db.flush()
    return AgentResponse.model_validate(agent)

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    data: AgentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.developer_id == user.id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(agent, field, value)
    await db.flush()
    return AgentResponse.model_validate(agent)

@router.delete("/{agent_id}")
async def delete_agent(agent_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.developer_id == user.id))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.is_active = False
    await db.flush()
    return {"message": "Agent deleted"}

@router.post("/{agent_id}/execute", response_model=AgentExecuteResponse)
async def execute_agent(
    agent_id: str,
    req: AgentExecuteRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.models.wallet import Wallet
    from app.services.payment_service import verify_horizon_transaction, execute_payment_split

    result = await db.execute(select(Agent).where(Agent.id == agent_id, Agent.is_active == True))
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Fetch user wallet
    w_res = await db.execute(select(Wallet).where(Wallet.user_id == user.id))
    user_wallet = w_res.scalar_one_or_none()

    if not user_wallet:
        user_wallet = Wallet(
            user_id=user.id,
            xlm_balance=100.0,
            address=user.wallet_address or "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        )
        db.add(user_wallet)
        await db.flush()

    verified_on_chain = False
    if req.tx_hash:
        try:
            tx_data = await verify_horizon_transaction(req.tx_hash)
            if tx_data.get("successful"):
                verified_on_chain = True
        except Exception:
            pass

    if not verified_on_chain:
        if user_wallet.xlm_balance < agent.price_per_request:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient XLM balance. Agent cost is {agent.price_per_request} XLM, but your balance is {user_wallet.xlm_balance} XLM. Please top up your wallet."
            )
        user_wallet.xlm_balance -= agent.price_per_request

    # Get developer address if available
    dev_address = ""
    if agent.developer_id:
        dev_res = await db.execute(select(User).where(User.id == agent.developer_id))
        dev_user = dev_res.scalar_one_or_none()
        if dev_user and dev_user.wallet_address:
            dev_address = dev_user.wallet_address

    # Execute payment split (80% dev, 20% platform)
    split = await execute_payment_split(
        amount=agent.price_per_request,
        developer_address=dev_address,
        platform_address="",
        agent_name=agent.name,
    )

    # Credit developer wallet in DB if different user
    if agent.developer_id and agent.developer_id != user.id:
        dev_w_res = await db.execute(select(Wallet).where(Wallet.user_id == agent.developer_id))
        dev_wallet = dev_w_res.scalar_one_or_none()
        if dev_wallet:
            dev_wallet.xlm_balance += split["developer_share"]

    # Execute LLM request
    result_text = await execute_llm_request(agent.model, agent.prompt, req.prompt)

    # Log transaction
    tx_desc = f"Execution of {agent.name} (Dev: {split['developer_share']} XLM, Platform: {split['platform_share']} XLM)"
    if req.tx_hash:
        tx_desc += f" [On-Chain Hash: {req.tx_hash[:12]}...]"

    tx = Transaction(
        type=TransactionType.PAYMENT,
        amount=agent.price_per_request,
        asset="XLM",
        user_id=user.id,
        agent_id=agent.id,
        status=TransactionStatus.COMPLETED,
        description=tx_desc,
    )
    db.add(tx)

    agent.total_requests += 1
    agent.total_revenue += split["developer_share"]
    await db.flush()

    return AgentExecuteResponse(
        result=result_text,
        transaction_id=req.tx_hash or tx.id,
        cost=agent.price_per_request,
    )


