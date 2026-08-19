import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, Bot } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { useUIStore } from '../../stores/uiStore'
import { agentsApi } from '../../api/endpoints'

export function CreateAgentPage() {
  const navigate = useNavigate()
  const addToast = useUIStore((s) => s.addToast)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [model, setModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [price, setPrice] = useState('')

  const mutation = useMutation({
    mutationFn: (data: Parameters<typeof agentsApi.create>[0]) => agentsApi.create(data),
    onSuccess: () => {
      addToast({ type: 'success', title: 'Agent published!', message: 'Your agent is now available in the marketplace.' })
      navigate('/dashboard/agents')
    },
    onError: (err: Error) => {
      addToast({ type: 'error', title: 'Failed to publish', message: err.message })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !description || !price) return
    mutation.mutate({
      name,
      description,
      category,
      model,
      prompt,
      pricePerRequest: parseFloat(price),
    })
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-caption text-muted-slate hover:text-ink mb-6">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Bot className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-display font-display text-near-black">Create Agent</h1>
          <p className="text-body text-muted-slate">Publish your AI agent to the marketplace</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="lg">
          <h2 className="text-heading font-display text-ink mb-4">Basic Information</h2>
          <div className="space-y-4">
            <Input label="Agent name" placeholder="e.g., GPT-4 Writer" value={name} onChange={(e) => setName(e.target.value)} required />
            <div>
              <label className="block text-caption font-medium text-ink mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe what your agent does..." className="w-full p-3 border border-hairline rounded-sm text-body text-ink placeholder:text-muted-slate focus:outline-none focus:border-form-focus resize-none" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Category" options={[
                { value: 'writing', label: 'Writing' }, { value: 'coding', label: 'Coding' },
                { value: 'analysis', label: 'Analysis' }, { value: 'creative', label: 'Creative' },
                { value: 'productivity', label: 'Productivity' }, { value: 'data', label: 'Data' },
                { value: 'marketing', label: 'Marketing' }, { value: 'research', label: 'Research' },
              ]} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Select category" />
              <Select label="AI Model" options={[
                { value: 'gpt-4', label: 'OpenAI GPT-4' }, { value: 'gpt-4o', label: 'OpenAI GPT-4o' },
                { value: 'claude-3', label: 'Anthropic Claude 3' }, { value: 'gemini-pro', label: 'Google Gemini Pro' },
                { value: 'mixtral', label: 'Mixtral 8x7B' }, { value: 'custom', label: 'Custom API' },
              ]} value={model} onChange={(e) => setModel(e.target.value)} placeholder="Select model" />
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-heading font-display text-ink mb-4">System Prompt</h2>
          <div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={6} placeholder="Enter the system prompt that defines your agent's behavior..." className="w-full p-3 border border-hairline rounded-sm text-body text-ink placeholder:text-muted-slate focus:outline-none focus:border-form-focus resize-none font-mono text-caption" />
            <p className="text-caption text-muted-slate mt-1">This prompt will be sent as the system message for every request.</p>
          </div>
        </Card>

        <Card padding="lg">
          <h2 className="text-heading font-display text-ink mb-4">Pricing</h2>
          <div className="max-w-xs">
            <Input label="Price per request (XLM)" type="number" step="0.01" min="0.01" placeholder="0.50" value={price} onChange={(e) => setPrice(e.target.value)} hint="80% goes to you, 20% to platform" required />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>Publish Agent</Button>
        </div>
      </form>
    </div>
  )
}