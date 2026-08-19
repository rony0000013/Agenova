#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};


#[test]
fn test_create_and_get_agreement() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, ServiceAgreementContract);
    let client = ServiceAgreementContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    let agreement_id = client.create_agreement(
        &user,
        &developer,
        &agent_id,
        &i128::from(50),
        &10,
        &30,
    );

    let agreement = client.get_agreement(&agreement_id).unwrap();
    assert_eq!(agreement.user, user);
    assert_eq!(agreement.developer, developer);
    assert_eq!(agreement.active, true);

    let status = client.get_agreement_status(&agreement_id);
    assert_eq!(status, AgreementStatus::Active);
}

#[test]
fn test_record_request() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, ServiceAgreementContract);
    let client = ServiceAgreementContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    let agreement_id = client.create_agreement(
        &user,
        &developer,
        &agent_id,
        &i128::from(50),
        &3,
        &30,
    );

    assert_eq!(client.record_request(&agreement_id), true);
    assert_eq!(client.record_request(&agreement_id), true);
    assert_eq!(client.record_request(&agreement_id), false);

    let status = client.get_agreement_status(&agreement_id);
    assert_eq!(status, AgreementStatus::Completed);
}

#[test]
fn test_cancel_agreement() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, ServiceAgreementContract);
    let client = ServiceAgreementContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let developer = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    let agreement_id = client.create_agreement(
        &user,
        &developer,
        &agent_id,
        &i128::from(50),
        &10,
        &30,
    );

    client.cancel_agreement(&user, &agreement_id);
    let status = client.get_agreement_status(&agreement_id);
    assert_eq!(status, AgreementStatus::Canceled);
}

#[test]
#[should_panic(expected = "unauthorized")]
fn test_unauthorized_cancel() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, ServiceAgreementContract);
    let client = ServiceAgreementContractClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let developer = Address::generate(&env);
    let imposter = Address::generate(&env);
    let agent_id = BytesN::from_array(&env, &[1u8; 32]);

    let agreement_id = client.create_agreement(
        &user,
        &developer,
        &agent_id,
        &i128::from(50),
        &10,
        &30,
    );

    client.cancel_agreement(&imposter, &agreement_id);
}
