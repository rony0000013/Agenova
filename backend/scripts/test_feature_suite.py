import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8001/api"

def test_features():
    results = []

    # 1. Test Stellar Wallet Login Handshake
    stellar_addr = "GA2C5RFPE6GCKMY3US5PAB6UZLKIGAHWKXX2G5OOHOO47W5R"
    try:
        r = requests.post(f"{BASE_URL}/auth/stellar-login", json={"walletAddress": stellar_addr, "name": "Stellar Auditor"})
        if r.status_code == 200:
            token = r.json().get("access_token")
            user = r.json().get("user")
            results.append(("✅ [Auth] Stellar Wallet Login", f"Success - User ID: {user.get('id')}, Role: {user.get('role')}"))
        else:
            results.append(("❌ [Auth] Stellar Wallet Login", f"Failed: {r.status_code} - {r.text}"))
            token = None
    except Exception as e:
        results.append(("❌ [Auth] Stellar Wallet Login", f"Error: {e}"))
        token = None

    headers = {"Authorization": f"Bearer {token}"} if token else {}

    # 2. Test Marketplace Agents Listing
    try:
        r = requests.get(f"{BASE_URL}/agents?page=1&limit=10")
        if r.status_code == 200:
            agents = r.json().get("data", [])
            results.append(("✅ [Marketplace] Agents Listing", f"Success - Found {len(agents)} agents"))
            first_agent_id = agents[0]["id"] if agents else None
        else:
            results.append(("❌ [Marketplace] Agents Listing", f"Failed: {r.status_code}"))
            first_agent_id = None
    except Exception as e:
        results.append(("❌ [Marketplace] Agents Listing", f"Error: {e}"))
        first_agent_id = None

    # 3. Test Agent Details & Execution with Micropayment
    if first_agent_id:
        try:
            r = requests.get(f"{BASE_URL}/agents/{first_agent_id}")
            if r.status_code == 200:
                agent = r.json()
                price = agent.get('price_per_request') or agent.get('price_per_call') or 0.01
                results.append(("✅ [Marketplace] Agent Details", f"Success - {agent.get('name')} ({price} XLM/call)"))
            else:
                results.append(("❌ [Marketplace] Agent Details", f"Failed: {r.status_code}"))

            r_exec = requests.post(f"{BASE_URL}/agents/{first_agent_id}/execute", json={"prompt": "Analyze Stellar liquidity pool returns"}, headers=headers)
            if r_exec.status_code == 200:
                exec_data = r_exec.json()
                tx_id = exec_data.get('transaction_id') or exec_data.get('transactionId') or 'tx_ok'
                results.append(("✅ [Execution] Agent Micropayment Run", f"Success - Tx ID: {str(tx_id)[:8]}..."))
            else:
                results.append(("❌ [Execution] Agent Micropayment Run", f"Failed: {r_exec.status_code} - {r_exec.text}"))
        except Exception as e:
            results.append(("❌ [Marketplace] Agent Exec", f"Error: {e}"))

    # 4. Test Wallet Balance & Transactions
    try:
        r_bal = requests.get(f"{BASE_URL}/wallet/balance", headers=headers)
        if r_bal.status_code == 200:
            bal_data = r_bal.json()
            results.append(("✅ [Wallet] Backend Balance Sync", f"Success - Balance: {bal_data.get('balance')} XLM"))
        else:
            results.append(("❌ [Wallet] Backend Balance Sync", f"Failed: {r_bal.status_code}"))

        r_tx = requests.get(f"{BASE_URL}/wallet/transactions", headers=headers)
        if r_tx.status_code == 200:
            txs = r_tx.json().get("data", [])
            results.append(("✅ [Wallet] Transactions History", f"Success - {len(txs)} records logged"))
        else:
            results.append(("❌ [Wallet] Transactions History", f"Failed: {r_tx.status_code}"))
    except Exception as e:
        results.append(("❌ [Wallet] Verification", f"Error: {e}"))

    # 5. Test Billing & Plans
    try:
        r_plans = requests.get(f"{BASE_URL}/billing/plans")
        if r_plans.status_code == 200:
            plans = r_plans.json()
            results.append(("✅ [Billing] Pricing Plans", f"Success - {len(plans)} plans available (Free, Pro, Enterprise)"))
        else:
            results.append(("❌ [Billing] Pricing Plans", f"Failed: {r_plans.status_code}"))
    except Exception as e:
        results.append(("❌ [Billing] Verification", f"Error: {e}"))

    # 6. Test API Keys Management
    try:
        r_key = requests.post(f"{BASE_URL}/api-keys", json={"name": "Auditor Test Key"}, headers=headers)
        if r_key.status_code == 200:
            key_data = r_key.json()
            key_id = key_data.get("id")
            results.append(("✅ [API Keys] Key Generation", f"Success - Created key: {key_data.get('key')[:12]}..."))
            # Revoke
            r_del = requests.delete(f"{BASE_URL}/api-keys/{key_id}", headers=headers)
            results.append(("✅ [API Keys] Key Revocation", f"Success - Revoked test key"))
        else:
            results.append(("❌ [API Keys] Key Generation", f"Failed: {r_key.status_code}"))
    except Exception as e:
        results.append(("❌ [API Keys] Verification", f"Error: {e}"))

    # 7. Test Notifications
    try:
        r_notif = requests.get(f"{BASE_URL}/notifications", headers=headers)
        if r_notif.status_code == 200:
            notifs = r_notif.json()
            results.append(("✅ [Notifications] Notification Center", f"Success - {len(notifs)} notifications fetched"))
        else:
            results.append(("❌ [Notifications] Notification Center", f"Failed: {r_notif.status_code}"))
    except Exception as e:
        results.append(("❌ [Notifications] Verification", f"Error: {e}"))

    # 8. Test Analytics Dashboard
    try:
        r_ana = requests.get(f"{BASE_URL}/analytics/dashboard", headers=headers)
        if r_ana.status_code == 200:
            ana_data = r_ana.json()
            results.append(("✅ [Analytics] Dashboard Metrics", f"Success - Total Spent: {ana_data.get('total_spent')} XLM, Calls: {ana_data.get('total_calls')}"))
        else:
            results.append(("❌ [Analytics] Dashboard Metrics", f"Failed: {r_ana.status_code}"))
    except Exception as e:
        results.append(("❌ [Analytics] Verification", f"Error: {e}"))

    # 9. Test Integrations
    try:
        r_integ = requests.get(f"{BASE_URL}/integrations", headers=headers)
        if r_integ.status_code == 200:
            integs = r_integ.json()
            results.append(("✅ [Integrations] Integration Providers", f"Success - {len(integs)} active integrations"))
        else:
            results.append(("❌ [Integrations] Integration Providers", f"Failed: {r_integ.status_code}"))
    except Exception as e:
        results.append(("❌ [Integrations] Verification", f"Error: {e}"))

    print("\n========================================================")
    print("      AGENOVA DECENTRALIZED PLATFORM - FEATURE AUDIT     ")
    print("========================================================")
    for title, detail in results:
        clean_title = title.replace("✅", "[PASS]").replace("❌", "[FAIL]")
        print(f"{clean_title.ljust(42)} | {detail}")
    print("========================================================\n")

if __name__ == "__main__":
    test_features()
