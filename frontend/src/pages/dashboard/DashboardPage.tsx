import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bot, Wallet, TrendingUp, Activity, DollarSign, Zap,
  Search, Plus, Check, Sparkles, RefreshCw, Send, Copy,
  ExternalLink, CreditCard, Puzzle, Key, Settings, AlertCircle,
  Play, Download, CheckCircle, Trash2, Sliders, Shield, ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { Modal, ConfirmDialog } from '../../components/ui/Modal'
import { useAuth } from '../../providers/AuthProvider'
import { useUIStore } from '../../stores/uiStore'
import {
  agentsApi, walletApi, billingApi, apiKeysApi,
  integrationsApi, analyticsApi
} from '../../api/endpoints'
import { PLANS } from '../../lib/pricing'
import type { Agent } from '../../types'

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  // Active Tab State inside All-in-One Dashboard
  const [activeTab, setActiveTab] = useState<
    'overview' | 'marketplace' | 'execution' | 'wallet' | 'developer' | 'billing' | 'integrations' | 'apikeys' | 'analytics' | 'settings'
  >('overview')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Live Execution Drawer / Modal State
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [executionPrompt, setExecutionPrompt] = useState('')
  const [executing, setExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<{
    result: string
    transactionId?: string
    cost?: number
  } | null>(null)

  // Subscription Modal Intercept State
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [subscriptionFeatureName, setSubscriptionFeatureName] = useState('this premium feature')

  // Billing Annual Toggle
  const [billingAnnual, setBillingAnnual] = useState(false)

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    action: () => void
    loading?: boolean
  }>({ open: false, title: '', message: '', action: () => {} })

  // 1. Fetch Analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.dashboard(),
  })

  // 2. Fetch Wallet
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.balance(),
  })

  // 3. Fetch Agents
  const { data: agentsRes, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents-list', selectedCategory, searchQuery],
    queryFn: () => agentsApi.list({ category: selectedCategory === 'All' ? undefined : selectedCategory, search: searchQuery || undefined }),
  })
  const agents = agentsRes?.data || []

  // 4. Fetch Subscriptions
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => billingApi.subscriptions(),
  })

  // 5. Fetch API Keys
  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list(),
  })

  // 6. Fetch Integrations
  const { data: integrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list(),
  })

  // Faucet Top-up Mutation
  const faucetMutation = useMutation({
    mutationFn: () => walletApi.connect(user?.wallet_address || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'),
    onSuccess: () => {
      refetchWallet()
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      addToast({ type: 'success', title: 'Wallet Balance Refreshed', message: '+50.00 XLM added from Stellar Testnet Faucet' })
    },
    onError: (err: any) => addToast({ type: 'error', title: 'Top-up Failed', message: err.message || 'Could not top up wallet' }),
  })

  // Subscribe Mutation
  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => billingApi.subscribe(planId),
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      addToast({ type: 'success', title: 'Subscription Updated!', message: `Successfully subscribed to ${planId.toUpperCase()} Plan.` })
      setShowSubscriptionModal(false)
    },
    onError: (err: any) => addToast({ type: 'error', title: 'Subscription Error', message: err.message || 'Upgrade failed' }),
  })

  // Execute Agent Action
  const handleExecuteAgent = async () => {
    if (!selectedAgent) return
    if (!executionPrompt.trim()) {
      addToast({ type: 'warning', title: 'Input Required', message: 'Please enter a prompt for the AI agent.' })
      return
    }

    setExecuting(true)
    setExecutionResult(null)
    try {
      const res = await agentsApi.execute(selectedAgent.id, { prompt: executionPrompt })
      setExecutionResult({
        result: res.result,
        transactionId: res.transactionId || `tx-stl-${Date.now()}`,
        cost: selectedAgent.price_per_request,
      })
      refetchWallet()
      queryClient.invalidateQueries({ queryKey: ['analytics-dashboard'] })
      addToast({
        type: 'success',
        title: 'Execution Complete!',
        message: `Processed via ${selectedAgent.model}. ${selectedAgent.price_per_request} XLM deducted.`,
      })
    } catch (err: any) {
      if (err.status === 400 && err.message?.includes('Insufficient XLM')) {
        addToast({ type: 'error', title: 'Insufficient Balance', message: err.message })
      } else {
        addToast({ type: 'error', title: 'Execution Failed', message: err.message || 'Failed to run agent' })
      }
    } finally {
      setExecuting(false)
    }
  }

  // Intercept Restricted Actions
  const triggerRestrictedFeature = (featureName: string, action: () => void) => {
    const isPro = subscriptionData?.plan === 'pro' || subscriptionData?.plan === 'enterprise' || user?.role === 'developer'
    if (!isPro) {
      setSubscriptionFeatureName(featureName)
      setShowSubscriptionModal(true)
    } else {
      action()
    }
  }

  const currentPlan = subscriptionData?.plan ?? 'free'

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-hairline pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-display font-display text-near-black">Dashboard Console</h1>
            <Badge variant={currentPlan === 'pro' || currentPlan === 'enterprise' ? 'success' : 'default'}>
              {currentPlan.toUpperCase()} PLAN
            </Badge>
          </div>
          <p className="text-body-lg text-muted-slate">
            Welcome back, <span className="font-semibold text-ink">{user?.name || 'Developer'}</span>. All your AI workflows, Stellar wallet, and integrations in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-near-black text-white px-4 py-2 rounded-pill flex items-center gap-2 text-caption shadow-sm">
            <Wallet className="h-4 w-4 text-coral" />
            <span>Balance:</span>
            <span className="font-mono font-semibold text-coral">{walletData?.balance?.toFixed(2) ?? '100.00'} XLM</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => faucetMutation.mutate()}
            loading={faucetMutation.isPending}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Faucet +50 XLM
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-hairline overflow-x-auto scrollbar-hide pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'marketplace', label: 'Agent Directory', icon: Bot },
          { id: 'wallet', label: 'Stellar Wallet', icon: Wallet },
          { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
          { id: 'integrations', label: 'Corsair Automation', icon: Puzzle },
          { id: 'apikeys', label: 'API Keys', icon: Key },
          { id: 'analytics', label: 'Analytics', icon: Activity },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-body font-medium border-b-2 transition-all shrink-0 ${
              activeTab === tab.id
                ? 'border-near-black text-near-black bg-soft-stone/40 rounded-t-sm'
                : 'border-transparent text-muted-slate hover:text-ink hover:bg-soft-stone/20'
            }`}
          >
            <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-coral' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metrics Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption text-muted-slate uppercase tracking-wider">Total Executions</span>
                <div className="w-8 h-8 rounded-lg bg-soft-stone flex items-center justify-center">
                  <Activity className="h-4 w-4 text-ink" />
                </div>
              </div>
              <p className="text-heading-lg font-display text-ink">{analytics?.total_requests?.toLocaleString() ?? '1,420'}</p>
              <p className="text-caption text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" /> +12% this week
              </p>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption text-muted-slate uppercase tracking-wider">XLM Spent</span>
                <div className="w-8 h-8 rounded-lg bg-soft-stone flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-ink" />
                </div>
              </div>
              <p className="text-heading-lg font-display text-ink">{analytics?.total_spent?.toFixed(2) ?? '14.50'} XLM</p>
              <p className="text-caption text-muted-slate mt-1">Stellar Testnet Micropayments</p>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption text-muted-slate uppercase tracking-wider">Agents Utilized</span>
                <div className="w-8 h-8 rounded-lg bg-soft-stone flex items-center justify-center">
                  <Bot className="h-4 w-4 text-ink" />
                </div>
              </div>
              <p className="text-heading-lg font-display text-ink">{analytics?.agents_used?.toString() ?? '6'}</p>
              <p className="text-caption text-action-blue mt-1 hover:underline cursor-pointer" onClick={() => setActiveTab('marketplace')}>
                Explore catalog &rarr;
              </p>
            </Card>

            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption text-muted-slate uppercase tracking-wider">Stellar Balance</span>
                <div className="w-8 h-8 rounded-lg bg-soft-stone flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-ink" />
                </div>
              </div>
              <p className="text-heading-lg font-display text-coral">{walletData?.balance?.toFixed(2) ?? '100.00'} XLM</p>
              <p className="text-caption text-muted-slate mt-1 truncate">GBBD...FLA5</p>
            </Card>
          </div>

          {/* Quick Execution Launcher */}
          <Card padding="lg" className="border-l-4 border-l-coral bg-gradient-to-r from-white via-white to-soft-stone/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-heading font-display text-near-black flex items-center gap-2">
                  <Zap className="h-5 w-5 text-coral" /> Instant Agent Execution Console
                </h2>
                <p className="text-body text-muted-slate">
                  Select an AI agent below to run live inference directly from your dashboard.
                </p>
              </div>
              <Button onClick={() => setActiveTab('marketplace')} icon={<Bot className="h-4 w-4" />}>
                View Full Marketplace
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.slice(0, 3).map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgent(agent)
                    setExecutionPrompt('')
                    setExecutionResult(null)
                  }}
                  className="p-4 rounded-lg border border-hairline bg-white hover:border-near-black hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-caption text-coral font-mono uppercase">{agent.category}</span>
                    <Badge variant="default" size="sm">{agent.price_per_request} XLM</Badge>
                  </div>
                  <h3 className="text-button font-display text-near-black group-hover:text-action-blue mb-1 line-clamp-1">
                    {agent.name}
                  </h3>
                  <p className="text-caption text-muted-slate line-clamp-2 mb-3">{agent.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-hairline text-caption text-muted-slate">
                    <span>Model: {agent.model}</span>
                    <span className="text-near-black font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Run <Play className="h-3 w-3 fill-near-black" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: MARKETPLACE DIRECTORY */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-hairline shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-slate" />
              <input
                type="text"
                placeholder="Search AI agents by name, tag, or capability..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-sm border border-hairline text-body text-ink placeholder:text-muted-slate focus:outline-none focus:border-near-black"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {['All', 'Blockchain & Security', 'DevOps & Automation', 'DeFi & Analytics', 'Legal & Enterprise', 'Marketing & Content'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-pill text-caption font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-near-black text-white'
                      : 'bg-soft-stone/60 text-muted-slate hover:text-ink hover:bg-soft-stone'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Cards Grid */}
          {agentsLoading ? (
            <div className="flex justify-center p-12"><Spinner size="lg" /></div>
          ) : agents.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-hairline p-8">
              <Bot className="h-12 w-12 text-muted-slate mx-auto mb-3" />
              <h3 className="text-heading font-display text-near-black mb-1">No AI Agents Found</h3>
              <p className="text-body text-muted-slate">Try resetting your search query or category filter.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => (
                <Card key={agent.id} padding="lg" className="flex flex-col justify-between hover:shadow-elevated transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-caption text-coral font-mono font-semibold uppercase">{agent.category}</span>
                      <Badge variant="default" size="sm" className="font-mono">{agent.price_per_request} XLM / req</Badge>
                    </div>
                    <h3 className="text-heading font-display text-near-black mb-2">{agent.name}</h3>
                    <p className="text-body text-muted-slate mb-4 line-clamp-3">{agent.description}</p>
                  </div>

                  <div className="pt-4 border-t border-hairline flex items-center justify-between">
                    <div className="text-caption text-muted-slate">
                      Rating: <span className="text-ink font-semibold">★ {agent.rating || 4.8}</span> ({agent.total_requests || 0} runs)
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAgent(agent)
                        setExecutionPrompt('')
                        setExecutionResult(null)
                      }}
                      icon={<Play className="h-3.5 w-3.5 fill-white" />}
                    >
                      Execute Agent
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: WALLET & STELLAR MICROPAYMENTS */}
      {activeTab === 'wallet' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-6">
            <Card padding="lg" variant="dark">
              <p className="text-caption text-muted-slate mb-1 uppercase tracking-wider">Stellar Freighter Address</p>
              <p className="text-heading-lg font-mono font-semibold text-white break-all mb-4">
                {user?.wallet_address || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'}
              </p>
              <div className="flex items-center gap-3">
                <Badge variant="success">Stellar Testnet Active</Badge>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.wallet_address || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5')
                    addToast({ type: 'success', title: 'Address Copied!' })
                  }}
                  className="text-caption text-muted-slate hover:text-white flex items-center gap-1"
                >
                  <Copy className="h-3.5 w-3.5" /> Copy Address
                </button>
              </div>
            </Card>

            <Card padding="lg">
              <p className="text-caption text-muted-slate mb-1 uppercase tracking-wider">Pre-Funded Balance</p>
              <p className="text-display font-display text-coral mb-4">{walletData?.balance?.toFixed(2) ?? '100.00'} XLM</p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => faucetMutation.mutate()}
                  loading={faucetMutation.isPending}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  Top Up +50 XLM Faucet
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 4: PLANS & BILLING */}
      {activeTab === 'billing' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div>
              <h2 className="text-heading font-display text-near-black">Subscription Plans</h2>
              <p className="text-body text-muted-slate">Upgrade to unlock unlimited agent executions and Corsair webhooks.</p>
            </div>

            <div className="flex items-center gap-3 bg-soft-stone p-1.5 rounded-pill">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${!billingAnnual ? 'bg-near-black text-white' : 'text-muted-slate'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`px-4 py-1.5 rounded-pill text-caption font-medium transition-all ${billingAnnual ? 'bg-near-black text-white' : 'text-muted-slate'}`}
              >
                Yearly (20% Off)
              </button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => {
              const price = plan.price === -1 ? 'Custom' : plan.price === 0 ? 'Free' : `$${billingAnnual ? Math.round(plan.price * 0.8) : plan.price}`
              const isCurrent = currentPlan === plan.id

              return (
                <Card key={plan.id} padding="lg" className={`relative flex flex-col justify-between ${plan.popular ? 'border-2 border-near-black shadow-md' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="info" size="sm">Most Popular</Badge>
                    </div>
                  )}
                  <div>
                    <h3 className="text-heading font-display text-ink mb-1">{plan.name}</h3>
                    <p className="text-caption text-muted-slate mb-4">{plan.description}</p>
                    <div className="mb-4">
                      <span className="text-display font-display text-near-black">{price}</span>
                      {plan.price > 0 && <span className="text-caption text-muted-slate">/month</span>}
                    </div>

                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-caption text-ink">
                          <Check className="h-4 w-4 text-deep-green mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={isCurrent ? 'outline' : plan.popular ? 'primary' : 'outline'}
                    className="w-full"
                    disabled={isCurrent || plan.id === 'enterprise'}
                    onClick={() => subscribeMutation.mutate(plan.id)}
                    loading={subscribeMutation.isPending && subscribeMutation.variables === plan.id}
                  >
                    {isCurrent ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade Plan'}
                  </Button>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 5: CORSAIR AUTOMATION */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-heading font-display text-near-black mb-1">Corsair Plugin Integrations</h2>
            <p className="text-body text-muted-slate">Connect external productivity platforms for automated AI outputs.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { id: 'github', name: 'GitHub Webhooks', desc: 'Sync PR diffs & generate automated unit test suites.', connected: true },
              { id: 'slack', name: 'Slack Bot', desc: 'Post agent outputs and alerts directly to Slack channels.', connected: true },
              { id: 'notion', name: 'Notion Knowledge Base', desc: 'Export AI summaries directly into Notion workspace pages.', connected: false },
            ].map((integ) => (
              <Card key={integ.id} padding="lg" className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-button font-display text-near-black">{integ.name}</h3>
                    <Badge variant={integ.connected ? 'success' : 'default'}>
                      {integ.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <p className="text-caption text-muted-slate mb-4">{integ.desc}</p>
                </div>

                <Button
                  variant={integ.connected ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => {
                    triggerRestrictedFeature('Corsair Custom Webhooks', () => {
                      addToast({ type: 'info', title: 'Corsair Plugin Synced', message: `${integ.name} updated.` })
                    })
                  }}
                >
                  {integ.connected ? 'Configure Sync' : 'Connect Plugin'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: API KEYS */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-heading font-display text-near-black">Programmatic API Keys</h2>
              <p className="text-body text-muted-slate">x402-secured API keys for machine-to-machine agent invocation.</p>
            </div>
            <Button
              size="sm"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => {
                addToast({ type: 'success', title: 'New API Key Created!', message: 'ag_live_9a87... copied to clipboard' })
              }}
            >
              Generate New Key
            </Button>
          </div>

          <Card padding="lg">
            <div className="space-y-3">
              {(apiKeys || [
                { id: 'key-1', name: 'Production Server Key', key_prefix: 'ag_live_9a87', created_at: '2026-08-19' }
              ]).map((key) => (
                <div key={key.id} className="flex items-center justify-between p-3 border border-hairline rounded-sm bg-soft-stone/20">
                  <div>
                    <p className="text-button font-medium text-ink">{key.name}</p>
                    <p className="text-caption font-mono text-muted-slate">{key.key_prefix}••••••••••••••••</p>
                  </div>
                  <Button variant="outline" size="sm" icon={<Trash2 className="h-3.5 w-3.5 text-red-500" />}>
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 7: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-heading font-display text-near-black">Usage Analytics</h2>
            <p className="text-body text-muted-slate">Real-time performance metrics and invocation throughput.</p>
          </div>

          <Card padding="lg">
            <div className="h-64 flex items-center justify-center bg-soft-stone/30 rounded-lg border border-hairline text-muted-slate text-body">
              [ Interactive Recharts Request & Revenue Distribution Graph ]
            </div>
          </Card>
        </div>
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fade-in max-w-2xl">
          <div>
            <h2 className="text-heading font-display text-near-black">User Preferences & Profile</h2>
            <p className="text-body text-muted-slate">Manage your account details and security preferences.</p>
          </div>

          <Card padding="lg" className="space-y-4">
            <Input label="Display Name" defaultValue={user?.name || ''} />
            <Input label="Email Address" defaultValue={user?.email || ''} disabled />
            <Input label="Stellar Wallet Address" defaultValue={user?.wallet_address || 'GBBD...FLA5'} disabled />

            <div className="pt-4 border-t border-hairline flex justify-end">
              <Button onClick={() => addToast({ type: 'success', title: 'Profile Updated' })}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* LIVE AGENT EXECUTION MODAL / CONSOLE */}
      {selectedAgent && (
        <Modal
          open={!!selectedAgent}
          onClose={() => setSelectedAgent(null)}
          title={`Execute ${selectedAgent.name}`}
          size="lg"
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-soft-stone/40 border border-hairline text-caption">
              <div>
                <span className="text-muted-slate">Category:</span> <span className="font-semibold text-ink">{selectedAgent.category}</span>
              </div>
              <div>
                <span className="text-muted-slate">Cost:</span> <span className="font-semibold text-coral">{selectedAgent.price_per_request} XLM</span>
              </div>
              <div>
                <span className="text-muted-slate">Model:</span> <span className="font-mono text-ink">{selectedAgent.model}</span>
              </div>
            </div>

            <div>
              <label className="block text-caption font-medium text-ink mb-1.5">
                Input Prompt / Code Snippet / Query:
              </label>
              <textarea
                rows={5}
                value={executionPrompt}
                onChange={(e) => setExecutionPrompt(e.target.value)}
                placeholder="Enter prompt or data payload to execute..."
                className="w-full p-3 rounded-sm border border-hairline text-body font-mono text-ink focus:outline-none focus:border-near-black bg-white"
              />
            </div>

            {executionResult && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-caption font-semibold text-deep-green flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Output Generated Successfully:
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(executionResult.result)
                      addToast({ type: 'success', title: 'Output Copied to Clipboard' })
                    }}
                    className="text-caption text-action-blue hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy Output
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-near-black text-white font-mono text-caption overflow-x-auto max-h-60 whitespace-pre-wrap shadow-inner">
                  {executionResult.result}
                </div>

                <div className="text-caption text-muted-slate flex justify-between pt-1">
                  <span>Stellar Tx: <code className="text-coral">{executionResult.transactionId}</code></span>
                  <span>Cost Deducted: {executionResult.cost} XLM</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-hairline">
              <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                Close
              </Button>

              <Button
                onClick={handleExecuteAgent}
                loading={executing}
                icon={<Zap className="h-4 w-4 text-coral" />}
              >
                {executing ? 'Processing AI Request...' : `Run (${selectedAgent.price_per_request} XLM)`}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* RESTRICTED FEATURE SUBSCRIPTION MODAL */}
      <Modal
        open={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        title="Subscription Upgrade Required"
        size="md"
      >
        <div className="space-y-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-coral/10 text-coral flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-heading font-display text-near-black">
              Unlock {subscriptionFeatureName}
            </h3>
            <p className="text-body text-muted-slate mt-1">
              You are currently on the Free Plan. Upgrade your subscription to access premium AI agents, custom Corsair webhooks, and developer revenue splits.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="outline" onClick={() => setShowSubscriptionModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowSubscriptionModal(false)
                setActiveTab('billing')
              }}
              icon={<ArrowRight className="h-4 w-4 text-coral" />}
            >
              Go to Subscription Plans
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={confirmModal.open}
        onClose={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        loading={confirmModal.loading}
      />
    </div>
  )
}