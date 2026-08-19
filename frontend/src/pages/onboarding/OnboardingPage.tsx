import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Bot, Wallet, Check, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../providers/AuthProvider'
import { useUIStore } from '../../stores/uiStore'

const steps = [
  { title: 'Welcome', icon: Zap },
  { title: 'Profile', icon: Zap },
  { title: 'Preferences', icon: Bot },
  { title: 'Wallet', icon: Wallet },
  { title: 'Ready', icon: Check },
]

const roles = [
  { value: 'user', label: 'AI User', desc: 'Use AI agents for my work' },
  { value: 'developer', label: 'Agent Developer', desc: 'Build and sell AI agents' },
  { value: 'both', label: 'Both', desc: 'Use and build AI agents' },
]

export function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const navigate = useNavigate()
  const { user } = useAuth()
  const addToast = useUIStore((s) => s.addToast)

  const interestOptions = ['Writing', 'Coding', 'Analysis', 'Creative', 'Productivity', 'Data', 'Marketing', 'Research']

  const toggleInterest = (i: string) => {
    setInterests((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i])
  }

  const handleComplete = () => {
    addToast({ type: 'success', title: 'Onboarding complete!', message: 'Welcome to Agenova.' })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-lg bg-near-black flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-heading font-semibold">Agenova</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-medium ${i <= step ? 'bg-near-black text-white' : 'bg-soft-stone text-muted-slate'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-caption hidden sm:block ${i <= step ? 'text-ink' : 'text-muted-slate'}`}>{s.title}</span>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-near-black' : 'bg-hairline'}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-indigo-600" />
            </div>
            <h1 className="text-display font-display text-near-black mb-3">Welcome to Agenova</h1>
            <p className="text-body-lg text-muted-slate mb-8 leading-relaxed">
              Let&apos;s get you set up. In just a few steps, you&apos;ll be ready to explore, use, and build AI agents.
            </p>
            <Button size="lg" onClick={() => setStep(1)}>
              Get started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-heading font-display text-ink mb-6">Complete your profile</h2>
            <div className="space-y-4">
              <Input label="Full name" value={user?.name || ''} onChange={() => {}} />
              <div>
                <label className="block text-caption font-medium text-ink mb-2">I want to...</label>
                <div className="grid gap-2">
                  {roles.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className={`flex items-center gap-3 p-4 border rounded-sm text-left transition-colors ${role === r.value ? 'border-near-black bg-soft-stone/30' : 'border-hairline hover:border-muted-slate'}`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === r.value ? 'border-near-black' : 'border-hairline'}`}>
                        {role === r.value && <div className="w-3 h-3 rounded-full bg-near-black" />}
                      </div>
                      <div>
                        <p className="text-button font-medium text-ink">{r.label}</p>
                        <p className="text-caption text-muted-slate">{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Company (optional)" placeholder="Your company name" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-heading font-display text-ink mb-2">What interests you?</h2>
            <p className="text-body text-muted-slate mb-6">Select the types of AI agents you&apos;re interested in.</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleInterest(opt)}
                  className={`px-4 py-2 rounded-pill text-button transition-colors ${
                    interests.includes(opt) ? 'bg-near-black text-white' : 'bg-soft-stone text-ink hover:bg-border-light'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-heading font-display text-ink mb-2">Connect your wallet</h2>
            <p className="text-body text-muted-slate mb-6">
              Connect a Stellar wallet to make payments and receive earnings. You can skip this and do it later.
            </p>
            <Button className="w-full mb-3" icon={<Wallet className="h-4 w-4" />}>
              Connect Freighter Wallet
            </Button>
            <p className="text-caption text-muted-slate text-center">
              Don&apos;t have Freighter?{' '}
              <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-action-blue hover:underline">Install it</a>
            </p>
          </div>
        )}

        {step === 4 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-pale-green flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-deep-green" />
            </div>
            <h1 className="text-display font-display text-near-black mb-3">You&apos;re all set!</h1>
            <p className="text-body-lg text-muted-slate mb-8">
              Your account is ready. Start exploring the marketplace or create your first AI agent.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={handleComplete}>
                Go to Dashboard <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/marketplace')}>
                Browse Marketplace
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step > 0 && step < 4 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < 4 && step > 0 && (
            <Button className="ml-auto" onClick={() => step === 3 ? handleComplete() : setStep(step + 1)}>
              {step === 3 ? 'Finish' : 'Continue'} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
