'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  FiPackage,
  FiSearch,
  FiCode,
  FiDollarSign,
  FiUploadCloud,
  FiDownload,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiGrid,
  FiList,
  FiMenu,
  FiX,
  FiPlus,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
  FiCopy,
  FiTag,
  FiTarget,
  FiTrendingUp,
  FiUsers,
  FiFile,
  FiFileText,
  FiChevronRight,
  FiArrowLeft,
  FiStar,
  FiZap,
  FiShoppingBag
} from 'react-icons/fi'
import {
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineArchiveBox
} from 'react-icons/hi2'
import { LuLayoutDashboard, LuFileCode2, LuShoppingBag } from 'react-icons/lu'

// ========================
// CONSTANTS
// ========================

const MANAGER_AGENT_ID = '699ae0e021096e9c61f06fb8'
const PUBLISHER_AGENT_ID = '699ae0f692da22a75dd2719f'
const STORAGE_KEY = 'rule47_products'

// ========================
// TYPES
// ========================

interface MarketResearch {
  demand_score: number
  demand_analysis: string
  competitors: any
  pricing_benchmark: any
  target_audience: string
  positioning_opportunities: string
  market_summary: string
  viability_rating: string
}

interface ProductContent {
  tech_stack: any
  files: any
  readme_content: string
  setup_instructions: string
  file_count: number
  product_summary: string
}

interface Listing {
  title: string
  tagline: string
  description: string
  feature_bullets: any
  recommended_price: number
  price_justification: string
  category_tags: any
  call_to_action: string
  seo_keywords: any
}

interface ProductPackage {
  product_name: string
  product_type: string
  market_research: MarketResearch
  product_content: ProductContent
  listing: Listing
  status: string
  created_at: string
}

interface StoredProduct {
  id: string
  product_name: string
  product_type: string
  status: 'live' | 'draft'
  price: number
  title: string
  tagline: string
  description: string
  feature_bullets: string[]
  category_tags: string[]
  market_research: any
  product_content: any
  listing: any
  created_at: string
  published_at?: string
  publisher_response?: any
}

interface FormData {
  productIdea: string
  productType: string
  targetAudience: string
  priceRange: string
}

// ========================
// HELPERS
// ========================

function safeParse<T>(value: any, fallback: T): T {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed as T
    } catch {
      return fallback
    }
  }
  if (Array.isArray(fallback) && Array.isArray(value)) return value as T
  if (typeof fallback === 'object' && typeof value === 'object') return value as T
  return value as T
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

function loadProducts(): StoredProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveProducts(products: StoredProduct[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  } catch {
    // silently fail
  }
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch {
    return dateStr
  }
}

// ========================
// MARKDOWN RENDERER
// ========================

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">{part}</strong>
    ) : (
      part
    )
  )
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

// ========================
// SAMPLE DATA
// ========================

const SAMPLE_PRODUCTS: StoredProduct[] = [
  {
    id: 'sample-1',
    product_name: 'React Dashboard Starter Kit',
    product_type: 'Template',
    status: 'live',
    price: 29,
    title: 'React Dashboard Starter Kit - Admin Panel Template',
    tagline: 'Ship your SaaS dashboard 10x faster',
    description: 'A production-ready React dashboard template with authentication, charts, tables, and dark mode. Built with TypeScript, Tailwind CSS, and shadcn/ui.',
    feature_bullets: ['TypeScript + React 18', 'Dark mode support', '20+ pre-built components', 'Authentication flow included', 'Responsive design'],
    category_tags: ['react', 'dashboard', 'template', 'saas'],
    market_research: { demand_score: 8, viability_rating: 'High', target_audience: 'Indie hackers and startup founders' },
    product_content: { file_count: 45, tech_stack: ['React', 'TypeScript', 'Tailwind CSS'] },
    listing: {},
    created_at: '2025-01-15T10:30:00Z',
    published_at: '2025-01-15T11:00:00Z'
  },
  {
    id: 'sample-2',
    product_name: 'Email Automation Scripts',
    product_type: 'Tool/Script',
    status: 'live',
    price: 19,
    title: 'Email Automation Scripts - Python Collection',
    tagline: 'Automate your email workflows in minutes',
    description: 'A collection of 15 Python scripts for email automation including bulk sending, scheduling, template management, and analytics tracking.',
    feature_bullets: ['15 ready-to-use scripts', 'SMTP and API support', 'Template engine included', 'CSV import/export'],
    category_tags: ['python', 'automation', 'email', 'scripts'],
    market_research: { demand_score: 7, viability_rating: 'Medium-High', target_audience: 'Marketers and small business owners' },
    product_content: { file_count: 18, tech_stack: ['Python', 'SMTP'] },
    listing: {},
    created_at: '2025-02-01T14:00:00Z',
    published_at: '2025-02-01T15:30:00Z'
  },
  {
    id: 'sample-3',
    product_name: 'API Documentation Generator',
    product_type: 'Utility',
    status: 'draft',
    price: 15,
    title: 'API Documentation Generator',
    tagline: 'Beautiful API docs from your code',
    description: 'Automatically generate beautiful, interactive API documentation from OpenAPI/Swagger specs. Includes custom themes and search.',
    feature_bullets: ['OpenAPI 3.0 support', 'Custom theming', 'Full-text search', 'One-click deploy'],
    category_tags: ['api', 'documentation', 'developer-tools'],
    market_research: { demand_score: 6, viability_rating: 'Medium', target_audience: 'Backend developers' },
    product_content: { file_count: 22, tech_stack: ['Node.js', 'React'] },
    listing: {},
    created_at: '2025-02-10T09:00:00Z'
  },
  {
    id: 'sample-4',
    product_name: 'Social Media Scheduler CLI',
    product_type: 'Tool/Script',
    status: 'draft',
    price: 12,
    title: 'Social Media Scheduler CLI',
    tagline: 'Schedule posts from your terminal',
    description: 'A command-line tool to schedule and manage social media posts across Twitter, LinkedIn, and Instagram from your terminal.',
    feature_bullets: ['Multi-platform support', 'Cron scheduling', 'Media uploads', 'Analytics dashboard'],
    category_tags: ['cli', 'social-media', 'automation'],
    market_research: { demand_score: 5, viability_rating: 'Medium', target_audience: 'Developer content creators' },
    product_content: { file_count: 12, tech_stack: ['Go', 'REST APIs'] },
    listing: {},
    created_at: '2025-02-18T16:00:00Z'
  }
]

// ========================
// ERROR BOUNDARY
// ========================

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ========================
// INLINE SUB-COMPONENTS
// ========================

function StatusBadge({ status }: { status: string }) {
  if (status === 'live') {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        <FiCheck className="w-3 h-3 mr-1" /> Live
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100">
      <FiEdit3 className="w-3 h-3 mr-1" /> Draft
    </Badge>
  )
}

function DemandGauge({ score }: { score: number }) {
  const safeScore = typeof score === 'number' ? Math.min(10, Math.max(0, score)) : 0
  const percentage = safeScore * 10
  const color = safeScore >= 7 ? 'bg-green-500' : safeScore >= 4 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Demand Score</span>
        <span className="text-2xl font-bold text-foreground">{safeScore}<span className="text-sm text-muted-foreground font-normal">/10</span></span>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function StepIndicator({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep
        const isDone = idx < currentStep
        return (
          <div key={idx} className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 shrink-0',
              isDone ? 'bg-green-500 text-white' : isActive ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary text-muted-foreground'
            )}>
              {isDone ? <FiCheck className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={cn(
              'text-sm transition-colors',
              isActive ? 'text-foreground font-medium' : isDone ? 'text-green-600 font-medium' : 'text-muted-foreground'
            )}>
              {step}
            </span>
            {isActive && <span className="text-xs text-muted-foreground animate-pulse">Processing...</span>}
          </div>
        )
      })}
    </div>
  )
}

function EmptyState({ icon, title, description, action, onAction }: {
  icon: React.ReactNode
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && onAction && (
        <Button onClick={onAction} className="gap-2">
          <FiPlus className="w-4 h-4" /> {action}
        </Button>
      )}
    </div>
  )
}

function AgentStatusCard({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: MANAGER_AGENT_ID, name: 'Product Creation Manager', desc: 'Orchestrates research, building, and listing' },
    { id: PUBLISHER_AGENT_ID, name: 'Store Publisher', desc: 'Publishes products to Payhip store' }
  ]
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FiZap className="w-4 h-4 text-primary" /> AI Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {agents.map((agent) => (
          <div key={agent.id} className="flex items-center gap-2 py-1.5">
            <div className={cn(
              'w-2 h-2 rounded-full shrink-0 transition-colors',
              activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'
            )} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{agent.name}</p>
              <p className="text-xs text-muted-foreground truncate">{agent.desc}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ========================
// MAIN PAGE
// ========================

export default function Page() {
  // Navigation
  const [screen, setScreen] = useState<'dashboard' | 'new' | 'review' | 'catalog'>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sampleMode, setSampleMode] = useState(false)

  // Products
  const [products, setProducts] = useState<StoredProduct[]>([])
  const [selectedProduct, setSelectedProduct] = useState<StoredProduct | null>(null)

  // Agent state
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Generation state
  const [generationStep, setGenerationStep] = useState(0)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    productIdea: '',
    productType: '',
    targetAudience: '',
    priceRange: ''
  })

  // Review state — product package from manager
  const [currentPackage, setCurrentPackage] = useState<ProductPackage | null>(null)
  const [artifactFiles, setArtifactFiles] = useState<any[]>([])

  // Editable listing fields
  const [editedTitle, setEditedTitle] = useState('')
  const [editedTagline, setEditedTagline] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [editedPrice, setEditedPrice] = useState(0)
  const [editedBullets, setEditedBullets] = useState<string[]>([])
  const [editedTags, setEditedTags] = useState<string[]>([])

  // Publishing state
  const [publishing, setPublishing] = useState(false)
  const [publishResult, setPublishResult] = useState<any>(null)
  const [showPublishDialog, setShowPublishDialog] = useState(false)

  // Catalog filter
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'live' | 'draft'>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogView, setCatalogView] = useState<'grid' | 'list'>('grid')

  // Detail view dialog
  const [detailProduct, setDetailProduct] = useState<StoredProduct | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Load products from localStorage
  useEffect(() => {
    setProducts(loadProducts())
  }, [])

  // Compute stats
  const displayProducts = sampleMode && products.length === 0 ? SAMPLE_PRODUCTS : products
  const totalProducts = displayProducts.length
  const liveProducts = displayProducts.filter(p => p.status === 'live').length
  const draftProducts = displayProducts.filter(p => p.status === 'draft').length
  const revenueEstimate = displayProducts.filter(p => p.status === 'live').reduce((sum, p) => sum + (p.price || 0), 0)

  // Navigation handler
  const navigate = useCallback((s: 'dashboard' | 'new' | 'review' | 'catalog') => {
    setScreen(s)
    setSidebarOpen(false)
    setError(null)
    setSuccessMessage(null)
  }, [])

  // Populate editable fields from package
  const populateEditableFields = useCallback((pkg: ProductPackage) => {
    const listing = pkg?.listing || {}
    setEditedTitle(listing?.title || pkg?.product_name || '')
    setEditedTagline(listing?.tagline || '')
    setEditedDescription(listing?.description || '')
    setEditedPrice(listing?.recommended_price || 0)
    setEditedBullets(safeParse(listing?.feature_bullets, []))
    setEditedTags(safeParse(listing?.category_tags, []))
  }, [])

  // Generate product
  const handleGenerate = async () => {
    if (!formData.productIdea.trim()) {
      setError('Please describe your product idea.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setActiveAgentId(MANAGER_AGENT_ID)
    setGenerationStep(0)
    setGenerationProgress(10)
    setScreen('review')

    // Simulate step progression
    const stepTimer1 = setTimeout(() => { setGenerationStep(1); setGenerationProgress(40) }, 8000)
    const stepTimer2 = setTimeout(() => { setGenerationStep(2); setGenerationProgress(70) }, 20000)

    const message = `Create a complete digital product package for the following:
Product Idea: ${formData.productIdea}
Product Type: ${formData.productType || 'Tool/Script'}
Target Audience: ${formData.targetAudience || 'Software developers and technical users'}
Price Range: ${formData.priceRange || '$10-25'}

Please coordinate market research, product building, and listing creation.`

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)

      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setGenerationStep(3)
      setGenerationProgress(100)

      if (result?.success) {
        const rawResult = result?.response?.result
        const productPackage = rawResult?.product_package || rawResult
        const pkg: ProductPackage = {
          product_name: productPackage?.product_name || formData.productIdea.slice(0, 50),
          product_type: productPackage?.product_type || formData.productType || 'Tool/Script',
          market_research: productPackage?.market_research || {},
          product_content: productPackage?.product_content || {},
          listing: productPackage?.listing || {},
          status: productPackage?.status || 'ready_for_review',
          created_at: productPackage?.created_at || new Date().toISOString()
        }
        setCurrentPackage(pkg)
        populateEditableFields(pkg)

        const files = Array.isArray(result?.module_outputs?.artifact_files)
          ? result.module_outputs.artifact_files
          : []
        setArtifactFiles(files)

        setSuccessMessage('Product package generated successfully!')
      } else {
        setError(result?.error || 'Failed to generate product package. Please try again.')
      }
    } catch (err: any) {
      clearTimeout(stepTimer1)
      clearTimeout(stepTimer2)
      setError(err?.message || 'Network error during generation.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  // Publish to Payhip
  const handlePublish = async () => {
    if (!currentPackage) return

    setPublishing(true)
    setError(null)
    setActiveAgentId(PUBLISHER_AGENT_ID)

    const files = safeParse(currentPackage?.product_content?.files, [])
    const fileNames = Array.isArray(files) ? files.map((f: any) => typeof f === 'string' ? f : f?.filename || f?.name || 'file').slice(0, 10) : []

    const message = `Publish this approved product to the RULE 47 Payhip store (https://payhip.com/RULE47):
Title: ${editedTitle}
Tagline: ${editedTagline}
Description: ${editedDescription}
Price: $${editedPrice}
Features: ${JSON.stringify(editedBullets)}
Tags: ${JSON.stringify(editedTags)}
Files: ${JSON.stringify(fileNames)}
Product Type: ${currentPackage.product_type}

Format for Payhip digital download listing and publish to the RULE 47 store.`

    try {
      const result = await callAIAgent(message, PUBLISHER_AGENT_ID)

      if (result?.success) {
        const pubResult = result?.response?.result
        setPublishResult(pubResult)

        // Save as live product
        const newProduct: StoredProduct = {
          id: generateId(),
          product_name: currentPackage.product_name,
          product_type: currentPackage.product_type,
          status: 'live',
          price: editedPrice,
          title: editedTitle,
          tagline: editedTagline,
          description: editedDescription,
          feature_bullets: editedBullets,
          category_tags: editedTags,
          market_research: currentPackage.market_research,
          product_content: currentPackage.product_content,
          listing: currentPackage.listing,
          created_at: currentPackage.created_at,
          published_at: pubResult?.published_at || new Date().toISOString(),
          publisher_response: pubResult
        }

        const updated = [newProduct, ...products]
        setProducts(updated)
        saveProducts(updated)
        setShowPublishDialog(true)
      } else {
        setError(result?.error || 'Failed to publish product. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message || 'Network error during publishing.')
    } finally {
      setPublishing(false)
      setActiveAgentId(null)
    }
  }

  // Save as draft
  const handleSaveDraft = () => {
    if (!currentPackage) return

    const newProduct: StoredProduct = {
      id: generateId(),
      product_name: currentPackage.product_name,
      product_type: currentPackage.product_type,
      status: 'draft',
      price: editedPrice,
      title: editedTitle,
      tagline: editedTagline,
      description: editedDescription,
      feature_bullets: editedBullets,
      category_tags: editedTags,
      market_research: currentPackage.market_research,
      product_content: currentPackage.product_content,
      listing: currentPackage.listing,
      created_at: currentPackage.created_at
    }

    const updated = [newProduct, ...products]
    setProducts(updated)
    saveProducts(updated)
    setSuccessMessage('Product saved as draft!')
    setTimeout(() => {
      navigate('catalog')
    }, 1500)
  }

  // Delete product
  const handleDeleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id)
    setProducts(updated)
    saveProducts(updated)
  }

  // View product detail
  const handleViewProduct = (product: StoredProduct) => {
    setDetailProduct(product)
    setShowDetailDialog(true)
  }

  // Filter catalog
  const filteredProducts = displayProducts.filter(p => {
    if (catalogFilter !== 'all' && p.status !== catalogFilter) return false
    if (catalogSearch && !p.product_name.toLowerCase().includes(catalogSearch.toLowerCase()) && !p.title.toLowerCase().includes(catalogSearch.toLowerCase())) return false
    return true
  })

  // =========================
  // RENDER: SIDEBAR
  // =========================

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: <LuLayoutDashboard className="w-5 h-5" /> },
    { id: 'new' as const, label: 'New Product', icon: <FiPlus className="w-5 h-5" /> },
    { id: 'catalog' as const, label: 'Product Catalog', icon: <LuShoppingBag className="w-5 h-5" /> }
  ]

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        {/* Brand */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <HiOutlineSparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">RULE 47</h1>
              <p className="text-xs text-muted-foreground">Digital Product Factory</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                screen === item.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="p-4 space-y-3">
          <AgentStatusCard activeAgentId={activeAgentId} />

          {/* Store connection */}
          <a
            href="https://payhip.com/RULE47"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-green-700">RULE 47 Store</p>
              <p className="text-[10px] text-green-600 truncate">payhip.com/RULE47</p>
            </div>
            <FiExternalLink className="w-3 h-3 text-green-600 shrink-0" />
          </a>

          {/* Sample data toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
            <Switch
              id="sample-toggle"
              checked={sampleMode}
              onCheckedChange={setSampleMode}
            />
          </div>
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: DASHBOARD SCREEN
  // =========================

  function DashboardScreen() {
    const recent = displayProducts.slice(0, 6)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-sm text-muted-foreground">Overview of your digital product factory</p>
          </div>
          <Button onClick={() => navigate('new')} className="gap-2 shadow-md">
            <FiPlus className="w-4 h-4" /> New Product
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Products</span>
                <FiPackage className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Live Products</span>
                <FiCheck className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-green-600">{liveProducts}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Drafts</span>
                <FiEdit3 className="w-5 h-5 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{draftProducts}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Revenue Est.</span>
                <FiDollarSign className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">${revenueEstimate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Recent Products</h3>
            {displayProducts.length > 6 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('catalog')} className="text-sm gap-1">
                View All <FiChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={<FiPackage className="w-8 h-8" />}
              title="No products yet"
              description="Create your first digital product and start selling on Payhip."
              action="Create Product"
              onAction={() => navigate('new')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(product => (
                <Card key={product.id} className="shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group" onClick={() => handleViewProduct(product)}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">{product.product_type}</Badge>
                      <StatusBadge status={product.status} />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{product.product_name}</h4>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.tagline || product.description || 'No description'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">${product.price}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(product.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // =========================
  // RENDER: NEW PRODUCT SCREEN
  // =========================

  function NewProductScreen() {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Create New Product</h2>
          <p className="text-sm text-muted-foreground">Describe your idea and our AI agents will research, build, and create a listing for you.</p>
        </div>

        <Card className="shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="product-idea" className="text-sm font-medium">Product Idea *</Label>
              <Textarea
                id="product-idea"
                placeholder="Describe the software tool or digital product you want to create... For example: 'A Python CLI tool that generates color palettes from images, outputs CSS variables, and supports Tailwind config export.'"
                value={formData.productIdea}
                onChange={(e) => setFormData(prev => ({ ...prev, productIdea: e.target.value }))}
                rows={5}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-type" className="text-sm font-medium">Product Type</Label>
                <Select value={formData.productType} onValueChange={(val) => setFormData(prev => ({ ...prev, productType: val }))}>
                  <SelectTrigger id="product-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tool/Script">Tool / Script</SelectItem>
                    <SelectItem value="Template">Template</SelectItem>
                    <SelectItem value="Utility">Utility</SelectItem>
                    <SelectItem value="Documentation">Documentation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price-range" className="text-sm font-medium">Price Range</Label>
                <Select value={formData.priceRange} onValueChange={(val) => setFormData(prev => ({ ...prev, priceRange: val }))}>
                  <SelectTrigger id="price-range">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Free">Free</SelectItem>
                    <SelectItem value="$1-10">$1 - $10</SelectItem>
                    <SelectItem value="$10-25">$10 - $25</SelectItem>
                    <SelectItem value="$25-50">$25 - $50</SelectItem>
                    <SelectItem value="$50+">$50+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target-audience" className="text-sm font-medium">Target Audience</Label>
              <Input
                id="target-audience"
                placeholder="e.g., Indie hackers, frontend developers, small business owners"
                value={formData.targetAudience}
                onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <FiAlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button onClick={handleGenerate} disabled={loading || !formData.productIdea.trim()} className="w-full gap-2 h-12 text-base shadow-md">
              {loading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <HiOutlineSparkles className="w-5 h-5" /> Generate Product
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* What happens section */}
        <Card className="shadow-sm border-dashed">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">What happens when you generate?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FiSearch className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Market Research</p>
                  <p className="text-xs text-muted-foreground">Demand analysis, competitor scan, pricing benchmarks</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FiCode className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Product Building</p>
                  <p className="text-xs text-muted-foreground">Code files, documentation, setup instructions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FiFileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Listing Copy</p>
                  <p className="text-xs text-muted-foreground">SEO title, description, feature bullets, pricing</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // =========================
  // RENDER: REVIEW SCREEN
  // =========================

  function ReviewScreen() {
    if (loading && !currentPackage) {
      return (
        <div className="max-w-lg mx-auto space-y-6 py-12">
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold text-foreground mb-6 text-center">Creating Your Product</h3>
              <StepIndicator
                steps={['Researching Market', 'Building Product', 'Writing Listing', 'Complete']}
                currentStep={generationStep}
              />
              <div className="mt-6">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2 text-center">This may take 1-3 minutes...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (!currentPackage) {
      return (
        <EmptyState
          icon={<FiPackage className="w-8 h-8" />}
          title="No product to review"
          description="Generate a product first to see it here."
          action="Create Product"
          onAction={() => navigate('new')}
        />
      )
    }

    const mr = currentPackage.market_research || {}
    const pc = currentPackage.product_content || {}
    const listing = currentPackage.listing || {}

    // Parse stringified fields
    const competitors = safeParse(mr.competitors, [])
    const pricingBenchmark = safeParse(mr.pricing_benchmark, { min: 0, max: 0, recommended: 0 })
    const techStack = safeParse(pc.tech_stack, [])
    const files = safeParse(pc.files, [])
    const seoKeywords = safeParse(listing.seo_keywords, [])

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('new')} className="gap-1">
              <FiArrowLeft className="w-4 h-4" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-bold text-foreground">{currentPackage.product_name}</h2>
              <p className="text-sm text-muted-foreground">Review and edit before publishing</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setCurrentPackage(null); navigate('new') }} className="gap-1">
              <FiRefreshCw className="w-3 h-3" /> Regenerate
            </Button>
            <Button variant="secondary" size="sm" onClick={handleSaveDraft} className="gap-1">
              <HiOutlineArchiveBox className="w-4 h-4" /> Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={publishing} className="gap-1 shadow-md">
              {publishing ? (
                <><FiRefreshCw className="w-3 h-3 animate-spin" /> Publishing...</>
              ) : (
                <><FiUploadCloud className="w-4 h-4" /> Publish to Payhip</>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <FiAlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto text-xs">Dismiss</Button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">
            <FiCheck className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Three panel layout */}
        <Tabs defaultValue="research" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="research" className="gap-1 text-xs sm:text-sm"><HiOutlineChartBar className="w-4 h-4 hidden sm:block" /> Research</TabsTrigger>
            <TabsTrigger value="product" className="gap-1 text-xs sm:text-sm"><LuFileCode2 className="w-4 h-4 hidden sm:block" /> Product</TabsTrigger>
            <TabsTrigger value="listing" className="gap-1 text-xs sm:text-sm"><FiTag className="w-4 h-4 hidden sm:block" /> Listing</TabsTrigger>
          </TabsList>

          {/* MARKET RESEARCH TAB */}
          <TabsContent value="research" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Demand Score */}
              <Card className="shadow-md">
                <CardContent className="p-6">
                  <DemandGauge score={mr?.demand_score ?? 0} />
                  <div className="mt-4">
                    <Badge variant="secondary" className="text-xs mb-2">Viability: {mr?.viability_rating || 'N/A'}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Pricing Benchmark */}
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiDollarSign className="w-4 h-4 text-primary" /> Pricing Benchmark
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {typeof pricingBenchmark === 'object' && pricingBenchmark !== null ? (
                    <div className="space-y-2">
                      {Object.entries(pricingBenchmark).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-foreground">{typeof val === 'number' ? `$${val}` : String(val ?? '')}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{String(mr?.pricing_benchmark || 'No data available')}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Demand Analysis */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiTrendingUp className="w-4 h-4 text-primary" /> Demand Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {renderMarkdown(mr?.demand_analysis || 'No analysis available.')}
              </CardContent>
            </Card>

            {/* Target Audience */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiUsers className="w-4 h-4 text-primary" /> Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {renderMarkdown(mr?.target_audience || 'Not specified.')}
              </CardContent>
            </Card>

            {/* Positioning */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiTarget className="w-4 h-4 text-primary" /> Positioning Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {renderMarkdown(mr?.positioning_opportunities || 'No data.')}
              </CardContent>
            </Card>

            {/* Competitors */}
            {Array.isArray(competitors) && competitors.length > 0 && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiSearch className="w-4 h-4 text-primary" /> Competitors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {competitors.map((comp: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-secondary/50 border">
                        <p className="text-sm font-medium text-foreground">{typeof comp === 'string' ? comp : comp?.name || comp?.title || `Competitor ${idx + 1}`}</p>
                        {typeof comp === 'object' && comp?.description && (
                          <p className="text-xs text-muted-foreground mt-1">{comp.description}</p>
                        )}
                        {typeof comp === 'object' && comp?.price && (
                          <Badge variant="secondary" className="text-xs mt-1">{typeof comp.price === 'number' ? `$${comp.price}` : comp.price}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* If competitors is a string, render as markdown */}
            {typeof mr?.competitors === 'string' && !Array.isArray(competitors) && mr.competitors && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiSearch className="w-4 h-4 text-primary" /> Competitors
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderMarkdown(mr.competitors)}
                </CardContent>
              </Card>
            )}

            {/* Market Summary */}
            {mr?.market_summary && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <HiOutlineChartBar className="w-4 h-4 text-primary" /> Market Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {renderMarkdown(mr.market_summary)}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PRODUCT TAB */}
          <TabsContent value="product" className="mt-4 space-y-4">
            {/* Summary */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiPackage className="w-4 h-4 text-primary" /> Product Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {renderMarkdown(pc?.product_summary || 'No summary available.')}
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiCode className="w-4 h-4 text-primary" /> Tech Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Array.isArray(techStack) && techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {techStack.map((tech: any, idx: number) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {typeof tech === 'string' ? tech : tech?.name || `Tech ${idx + 1}`}
                      </Badge>
                    ))}
                  </div>
                ) : typeof pc?.tech_stack === 'string' && pc.tech_stack ? (
                  <p className="text-sm text-muted-foreground">{pc.tech_stack}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No tech stack info.</p>
                )}
              </CardContent>
            </Card>

            {/* Files */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiFile className="w-4 h-4 text-primary" /> Files
                  {typeof pc?.file_count === 'number' && (
                    <Badge variant="secondary" className="text-xs ml-2">{pc.file_count} files</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {Array.isArray(files) && files.length > 0 ? (
                  <div className="space-y-2">
                    {files.map((file: any, idx: number) => {
                      const fileName = typeof file === 'string' ? file : file?.filename || file?.name || `file_${idx + 1}`
                      const fileDesc = typeof file === 'object' ? file?.description || file?.purpose || '' : ''
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border font-mono text-sm">
                          <LuFileCode2 className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                            {fileDesc && <p className="text-xs text-muted-foreground truncate">{fileDesc}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : typeof pc?.files === 'string' && pc.files ? (
                  <div className="p-3 rounded-lg bg-secondary/30 border">
                    {renderMarkdown(pc.files)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No file details available.</p>
                )}
              </CardContent>
            </Card>

            {/* Artifact Downloads */}
            {artifactFiles.length > 0 && (
              <Card className="shadow-md border-primary/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiDownload className="w-4 h-4 text-primary" /> Downloadable Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {artifactFiles.map((af: any, idx: number) => (
                    <a
                      key={idx}
                      href={af?.file_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
                    >
                      <FiDownload className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground truncate">{af?.name || `File ${idx + 1}`}</span>
                      <FiExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* README */}
            {pc?.readme_content && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-primary" /> README
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-96">
                    <div className="p-4 rounded-lg bg-secondary/30 border font-mono text-xs">
                      {renderMarkdown(pc.readme_content)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Setup Instructions */}
            {pc?.setup_instructions && (
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiCode className="w-4 h-4 text-primary" /> Setup Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="p-4 rounded-lg bg-secondary/30 border font-mono text-xs">
                    {renderMarkdown(pc.setup_instructions)}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* LISTING TAB (EDITABLE) */}
          <TabsContent value="listing" className="mt-4 space-y-4">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiEdit3 className="w-4 h-4 text-primary" /> Listing Copy (Editable)
                </CardTitle>
                <CardDescription className="text-xs">Edit fields below before publishing to Payhip.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Title</Label>
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Product title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Tagline</Label>
                  <Input
                    value={editedTagline}
                    onChange={(e) => setEditedTagline(e.target.value)}
                    placeholder="Short tagline"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Description</Label>
                  <Textarea
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="Full product description"
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Price ($)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Price Justification</Label>
                    <p className="text-sm text-muted-foreground p-2 border rounded-lg bg-secondary/30">{listing?.price_justification || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Bullets */}
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FiStar className="w-4 h-4 text-primary" /> Feature Bullets
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {editedBullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                    <Input
                      value={bullet}
                      onChange={(e) => {
                        const updated = [...editedBullets]
                        updated[idx] = e.target.value
                        setEditedBullets(updated)
                      }}
                      className="text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditedBullets(editedBullets.filter((_, i) => i !== idx))}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <FiX className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditedBullets([...editedBullets, ''])}
                  className="gap-1 text-xs"
                >
                  <FiPlus className="w-3 h-3" /> Add Bullet
                </Button>
              </CardContent>
            </Card>

            {/* Tags & Keywords */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiTag className="w-4 h-4 text-primary" /> Category Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {editedTags.map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="gap-1 pr-1 text-xs">
                        {tag}
                        <button
                          onClick={() => setEditedTags(editedTags.filter((_, i) => i !== idx))}
                          className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                        >
                          <FiX className="w-2.5 h-2.5" />
                        </button>
                      </Badge>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const tag = prompt('Enter tag:')
                        if (tag?.trim()) setEditedTags([...editedTags, tag.trim()])
                      }}
                      className="h-6 text-xs gap-1"
                    >
                      <FiPlus className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FiSearch className="w-4 h-4 text-primary" /> SEO Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(seoKeywords) && seoKeywords.map((kw: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                    {(!Array.isArray(seoKeywords) || seoKeywords.length === 0) && typeof listing?.seo_keywords === 'string' && listing.seo_keywords && (
                      <p className="text-sm text-muted-foreground">{listing.seo_keywords}</p>
                    )}
                    {(!Array.isArray(seoKeywords) || seoKeywords.length === 0) && !listing?.seo_keywords && (
                      <p className="text-sm text-muted-foreground">No keywords</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA */}
            {listing?.call_to_action && (
              <Card className="shadow-md border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FiZap className="w-4 h-4 text-primary" />
                    Call to Action: <span className="text-primary">{listing.call_to_action}</span>
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Publish actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handlePublish} disabled={publishing} className="gap-2 shadow-md flex-1 sm:flex-none">
                {publishing ? (
                  <><FiRefreshCw className="w-4 h-4 animate-spin" /> Publishing...</>
                ) : (
                  <><FiUploadCloud className="w-4 h-4" /> Publish to Payhip</>
                )}
              </Button>
              <Button variant="secondary" onClick={handleSaveDraft} className="gap-2 flex-1 sm:flex-none">
                <HiOutlineArchiveBox className="w-4 h-4" /> Save Draft
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // =========================
  // RENDER: CATALOG SCREEN
  // =========================

  function CatalogScreen() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Product Catalog</h2>
            <p className="text-sm text-muted-foreground">{filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={() => navigate('new')} className="gap-2 shadow-md">
            <FiPlus className="w-4 h-4" /> New Product
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Button
                  variant={catalogFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCatalogFilter('all')}
                  className="text-xs"
                >
                  All
                </Button>
                <Button
                  variant={catalogFilter === 'live' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCatalogFilter('live')}
                  className="text-xs"
                >
                  Live
                </Button>
                <Button
                  variant={catalogFilter === 'draft' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCatalogFilter('draft')}
                  className="text-xs"
                >
                  Drafts
                </Button>
              </div>
              <div className="flex-1 w-full sm:w-auto">
                <Input
                  placeholder="Search products..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant={catalogView === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCatalogView('grid')}
                >
                  <FiGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={catalogView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCatalogView('list')}
                >
                  <FiList className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<FiShoppingBag className="w-8 h-8" />}
            title="No products found"
            description={catalogSearch ? 'Try adjusting your search or filters.' : 'Create your first digital product and start selling.'}
            action="Create Product"
            onAction={() => navigate('new')}
          />
        ) : catalogView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <Card key={product.id} className="shadow-md hover:shadow-lg transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="text-xs">{product.product_type}</Badge>
                    <StatusBadge status={product.status} />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{product.product_name}</h4>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.tagline || product.description || 'No description'}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">${product.price}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(product.created_at)}</span>
                  </div>
                  <Separator className="mb-3" />
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1" onClick={() => handleViewProduct(product)}>
                      <FiEye className="w-3 h-3" /> View
                    </Button>
                    {!product.id.startsWith('sample-') && (
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1" onClick={() => handleDeleteProduct(product.id)}>
                        <FiTrash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map(product => (
              <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FiPackage className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">{product.product_name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{product.tagline || product.description || 'No description'}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0 hidden sm:flex">{product.product_type}</Badge>
                  <StatusBadge status={product.status} />
                  <span className="text-sm font-bold text-foreground shrink-0">${product.price}</span>
                  <span className="text-xs text-muted-foreground shrink-0 hidden md:block">{formatDate(product.created_at)}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product)}>
                      <FiEye className="w-4 h-4" />
                    </Button>
                    {!product.id.startsWith('sample-') && (
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteProduct(product.id)}>
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // =========================
  // MAIN RENDER
  // =========================

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <HiOutlineSparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold">RULE 47</span>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar - desktop always visible, mobile overlay */}
          <aside className={cn(
            'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0 shrink-0',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}>
            <ScrollArea className="h-full">
              <SidebarContent />
            </ScrollArea>
          </aside>

          {/* Mobile overlay backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Main content */}
          <main className="flex-1 min-h-screen">
            <ScrollArea className="h-screen">
              <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
                {screen === 'dashboard' && <DashboardScreen />}
                {screen === 'new' && <NewProductScreen />}
                {screen === 'review' && <ReviewScreen />}
                {screen === 'catalog' && <CatalogScreen />}
              </div>
            </ScrollArea>
          </main>
        </div>

        {/* Publish Success Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <FiCheck className="w-5 h-5" /> Product Published to RULE 47
              </DialogTitle>
              <DialogDescription>
                Your product has been prepared for your Payhip store at payhip.com/RULE47.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-3 py-2 pr-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Title</span>
                  <span className="font-medium text-foreground text-right max-w-[250px]">{publishResult?.product_title || editedTitle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium text-foreground">${publishResult?.product_price ?? editedPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">{publishResult?.publication_status || 'Published'}</Badge>
                </div>

                {/* Store & Product URLs */}
                {(publishResult?.store_url || publishResult?.product_url) && (
                  <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    {publishResult?.store_url && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Store</span>
                        <a href={publishResult.store_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium text-xs">
                          {publishResult.store_url} <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {publishResult?.product_url && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Product Link</span>
                        <a href={publishResult.product_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline font-medium text-xs">
                          View on Payhip <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {publishResult?.confirmation_message && (
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700">
                    {publishResult.confirmation_message}
                  </div>
                )}

                {publishResult?.published_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Published At</span>
                    <span className="text-xs text-muted-foreground">{publishResult.published_at}</span>
                  </div>
                )}

                {/* Next Steps */}
                {publishResult?.next_steps && (
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1"><FiAlertCircle className="w-3 h-3 text-primary" /> Next Steps</p>
                    <p className="text-xs text-muted-foreground">{publishResult.next_steps}</p>
                  </div>
                )}

                {/* Payhip Payload details */}
                {publishResult?.payhip_payload && (
                  <div className="mt-2 p-3 rounded-lg bg-secondary/50 border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Payhip API Payload</p>
                    {Object.entries(publishResult.payhip_payload).map(([key, val]) => {
                      const displayVal = String(val ?? '')
                      if (key === 'description' && displayVal.length > 100) {
                        return (
                          <div key={key} className="py-0.5">
                            <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                            <p className="text-xs font-medium text-foreground mt-0.5 line-clamp-3">{displayVal}</p>
                          </div>
                        )
                      }
                      return (
                        <div key={key} className="flex justify-between text-xs py-0.5">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-foreground truncate max-w-[200px]">{displayVal}</span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Files to upload */}
                {Array.isArray(publishResult?.files_to_upload) && publishResult.files_to_upload.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Files for Upload</p>
                    <div className="space-y-1">
                      {publishResult.files_to_upload.map((f: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-xs p-2 rounded bg-secondary/30 border">
                          <LuFileCode2 className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-foreground flex-1 truncate">{f?.filename || `File ${idx + 1}`}</span>
                          {f?.filetype && <Badge variant="outline" className="text-[10px] h-4">{f.filetype}</Badge>}
                          {f?.size_estimate && <span className="text-muted-foreground shrink-0">{f.size_estimate}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category tags from publisher */}
                {Array.isArray(publishResult?.category_tags) && publishResult.category_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-xs text-muted-foreground mr-1 self-center">Tags:</span>
                    {publishResult.category_tags.map((tag: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <a href="https://payhip.com/RULE47" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-input bg-background hover:bg-secondary h-10 px-4 py-2 w-full sm:w-auto">
                <FiExternalLink className="w-4 h-4" /> Open RULE 47 Store
              </a>
              <Button onClick={() => { setShowPublishDialog(false); navigate('catalog') }} className="w-full sm:w-auto gap-2">
                <LuShoppingBag className="w-4 h-4" /> View Catalog
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Detail Dialog */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            {detailProduct && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FiPackage className="w-5 h-5 text-primary" />
                    {detailProduct.product_name}
                  </DialogTitle>
                  <DialogDescription>{detailProduct.tagline || detailProduct.description?.slice(0, 100) || 'No description'}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={detailProduct.status} />
                    <span className="text-xl font-bold text-foreground">${detailProduct.price}</span>
                  </div>
                  <Separator />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</p>
                    <Badge variant="secondary">{detailProduct.product_type}</Badge>
                  </div>

                  {detailProduct.description && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</p>
                      <div className="text-sm text-foreground">{renderMarkdown(detailProduct.description)}</div>
                    </div>
                  )}

                  {Array.isArray(detailProduct.feature_bullets) && detailProduct.feature_bullets.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Features</p>
                      <ul className="space-y-1">
                        {detailProduct.feature_bullets.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <FiCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {Array.isArray(detailProduct.category_tags) && detailProduct.category_tags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {detailProduct.category_tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created: {formatDate(detailProduct.created_at)}</span>
                    {detailProduct.published_at && <span>Published: {formatDate(detailProduct.published_at)}</span>}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}
