import { api } from './client'
import type { User, Agent, Transaction, Wallet, Subscription, APIKey, Notification, Integration, AnalyticsData, PaginatedResponse } from '../types'

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string; user: User }>('/auth/login', data),
  stellarLogin: (data: { walletAddress: string; name?: string; role?: string }) =>
    api.post<{ access_token: string; token?: string; user: User }>('/auth/stellar-login', data),
  signup: (data: { email: string; password: string; name: string }) =>
    api.post<{ user: User; message: string }>('/auth/signup', data),
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) =>
    api.post<{ message: string }>('/auth/verify-email', { token }),
  me: () => api.get<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
}


export const agentsApi = {
  list: (params?: { page?: number; limit?: number; category?: string; search?: string; sort?: string }) =>
    api.get<PaginatedResponse<Agent>>('/agents', { params }),
  get: (id: string) => api.get<Agent>(`/agents/${id}`),
  create: (data: Partial<Agent>) => api.post<Agent>('/agents', data),
  update: (id: string, data: Partial<Agent>) => api.put<Agent>(`/agents/${id}`, data),
  delete: (id: string) => api.delete<{ message: string }>(`/agents/${id}`),
  execute: (id: string, input: { prompt: string; variables?: Record<string, string> }) =>
    api.post<{ result: string; transactionId: string }>(`/agents/${id}/execute`, input),
  myAgents: () => api.get<Agent[]>('/agents/my'),
}

export const walletApi = {
  connect: (address: string) => api.post<Wallet>('/wallet/connect', { address }),
  disconnect: () => api.post<{ message: string }>('/wallet/disconnect'),
  balance: () => api.get<Wallet>('/wallet/balance'),
  transactions: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Transaction>>('/wallet/transactions', { params }),
}

export const billingApi = {
  subscriptions: () => api.get<Subscription>('/billing/subscription'),
  plans: () => api.get<{ id: string; name: string; price: number; features: string[] }[]>('/billing/plans'),
  subscribe: (planId: string) => api.post<Subscription>('/billing/subscribe', { planId }),
  cancel: () => api.post<{ message: string }>('/billing/cancel'),
  history: () => api.get<Transaction[]>('/billing/history'),
}

export const apiKeysApi = {
  list: () => api.get<APIKey[]>('/api-keys'),
  create: (name: string) => api.post<APIKey>('/api-keys', { name }),
  revoke: (id: string) => api.delete<{ message: string }>(`/api-keys/${id}`),
}

export const notificationsApi = {
  list: () => api.get<Notification[]>('/notifications'),
  markRead: (id: string) => api.put<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.put<{ message: string }>('/notifications/read-all'),
  delete: (id: string) => api.delete<{ message: string }>(`/notifications/${id}`),
  clearAll: () => api.delete<{ message: string }>('/notifications'),
  preferences: () => api.get<Record<string, boolean>>('/notifications/preferences'),
  updatePreferences: (prefs: Record<string, boolean>) =>
    api.put<Record<string, boolean>>('/notifications/preferences', prefs),
}

export const analyticsApi = {
  dashboard: () => api.get<AnalyticsData>('/analytics/dashboard'),
  developer: () => api.get<AnalyticsData>('/analytics/developer'),
  admin: () => api.get<AnalyticsData>('/analytics/admin'),
}

export const integrationsApi = {
  list: () => api.get<Integration[]>('/integrations'),
  connect: (type: string, config: Record<string, string>) =>
    api.post<Integration>('/integrations/connect', { type, config }),
  disconnect: (id: string) => api.delete<{ message: string }>(`/integrations/${id}`),
  sync: (id: string) => api.post<{ message: string }>(`/integrations/${id}/sync`),
}

export const settingsApi = {
  get: () => api.get<Record<string, any>>('/settings'),
  update: (data: Record<string, any>) => api.put<Record<string, any>>('/settings', data),
  deleteAccount: () => api.delete<{ message: string }>('/settings/account'),
  exportData: () => api.post<{ message: string }>('/settings/export'),
}

export const adminApi = {
  users: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<User>>('/admin/users', { params }),
  updateUserRole: (userId: string, role: string) =>
    api.put<{ message: string }>(`/admin/users/${userId}/role`, { role }),
  agents: () => api.get<Agent[]>('/admin/agents'),
  toggleAgentStatus: (agentId: string) =>
    api.put<{ message: string }>(`/admin/agents/${agentId}/toggle`),
  analytics: () => api.get<AnalyticsData>('/admin/analytics'),
}
