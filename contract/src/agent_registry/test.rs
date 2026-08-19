#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};


#[test]
fn test_register_and_get_agent() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, AgentRegistryContract);
    let client = AgentRegistryContractClient::new(&env, &contract_id);

    let developer = Address::generate(&env);
    let name = String::from_str(&env, "GPT-4 Writer");
    let description = String::from_str(&env, "Professional writing agent");
    let category = String::from_str(&env, "writing");

    let agent_id = client.register_agent(&developer, &name, &description, &category, &i128::from(50));

    let agent = client.get_agent(&agent_id).unwrap();
    assert_eq!(agent.name, name);
    assert_eq!(agent.developer, developer);
    assert_eq!(agent.active, true);

    assert_eq!(client.get_total_agents(), 1);
    assert_eq!(client.get_developer_agent_count(&developer), 1);
}

#[test]
fn test_update_agent_status() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, AgentRegistryContract);
    let client = AgentRegistryContractClient::new(&env, &contract_id);

    let developer = Address::generate(&env);
    let agent_id = client.register_agent(
        &developer,
        &String::from_str(&env, "Test Agent"),
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "coding"),
        &i128::from(100),
    );

    client.update_agent_status(&developer, &agent_id, &false);
    let agent = client.get_agent(&agent_id).unwrap();
    assert_eq!(agent.active, false);
}

#[test]
#[should_panic(expected = "unauthorized")]
fn test_unauthorized_update() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, AgentRegistryContract);
    let client = AgentRegistryContractClient::new(&env, &contract_id);

    let developer = Address::generate(&env);
    let imposter = Address::generate(&env);

    let agent_id = client.register_agent(
        &developer,
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "Test"),
        &String::from_str(&env, "other"),
        &i128::from(10),
    );

    client.update_agent_status(&imposter, &agent_id, &false);
}
