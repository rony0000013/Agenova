use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, BytesN, Env, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServiceAgreement {
    pub id: BytesN<32>,
    pub user: Address,
    pub developer: Address,
    pub agent_id: BytesN<32>,
    pub price_per_request: i128,
    pub max_requests: u64,
    pub requests_used: u64,
    pub active: bool,
    pub created_at: u64,
    pub expires_at: u64,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum AgreementStatus {
    Active,
    Completed,
    Canceled,
    Expired,
}

#[contracttype]
pub enum DataKey {
    Agreement(BytesN<32>),
    UserAgreementCount(Address),
    DeveloperAgreementCount(Address),
    AgreementCount,
}

#[contract]
pub struct ServiceAgreementContract;

#[contractimpl]
impl ServiceAgreementContract {
    pub fn create_agreement(
        env: Env,
        user: Address,
        developer: Address,
        agent_id: BytesN<32>,
        price_per_request: i128,
        max_requests: u64,
        duration_days: u64,
    ) -> BytesN<32> {
        user.require_auth();

        let count: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::AgreementCount)
            .unwrap_or(0);

        let mut bytes = Bytes::new(&env);
        bytes.extend_from_array(&count.to_le_bytes());
        let id: BytesN<32> = env.crypto().sha256(&bytes).into();
        let timestamp = env.ledger().timestamp();
        let expires_at = timestamp + (duration_days * 86400);

        let agreement = ServiceAgreement {
            id: id.clone(),
            user,
            developer,
            agent_id,
            price_per_request,
            max_requests,
            requests_used: 0,
            active: true,
            created_at: timestamp,
            expires_at,
        };

        env.storage().persistent().set(&DataKey::Agreement(id.clone()), &agreement);
        env.storage().persistent().set(&DataKey::AgreementCount, &(count + 1));

        env.events().publish((symbol_short!("agree"),), id.clone());
        id
    }

    pub fn get_agreement(env: Env, agreement_id: BytesN<32>) -> Option<ServiceAgreement> {
        env.storage().persistent().get(&DataKey::Agreement(agreement_id))
    }

    pub fn record_request(env: Env, agreement_id: BytesN<32>) -> bool {
        let mut agreement = env
            .storage()
            .persistent()
            .get::<_, ServiceAgreement>(&DataKey::Agreement(agreement_id.clone()))
            .unwrap_or_else(|| panic!("agreement not found"));

        if !agreement.active {
            panic!("agreement not active");
        }

        let current_time = env.ledger().timestamp();
        if current_time > agreement.expires_at {
            agreement.active = false;
            env.storage().persistent().set(&DataKey::Agreement(agreement_id), &agreement);
            panic!("agreement expired");
        }

        if agreement.requests_used >= agreement.max_requests {
            panic!("maximum requests reached");
        }

        agreement.requests_used += 1;

        if agreement.requests_used >= agreement.max_requests {
            agreement.active = false;
        }

        env.storage().persistent().set(&DataKey::Agreement(agreement_id), &agreement);
        agreement.active
    }

    pub fn cancel_agreement(env: Env, user: Address, agreement_id: BytesN<32>) {
        user.require_auth();

        let mut agreement = env
            .storage()
            .persistent()
            .get::<_, ServiceAgreement>(&DataKey::Agreement(agreement_id.clone()))
            .unwrap_or_else(|| panic!("agreement not found"));

        if agreement.user != user {
            panic!("unauthorized");
        }

        agreement.active = false;
        env.storage().persistent().set(&DataKey::Agreement(agreement_id.clone()), &agreement);

        env.events().publish((symbol_short!("cancel"),), agreement_id);
    }

    pub fn get_agreement_status(env: Env, agreement_id: BytesN<32>) -> AgreementStatus {
        let agreement = env
            .storage()
            .persistent()
            .get::<_, ServiceAgreement>(&DataKey::Agreement(agreement_id))
            .unwrap_or_else(|| panic!("agreement not found"));

        if !agreement.active {
            if agreement.requests_used >= agreement.max_requests {
                return AgreementStatus::Completed;
            }
            return AgreementStatus::Canceled;
        }

        let current_time = env.ledger().timestamp();
        if current_time > agreement.expires_at {
            return AgreementStatus::Expired;
        }

        AgreementStatus::Active
    }
}

#[cfg(test)]
mod test;
