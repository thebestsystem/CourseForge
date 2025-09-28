'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { BookOpen, Loader2, Mail, Lock, User, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions')
      setIsLoading(false)
      return
    }

    if (!formData.role) {
      setError('Please select your role')
      setIsLoading(false)
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as 'educator' | 'student',
      })
      
      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed'
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

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }))
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Branding */}
      <div className="lg:flex-1 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800 p-8 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold">CourseForge</span>
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Join CourseForge Today
          </h1>
          
          <p className="text-lg text-white/90 mb-8">
            Create professional courses with the power of AI. Get access to 7 specialized 
            agents that will transform your course creation process.
          </p>

          <div className="space-y-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  🏗️
                </div>
                <div className="font-semibold">Architect Agent</div>
              </div>
              <div className="text-white/80 text-xs">
                Structures your courses and defines learning objectives
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  🔍
                </div>
                <div className="font-semibold">Research Agent</div>
              </div>
              <div className="text-white/80 text-xs">
                Gathers content and verifies information for accuracy
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  ✍️
                </div>
                <div className="font-semibold">Writing Agent</div>
              </div>
              <div className="text-white/80 text-xs">
                Creates engaging content tailored to your audience
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-sm bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Free forever plan available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Signup form */}
      <div className="lg:flex-1 p-8 flex flex-col justify-center">
        <div className="mx-auto w-full max-w-sm">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>
                Start your AI-powered course creation journey
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        placeholder="John"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select onValueChange={handleRoleChange} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="educator">
                        <div className="flex items-center">
                          <GraduationCap className="mr-2 h-4 w-4" />
                          Educator / Instructor
                        </div>
                      </SelectItem>
                      <SelectItem value="student">
                        <div className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Student / Learner
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || !acceptedTerms}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="font-medium mb-2">🎉 What you get with your free account:</div>
              <ul className="text-left space-y-1">
                <li>• Create up to 3 courses</li>
                <li>• Access to basic AI assistance</li>
                <li>• Standard templates</li>
                <li>• Community support</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}