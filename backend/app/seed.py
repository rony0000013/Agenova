import logging
from sqlalchemy import select
from app.database import async_session
from app.models.user import User, UserRole
from app.models.agent import Agent, AgentCategory, AgentStatus

from app.models.wallet import Wallet
from app.models.subscription import Subscription, SubscriptionPlan, SubscriptionStatus
from app.models.integration import Integration, IntegrationType

from app.models.notification import Notification, NotificationType

from app.models.api_key import APIKey

from app.services.auth_service import hash_password

logger = logging.getLogger("agenova.seed")

async def seed_initial_data():
    async with async_session() as db:
        try:
            # Check if database is already seeded
            res = await db.execute(select(User).limit(1))
            if res.scalar_one_or_none():
                logger.info("Database already contains users. Skipping initial seed.")
                return

            logger.info("Seeding initial data for Agenova...")

            # 1. Create Admin and Demo User
            demo_user = User(
                email="demo@agenova.ai",
                password_hash=hash_password("Password123!"),
                name="Alex Vance",
                company="Stellar Labs",
                role=UserRole.DEVELOPER,
                wallet_address="GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
                is_verified=True,
            )
            db.add(demo_user)

            admin_user = User(
                email="admin@agenova.ai",
                password_hash=hash_password("Admin123!"),
                name="Platform Administrator",
                company="Agenova Inc",
                role=UserRole.ADMIN,
                wallet_address="GDUHFTZNWCSV5EB4R3VZQFYG7XPLH7HNONOSTY22PAGFUNCXJN3YEFYX",
                is_verified=True,
            )
            db.add(admin_user)
            await db.flush()

            # 2. Wallet for Demo User
            demo_wallet = Wallet(
                user_id=demo_user.id,
                xlm_balance=250.00,
                usdc_balance=50.00,
                address=demo_user.wallet_address,
                is_connected=True,
            )
            db.add(demo_wallet)


            # 3. Active Subscription for Demo User
            demo_sub = Subscription(
                user_id=demo_user.id,
                plan=SubscriptionPlan.PRO,
                status=SubscriptionStatus.ACTIVE,
            )
            db.add(demo_sub)


            # 4. Featured AI Agents
            agents_data = [
                {
                    "name": "Soroban Smart Contract Auditor",
                    "description": "Scans Rust Soroban contracts for reentrancy, authorization bypasses, and overflow vulnerabilities.",
                    "category": AgentCategory.CODING,
                    "model": "gpt-4o",
                    "prompt": "You are an elite Soroban smart contract auditor. Analyze the submitted Rust code for security flaws, memory safety, and optimization issues. Structure your output into Vulnerabilities, Recommendations, and Severity Rating.",
                    "price_per_request": 0.50,
                    "rating": 4.9,
                    "total_requests": 1420,
                    "total_revenue": 710.00,
                    "tags": "Soroban,Rust,Security,Audit",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
                {
                    "name": "Corsair GitHub Workflow Automation",
                    "description": "Parses incoming PR diffs and automatically generates unit test suites and updates documentation via Corsair webhooks.",
                    "category": AgentCategory.PRODUCTIVITY,
                    "model": "gpt-4o",
                    "prompt": "You are a DevOps automation assistant. Analyze the input diff and generate production-ready unit tests and updated documentation snippets.",
                    "price_per_request": 0.25,
                    "rating": 4.8,
                    "total_requests": 980,
                    "total_revenue": 245.00,
                    "tags": "GitHub,Corsair,CI/CD,Testing",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
                {
                    "name": "Stellar Micropayment Yield Calculator",
                    "description": "Calculates real-time arbitrage and liquidity yield pools across Stellar Horizon DEX and Soroban AMMs.",
                    "category": AgentCategory.ANALYSIS,
                    "model": "claude-3-5-sonnet",
                    "prompt": "You are a DeFi quantitative analyst. Process pool metrics and compute expected yield returns, impermanent loss risk, and transaction path recommendations.",
                    "price_per_request": 0.10,
                    "rating": 4.7,
                    "total_requests": 2150,
                    "total_revenue": 215.00,
                    "tags": "DeFi,Stellar,Yield,Liquidity",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
                {
                    "name": "Legal Contract Summarizer & Risk Rating",
                    "description": "Extracts indemnity, termination liability, and compliance terms from SaaS agreements into structured JSON.",
                    "category": AgentCategory.OTHER,
                    "model": "gpt-4o",
                    "prompt": "You are a senior corporate counsel AI. Summarize the submitted legal text into Key Provisions, Risk Highlights, and Compliance Checkpoints.",
                    "price_per_request": 0.75,
                    "rating": 4.95,
                    "total_requests": 630,
                    "total_revenue": 472.50,
                    "tags": "Legal,Contracts,Compliance,Enterprise",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
                {
                    "name": "Slack & Notion Knowledge Synthesizer",
                    "description": "Synthesizes customer support threads and updates knowledge base docs across Notion & Slack via Corsair plugins.",
                    "category": AgentCategory.PRODUCTIVITY,
                    "model": "gpt-4o-mini",
                    "prompt": "You are a technical documentation specialist. Convert unstructured chat threads into clean markdown documentation articles.",
                    "price_per_request": 0.05,
                    "rating": 4.6,
                    "total_requests": 3400,
                    "total_revenue": 170.00,
                    "tags": "Notion,Slack,Corsair,Docs",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
                {
                    "name": "Enterprise Marketing Copywriter",
                    "description": "Generates high-converting AIDA marketing headlines, blog summaries, and email nurture sequences.",
                    "category": AgentCategory.MARKETING,
                    "model": "gpt-4o",
                    "prompt": "You are a world-class persuasion copywriter. Craft compelling headlines, value propositions, and email copy following Cohere editorial standards.",
                    "price_per_request": 0.15,
                    "rating": 4.85,
                    "total_requests": 1820,
                    "total_revenue": 273.00,
                    "tags": "Copywriting,Marketing,SEO,AIDA",
                    "developer_id": demo_user.id,
                    "status": AgentStatus.ACTIVE,
                },
            ]

            for a_data in agents_data:
                agent = Agent(**a_data)
                db.add(agent)

            # 5. Integrations for Demo User
            integrations_data = [
                Integration(user_id=demo_user.id, type=IntegrationType.GITHUB, name="GitHub Webhooks", connected=True, config='{"repo": "stellar/soroban-example"}'),
                Integration(user_id=demo_user.id, type=IntegrationType.SLACK, name="Slack Bot", connected=True, config='{"channel": "#ai-marketplace-alerts"}'),
                Integration(user_id=demo_user.id, type=IntegrationType.NOTION, name="Notion Docs", connected=False, config='{}'),
            ]
            for i in integrations_data:
                db.add(i)

            # 6. Notifications
            notifications_data = [
                Notification(user_id=demo_user.id, type=NotificationType.SYSTEM, title="Welcome to Agenova!", message="Your Stellar Freighter wallet is linked. Explore pay-per-request AI agents.", read=False),
                Notification(user_id=demo_user.id, type=NotificationType.PAYMENT, title="Wallet Top-Up", message="Received 250 XLM faucet drop on Stellar Testnet.", read=True),
            ]
            for n in notifications_data:
                db.add(n)


            # 7. API Key
            api_key = APIKey(
                user_id=demo_user.id,
                name="Production Server Key",
                key_prefix="ag_live_9a87",
                key_hash="dummy_hash_for_demo_key",
            )
            db.add(api_key)

            await db.commit()
            logger.info("Database successfully seeded with initial AI Agents and demo user!")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error seeding database: {e}")
