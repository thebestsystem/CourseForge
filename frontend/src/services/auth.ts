import { apiClient, API_ENDPOINTS } from './api'
import { User } from '@/shared/types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'educator' | 'student'
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const credentials: LoginCredentials = { email, password }
    return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, credentials)
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, userData)
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      // Ignore logout errors - still clear local storage
      console.error('Logout error:', error)
    }
  }

  async getCurrentUser(): Promise<User> {
    return await apiClient.get<User>(API_ENDPOINTS.AUTH.ME)
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    return await apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REFRESH, {
      refreshToken,
    })
  }

  async forgotPassword(email: string): Promise<void> {
    const data: ForgotPasswordData = { email }
    await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, data)
  }

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<void> {
    const data: ResetPasswordData = { token, password, confirmPassword }
    await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data)
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<void> {
    const data: ChangePasswordData = { currentPassword, newPassword, confirmPassword }
    await apiClient.patch(API_ENDPOINTS.USERS.CHANGE_PASSWORD, data)
  }

  // Token management helpers
  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('refresh_token')
  }

  setTokens(token: string, refreshToken: string): void {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
    localStorage.setItem('refresh_token', refreshToken)
  }

  clearTokens(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Auto-refresh token logic
  async autoRefreshToken(): Promise<void> {
    try {
      const { token, refreshToken } = await this.refreshToken()
      this.setTokens(token, refreshToken)
    } catch (error) {
      console.error('Token refresh failed:', error)
      this.clearTokens()
      throw error
    }
  }

  // Setup auto-refresh interval (call this after successful login)
  setupAutoRefresh(): void {
    const refreshInterval = 15 * 60 * 1000 // 15 minutes
    
    setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.autoRefreshToken()
        } catch (error) {
          // Token refresh failed, user needs to re-login
          window.location.href = '/login'
        }
      }
    }, refreshInterval)
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate password strength
  validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const authService = new AuthService()