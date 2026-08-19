import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Download } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'
import { billingApi } from '../../api/endpoints'
import { PLANS } from '../../lib/pricing'

export function BillingPage() {
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.subscriptions(),
  })

  const { data: plansData } = useQuery({
    queryKey: ['plans'],
    queryFn: () => billingApi.plans(),
  })

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => billingApi.subscribe(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      addToast({ type: 'success', title: 'Plan updated!' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Subscription failed', message: err.message }),
  })

  const currentPlan = subscription?.plan ?? 'free'

  if (subLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-display font-display text-near-black">Billing</h1>
        <p className="text-body-lg text-muted-slate">Manage your subscription and invoices</p>
      </div>

      <Card padding="lg" variant="dark">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-caption text-muted-slate mb-1">Current Plan</p>
            <p className="text-display font-display text-white capitalize">{currentPlan}</p>
            <p className="text-body text-muted-slate mt-1 capitalize">{subscription?.status ?? 'active'} · {subscription?.plan ?? 'free'} plan</p>
          </div>
          <Badge variant="success" size="md">{subscription?.status ?? 'unknown'}</Badge>
        </div>
      </Card>

      <div>
        <h2 className="text-heading font-display text-ink mb-4">Available Plans</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => (
            <Card key={plan.id} padding="lg" className={`relative ${plan.popular ? 'border-indigo-400 ring-1 ring-indigo-400' : ''}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge variant="info" size="sm">Popular</Badge></div>}
              <h3 className="text-heading font-display text-ink mb-1">{plan.name}</h3>
              <div className="mb-4">
                {plan.price === -1 ? (
                  <span className="text-heading-lg font-display text-ink">Custom</span>
                ) : plan.price === 0 ? (
                  <span className="text-heading-lg font-display text-ink">Free</span>
                ) : (
                  <>
                    <span className="text-heading-lg font-display text-ink">${plan.price}</span>
                    <span className="text-caption text-muted-slate">/month</span>
                  </>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-caption text-ink">
                    <Check className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button
                variant={currentPlan === plan.id ? 'outline' : plan.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => subscribeMutation.mutate(plan.id)}
                disabled={plan.id === 'enterprise' || currentPlan === plan.id}
                loading={subscribeMutation.isPending && subscribeMutation.variables === plan.id}
              >
                {plan.id === 'enterprise' ? 'Contact sales' : currentPlan === plan.id ? 'Current plan' : 'Upgrade'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}