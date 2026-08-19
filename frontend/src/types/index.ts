export interface User {
  id: string
  email: string
  name: string
  display_name?: string
  avatar?: string
  role: 'user' | 'developer' | 'admin'
  walletAddress?: string
  wallet_address?: string
  plan?: string
  isVerified?: boolean
  is_verified?: boolean
  createdAt?: string
  created_at?: string
}

export interface Agent {
  id: string
  name: string
  description: string
  category: AgentCategory | string
  pricePerRequest?: number
  price_per_request?: number
  model: string
  prompt: string
  status?: 'active' | 'inactive' | 'draft' | string
  developer?: User
  developer_id?: string
  rating?: number
  totalRequests?: number
  total_requests?: number
  totalRevenue?: number
  total_revenue?: number
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  tags?: string[]
  icon?: string
}

export type AgentCategory =
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'productivity'
  | 'data'
  | 'marketing'
  | 'research'
  | 'Blockchain & Security'
  | 'DevOps & Automation'
  | 'DeFi & Analytics'
  | 'Legal & Enterprise'
  | 'Marketing & Content'
  | 'Productivity & Support'
  | 'other'

export interface Transaction {
  id: string
  type: 'payment' | 'payout' | 'refund' | 'deposit' | string
  amount: number
  asset: 'XLM' | 'USDC' | string
  from?: string
  to?: string
  user_id?: string
  status: 'pending' | 'completed' | 'failed' | string
  agentId?: string
  agent_id?: string
  description?: string
  createdAt?: string
  created_at?: string
  stellarTxHash?: string
  stellar_tx_hash?: string
}

export interface Wallet {
  address?: string
  stellar_address?: string
  balance: number
  xlmBalance?: number
  usdcBalance?: number
  isConnected?: boolean
  is_connected?: boolean
}

export interface Subscription {
  id?: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise' | string
  status: 'active' | 'canceled' | 'expired' | 'trial' | string
  price?: number
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd?: boolean
  trialEndsAt?: string
}

export interface APIKey {
  id: string
  name: string
  key?: string
  key_prefix?: string
  hashed_key?: string
  createdAt?: string
  created_at?: string
  lastUsed?: string
  active?: boolean
}

export interface Notification {
  id: string
  type?: 'payment' | 'agent' | 'system' | 'subscription' | 'integration' | string
  title: string
  message: string
  read?: boolean
  is_read?: boolean
  createdAt?: string
  created_at?: string
  link?: string
}

export interface Integration {
  id: string
  name?: string
  provider?: string
  type?: 'github' | 'slack' | 'notion' | 'gmail' | 'google_drive' | 'webhook' | string
  connected?: boolean
  is_connected?: boolean
  config?: Record<string, string>
  lastSynced?: string
}

export interface AnalyticsData {
  totalRequests?: number
  total_requests?: number
  totalRevenue?: number
  total_revenue?: number
  totalSpent?: number
  total_spent?: number
  totalUsers?: number
  total_users?: number
  agentsUsed?: number
  agents_used?: number
  totalAgents?: number
  total_agents?: number
  activeAgents?: number
  dailyRequests?: { date: string; count: number }[]
  revenueByDay?: { date: string; amount: number }[]
  topAgents?: { id: string; name: string; requests: number; revenue: number }[]
}

export interface PaginationParams {
  page: number
  limit: number
  total: number
  totalPages?: number
  total_pages?: number
}

export interface PaginatedResponse<T> {
  data?: T[]
  items?: T[]
  pagination?: PaginationParams
  total?: number
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
