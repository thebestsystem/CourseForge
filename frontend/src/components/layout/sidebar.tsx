'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  LayoutDashboard,
  FileText,
  Bot,
  PresentationChart,
  Video,
  Globe,
  BarChart3,
  Settings,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Courses',
    href: '/dashboard/courses',
    icon: BookOpen,
    badge: '12',
  },
  {
    name: 'Documents',
    href: '/dashboard/documents',
    icon: FileText,
    badge: '89',
  },
  {
    name: 'AI Agents',
    href: '/dashboard/ai-agents',
    icon: Bot,
    badge: 'NEW',
    badgeVariant: 'default' as const,
  },
  {
    name: 'Content Editor',
    href: '/dashboard/content',
    icon: FileText,
  },
  {
    name: 'Presentations',
    href: '/dashboard/presentations',
    icon: PresentationChart,
  },
  {
    name: 'Video Studio',
    href: '/dashboard/video-studio',
    icon: Video,
    badge: 'PRO',
    badgeVariant: 'secondary' as const,
  },
  {
    name: 'Multilingual',
    href: '/dashboard/multilingual',
    icon: Globe,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
]

const adminNavigation = [
  {
    name: 'Users',
    href: '/dashboard/admin/users',
    icon: Users,
  },
  {
    name: 'Settings',
    href: '/dashboard/admin/settings',
    icon: Settings,
  },
]

const bottomNavigation = [
  {
    name: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'

  return (
    <div className={cn(
      "flex flex-col border-r bg-background transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo and collapse button */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">CourseForge</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          {user?.subscription && (
            <div className="mt-3">
              <Badge variant={user.subscription.plan === 'FREE' ? 'outline' : 'default'}>
                {user.subscription.plan} Plan
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            
            return (
              <Link key={item.name} href={item.href}>
                <div className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                  collapsed && "justify-center px-2"
                )}>
                  <item.icon className={cn("h-4 w-4", collapsed ? "h-5 w-5" : "")} />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <Badge 
                          variant={item.badgeVariant || 'outline'}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* AI Agent Quick Access */}
        {!collapsed && (
          <div className="pt-4">
            <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>AI AGENTS</span>
            </div>
            <div className="space-y-1 mt-2">
              {[
                { name: 'Architect', icon: '🏗️', href: '/dashboard/ai-agents/architect' },
                { name: 'Research', icon: '🔍', href: '/dashboard/ai-agents/research' },
                { name: 'Writing', icon: '✍️', href: '/dashboard/ai-agents/writing' },
                { name: 'Quality', icon: '✅', href: '/dashboard/ai-agents/quality' },
              ].map((agent) => (
                <Link key={agent.name} href={agent.href}>
                  <div className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                    pathname === agent.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  )}>
                    <span className="text-base">{agent.icon}</span>
                    <span className="flex-1">{agent.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Admin Navigation */}
        {isAdmin && !collapsed && (
          <div className="pt-4">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground">
              ADMINISTRATION
            </div>
            <div className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href)
                
                return (
                  <Link key={item.name} href={item.href}>
                    <div className={cn(
                      "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                      isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                    )}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom navigation */}
      <div className="p-4 border-t space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                collapsed && "justify-center px-2"
              )}>
                <item.icon className={cn("h-4 w-4", collapsed ? "h-5 w-5" : "")} />
                {!collapsed && <span>{item.name}</span>}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Upgrade prompt for free users */}
      {!collapsed && user?.subscription?.plan === 'FREE' && (
        <div className="p-4 border-t">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Unlock unlimited courses and advanced AI features
            </p>
            <Button size="sm" className="w-full" asChild>
              <Link href="/dashboard/billing">Upgrade Now</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}