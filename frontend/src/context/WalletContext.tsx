import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  isFreighterInstalled,
  checkFreighterAllowed,
  connectFreighter,
  getFreighterAddress,
  getFreighterNetworkInfo,
  isTestnet,
  signFreighterTransaction,
  type FreighterNetworkInfo,
  FreighterError,
} from '../lib/freighter';
import {
  fetchStellarAccount,
  fundTestnetFriendbot,
  buildPaymentXdr,
  submitSignedTransaction,
  type StellarAccountBalance,
} from '../lib/stellar';

export type WalletStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'not_installed'
  | 'wrong_network';

export interface WalletContextType {
  status: WalletStatus;
  address: string | null;
  network: FreighterNetworkInfo | null;
  isTestnetNetwork: boolean;
  balance: StellarAccountBalance;
  isLoadingBalance: boolean;
  isInstalled: boolean;
  error: string | null;
  connect: () => Promise<string>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  requestFaucet: () => Promise<string>;
  sendPayment: (params: { destination: string; amount: string; memo?: string }) => Promise<string>;
}

const defaultBalance: StellarAccountBalance = {
  address: '',
  xlm: '0.00',
  spendable: '0.00',
  usdc: '0.00',
  funded: false,
  subentryCount: 0,
};

const DISCONNECTED_KEY = 'stellar_pay:wallet_disconnected';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('idle');
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<FreighterNetworkInfo | null>(null);
  const [isTestnetNetwork, setIsTestnetNetwork] = useState<boolean>(true);
  const [balance, setBalance] = useState<StellarAccountBalance>(defaultBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check extension presence
  useEffect(() => {
    isFreighterInstalled().then(setIsInstalled);
  }, []);

  // Fetch live balance for active address
  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(defaultBalance);
      return;
    }
    setIsLoadingBalance(true);
    try {
      const data = await fetchStellarAccount(address);
      setBalance(data);
    } catch (err: any) {
      console.warn('Balance refresh warning:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      refreshBalance();
    }
  }, [address, refreshBalance]);

  // Connect explicit flow
  const connect = useCallback(async (): Promise<string> => {
    setStatus('connecting');
    setError(null);
    try {
      const { address: pubKey, network: netInfo } = await connectFreighter();
      localStorage.removeItem(DISCONNECTED_KEY);
      setAddress(pubKey);
      setNetwork(netInfo);
      const isTest = isTestnet(netInfo.networkPassphrase || netInfo.network);
      setIsTestnetNetwork(isTest);
      setStatus(isTest ? 'connected' : 'wrong_network');
      setIsInstalled(true);
      return pubKey;
    } catch (err: any) {
      const msg = err.message || 'Failed to connect Freighter wallet.';
      setError(msg);
      if (err instanceof FreighterError && err.code === 'NOT_INSTALLED') {
        setStatus('not_installed');
      } else {
        setStatus('disconnected');
      }
      throw err;
    }
  }, []);

  // Disconnect explicit flow
  const disconnect = useCallback(() => {
    try {
      localStorage.setItem(DISCONNECTED_KEY, 'true');
    } catch {}
    setAddress(null);
    setNetwork(null);
    setBalance(defaultBalance);
    setStatus('disconnected');
    setError(null);
  }, []);

  // Request Friendbot testnet faucet funds
  const requestFaucet = useCallback(async (): Promise<string> => {
    if (!address) {
      throw new Error('Please connect your Freighter wallet first.');
    }
    const res = await fundTestnetFriendbot(address);
    // Wait briefly for ledger settlement then refresh balance
    setTimeout(() => {
      refreshBalance();
    }, 1500);
    return res.message;
  }, [address, refreshBalance]);

  // Build, sign with Freighter, submit to Horizon
  const sendPayment = useCallback(
    async ({ destination, amount, memo }: { destination: string; amount: string; memo?: string }): Promise<string> => {
      if (!address) {
        throw new Error('Wallet not connected.');
      }
      if (!isTestnetNetwork) {
        throw new Error('Please switch Freighter wallet network to Testnet before sending.');
      }

      // Step 1: Build unsigned XDR
      const unsignedXdr = await buildPaymentXdr({
        sourceAddress: address,
        destinationAddress: destination,
        amountXlm: amount,
        memo,
        networkPassphrase: network?.networkPassphrase,
      });

      // Step 2: Sign via Freighter extension popup
      const signedXdr = await signFreighterTransaction(unsignedXdr, {
        address,
        networkPassphrase: network?.networkPassphrase,
      });

      // Step 3: Submit signed transaction to Horizon
      const result = await submitSignedTransaction(signedXdr);

      // Refresh balance after payment
      refreshBalance();

      return result.hash;
    },
    [address, network, isTestnetNetwork, refreshBalance]
  );

  // Silent session restore on mount
  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      const isExplicitlyDisconnected = localStorage.getItem(DISCONNECTED_KEY) === 'true';
      if (isExplicitlyDisconnected) {
        setStatus('disconnected');
        return;
      }

      const installed = await isFreighterInstalled();
      if (isCancelled) return;
      setIsInstalled(installed);

      if (!installed) {
        setStatus('not_installed');
        return;
      }

      const allowed = await checkFreighterAllowed();
      if (isCancelled) return;

      if (allowed) {
        const addr = await getFreighterAddress();
        if (isCancelled) return;

        if (addr) {
          const net = await getFreighterNetworkInfo();
          if (isCancelled) return;

          setAddress(addr);
          setNetwork(net);
          const isTest = isTestnet(net.networkPassphrase || net.network);
          setIsTestnetNetwork(isTest);
          setStatus(isTest ? 'connected' : 'wrong_network');
        } else {
          setStatus('disconnected');
        }
      } else {
        setStatus('disconnected');
      }
    }

    restoreSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Periodic poll for wallet / network switch in extension (every 4 seconds)
  useEffect(() => {
    if (status !== 'connected' && status !== 'wrong_network') return;

    const interval = setInterval(async () => {
      try {
        const addr = await getFreighterAddress();
        const net = await getFreighterNetworkInfo();
        if (!addr) {
          disconnect();
          return;
        }
        if (addr !== address) {
          setAddress(addr);
        }
        setNetwork(net);
        const isTest = isTestnet(net.networkPassphrase || net.network);
        setIsTestnetNetwork(isTest);
        setStatus(isTest ? 'connected' : 'wrong_network');
      } catch (err) {
        console.warn('Freighter poll error:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [status, address, disconnect]);

  return (
    <WalletContext.Provider
      value={{
        status,
        address,
        network,
        isTestnetNetwork,
        balance,
        isLoadingBalance,
        isInstalled,
        error,
        connect,
        disconnect,
        refreshBalance,
        requestFaucet,
        sendPayment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
