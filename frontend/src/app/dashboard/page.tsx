'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Bot, 
  FileText, 
  Users, 
  BarChart3,
  Plus,
  Sparkles,
  Video,
  Globe,
  Presentation,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Total Courses',
      value: '12',
      change: '+2 this month',
      icon: BookOpen,
      color: 'text-blue-600',
    },
    {
      title: 'AI Executions',
      value: '347',
      change: '+23 this week',
      icon: Bot,
      color: 'text-purple-600',
    },
    {
      title: 'Documents',
      value: '89',
      change: '+8 recent uploads',
      icon: FileText,
      color: 'text-green-600',
    },
    {
      title: 'Total Students',
      value: '1,234',
      change: '+56 new enrollments',
      icon: Users,
      color: 'text-orange-600',
    },
  ]

  const aiAgents = [
    {
      name: 'Architect Agent',
      description: 'Structure & learning objectives',
      icon: '🏗️',
      status: 'ready',
      lastUsed: '2 hours ago',
    },
    {
      name: 'Research Agent',
      description: 'Content research & verification',
      icon: '🔍',
      status: 'busy',
      lastUsed: 'Running now',
    },
    {
      name: 'Writing Agent',
      description: 'Content creation & narrative',
      icon: '✍️',
      status: 'ready',
      lastUsed: '1 day ago',
    },
    {
      name: 'Quality Agent',
      description: 'Review & compliance check',
      icon: '✅',
      status: 'ready',
      lastUsed: '3 hours ago',
    },
  ]

  const recentCourses = [
    {
      title: 'Introduction to Machine Learning',
      status: 'Published',
      progress: 100,
      students: 456,
      lastUpdated: '2 days ago',
    },
    {
      title: 'Web Development Bootcamp',
      status: 'In Progress',
      progress: 75,
      students: 234,
      lastUpdated: '5 hours ago',
    },
    {
      title: 'Data Science Fundamentals',
      status: 'Draft',
      progress: 40,
      students: 0,
      lastUpdated: '1 hour ago',
    },
  ]

  const quickActions = [
    {
      title: 'Create New Course',
      description: 'Start building a new course with AI assistance',
      icon: Plus,
      href: '/dashboard/courses/new',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Upload Documents',
      description: 'Add materials for AI processing',
      icon: FileText,
      href: '/dashboard/documents/upload',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'AI Agent Studio',
      description: 'Configure and manage your AI agents',
      icon: Bot,
      href: '/dashboard/ai-agents',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Video Studio',
      description: 'Create professional course videos',
      icon: Video,
      href: '/dashboard/video-studio',
      color: 'bg-red-500 hover:bg-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your courses and AI agents today.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/courses/new">
            <Plus className="mr-2 h-4 w-4" />
            New Course
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Card key={action.title} className="group cursor-pointer hover:shadow-md transition-shadow">
            <Link href={action.href}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.color} text-white flex items-center justify-center mb-4`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Agents Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" />
              AI Agents Status
            </CardTitle>
            <CardDescription>
              Monitor your specialized AI agents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiAgents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{agent.icon}</div>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-muted-foreground">{agent.description}</div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={agent.status === 'busy' ? 'default' : 'secondary'}>
                    {agent.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">{agent.lastUsed}</div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/ai-agents">
                <Bot className="mr-2 h-4 w-4" />
                Manage All Agents
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Recent Courses
            </CardTitle>
            <CardDescription>
              Your latest course projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCourses.map((course) => (
              <div key={course.title} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="font-medium">{course.title}</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={
                      course.status === 'Published' ? 'default' :
                      course.status === 'In Progress' ? 'secondary' : 'outline'
                    }>
                      {course.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {course.students > 0 ? `${course.students} students` : 'No enrollments yet'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{course.progress}%</div>
                  <div className="text-xs text-muted-foreground">{course.lastUpdated}</div>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Platform Features
          </CardTitle>
          <CardDescription>
            Explore the full power of CourseForge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
              <Video className="h-8 w-8 text-red-500" />
              <div>
                <div className="font-medium">Video Studio</div>
                <div className="text-sm text-muted-foreground">Create professional videos with AI</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <div className="font-medium">Multilingual</div>
                <div className="text-sm text-muted-foreground">Translate courses automatically</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-lg bg-muted/50">
              <Presentation className="h-8 w-8 text-green-500" />
              <div>
                <div className="font-medium">Presentations</div>
                <div className="text-sm text-muted-foreground">Generate PowerPoint slides</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}