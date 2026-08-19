import { useState, useEffect } from 'react'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Send,
  Droplets,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useWallet } from '../../context/WalletContext'
import { useUIStore } from '../../stores/uiStore'
import { fetchAccountPayments, type PaymentItem } from '../../lib/stellar'

export function WalletPage() {
  const {
    status,
    address,
    network,
    isTestnetNetwork,
    balance,
    isLoadingBalance,
    connect,
    disconnect,
    refreshBalance,
    requestFaucet,
    sendPayment,
  } = useWallet()

  const [showDeposit, setShowDeposit] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [destAddress, setDestAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendMemo, setSendMemo] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false)
  const [transactions, setTransactions] = useState<PaymentItem[]>([])
  const [isLoadingTx, setIsLoadingTx] = useState(false)

  const addToast = useUIStore((s) => s.addToast)

  const loadHistory = async (addr: string) => {
    setIsLoadingTx(true)
    try {
      const items = await fetchAccountPayments(addr, 25)
      setTransactions(items)
    } catch (err) {
      console.warn('Could not fetch tx history:', err)
    } finally {
      setIsLoadingTx(false)
    }
  }

  useEffect(() => {
    if (address) {
      loadHistory(address)
    } else {
      setTransactions([])
    }
  }, [address])

  const handleConnect = async () => {
    try {
      const pubKey = await connect()
      addToast({
        type: 'success',
        title: 'Freighter Connected',
        message: `Successfully connected wallet: ${pubKey.slice(0, 6)}...${pubKey.slice(-4)}`,
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: err.message || 'Could not connect Freighter extension.',
      })
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: 'success', title: 'Address copied!', message: 'Copied to clipboard' })
  }

  const handleFaucet = async () => {
    if (!address) return
    setIsRequestingFaucet(true)
    try {
      const msg = await requestFaucet()
      addToast({ type: 'success', title: 'Testnet Faucet', message: msg })
      setTimeout(() => {
        loadHistory(address)
      }, 2500)
    } catch (err: any) {
      addToast({ type: 'error', title: 'Faucet Request Failed', message: err.message })
    } finally {
      setIsRequestingFaucet(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!destAddress || !sendAmount) return
    setIsSending(true)
    try {
      const txHash = await sendPayment({
        destination: destAddress.trim(),
        amount: sendAmount.trim(),
        memo: sendMemo.trim() || undefined,
      })
      addToast({
        type: 'success',
        title: 'Payment Submitted to Horizon!',
        message: `Transaction Hash: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
      })
      setShowSend(false)
      setDestAddress('')
      setSendAmount('')
      setSendMemo('')
      if (address) {
        setTimeout(() => loadHistory(address), 2500)
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Error signing and submitting payment',
      })
    } finally {
      setIsSending(false)
    }
  }

  if (status !== 'connected' && status !== 'wrong_network') {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-display font-display text-near-black mb-2">Stellar Wallet</h1>
          <p className="text-body-lg text-muted-slate">
            Manage your decentralized balance, payments, and agent micropayments via Freighter
          </p>
        </div>

        <Card padding="lg" className="text-center py-16 bg-white border border-hairline shadow-sm">
          <div className="w-16 h-16 rounded-full bg-soft-stone flex items-center justify-center mx-auto mb-5 text-ink">
            <Wallet className="h-8 w-8" />
          </div>
          <h2 className="text-heading font-display text-ink mb-2">Connect your Freighter Wallet</h2>
          <p className="text-body text-muted-slate max-w-md mx-auto mb-8">
            Connect your browser extension to query live balances, request free Testnet XLM, and sign micropayments directly on the Stellar ledger.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              size="lg"
              onClick={handleConnect}
              loading={status === 'connecting'}
              icon={<Sparkles className="h-4 w-4" />}
            >
              {status === 'connecting' ? 'Connecting Freighter...' : 'Connect Freighter Extension'}
            </Button>
            <a
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-action-blue text-button font-medium hover:underline flex items-center gap-1"
            >
              Install Extension <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display font-display text-near-black">Stellar Wallet</h1>
            <Badge variant={isTestnetNetwork ? 'success' : 'error'} size="sm">
              {network?.network || 'TESTNET'}
            </Badge>
          </div>
          <p className="text-body text-muted-slate">
            Direct on-chain Horizon & Freighter wallet management
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            onClick={handleFaucet}
            loading={isRequestingFaucet}
            icon={<Droplets className="h-4 w-4 text-deep-green" />}
          >
            Faucet (+10,000 XLM)
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSend(true)}
            icon={<Send className="h-4 w-4 text-action-blue" />}
          >
            Send XLM
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDeposit(true)}
            icon={<Plus className="h-4 w-4" />}
          >
            Deposit
          </Button>
          <Button
            icon={<RefreshCw className={`h-4 w-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />}
            onClick={() => {
              refreshBalance()
              if (address) loadHistory(address)
            }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Network Warning if not Testnet */}
      {!isTestnetNetwork && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-center justify-between text-error-red">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-body font-medium">
              Freighter is currently connected to {network?.network || 'a non-testnet network'}. Please switch network to Stellar Testnet in Freighter extension settings.
            </p>
          </div>
        </div>
      )}

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card padding="lg" variant="dark" className="relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-caption text-muted-slate mb-1">Total XLM Balance</p>
              <p className="text-display font-display text-white">
                {isLoadingBalance ? '...' : `${balance.xlm} XLM`}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-caption text-muted-slate">
            <span>Spendable:</span>
            <span className="text-white font-medium">{balance.spendable} XLM</span>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-caption text-muted-slate mb-1">Account Status</p>
              <p className="text-heading font-display text-ink">
                {balance.funded ? 'Funded & Active' : 'Unfunded (New)'}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${balance.funded ? 'bg-pale-green text-deep-green' : 'bg-soft-stone text-muted-slate'}`}>
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-hairline flex justify-between text-caption text-muted-slate">
            <span>Base Reserve:</span>
            <span className="text-ink font-medium">1.0 XLM locked</span>
          </div>
        </Card>

        <Card padding="lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-caption text-muted-slate mb-1">USDC Asset Balance</p>
              <p className="text-heading font-display text-ink">{balance.usdc} USDC</p>
            </div>
            <Badge variant="success" size="sm">Stellar Asset</Badge>
          </div>
          <div className="mt-4 pt-3 border-t border-hairline flex justify-between text-caption text-muted-slate">
            <span>Network:</span>
            <span className="text-ink font-medium">Stellar Testnet</span>
          </div>
        </Card>
      </div>

      {/* Account Info Card */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-caption text-muted-slate mb-1">Connected Freighter Address (Ed25519 Public Key)</p>
            <p className="text-mono text-button text-ink break-all">{address}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleCopy(address || '')}
              className="p-2 border border-hairline rounded hover:bg-soft-stone text-muted-slate hover:text-ink transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="Copy address"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 border border-hairline rounded hover:bg-soft-stone text-muted-slate hover:text-ink transition-colors flex items-center gap-1.5 text-xs font-medium"
              title="View on Stellar Expert"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Explorer</span>
            </a>
            <Button variant="ghost" size="sm" onClick={disconnect} className="text-error-red hover:bg-red-50">
              Disconnect
            </Button>
          </div>
        </div>
      </Card>

      {/* Transaction Operations History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-display text-ink">Horizon Payment History</h2>
          <span className="text-caption text-muted-slate">Live Stellar Testnet operations</span>
        </div>

        {isLoadingTx ? (
          <div className="text-center py-12 text-muted-slate">Loading operations from Horizon...</div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="No transactions found"
            description="Your account hasn't made or received any payments yet. Request 10,000 XLM from Friendbot or send a test payment."
            action={{ label: 'Request 10,000 XLM Faucet', onClick: handleFaucet }}
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} padding="md" className="flex items-center justify-between hover:border-muted-slate/50 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      tx.direction === 'received' ? 'bg-pale-green text-deep-green' : 'bg-red-50 text-error-red'
                    }`}
                  >
                    {tx.direction === 'received' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-button text-ink font-medium truncate">
                      {tx.type === 'create_account' ? 'Account Creation / Funding' : tx.direction === 'received' ? 'Received Payment' : 'Sent Payment'}
                    </p>
                    <div className="flex items-center gap-2 text-caption text-muted-slate truncate font-mono text-xs">
                      <span>{tx.direction === 'received' ? `From: ${tx.from.slice(0, 8)}...` : `To: ${tx.to.slice(0, 8)}...`}</span>
                      <span>·</span>
                      <span>{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-button font-semibold ${
                      tx.direction === 'received' ? 'text-deep-green' : 'text-error-red'
                    }`}
                  >
                    {tx.direction === 'received' ? '+' : '-'}{tx.amount} {tx.asset}
                  </span>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-slate hover:text-ink p-1 rounded transition-colors"
                    title="View Transaction on Explorer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <Modal open={showDeposit} onClose={() => setShowDeposit(false)} title="Deposit Stellar Assets" size="sm">
        <p className="text-body text-muted-slate mb-4">
          Send native XLM or USDC to your Freighter public key on the Stellar Testnet:
        </p>
        <div className="p-3 bg-soft-stone/60 rounded border border-hairline mb-4 font-mono text-caption break-all text-ink">
          {address}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => handleCopy(address || '')}>
            <Copy className="h-4 w-4 mr-1.5" /> Copy Address
          </Button>
          <Button className="flex-1" onClick={handleFaucet} loading={isRequestingFaucet}>
            <Droplets className="h-4 w-4 mr-1.5 text-pale-green" /> Friendbot Faucet
          </Button>
        </div>
      </Modal>

      {/* Send Payment Modal */}
      <Modal open={showSend} onClose={() => setShowSend(false)} title="Send Stellar Payment">
        <form onSubmit={handleSend} className="space-y-4">
          <p className="text-caption text-muted-slate">
            Construct an on-chain transfer, review and authorize signature in Freighter extension.
          </p>

          <Input
            label="Recipient Stellar Public Key (G...)"
            placeholder="e.g. GA2C5RFPE6GCKMY3US5PAB6UZLKIGAHWKXX2G..."
            value={destAddress}
            onChange={(e) => setDestAddress(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Amount (XLM)"
              type="number"
              step="0.0000001"
              placeholder="0.00"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setSendAmount(balance.spendable)}
              className="absolute right-3 top-[38px] text-xs font-semibold text-action-blue hover:underline"
            >
              MAX ({balance.spendable} XLM)
            </button>
          </div>

          <Input
            label="Memo (Optional, max 28 chars)"
            placeholder="e.g. agenova-tip"
            value={sendMemo}
            onChange={(e) => setSendMemo(e.target.value)}
            maxLength={28}
          />

          <div className="p-3 bg-soft-stone/60 rounded text-xs space-y-1 text-muted-slate border border-hairline">
            <div className="flex justify-between">
              <span>Network Base Fee:</span>
              <span className="font-mono text-ink">0.00001 XLM (100 stroops)</span>
            </div>
            <div className="flex justify-between">
              <span>Signer:</span>
              <span className="font-mono text-ink">Freighter Browser Extension</span>
            </div>
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="font-mono text-ink">Stellar Testnet</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowSend(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSending} icon={<Sparkles className="h-4 w-4" />}>
              {isSending ? 'Signing & Submitting...' : 'Sign with Freighter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}