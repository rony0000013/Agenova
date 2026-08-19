import { useState } from 'react'
import {
  Wallet,
  ExternalLink,
  Copy,
  LogOut,
  Droplets,
  Send,
  AlertTriangle,
  ChevronDown,
  Sparkles,
} from 'lucide-react'
import { useWallet } from '../../context/WalletContext'
import { useUIStore } from '../../stores/uiStore'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'

export function WalletConnectButton() {
  const {
    status,
    address,
    network,
    isTestnetNetwork,
    balance,
    isLoadingBalance,
    connect,
    disconnect,
    requestFaucet,
    sendPayment,
  } = useWallet()

  const addToast = useUIStore((s) => s.addToast)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isRequestingFaucet, setIsRequestingFaucet] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [destAddress, setDestAddress] = useState('')
  const [sendAmount, setSendAmount] = useState('')
  const [sendMemo, setSendMemo] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleConnect = async () => {
    try {
      const pubKey = await connect()
      addToast({
        type: 'success',
        title: 'Freighter Connected',
        message: `Linked wallet: ${pubKey.slice(0, 6)}...${pubKey.slice(-4)}`,
      })
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Connection Failed',
        message: err.message || 'Could not connect Freighter extension.',
      })
    }
  }

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    addToast({ type: 'success', title: 'Address Copied', message: 'Stellar address copied to clipboard.' })
  }

  const handleFaucet = async () => {
    setIsRequestingFaucet(true)
    try {
      const msg = await requestFaucet()
      addToast({ type: 'success', title: 'Testnet Faucet', message: msg })
    } catch (err: any) {
      addToast({ type: 'error', title: 'Faucet Request Failed', message: err.message })
    } finally {
      setIsRequestingFaucet(false)
    }
  }

  const handleSendPayment = async (e: React.FormEvent) => {
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
        title: 'Payment Submitted!',
        message: `Transaction Hash: ${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
      })
      setShowSendModal(false)
      setDestAddress('')
      setSendAmount('')
      setSendMemo('')
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: err.message || 'Transaction submission error',
      })
    } finally {
      setIsSending(false)
    }
  }

  if (status !== 'connected' && status !== 'wrong_network') {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleConnect}
        loading={status === 'connecting'}
        icon={<Wallet className="h-4 w-4 text-coral" />}
        className="border-hairline bg-white hover:bg-soft-stone"
      >
        {status === 'connecting' ? 'Connecting...' : 'Connect Freighter'}
      </Button>
    )
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline bg-white hover:bg-soft-stone/60 transition-all text-caption"
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isTestnetNetwork ? 'bg-deep-green animate-pulse' : 'bg-coral'
              }`}
            />
            <span className="font-mono text-ink font-medium">
              {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : 'Wallet'}
            </span>
          </div>
          <span className="text-muted-slate font-medium hidden sm:inline">
            {isLoadingBalance ? '...' : `${balance.xlm} XLM`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-slate" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-xl border border-hairline p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <div className="flex items-center gap-1.5">
                  <Badge variant={isTestnetNetwork ? 'success' : 'error'} size="sm">
                    {network?.network || 'TESTNET'}
                  </Badge>
                  {isTestnetNetwork && (
                    <span className="text-xs text-muted-slate">Stellar Testnet</span>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  className="text-muted-slate hover:text-ink p-1 rounded transition-colors"
                  title="Copy full address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="py-2.5">
                <p className="text-xs text-muted-slate">Balance</p>
                <div className="flex items-baseline justify-between mt-0.5">
                  <p className="text-lg font-bold text-ink">{balance.xlm} XLM</p>
                  <p className="text-xs text-muted-slate">Spendable: {balance.spendable} XLM</p>
                </div>
                {parseFloat(balance.usdc) > 0 && (
                  <p className="text-xs text-muted-slate mt-0.5">{balance.usdc} USDC</p>
                )}
              </div>

              {!isTestnetNetwork && (
                <div className="p-2 mb-2 bg-red-50 border border-red-200 rounded text-xs text-error-red flex items-start gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Please switch Freighter network to Stellar Testnet in your extension settings.</span>
                </div>
              )}

              <div className="space-y-1 pt-1 border-t border-hairline">
                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    setShowSendModal(true)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink hover:bg-soft-stone rounded transition-colors text-left"
                >
                  <Send className="h-3.5 w-3.5 text-action-blue" />
                  <span>Send XLM Payment</span>
                </button>

                <button
                  onClick={handleFaucet}
                  disabled={isRequestingFaucet}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-ink hover:bg-soft-stone rounded transition-colors text-left"
                >
                  <Droplets className="h-3.5 w-3.5 text-deep-green" />
                  <span>{isRequestingFaucet ? 'Requesting...' : 'Get 10,000 Testnet XLM (Friendbot)'}</span>
                </button>

                <a
                  href={`https://stellar.expert/explorer/testnet/account/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted-slate hover:text-ink hover:bg-soft-stone rounded transition-colors text-left"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View on Stellar Expert</span>
                </a>

                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    disconnect()
                    addToast({ type: 'info', title: 'Wallet Disconnected' })
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-error-red hover:bg-red-50 rounded transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Disconnect Wallet</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Send Payment Modal */}
      <Modal open={showSendModal} onClose={() => setShowSendModal(false)} title="Send XLM Payment">
        <form onSubmit={handleSendPayment} className="space-y-4">
          <p className="text-caption text-muted-slate">
            Build and sign a native Stellar testnet payment using your connected Freighter wallet.
          </p>

          <Input
            label="Recipient Stellar Address (G...)"
            placeholder="e.g. GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
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
            placeholder="e.g. agenova-micropayment"
            value={sendMemo}
            onChange={(e) => setSendMemo(e.target.value)}
            maxLength={28}
          />

          <div className="p-3 bg-soft-stone/60 rounded text-xs space-y-1 text-muted-slate">
            <div className="flex justify-between">
              <span>Network Base Fee:</span>
              <span className="font-mono text-ink">0.00001 XLM (100 stroops)</span>
            </div>
            <div className="flex justify-between">
              <span>Signer:</span>
              <span className="font-mono text-ink">Freighter Extension Popup</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setShowSendModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSending} icon={<Sparkles className="h-4 w-4" />}>
              {isSending ? 'Signing & Submitting...' : 'Sign with Freighter'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
