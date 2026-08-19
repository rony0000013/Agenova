import { isConnected, setAllowed, getAddress, requestAccess } from '@stellar/freighter-api';

export class FreighterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FreighterError';
  }
}

/** Check if the Freighter Chrome extension is installed in the browser */
export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const res: any = await isConnected();
    if (typeof res === 'boolean') return res;
    if (res && typeof res.isConnected === 'boolean') return res.isConnected;
    return typeof window !== 'undefined' && !!(window as any).freighter;
  } catch {
    return typeof window !== 'undefined' && !!(window as any).freighter;
  }
}

/** Trigger Freighter popup, request permission, and return user's Stellar Public Key (G...) */
export async function connectFreighter(): Promise<string> {
  const installed = await isFreighterInstalled();
  if (!installed) {
    throw new FreighterError(
      'Freighter Chrome Extension not detected. Please install Freighter from https://www.freighter.app/'
    );
  }

  try {
    const allowed: any = await setAllowed();
    if (allowed && allowed.error) {
      throw new FreighterError(allowed.error);
    }

    // Try requestAccess or getAddress
    let addressRes: any = await requestAccess();
    if (!addressRes || addressRes.error) {
      addressRes = await getAddress();
    }

    const pubKey = typeof addressRes === 'string' ? addressRes : addressRes?.address || addressRes?.publicKey;
    if (!pubKey || typeof pubKey !== 'string') {
      throw new FreighterError('Could not retrieve public key from Freighter wallet.');
    }

    return pubKey;
  } catch (err: any) {
    if (err instanceof FreighterError) throw err;
    throw new FreighterError(err.message || 'Failed to connect Freighter wallet.');
  }
}
