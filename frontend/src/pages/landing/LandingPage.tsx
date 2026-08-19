import { Link } from 'react-router-dom'
import { ArrowRight, Bot, Wallet, Zap, Shield, BarChart3, Users, Star, ChevronRight, Check } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

const features = [
  {
    icon: Bot,
    title: 'AI Agent Marketplace',
    description: 'Discover and use specialized AI agents for writing, coding, analysis, and more. Pay only for what you use.',
  },
  {
    icon: Wallet,
    title: 'Stellar Micropayments',
    description: 'Pay-per-request with XLM or USDC on Stellar. No subscriptions, no commitments, just pure pay-as-you-go.',
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Agents run on demand with leading LLMs. Get results in seconds with real-time revenue distribution.',
  },
  {
    icon: Shield,
    title: 'On-Chain Revenue Sharing',
    description: 'Transparent, automated revenue splits between developers and the platform, recorded on Stellar.',
  },
  {
    icon: BarChart3,
    title: 'Usage Analytics',
    description: 'Track every request, monitor spending, and analyze performance with detailed dashboards.',
  },
  {
    icon: Users,
    title: 'Developer Portal',
    description: 'Publish your own AI agents, set your price, and earn XLM for every request processed.',
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'AI Developer',
    avatar: 'SC',
    content: 'Agenova transformed how I monetize my AI models. The Stellar micropayments mean I get paid instantly for every single request.',
  },
  {
    name: 'Marcus Rivera',
    role: 'Tech Lead',
    avatar: 'MR',
    content: 'We replaced three different AI subscriptions with Agenova. Pay-per-request saved us 60% on our monthly AI costs.',
  },
  {
    name: 'Emily Park',
    role: 'Data Analyst',
    avatar: 'EP',
    content: 'The agent marketplace has everything I need. From data analysis to report writing, I just pay and get results.',
  },
]

const faqs = [
  { q: 'How do Stellar micropayments work?', a: 'Each AI request triggers a small XLM or USDC payment on the Stellar network. Funds are split automatically between the developer and platform treasury in real-time.' },
  { q: 'Do I need a Stellar wallet?', a: 'Yes, you need a Freighter wallet extension to make payments. Developers also need it to receive payouts. Setting up a wallet takes less than 2 minutes.' },
  { q: 'Can I become an agent developer?', a: 'Anyone can publish an AI agent. Set your prompt, choose your price, and start earning XLM for every request. Our platform handles the billing and revenue distribution.' },
  { q: 'What AI models do agents use?', a: 'Agents can use OpenAI, Anthropic, Gemini, Groq, or any LLM. Developers configure which model powers their agent during publishing.' },
  { q: 'Is there a subscription fee?', a: 'No monthly fees. You pay only for the AI requests you make. Each request costs a small amount of XLM set by the agent developer.' },
  { q: 'How are earnings distributed?', a: 'For every paid request, 80% goes to the agent developer and 20% goes to the platform. All transactions are recorded on the Stellar blockchain.' },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Get started with basic access',
    features: ['10 free requests', 'Basic agents only', 'Community support', 'Standard response time'],
  },
  {
    name: 'Starter',
    price: '$10',
    description: 'For regular users',
    features: ['100 requests/month', 'All agent categories', 'Priority support', 'Analytics dashboard', 'API access'],
    popular: true,
  },
  {
    name: 'Pro',
    price: '$50',
    description: 'For power users and teams',
    features: ['1000 requests/month', 'Premium agents', 'Priority support', 'Advanced analytics', 'Full API access', 'Custom integrations'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations',
    features: ['Unlimited requests', 'Dedicated agents', '24/7 support', 'Custom SLAs', 'On-premise deployment', 'Dedicated account manager'],
  },
]

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center max-w-4xl mx-auto animate-fade-in">
            <Badge variant="coral" size="md" className="mb-6">
              Now on Stellar Testnet
            </Badge>
            <h1 className="text-hero-md sm:text-hero font-display font-light tracking-tight text-near-black leading-none mb-6">
              AI Agents,<br />
              <span className="text-gradient">Pay-Per-Request</span>
            </h1>
            <p className="text-body-lg sm:text-heading text-muted-slate max-w-2xl mx-auto mb-10 leading-relaxed">
              Discover and use powerful AI agents with instant Stellar micropayments.
              No subscriptions. No commitments. Just pure pay-as-you-go intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="text-button">
                  Explore the Marketplace
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" size="lg">
                  Browse Agents
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" size="md" className="mb-4">Platform Features</Badge>
            <h2 className="text-display sm:text-display-lg font-display text-near-black mb-4">
              Everything you need for AI
            </h2>
            <p className="text-body-lg text-muted-slate max-w-xl mx-auto">
              A complete ecosystem for discovering, using, and building AI agents on the Stellar network.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} padding="lg" hover className="group">
                <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  <feature.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="text-heading font-display text-ink mb-2">{feature.title}</h3>
                <p className="text-body text-muted-slate leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-soft-stone/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="coral" size="md" className="mb-4">Testimonials</Badge>
            <h2 className="text-display sm:text-display-lg font-display text-near-black mb-4">
              Trusted by innovators
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name} padding="lg">
                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-coral text-coral" />
                  ))}
                </div>
                <p className="text-body text-muted-slate mb-6 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-button font-medium">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-button font-medium text-ink">{t.name}</p>
                    <p className="text-caption text-muted-slate">{t.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" size="md" className="mb-4">Pricing</Badge>
            <h2 className="text-display sm:text-display-lg font-display text-near-black mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-body-lg text-muted-slate max-w-xl mx-auto">
              Choose the plan that fits your needs. All plans include pay-per-request pricing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                padding="lg"
                className={cn('relative', plan.popular && 'border-indigo-400 ring-1 ring-indigo-400')}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="info">Most Popular</Badge>
                  </div>
                )}
                <h3 className="text-heading font-display text-ink mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-display font-display text-near-black">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-body text-muted-slate">/month</span>}
                </div>
                <p className="text-caption text-muted-slate mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-caption text-ink">
                      <Check className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.price === 'Custom' ? '/contact' : '/signup'}>
                  <Button variant={plan.popular ? 'primary' : 'outline'} className="w-full">
                    {plan.price === 'Custom' ? 'Contact Us' : 'Get Started'}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-near-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" size="md" className="mb-4">FAQ</Badge>
            <h2 className="text-display sm:text-display-lg font-display mb-4">Frequently asked questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border border-white/10 rounded-sm">
                <summary className="flex items-center justify-between p-5 text-body font-medium cursor-pointer list-none">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-muted-slate group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-body text-muted-slate leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-display sm:text-display-lg font-display mb-4">
            Ready to build with AI?
          </h2>
          <p className="text-body-lg text-indigo-200 mb-8 max-w-xl mx-auto">
            Join the decentralized AI marketplace. Start using agents or publish your own in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-white/90">
                Get Started Free
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
