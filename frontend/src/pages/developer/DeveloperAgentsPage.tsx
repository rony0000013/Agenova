import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Bot, Edit3, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useUIStore } from '../../stores/uiStore'
import { agentsApi } from '../../api/endpoints'

export function DeveloperAgentsPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const addToast = useUIStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: agents, isLoading } = useQuery({
    queryKey: ['my-agents'],
    queryFn: () => agentsApi.myAgents(),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof agentsApi.update>[1] }) =>
      agentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-agents'] })
      addToast({ type: 'success', title: 'Agent status updated' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Update failed', message: err.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-agents'] })
      setDeleteId(null)
      addToast({ type: 'success', title: 'Agent deleted' })
    },
    onError: (err: Error) => addToast({ type: 'error', title: 'Delete failed', message: err.message }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display font-display text-near-black">My Agents</h1>
          <p className="text-body-lg text-muted-slate">Manage your published AI agents</p>
        </div>
        <Link to="/dashboard/agents/new">
          <Button icon={<Plus className="h-4 w-4" />}>Create Agent</Button>
        </Link>
      </div>

      {!agents || agents.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-8 w-8" />}
          title="No agents yet"
          description="Publish your first AI agent and start earning XLM for every request."
          action={{ label: 'Create your first agent', onClick: () => {} }}
        />
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Card key={agent.id} padding="md" className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-button font-medium text-ink">{agent.name}</p>
                    <Badge variant={agent.status === 'active' ? 'success' : 'default'} size="sm">{agent.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-caption text-muted-slate">
                    <span>{(agent.totalRequests || agent.total_requests || 0).toLocaleString()} requests</span>
                    <span>{(agent.totalRevenue || agent.total_revenue || 0).toLocaleString()} XLM earned</span>
                    <span>{agent.pricePerRequest || agent.price_per_request || 0} XLM/req</span>
                  </div>

                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleMutation.mutate({ id: agent.id, data: { status: agent.status === 'active' ? 'inactive' : 'active' } })}
                  className="p-2 text-muted-slate hover:text-ink transition-colors"
                  title={agent.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {agent.status === 'active' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => setDeleteId(agent.id)} className="p-2 text-muted-slate hover:text-error-red transition-colors" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete agent"
        message="Are you sure? This will permanently remove your agent from the marketplace. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}