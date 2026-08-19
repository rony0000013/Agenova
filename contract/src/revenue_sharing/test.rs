#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};


#[test]
fn test_revenue_split() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RevenueSharingContract);
    let client = RevenueSharingContractClient::new(&env, &contract_id);

    let platform = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    client.initialize(&platform);

    let split = client.calculate_and_record_split(&developer, &agent_id, &i128::from(1000));

    assert_eq!(split.developer_share, 800);
    assert_eq!(split.platform_share, 200);
    assert_eq!(split.total_amount, 1000);

    assert_eq!(client.get_total_distributed(), 1000);
}

#[test]
fn test_payout() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RevenueSharingContract);
    let client = RevenueSharingContractClient::new(&env, &contract_id);

    let platform = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    client.initialize(&platform);
    client.calculate_and_record_split(&developer, &agent_id, &i128::from(1000));

    let payout = client.get_payout(&developer);
    assert_eq!(payout.total_earned, 800);
    assert_eq!(payout.pending_amount, 800);

    let amount = client.process_payout(&developer);
    assert_eq!(amount, 800);

    let payout_after = client.get_payout(&developer);
    assert_eq!(payout_after.pending_amount, 0);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_zero_amount() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RevenueSharingContract);
    let client = RevenueSharingContractClient::new(&env, &contract_id);

    let platform = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    client.initialize(&platform);
    client.calculate_and_record_split(&developer, &agent_id, &i128::from(0));
}
