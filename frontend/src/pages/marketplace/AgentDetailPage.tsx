import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Zap, ArrowLeft, Send, Wallet } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { useUIStore } from '../../stores/uiStore'
import { agentsApi } from '../../api/endpoints'

export function AgentDetailPage() {
  const { id } = useParams()
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState('')
  const addToast = useUIStore((s) => s.addToast)

  const { data: agent, isLoading, isError } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.get(id!),
    enabled: !!id,
  })

  const executeMutation = useMutation({
    mutationFn: () => agentsApi.execute(id!, { prompt }),
    onSuccess: (data) => {
      setResult(data.result)
      addToast({ type: 'success', title: 'Request complete!', message: `${agent?.pricePerRequest ?? 0} XLM charged` })
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Execution failed', message: err.message })
    },
  })

  const handleExecute = () => {
    if (!prompt.trim()) return
    setResult('')
    addToast({ type: 'info', title: 'Processing request...', message: `Charging ${agent?.pricePerRequest ?? 0} XLM` })
    executeMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (isError || !agent) {
    return (
      <div className="max-w-4xl animate-fade-in">
        <EmptyState
          icon={<Zap className="h-8 w-8" />}
          title="Agent not found"
          description="This agent could not be loaded. It may have been removed or the link is invalid."
          action={{ label: 'Back to marketplace', onClick: () => window.history.back() }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl animate-fade-in">
      <Link to="/marketplace" className="flex items-center gap-1 text-caption text-muted-slate hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to marketplace
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Zap className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-display font-display text-near-black mb-1">{agent.name}</h1>
                <p className="text-body text-muted-slate">{agent.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-caption">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-coral text-coral" /> {agent.rating} rating</span>
              <span className="text-muted-slate">{(agent.totalRequests || agent.total_requests || 0).toLocaleString()} requests</span>

              <Badge variant="info" size="sm">{agent.model}</Badge>
              <Badge variant="default" size="sm">{agent.category}</Badge>
            </div>
          </div>

          <Card padding="lg">
            <h2 className="text-heading font-display text-ink mb-4">Try it out</h2>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt..."
              rows={4}
              className="w-full p-4 border border-hairline rounded-sm text-body text-ink placeholder:text-muted-slate focus:outline-none focus:border-form-focus resize-none"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2 text-caption text-muted-slate">
                <Wallet className="h-4 w-4" />
                Cost: <strong className="text-ink">{agent.pricePerRequest} XLM</strong>
              </div>
              <Button onClick={handleExecute} loading={executeMutation.isPending} icon={<Send className="h-4 w-4" />}>
                Execute & Pay
              </Button>
            </div>
          </Card>

          {executeMutation.isPending && (
            <Card padding="lg" className="text-center">
              <Spinner size="lg" />
              <p className="text-body text-muted-slate mt-3">Processing your request...</p>
            </Card>
          )}

          {result && !executeMutation.isPending && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading font-display text-ink">Result</h2>
                <Badge variant="success" size="sm">Completed</Badge>
              </div>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                <p className="text-body text-ink">{result}</p>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-button font-medium text-ink mb-3">Pricing</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-caption text-muted-slate">Per request</span>
                <span className="text-button font-medium text-ink">{agent.pricePerRequest} XLM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption text-muted-slate">Revenue split</span>
                <span className="text-caption text-ink">80% / 20%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption text-muted-slate">Network</span>
                <Badge variant="default" size="sm">Stellar</Badge>
              </div>
            </div>
          </Card>

          <Card padding="md">
            <h3 className="text-button font-medium text-ink mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {(agent.tags ?? []).map((tag) => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}