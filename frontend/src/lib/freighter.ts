import {
  isConnected,
  isAllowed,
  setAllowed,
  getAddress,
  requestAccess,
  getNetwork,
  getNetworkDetails,
  signTransaction,
  signAuthEntry,
  signMessage,
} from '@stellar/freighter-api';

export const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const STELLAR_PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

export class FreighterError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'FreighterError';
    this.code = code;
  }
}

/** Check if the Freighter browser extension is installed with readiness probe */
export async function isFreighterInstalled(retries = 3, delayMs = 100): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res: any = await isConnected();
      if (typeof res === 'boolean' && res) return true;
      if (res && typeof res.isConnected === 'boolean' && res.isConnected) return true;
      if (typeof window !== 'undefined' && (window as any).freighter) return true;
    } catch {
      // Continue polling if cold loading
    }
    if (i < retries - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return typeof window !== 'undefined' && !!(window as any).freighter;
}

/** Check whether user previously authorized this site (non-intrusive, no popup) */
export async function checkFreighterAllowed(): Promise<boolean> {
  try {
    const res: any = await isAllowed();
    if (typeof res === 'boolean') return res;
    if (res && typeof res.isAllowed === 'boolean') return res.isAllowed;
    return false;
  } catch {
    return false;
  }
}

export interface FreighterNetworkInfo {
  network: string;
  networkUrl: string;
  networkPassphrase: string;
  sorobanRpcUrl?: string;
}

/** Retrieve current network details from Freighter extension */
export async function getFreighterNetworkInfo(): Promise<FreighterNetworkInfo> {
  try {
    const detailsRes: any = await getNetworkDetails();
    if (detailsRes && !detailsRes.error) {
      return {
        network: detailsRes.network || 'TESTNET',
        networkUrl: detailsRes.networkUrl || 'https://horizon-testnet.stellar.org',
        networkPassphrase: detailsRes.networkPassphrase || STELLAR_TESTNET_PASSPHRASE,
        sorobanRpcUrl: detailsRes.sorobanRpcUrl || 'https://soroban-testnet.stellar.org',
      };
    }

    const netRes: any = await getNetwork();
    const network = netRes?.network || 'TESTNET';
    const networkPassphrase = netRes?.networkPassphrase || STELLAR_TESTNET_PASSPHRASE;
    return {
      network,
      networkUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase,
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    };
  } catch {
    return {
      network: 'TESTNET',
      networkUrl: 'https://horizon-testnet.stellar.org',
      networkPassphrase: STELLAR_TESTNET_PASSPHRASE,
      sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
    };
  }
}

/** Check if Freighter is currently configured on Stellar Testnet */
export function isTestnet(passphraseOrNetwork?: string): boolean {
  if (!passphraseOrNetwork) return true;
  const str = passphraseOrNetwork.toLowerCase();
  return str.includes('test') || passphraseOrNetwork === STELLAR_TESTNET_PASSPHRASE;
}

/** Request access and retrieve user's public key from Freighter */
export async function connectFreighter(): Promise<{ address: string; network: FreighterNetworkInfo }> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterError(
      'Freighter extension not detected. Please install the Freighter wallet extension from https://www.freighter.app/ to continue.',
      'NOT_INSTALLED'
    );
  }

  try {
    const allowedRes: any = await setAllowed();
    if (allowedRes && allowedRes.error) {
      throw new FreighterError(describeFreighterError(allowedRes.error), 'PERMISSION_DENIED');
    }

    let accessRes: any = await requestAccess();
    if (!accessRes || accessRes.error) {
      accessRes = await getAddress();
    }

    if (accessRes && accessRes.error) {
      throw new FreighterError(describeFreighterError(accessRes.error), 'ACCESS_REJECTED');
    }

    const pubKey =
      typeof accessRes === 'string'
        ? accessRes
        : accessRes?.address || accessRes?.publicKey;

    if (!pubKey || typeof pubKey !== 'string' || !pubKey.startsWith('G')) {
      throw new FreighterError('Could not retrieve a valid Stellar public key from Freighter.', 'INVALID_ADDRESS');
    }

    const network = await getFreighterNetworkInfo();

    return { address: pubKey, network };
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(describeFreighterError(err), 'CONNECT_FAILED');
  }
}

/** Get the currently selected address without prompting if already allowed */
export async function getFreighterAddress(): Promise<string | null> {
  try {
    const res: any = await getAddress();
    if (res && !res.error && res.address) {
      return res.address;
    }
    if (typeof res === 'string' && res.startsWith('G')) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}

/** Prompt Freighter to sign a built transaction XDR */
export async function signFreighterTransaction(
  xdr: string,
  opts?: { networkPassphrase?: string; address?: string }
): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterError('Freighter wallet extension is not installed.', 'NOT_INSTALLED');
  }

  try {
    const res: any = await signTransaction(xdr, {
      networkPassphrase: opts?.networkPassphrase || STELLAR_TESTNET_PASSPHRASE,
      address: opts?.address,
    });

    if (res && res.error) {
      throw new FreighterError(describeFreighterError(res.error), 'SIGN_REJECTED');
    }

    const signedXdr = typeof res === 'string' ? res : res?.signedTxXdr || res?.signedXDR;
    if (!signedXdr || typeof signedXdr !== 'string') {
      throw new FreighterError('Failed to receive signed transaction XDR from Freighter.', 'SIGN_EMPTY');
    }

    return signedXdr;
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(describeFreighterError(err), 'SIGN_FAILED');
  }
}

/** Prompt Freighter to sign Soroban Auth Entry XDR */
export async function signFreighterAuthEntry(
  entryXdr: string,
  opts?: { networkPassphrase?: string; address?: string }
): Promise<string> {
  try {
    const res: any = await signAuthEntry(entryXdr, {
      networkPassphrase: opts?.networkPassphrase || STELLAR_TESTNET_PASSPHRASE,
      address: opts?.address,
    });

    if (res && res.error) {
      throw new FreighterError(describeFreighterError(res.error), 'AUTH_SIGN_REJECTED');
    }

    const signedAuth = typeof res === 'string' ? res : res?.signedAuthEntry;
    if (!signedAuth) {
      throw new FreighterError('Failed to receive signed auth entry from Freighter.', 'AUTH_SIGN_EMPTY');
    }

    return signedAuth;
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(describeFreighterError(err), 'AUTH_SIGN_FAILED');
  }
}

/** Prompt Freighter to sign an arbitrary message */
export async function signFreighterMessage(
  message: string,
  opts?: { networkPassphrase?: string; address?: string }
): Promise<string> {
  try {
    const res: any = await signMessage(message, {
      networkPassphrase: opts?.networkPassphrase || STELLAR_TESTNET_PASSPHRASE,
      address: opts?.address,
    });

    if (res && res.error) {
      throw new FreighterError(describeFreighterError(res.error), 'MESSAGE_SIGN_REJECTED');
    }

    const signed = typeof res === 'string' ? res : res?.signedMessage;
    return typeof signed === 'string' ? signed : JSON.stringify(signed);
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(describeFreighterError(err), 'MESSAGE_SIGN_FAILED');
  }
}

/** Map Freighter raw errors to friendly explanations */
export function describeFreighterError(err: any): string {
  if (!err) return 'Unknown Freighter error occurred';
  const msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);

  if (msg.includes('User declined') || msg.includes('User rejected') || msg.includes('rejected')) {
    return 'Transaction or connection request was declined in Freighter.';
  }
  if (msg.includes('not installed') || msg.includes('not detected') || msg.includes('Freighter is not')) {
    return 'Freighter wallet extension is not installed. Please install it from freighter.app.';
  }
  if (msg.includes('locked') || msg.includes('Unlock')) {
    return 'Freighter wallet is locked. Please open your extension and unlock it.';
  }
  if (msg.includes('network') || msg.includes('passphrase')) {
    return 'Network mismatch. Please switch your Freighter wallet to Stellar Testnet.';
  }
  return msg;
}
