use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, symbol_short};

const PLATFORM_FEE_BPS: u32 = 2000;
const DEVELOPER_SHARE_BPS: u32 = 8000;
const ONE_HUNDRED_PERCENT: u32 = 10000;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RevenueSplit {
    pub developer: Address,
    pub platform: Address,
    pub developer_share: i128,
    pub platform_share: i128,
    pub total_amount: i128,
    pub timestamp: u64,
    pub agent_id: BytesN<32>,
}

#[contracttype]
pub struct Payout {
    pub developer: Address,
    pub total_earned: i128,
    pub last_payout: u64,
    pub pending_amount: i128,
}

#[contracttype]
pub enum DataKey {
    Payout(Address),
    PlatformTreasury,
    TotalDistributed,
}

#[contract]
pub struct RevenueSharingContract;

#[contractimpl]
impl RevenueSharingContract {
    pub fn initialize(env: Env, platform_treasury: Address) {
        if env.storage().persistent().has(&DataKey::PlatformTreasury) {
            panic!("already initialized");
        }
        env.storage().persistent().set(&DataKey::PlatformTreasury, &platform_treasury);
    }

    pub fn calculate_and_record_split(
        env: Env,
        developer: Address,
        agent_id: BytesN<32>,
        amount: i128,
    ) -> RevenueSplit {
        let platform: Address = env
            .storage()
            .persistent()
            .get(&DataKey::PlatformTreasury)
            .unwrap_or_else(|| panic!("platform treasury not set"));

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let developer_share = (amount * DEVELOPER_SHARE_BPS as i128) / ONE_HUNDRED_PERCENT as i128;
        let platform_share = (amount * PLATFORM_FEE_BPS as i128) / ONE_HUNDRED_PERCENT as i128;
        let timestamp = env.ledger().timestamp();

        let split = RevenueSplit {
            developer: developer.clone(),
            platform: platform.clone(),
            developer_share: developer_share,
            platform_share: platform_share,
            total_amount: amount,
            timestamp,
            agent_id,
        };

        let mut payout: Payout = env
            .storage()
            .persistent()
            .get(&DataKey::Payout(developer.clone()))
            .unwrap_or(Payout {
                developer: developer.clone(),
                total_earned: 0,
                last_payout: 0,
                pending_amount: 0,
            });

        payout.total_earned += developer_share;
        payout.pending_amount += developer_share;
        payout.last_payout = timestamp;

        env.storage().persistent().set(&DataKey::Payout(developer.clone()), &payout);

        let total: i128 = env.storage().persistent().get(&DataKey::TotalDistributed).unwrap_or(0);
        env.storage().persistent().set(&DataKey::TotalDistributed, &(total + amount));

        env.events().publish(
            (symbol_short!("split"), developer, platform),
            developer_share,
        );

        split
    }

    pub fn get_payout(env: Env, developer: Address) -> Payout {
        env.storage()
            .persistent()
            .get(&DataKey::Payout(developer.clone()))
            .unwrap_or(Payout {
                developer,
                total_earned: 0,
                last_payout: 0,
                pending_amount: 0,
            })
    }

    pub fn process_payout(env: Env, developer: Address) -> i128 {
        let mut payout: Payout = env
            .storage()
            .persistent()
            .get(&DataKey::Payout(developer.clone()))
            .unwrap_or_else(|| panic!("no payout available"));

        let amount = payout.pending_amount;
        if amount <= 0 {
            panic!("no pending amount");
        }

        payout.pending_amount = 0;
        payout.last_payout = env.ledger().timestamp();

        env.storage().persistent().set(&DataKey::Payout(developer), &payout);

        env.events().publish((symbol_short!("payout"),), amount);
        amount
    }

    pub fn get_platform_treasury(env: Env) -> Address {
        env.storage()
            .persistent()
            .get(&DataKey::PlatformTreasury)
            .unwrap_or_else(|| panic!("platform treasury not set"))
    }

    pub fn get_total_distributed(env: Env) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalDistributed)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
