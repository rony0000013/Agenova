import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

const plans = [
  {
    name: 'Free',
    price: 0,
    description: 'Get started with basic AI agent access',
    features: ['10 free requests/month', 'Basic agent categories', 'Community support', 'Standard response time', 'Usage dashboard'],
    cta: 'Get started',
  },
  {
    name: 'Starter',
    price: 10,
    description: 'For regular users who need more power',
    features: ['100 requests/month', 'All agent categories', 'Priority support', 'Basic analytics', 'API access', 'Email notifications'],
    popular: true,
    cta: 'Start free trial',
  },
  {
    name: 'Pro',
    price: 50,
    description: 'For power users and professional teams',
    features: ['1,000 requests/month', 'Premium agents', 'Priority support', 'Advanced analytics', 'Full API access', 'Custom integrations', 'Webhook exports', 'Team accounts'],
    cta: 'Start free trial',
  },
  {
    name: 'Enterprise',
    price: -1,
    description: 'For organizations with custom needs',
    features: ['Unlimited requests', 'Dedicated agent catalog', '24/7 dedicated support', 'Custom SLAs', 'On-premise deployment', 'Custom billing', 'SSO & SAML', 'Account manager'],
    cta: 'Contact sales',
  },
]

const comparisons = [
  { feature: 'Request limit', free: '10/mo', starter: '100/mo', pro: '1,000/mo', enterprise: 'Unlimited' },
  { feature: 'Agent categories', free: 'Basic', starter: 'All', pro: 'All + Premium', enterprise: 'Custom catalog' },
  { feature: 'API access', free: false, starter: true, pro: true, enterprise: true },
  { feature: 'Analytics', free: 'Basic', starter: 'Dashboard', pro: 'Advanced', enterprise: 'Custom' },
  { feature: 'Support', free: 'Community', starter: 'Priority email', pro: 'Priority chat', enterprise: '24/7 dedicated' },
  { feature: 'Integrations', free: false, starter: 'Webhooks', pro: 'Webhooks + API', enterprise: 'Full suite' },
  { feature: 'Custom models', free: false, starter: false, pro: true, enterprise: true },
  { feature: 'SSO / SAML', free: false, starter: false, pro: false, enterprise: true },
]

export function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="animate-fade-in">
      <section className="py-20 text-center max-w-4xl mx-auto px-4">
        <Badge variant="coral" size="md" className="mb-4">Pricing</Badge>
        <h1 className="text-display sm:text-display-lg font-display text-near-black mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-body-lg text-muted-slate max-w-xl mx-auto mb-8">
          Choose the plan that fits your needs. All plans include pay-per-request AI agent access with Stellar micropayments.
        </p>

        <div className="flex items-center justify-center gap-3 mb-12">
          <span className={`text-button ${!annual ? 'text-ink font-medium' : 'text-muted-slate'}`}>Monthly</span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-near-black' : 'bg-border-light'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${annual ? 'left-7' : 'left-1'}`} />
          </button>
          <span className={`text-button ${annual ? 'text-ink font-medium' : 'text-muted-slate'}`}>
            Annual <span className="text-coral font-medium">Save 20%</span>
          </span>
        </div>
      </section>

      <section className="pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} padding="lg" className={`relative flex flex-col ${plan.popular ? 'border-indigo-400 ring-1 ring-indigo-400' : ''}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge variant="info">Most Popular</Badge></div>}
              <h3 className="text-heading font-display text-ink mb-1">{plan.name}</h3>
              <div className="mb-2">
                {plan.price === -1 ? (
                  <span className="text-display font-display text-near-black">Custom</span>
                ) : (
                  <>
                    <span className="text-display font-display text-near-black">${annual ? (plan.price * 12 * 0.8).toFixed(0) : plan.price}</span>
                    <span className="text-body text-muted-slate">/{annual ? 'yr' : 'mo'}</span>
                  </>
                )}
              </div>
              <p className="text-caption text-muted-slate mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-caption text-ink">
                    <Check className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link to={plan.price === -1 ? '/contact' : '/signup'}>
                <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                  {plan.cta} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section className="pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-display font-display text-near-black text-center mb-10">Compare plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-hairline">
                <th className="text-left py-4 px-4 text-button text-muted-slate font-medium">Feature</th>
                <th className="text-center py-4 px-4 text-button font-medium text-ink">Free</th>
                <th className="text-center py-4 px-4 text-button font-medium text-ink">Starter</th>
                <th className="text-center py-4 px-4 text-button font-medium text-ink">Pro</th>
                <th className="text-center py-4 px-4 text-button font-medium text-ink">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row) => (
                <tr key={row.feature} className="border-b border-hairline">
                  <td className="py-4 px-4 text-body text-ink">{row.feature}</td>
                  {['free', 'starter', 'pro', 'enterprise'].map((tier) => (
                    <td key={tier} className="text-center py-4 px-4 text-body text-muted-slate">
                      {typeof row[tier as keyof typeof row] === 'boolean' ? (
                        row[tier as keyof typeof row] ? (
                          <Check className="h-4 w-4 text-deep-green mx-auto" />
                        ) : (
                          <span className="text-muted-slate">—</span>
                        )
                      ) : (
                        row[tier as keyof typeof row] as string
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
