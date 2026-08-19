import { type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './AuthProvider'
import { WalletProvider } from '../context/WalletContext'
import { ToastContainer } from '../components/ui/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </WalletProvider>
    </QueryClientProvider>
  )
}
