import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Puzzle, Code, Webhook, GitBranch, Zap, Image, FileText, MessagesSquare } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Spinner } from '../../components/ui/Spinner'
import { useUIStore } from '../../stores/uiStore'
import { integrationsApi } from '../../api/endpoints'

const INTEGRATION_TEMPLATES = [
  { id: 'slack', name: 'Slack', desc: 'Post agent responses to Slack channels', icon: MessagesSquare, color: 'text-green-600' },
  { id: 'github', name: 'GitHub', desc: 'Review PRs and issues with agents', icon: GitBranch, color: 'text-ink' },
  { id: 'zapier', name: 'Zapier', desc: 'Connect with 5000+ tools via Zapier', icon: Zap, color: 'text-orange-500' },
  { id: 'webhook', name: 'Webhook', desc: 'Custom webhook integrations', icon: Webhook, color: 'text-indigo-500' },
  { id: 'discord', name: 'Discord', desc: 'Agent notifications in Discord', icon: MessagesSquare, color: 'text-blue-600' },
  { id: 'openai', name: 'OpenAI', desc: 'Use custom OpenAI models', icon: Code, color: 'text-green-500' },
  { id: 'stability', name: 'Stability AI', desc: 'Image generation agents', icon: Image, color: 'text-purple-500' },
  { id: 'notion', name: 'Notion', desc: 'Sync agent outputs to Notion', icon: FileText, color: 'text-ink' },
]

export function IntegrationsPage() {
  const [showConfig, setShowConfig] = useState<string | null>(null)
  const [configValue, setConfigValue] = useState('')
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: activeIntegrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.list(),
  })

  const connectMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config?: Record<string, string> }) => integrationsApi.connect(id, config || {}),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      setShowConfig(null)
      setConfigValue('')
      addToast({ type: 'success', title: 'Integration connected!' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Connection failed', message: err.message }),
  })

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
      addToast({ type: 'success', title: 'Integration disconnected' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Disconnect failed', message: err.message }),
  })

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spinner size="lg" /></div>
  }

  const activeIds = new Set(activeIntegrations?.map((i: any) => i.integration_id ?? i.id) ?? [])

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-display font-display text-near-black">Integrations</h1>
        <p className="text-body-lg text-muted-slate">Connect your tools and services</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {INTEGRATION_TEMPLATES.map((t) => {
          const isActive = activeIds.has(t.id)
          return (
            <Card key={t.id} padding="lg" className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-soft-stone flex items-center justify-center ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                {isActive && <Badge variant="success" size="sm">Connected</Badge>}
              </div>
              <h3 className="text-button font-display text-ink mb-1">{t.name}</h3>
              <p className="text-caption text-muted-slate flex-1 mb-6">{t.desc}</p>
              {isActive ? (
                <Button variant="outline" size="sm" onClick={() => disconnectMutation.mutate(t.id)} loading={disconnectMutation.isPending && disconnectMutation.variables === t.id}>
                  Disconnect
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setShowConfig(t.id)}>Connect</Button>
              )}
            </Card>
          )
        })}
      </div>

      <Modal open={!!showConfig} onClose={() => setShowConfig(null)} title={`Configure ${INTEGRATION_TEMPLATES.find(t => t.id === showConfig)?.name || ''}`} size="sm">
        <Input label="API Key / Webhook URL" placeholder="Enter your API key or webhook URL" value={configValue} onChange={(e) => setConfigValue(e.target.value)} />
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowConfig(null)}>Cancel</Button>
          <Button onClick={() => showConfig && connectMutation.mutate({ id: showConfig, config: { key: configValue } })} loading={connectMutation.isPending}>Connect</Button>
        </div>
      </Modal>
    </div>
  )
}