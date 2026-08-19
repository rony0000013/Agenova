import { useState } from 'react'
import { Sparkles, Check, ArrowRight } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useNavigate } from 'react-router-dom'

interface SubscriptionGuardProps {
  isSubscribed?: boolean
  requiredPlan?: 'pro' | 'enterprise'
  featureName?: string
  onRedirectToBilling?: () => void
  children: React.ReactNode
}

export function SubscriptionGuard({
  isSubscribed = false,
  requiredPlan = 'pro',
  featureName = 'this premium feature',
  onRedirectToBilling,
  children,
}: SubscriptionGuardProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleIntercept = (e: React.MouseEvent) => {
    if (!isSubscribed) {
      e.preventDefault()
      e.stopPropagation()
      setModalOpen(true)
    }
  }

  const handleUpgradeRedirect = () => {
    setModalOpen(false)
    if (onRedirectToBilling) {
      onRedirectToBilling()
    } else {
      navigate('/dashboard/billing')
    }
  }

  return (
    <>
      <div onClickCapture={handleIntercept} className="contents">
        {children}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Subscription Required"
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-heading font-display text-near-black">
              Unlock {featureName}
            </h3>
            <p className="text-body text-muted-slate mt-1">
              You are currently on the Free Tier. Upgrade to the <span className="font-semibold text-ink capitalize">{requiredPlan} Plan</span> to access unlimited AI agent executions, custom Corsair webhooks, and developer revenue splits.
            </p>
          </div>

          <div className="bg-soft-stone/50 p-4 rounded-lg space-y-2 border border-hairline text-caption text-ink">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-deep-green" />
              <span>Unlimited XLM pay-per-request agent executions</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-deep-green" />
              <span>GitHub, Slack, and Notion Corsair webhook automation</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-deep-green" />
              <span>80% developer revenue split payout for custom agents</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Maybe Later
            </Button>
            <Button
              className="bg-near-black text-white hover:bg-near-black/90"
              icon={<ArrowRight className="h-4 w-4 text-coral" />}
              onClick={handleUpgradeRedirect}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
