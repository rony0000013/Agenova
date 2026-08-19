use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, String, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Agent {
    pub id: BytesN<32>,
    pub developer: Address,
    pub name: String,
    pub description: String,
    pub category: String,
    pub price_per_request: i128,
    pub active: bool,
    pub total_requests: u64,
    pub total_revenue: i128,
    pub created_at: u64,
}

#[contracttype]
pub enum DataKey {
    Agent(BytesN<32>),
    DeveloperAgentCount(Address),
    AgentCount,
    AgentList,
}

#[contract]
pub struct AgentRegistryContract;

#[contractimpl]
impl AgentRegistryContract {
    pub fn register_agent(
        env: Env,
        developer: Address,
        name: String,
        description: String,
        category: String,
        price_per_request: i128,
    ) -> BytesN<32> {
        developer.require_auth();

        let agent_count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::AgentCount)
            .unwrap_or(0);

        let mut bytes = Bytes::new(&env);
        bytes.extend_from_array(&agent_count.to_le_bytes());
        let id: BytesN<32> = env.crypto().sha256(&bytes).into();
        let timestamp = env.ledger().timestamp();

        let agent = Agent {
            id: id.clone(),
            developer: developer.clone(),
            name,
            description,
            category,
            price_per_request,
            active: true,
            total_requests: 0,
            total_revenue: 0,
            created_at: timestamp,
        };

        env.storage().persistent().set(&DataKey::Agent(id.clone()), &agent);
        env.storage().persistent().set(&DataKey::AgentCount, &(agent_count + 1));

        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::DeveloperAgentCount(developer.clone()))
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::DeveloperAgentCount(developer.clone()), &(count + 1));

        env.events().publish((symbol_short!("reg"), developer), id.clone());
        id
    }

    pub fn get_agent(env: Env, agent_id: BytesN<32>) -> Option<Agent> {
        env.storage().persistent().get(&DataKey::Agent(agent_id))
    }

    pub fn update_agent_status(env: Env, developer: Address, agent_id: BytesN<32>, active: bool) {
        developer.require_auth();

        let mut agent = env
            .storage()
            .persistent()
            .get::<_, Agent>(&DataKey::Agent(agent_id.clone()))
            .unwrap_or_else(|| panic!("agent not found"));

        if agent.developer != developer {
            panic!("unauthorized");
        }

        agent.active = active;
        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
    }

    pub fn record_usage(
        env: Env,
        agent_id: BytesN<32>,
        amount: i128,
    ) {
        let mut agent = env
            .storage()
            .persistent()
            .get::<_, Agent>(&DataKey::Agent(agent_id.clone()))
            .unwrap_or_else(|| panic!("agent not found"));

        agent.total_requests += 1;
        agent.total_revenue += amount;

        env.storage().persistent().set(&DataKey::Agent(agent_id), &agent);
    }

    pub fn get_total_agents(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::AgentCount)
            .unwrap_or(0)
    }

    pub fn get_developer_agent_count(env: Env, developer: Address) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::DeveloperAgentCount(developer))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
