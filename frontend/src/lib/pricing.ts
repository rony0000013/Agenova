export interface Plan {
  id: string
  name: string
  price: number
  description: string
  requests: number
  features: string[]
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', price: 0, description: 'Get started with basic access',
    requests: 10,
    features: ['10 requests/month', 'Basic agent categories', 'Community support', 'Standard response time', 'Usage dashboard'],
  },
  {
    id: 'starter', name: 'Starter', price: 10, description: 'For regular users who need more power',
    requests: 100,
    features: ['100 requests/month', 'All agent categories', 'Priority support', 'Basic analytics', 'API access', 'Email notifications'],
    popular: false,
  },
  {
    id: 'pro', name: 'Pro', price: 50, description: 'For power users and professional teams',
    requests: 1000,
    features: ['1,000 requests/month', 'Premium agents', 'Priority support', 'Advanced analytics', 'Full API access', 'Custom integrations', 'Webhook exports'],
    popular: true,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: -1, description: 'For organizations with custom needs',
    requests: -1,
    features: ['Unlimited requests', 'Dedicated agent catalog', '24/7 dedicated support', 'Custom SLAs', 'On-premise deployment', 'SSO / SAML'],
  },
]
