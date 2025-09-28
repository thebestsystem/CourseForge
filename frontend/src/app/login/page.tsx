'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BookOpen, Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold">CourseForge</span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Welcome Back to CourseForge
          </h1>
          
          <p className="text-lg text-white/90 mb-8">
            Continue creating amazing courses with AI-powered assistance. 
            Your specialized agents are ready to help you build engaging educational content.
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-1">🤖 AI Agents</div>
              <div className="text-white/80">7 specialized agents ready</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-1">🎬 Video Studio</div>
              <div className="text-white/80">Create professional videos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-1">🌍 Multilingual</div>
              <div className="text-white/80">Reach global audiences</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="font-semibold mb-1">📊 Analytics</div>
              <div className="text-white/80">Track performance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="lg:flex-1 p-8 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your CourseForge account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Don't have an account? </span>
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Demo Credentials
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="font-medium">Educator</div>
                    <div className="text-muted-foreground">demo@educator.com</div>
                    <div className="text-muted-foreground">password123</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <div className="font-medium">Student</div>
                    <div className="text-muted-foreground">demo@student.com</div>
                    <div className="text-muted-foreground">password123</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our{' '}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}