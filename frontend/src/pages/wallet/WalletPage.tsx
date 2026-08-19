import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, ArrowUpRight, ArrowDownRight, Copy, ExternalLink, Plus, RefreshCw } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'
import { walletApi } from '../../api/endpoints'
import { formatDate } from '../../lib/utils'

export function WalletPage() {
  const [showDeposit, setShowDeposit] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: wallet, isLoading, isError } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.balance(),
    retry: false,
  })

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => walletApi.transactions({ page: 1, limit: 20 }),
  })

  const connectMutation = useMutation({
    mutationFn: (address: string) => walletApi.connect(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      addToast({ type: 'success', title: 'Wallet connected!' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Connection failed', message: err.message }),
  })

  const disconnectMutation = useMutation({
    mutationFn: () => walletApi.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
      addToast({ type: 'success', title: 'Wallet disconnected' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Disconnect failed', message: err.message }),
  })

  const handleConnect = () => {
    connectMutation.mutate('GABC...PLACEHOLDER')
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast({ type: 'success', title: 'Address copied!' })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  if (isError || !wallet) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-display font-display text-near-black mb-2">Wallet</h1>
        <p className="text-body-lg text-muted-slate mb-8">Manage your Stellar wallet and transactions</p>
        <EmptyState
          icon={<Wallet className="h-8 w-8" />}
          title="Connect your wallet"
          description="Connect your Freighter wallet to make payments and receive earnings on the Stellar network."
          action={{ label: 'Connect Freighter', onClick: handleConnect }}
        />
      </div>
    )
  }

  const transactions = txData?.data ?? []

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-near-black">Wallet</h1>
          <p className="text-body-lg text-muted-slate">Manage your Stellar assets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowDeposit(true)} icon={<Plus className="h-4 w-4" />}>Deposit</Button>
          <Button
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => { queryClient.invalidateQueries({ queryKey: ['wallet'] }); queryClient.invalidateQueries({ queryKey: ['transactions'] }) }}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card padding="lg" variant="dark">
          <p className="text-caption text-muted-slate mb-2">Total Balance</p>
          <p className="text-display font-display text-white">{(wallet.balance ?? wallet.xlmBalance ?? 0) + (wallet.usdcBalance ?? 0)} XLM</p>
          <p className="text-caption text-muted-slate">Stellar Lumens</p>
        </Card>
        <Card padding="md">
          <p className="text-caption text-muted-slate mb-2">XLM Balance</p>
          <p className="text-heading-lg font-display text-ink">{wallet.balance ?? wallet.xlmBalance ?? 0}</p>
          <p className="text-caption text-muted-slate">Stellar Lumens</p>
        </Card>
        <Card padding="md">
          <div className="flex items-center justify-between mb-2">
            <p className="text-caption text-muted-slate">USDC Balance</p>
            <Badge variant="success" size="sm">Stellar</Badge>
          </div>
          <p className="text-heading-lg font-display text-ink">{wallet.usdcBalance ?? 0.00}</p>
          <p className="text-caption text-muted-slate">USD Coin</p>
        </Card>
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-caption text-muted-slate">Wallet Address</p>
            <p className="text-mono text-button text-ink">{wallet.address || wallet.stellar_address || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleCopy(wallet.address || wallet.stellar_address || '')} className="p-2 text-muted-slate hover:text-ink transition-colors" title="Copy address">
              <Copy className="h-4 w-4" />
            </button>
            <a href={`https://stellar.expert/explorer/testnet/account/${wallet.address || wallet.stellar_address}`} target="_blank" rel="noopener noreferrer" className="p-2 text-muted-slate hover:text-ink transition-colors" title="View on explorer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-heading font-display text-ink mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title="No transactions yet"
            description="Your transaction history will appear here."
          />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} padding="md" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === 'payout' || tx.type === 'deposit' ? 'bg-pale-green' : 'bg-red-50'}`}>
                    {tx.type === 'payout' || tx.type === 'deposit'
                      ? <ArrowDownRight className="h-4 w-4 text-deep-green" />
                      : <ArrowUpRight className="h-4 w-4 text-error-red" />}
                  </div>
                  <div>
                    <p className="text-button text-ink">{tx.description}</p>
                    <div className="flex items-center gap-2 text-caption text-muted-slate">
                      <span>{formatDate(tx.createdAt || tx.created_at || new Date())}</span>
                      <span>·</span>
                      <Badge variant={tx.status === 'completed' ? 'success' : 'warning'} size="sm">{tx.status}</Badge>
                    </div>
                  </div>
                </div>
                <span className={`text-button font-medium ${tx.type === 'payout' || tx.type === 'deposit' ? 'text-deep-green' : 'text-error-red'}`}>
                  {tx.type === 'payout' || tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.asset}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showDeposit} onClose={() => setShowDeposit(false)} title="Deposit XLM" size="sm">
        <p className="text-body text-muted-slate mb-4">Send XLM or USDC to this address on the Stellar network:</p>
        <div className="p-3 bg-soft-stone/50 rounded-sm mb-4">
          <p className="text-mono text-caption break-all">{wallet.address || wallet.stellar_address}</p>
        </div>
        <Button className="w-full" variant="outline" onClick={() => handleCopy(wallet.address || wallet.stellar_address || '')}>
          <Copy className="h-4 w-4 mr-1" /> Copy Address
        </Button>
      </Modal>

    </div>
  )
}