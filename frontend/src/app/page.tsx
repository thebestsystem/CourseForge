'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  BookOpen, 
  Bot, 
  Sparkles, 
  Users, 
  Video, 
  Presentation,
  Globe,
  BarChart3,
  ArrowRight,
  Check,
  Zap,
  Target,
  Palette,
  Search,
  Shield,
  TrendingUp
} from 'lucide-react'

const aiAgents = [
  {
    icon: Target,
    name: 'Architect Agent',
    description: 'Structure & learning objectives',
    color: 'bg-blue-500'
  },
  {
    icon: Search,
    name: 'Research Agent',
    description: 'Documentation & fact-checking',
    color: 'bg-green-500'
  },
  {
    icon: Zap,
    name: 'Writing Agent',
    description: 'Content creation & narrative',
    color: 'bg-purple-500'
  },
  {
    icon: Shield,
    name: 'Quality Agent',
    description: 'Review & compliance',
    color: 'bg-red-500'
  },
  {
    icon: Palette,
    name: 'Design Agent',
    description: 'Visual formatting & layout',
    color: 'bg-pink-500'
  },
  {
    icon: TrendingUp,
    name: 'Marketing Agent',
    description: 'Distribution strategies',
    color: 'bg-yellow-500'
  }
]

const features = [
  {
    icon: BookOpen,
    title: 'Course Planner',
    description: 'Create structured courses manually or with AI assistance',
  },
  {
    icon: Bot,
    title: 'AI Agents',
    description: '7 specialized agents for every aspect of course creation',
  },
  {
    icon: Video,
    title: 'Video Studio',
    description: 'Generate scripts, voiceovers, and complete video content',
  },
  {
    icon: Presentation,
    title: 'Presentation Generator',
    description: 'Export to PowerPoint with professional templates',
  },
  {
    icon: Globe,
    title: 'Multilingual Support',
    description: 'Automatic translation with cultural adaptation',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track performance and AI usage metrics',
  },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      '3 courses maximum',
      'Basic AI assistance',
      'Standard templates',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: [
      'Unlimited courses',
      'All AI agents',
      'Premium templates',
      'Video studio access',
      'Priority support',
      'Advanced analytics',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: [
      'Everything in Pro',
      'Custom AI training',
      'White-label solution',
      'Dedicated support',
      'SSO integration',
      'Custom integrations',
    ],
  },
]

export default function HomePage() {
  const [activeAgent, setActiveAgent] = useState(0)

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">CourseForge</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Course Creation
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Forge Your Course,
              <br />
              <span className="text-primary">By Hand or with AI</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create professional courses with specialized AI agents. From structure to content, 
              from design to marketing - let AI handle the heavy lifting while you focus on teaching.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/signup">
                  Start Creating Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="/demo">Watch Demo</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Agents Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet Your AI Course Creation Team
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Seven specialized AI agents work on-demand to help you create outstanding courses. 
              Each agent brings unique expertise to different aspects of course development.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiAgents.map((agent, index) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setActiveAgent(index)}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${agent.color} flex items-center justify-center mb-4`}>
                      <agent.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{agent.name}</CardTitle>
                    <CardDescription>{agent.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Create Amazing Courses
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From planning to publishing, CourseForge provides all the tools and AI assistance 
              you need to create professional, engaging educational content.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <feature.icon className="h-12 w-12 text-primary mb-4" />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free and upgrade as you grow. All plans include our core course creation tools.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-3" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/signup">
                        {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Course Creation?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of educators who are already using AI to create better courses faster.
            </p>
            
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/signup">
                Start Your Free Course Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">CourseForge</span>
              </div>
              <p className="text-muted-foreground">
                AI-powered course creation platform for modern educators.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/demo">Demo</Link></li>
                <li><Link href="/api">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/docs">Documentation</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/careers">Careers</Link></li>
                <li><Link href="/privacy">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}