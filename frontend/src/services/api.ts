import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ApiResponse } from '@/shared/types'

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    
    // Handle network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection.'
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
export const apiClient = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<ApiResponse<T>>(url, config)
    return response.data.data!
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, data, config)
    return response.data.data!
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data, config)
    return response.data.data!
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.patch<ApiResponse<T>>(url, data, config)
    return response.data.data!
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url, config)
    return response.data.data!
  },

  // File upload
  upload: async <T = any>(
    url: string,
    file: File,
    onProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: onProgress,
    })
    return response.data.data!
  },

  // Multiple file upload
  uploadMultiple: async <T = any>(
    url: string,
    files: File[],
    onProgress?: (progressEvent: any) => void,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })

    const response = await api.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: onProgress,
    })
    return response.data.data!
  },

  // Download file
  download: async (url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> => {
    const response = await api.get(url, {
      ...config,
      responseType: 'blob',
    })

    const contentDisposition = response.headers['content-disposition']
    const defaultFilename = contentDisposition
      ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
      : 'download'

    const blob = new Blob([response.data])
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename || defaultFilename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  // Get raw axios instance for custom requests
  raw: api,
}

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },

  // Users
  USERS: {
    BASE: '/api/users',
    PROFILE: '/api/users/profile',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password',
  },

  // Courses
  COURSES: {
    BASE: '/api/courses',
    CREATE: '/api/courses',
    BY_ID: (id: string) => `/api/courses/${id}`,
    UPDATE: (id: string) => `/api/courses/${id}`,
    DELETE: (id: string) => `/api/courses/${id}`,
    DUPLICATE: (id: string) => `/api/courses/${id}/duplicate`,
    PUBLISH: (id: string) => `/api/courses/${id}/publish`,
  },

  // Documents
  DOCUMENTS: {
    BASE: '/api/documents',
    UPLOAD: '/api/documents/upload',
    BY_ID: (id: string) => `/api/documents/${id}`,
    DELETE: (id: string) => `/api/documents/${id}`,
    PROCESS: (id: string) => `/api/documents/${id}/process`,
  },

  // AI Agents
  AI_AGENTS: {
    BASE: '/api/ai-agents',
    EXECUTE: '/api/ai-agents/execute',
    HISTORY: '/api/ai-agents/history',
    BY_TYPE: (type: string) => `/api/ai-agents/${type}`,
    CONFIG: '/api/ai-agents/config',
  },

  // Content
  CONTENT: {
    BASE: '/api/content',
    GENERATE: '/api/content/generate',
    BY_COURSE: (courseId: string) => `/api/content/course/${courseId}`,
    BY_ID: (id: string) => `/api/content/${id}`,
    UPDATE: (id: string) => `/api/content/${id}`,
  },

  // Presentations
  PRESENTATIONS: {
    BASE: '/api/presentations',
    CREATE: '/api/presentations',
    BY_ID: (id: string) => `/api/presentations/${id}`,
    EXPORT: (id: string, format: string) => `/api/presentations/${id}/export/${format}`,
  },

  // Video Studio
  VIDEO_STUDIO: {
    BASE: '/api/video-studio',
    PROJECTS: '/api/video-studio/projects',
    BY_ID: (id: string) => `/api/video-studio/projects/${id}`,
    GENERATE: '/api/video-studio/generate',
    RENDER: (id: string) => `/api/video-studio/projects/${id}/render`,
  },

  // Analytics
  ANALYTICS: {
    BASE: '/api/analytics',
    DASHBOARD: '/api/analytics/dashboard',
    COURSES: '/api/analytics/courses',
    AI_USAGE: '/api/analytics/ai-usage',
    USERS: '/api/analytics/users',
  },

  // Billing
  BILLING: {
    BASE: '/api/billing',
    PLANS: '/api/billing/plans',
    SUBSCRIBE: '/api/billing/subscribe',
    CANCEL: '/api/billing/cancel',
    INVOICES: '/api/billing/invoices',
    USAGE: '/api/billing/usage',
  },
}

export default apiClient