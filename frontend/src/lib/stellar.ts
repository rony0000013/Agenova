import {
  Horizon,
  Operation,
  TransactionBuilder,
  Networks,
  Asset,
  StrKey,
  Memo,
} from '@stellar/stellar-sdk';
import { STELLAR_TESTNET_PASSPHRASE } from './freighter';

export const HORIZON_TESTNET_URL = 'https://horizon-testnet.stellar.org';
export const SOROBAN_RPC_TESTNET_URL = 'https://soroban-testnet.stellar.org';
export const FRIENDBOT_URL = 'https://friendbot.stellar.org';
export const BASE_FEE = '100'; // in stroops

export const horizonServer = new Horizon.Server(HORIZON_TESTNET_URL);

export interface StellarAccountBalance {
  address: string;
  xlm: string;
  spendable: string;
  usdc: string;
  funded: boolean;
  sequenceNumber?: string;
  subentryCount: number;
}

export interface PaymentItem {
  id: string;
  type: 'payment' | 'create_account' | 'account_merge';
  from: string;
  to: string;
  amount: string;
  asset: string;
  createdAt: string;
  txHash: string;
  direction: 'sent' | 'received';
  memo?: string;
}

/** Convert XLM string (e.g. "10.5") to stroops bigint */
export function toStroops(xlm: string | number): bigint {
  const [whole, dec = ''] = String(xlm).trim().split('.');
  const padded = (dec + '0000000').slice(0, 7);
  return BigInt(whole || '0') * 10_000_000n + BigInt(padded);
}

/** Convert stroops to standard 7-decimal XLM string representation */
export function fromStroops(stroops: bigint | string | number): string {
  const s = BigInt(stroops).toString();
  if (s.length <= 7) {
    const padded = s.padStart(7, '0');
    return `0.${padded}`.replace(/\.?0+$/, '') || '0';
  }
  const whole = s.slice(0, -7);
  const dec = s.slice(-7).replace(/\.?0+$/, '');
  return dec ? `${whole}.${dec}` : whole;
}

/** Validate Stellar address (G...) */
export function isValidStellarAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return StrKey.isValidEd25519PublicKey(address.trim());
}

/** Fetch live balance & reserves for an address on Stellar Testnet */
export async function fetchStellarAccount(address: string): Promise<StellarAccountBalance> {
  if (!isValidStellarAddress(address)) {
    return {
      address,
      xlm: '0.00',
      spendable: '0.00',
      usdc: '0.00',
      funded: false,
      subentryCount: 0,
    };
  }

  try {
    const account = await horizonServer.loadAccount(address.trim());

    let xlmBalance = '0';
    let usdcBalance = '0';

    for (const b of account.balances) {
      if (b.asset_type === 'native') {
        xlmBalance = b.balance;
      } else if ('asset_code' in b && b.asset_code === 'USDC') {
        usdcBalance = b.balance;
      }
    }

    // Stellar reserve math: (2 + subentries) * 0.5 XLM + fee buffer (0.01 XLM)
    const baseReserve = 0.5;
    const lockedReserve = (2 + (account.subentry_count || 0)) * baseReserve;
    const rawXlm = parseFloat(xlmBalance) || 0;
    const spendableNum = Math.max(0, rawXlm - lockedReserve - 0.01);
    const spendable = spendableNum > 0 ? spendableNum.toFixed(4) : '0.00';

    return {
      address,
      xlm: parseFloat(xlmBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
      spendable,
      usdc: parseFloat(usdcBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      funded: true,
      sequenceNumber: account.sequence,
      subentryCount: account.subentry_count || 0,
    };
  } catch (err: any) {
    if (err?.response?.status === 404 || err?.name === 'NotFoundError') {
      return {
        address,
        xlm: '0.00',
        spendable: '0.00',
        usdc: '0.00',
        funded: false,
        subentryCount: 0,
      };
    }
    throw new Error(describeStellarError(err));
  }
}

/** Check whether a destination account exists on-chain */
export async function accountExists(address: string): Promise<boolean> {
  try {
    await horizonServer.loadAccount(address.trim());
    return true;
  } catch {
    return false;
  }
}

/** Request 10,000 Testnet XLM from Friendbot */
export async function fundTestnetFriendbot(address: string): Promise<{ success: boolean; message: string }> {
  if (!isValidStellarAddress(address)) {
    throw new Error('Please provide a valid Stellar address starting with G.');
  }

  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address.trim())}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Friendbot faucet failed: ${text || res.statusText}`);
  }

  return {
    success: true,
    message: 'Successfully received 10,000 Testnet XLM from Friendbot!',
  };
}

export interface BuildPaymentParams {
  sourceAddress: string;
  destinationAddress: string;
  amountXlm: string;
  memo?: string;
  networkPassphrase?: string;
}

/** Build an unsigned transaction XDR for classic Stellar payment */
export async function buildPaymentXdr(params: BuildPaymentParams): Promise<string> {
  const {
    sourceAddress,
    destinationAddress,
    amountXlm,
    memo,
    networkPassphrase = STELLAR_TESTNET_PASSPHRASE,
  } = params;

  if (!isValidStellarAddress(sourceAddress)) {
    throw new Error('Source account address is invalid.');
  }
  if (!isValidStellarAddress(destinationAddress)) {
    throw new Error('Destination account address is invalid.');
  }

  const amt = parseFloat(amountXlm);
  if (isNaN(amt) || amt <= 0) {
    throw new Error('Please enter a valid positive XLM amount.');
  }

  // Load current source account sequence
  const sourceAccount = await horizonServer.loadAccount(sourceAddress);
  const destExists = await accountExists(destinationAddress);

  const builder = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  });

  if (destExists) {
    builder.addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount: amt.toFixed(7),
      })
    );
  } else {
    // If destination does not exist, use createAccount (minimum 1 XLM starting balance)
    if (amt < 1.0) {
      throw new Error('Destination account is not funded yet. A minimum of 1.0 XLM is required to create a new Stellar account.');
    }
    builder.addOperation(
      Operation.createAccount({
        destination: destinationAddress,
        startingBalance: amt.toFixed(7),
      })
    );
  }

  if (memo && memo.trim().length > 0) {
    builder.addMemo(Memo.text(memo.trim().slice(0, 28)));
  }

  builder.setTimeout(180);

  const transaction = builder.build();
  return transaction.toXDR();
}

/** Submit signed transaction XDR to Horizon */
export async function submitSignedTransaction(signedXdr: string): Promise<Horizon.HorizonApi.SubmitTransactionResponse> {
  const tx = TransactionBuilder.fromXDR(signedXdr, STELLAR_TESTNET_PASSPHRASE);
  try {
    const result = await horizonServer.submitTransaction(tx);
    return result;
  } catch (err: any) {
    throw new Error(describeStellarError(err));
  }
}

/** Fetch payment history operations for an address */
export async function fetchAccountPayments(address: string, limit = 20): Promise<PaymentItem[]> {
  if (!isValidStellarAddress(address)) return [];

  try {
    const page = await horizonServer
      .payments()
      .forAccount(address.trim())
      .order('desc')
      .limit(limit)
      .call();

    return page.records.map((record: any): PaymentItem => {
      const isCreateAccount = record.type === 'create_account';
      const from = isCreateAccount ? record.funder : record.from || record.source_account;
      const to = isCreateAccount ? record.account : record.to;
      const amount = isCreateAccount ? record.starting_balance : record.amount || '0';
      const asset = isCreateAccount ? 'XLM' : record.asset_type === 'native' ? 'XLM' : record.asset_code || 'Tokens';
      const direction = (from || '').toLowerCase() === address.toLowerCase() ? 'sent' : 'received';

      return {
        id: record.id,
        type: record.type,
        from: from || 'Unknown',
        to: to || 'Unknown',
        amount: parseFloat(amount).toFixed(2),
        asset,
        createdAt: record.created_at,
        txHash: record.transaction_hash,
        direction,
      };
    });
  } catch (err) {
    console.warn('Could not fetch payment operations from Horizon:', err);
    return [];
  }
}

/** Translate Horizon error codes into clear actionable messages */
export function describeStellarError(err: any): string {
  if (!err) return 'Unknown Stellar network error occurred.';
  if (typeof err === 'string') return err;

  const resultCodes = err?.response?.data?.extras?.result_codes;
  if (resultCodes) {
    const opCodes = resultCodes.operations;
    const txCode = resultCodes.transaction;

    if (opCodes?.includes('op_underfunded') || txCode === 'tx_insufficient_balance') {
      return 'Insufficient XLM balance to complete this transaction (including base reserve and network fee).';
    }
    if (opCodes?.includes('op_low_reserve')) {
      return 'Transaction would drop the account below Stellar minimum base reserve (1 XLM).';
    }
    if (opCodes?.includes('op_no_destination')) {
      return 'Destination account does not exist on Stellar network.';
    }
    if (txCode === 'tx_bad_seq') {
      return 'Account sequence number mismatch. Please refresh and retry.';
    }
    if (txCode === 'tx_insufficient_fee') {
      return 'Network fee is too low for current network congestion.';
    }
  }

  if (err?.message) return err.message;
  return 'Stellar Horizon communication error.';
}
