// Shared types across frontend and backend

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profile?: UserProfile;
  subscription?: Subscription;
  organization?: Organization;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  STUDENT = 'student',
  EDUCATOR = 'educator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface UserProfile {
  id: string;
  userId: string;
  bio?: string;
  avatar?: string;
  expertise?: string[];
  languages?: string[];
  timezone?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  aiSettings: AIUserSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  courseUpdates: boolean;
  aiAgentAlerts: boolean;
  billingAlerts: boolean;
}

export interface AIUserSettings {
  preferredModel: string;
  temperature: number;
  maxTokens: number;
  enabledAgents: AIAgentType[];
}

export interface Organization {
  id: string;
  name: string;
  type: 'school' | 'university' | 'corporate' | 'individual';
  logo?: string;
  website?: string;
  settings: OrganizationSettings;
  members: OrganizationMember[];
}

export interface OrganizationSettings {
  allowedDomains: string[];
  defaultRole: UserRole;
  features: OrganizationFeatures;
}

export interface OrganizationFeatures {
  maxCourses: number;
  maxUsers: number;
  aiAgentsEnabled: boolean;
  customBranding: boolean;
  advancedAnalytics: boolean;
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: UserRole;
  joinedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId?: string;
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing'
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  authorId: string;
  organizationId?: string;
  status: CourseStatus;
  visibility: CourseVisibility;
  settings: CourseSettings;
  metadata: CourseMetadata;
  structure: CourseStructure;
  createdAt: Date;
  updatedAt: Date;
}

export enum CourseStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum CourseVisibility {
  PRIVATE = 'private',
  INTERNAL = 'internal',
  PUBLIC = 'public'
}

export interface CourseSettings {
  language: string;
  targetAudience: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in minutes
  prerequisites: string[];
  learningObjectives: string[];
}

export interface CourseMetadata {
  tags: string[];
  category: string;
  subcategory?: string;
  version: string;
  lastAIGeneration?: Date;
  aiAgentsUsed: AIAgentType[];
}

export interface CourseStructure {
  chapters: Chapter[];
  totalLessons: number;
  totalDuration: number;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  order: number;
  sections: Section[];
}

export interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  order: number;
  type: LessonType;
  content: LessonContent;
  duration?: number; // in minutes
  resources: LessonResource[];
}

export enum LessonType {
  TEXT = 'text',
  VIDEO = 'video',
  AUDIO = 'audio',
  PRESENTATION = 'presentation',
  INTERACTIVE = 'interactive',
  QUIZ = 'quiz',
  ASSIGNMENT = 'assignment'
}

export interface LessonContent {
  id: string;
  type: LessonType;
  data: any; // Type-specific content data
  generatedBy?: AIGenerationInfo;
}

export interface LessonResource {
  id: string;
  name: string;
  type: 'file' | 'link' | 'embed';
  url: string;
  size?: number;
  mimeType?: string;
}

// AI Agents System

export enum AIAgentType {
  ARCHITECT = 'architect',
  RESEARCH = 'research',
  WRITING = 'writing',
  EDITING = 'editing',
  DESIGN = 'design',
  QUALITY = 'quality',
  MARKETING = 'marketing'
}

export interface AIAgent {
  type: AIAgentType;
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isEnabled: boolean;
}

export interface AIAgentExecution {
  id: string;
  agentType: AIAgentType;
  courseId: string;
  userId: string;
  input: AIAgentInput;
  output?: AIAgentOutput;
  status: AIExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  cost?: number;
}

export enum AIExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

export interface AIAgentInput {
  prompt: string;
  context?: any;
  parameters?: Record<string, any>;
}

export interface AIAgentOutput {
  content: string;
  metadata?: Record<string, any>;
  suggestions?: string[];
  confidence?: number;
}

export interface AIGenerationInfo {
  agentType: AIAgentType;
  executionId: string;
  generatedAt: Date;
  model: string;
  confidence?: number;
}

// Document Management

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  ownerId: string;
  courseId?: string;
  status: DocumentStatus;
  metadata: DocumentMetadata;
  content?: ExtractedContent;
  createdAt: Date;
  updatedAt: Date;
}

export enum DocumentType {
  PDF = 'pdf',
  DOCX = 'docx',
  DOC = 'doc',
  TXT = 'txt',
  MD = 'md',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio'
}

export enum DocumentStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error'
}

export interface DocumentMetadata {
  classification?: DocumentClassification;
  extractedAt?: Date;
  language?: string;
  pageCount?: number;
  duration?: number; // for video/audio
  dimensions?: { width: number; height: number }; // for images/videos
}

export interface DocumentClassification {
  category: string;
  confidence: number;
  tags: string[];
  suggestedUse: string[];
}

export interface ExtractedContent {
  text: string;
  structure?: ContentStructure;
  entities?: NamedEntity[];
  summary?: string;
  keyPoints?: string[];
}

export interface ContentStructure {
  headings: Heading[];
  paragraphs: number;
  lists: number;
  tables: number;
  images: number;
}

export interface Heading {
  level: number;
  text: string;
  position: number;
}

export interface NamedEntity {
  text: string;
  type: string;
  confidence: number;
}

// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  pagination?: PaginationInfo;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Presentation System

export interface Presentation {
  id: string;
  courseId: string;
  title: string;
  template: PresentationTemplate;
  slides: Slide[];
  settings: PresentationSettings;
  generatedBy?: AIGenerationInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresentationTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  slides: SlideTemplate[];
}

export interface SlideTemplate {
  type: SlideType;
  layout: string;
  elements: SlideElement[];
}

export enum SlideType {
  TITLE = 'title',
  CONTENT = 'content',
  IMAGE = 'image',
  VIDEO = 'video',
  COMPARISON = 'comparison',
  CONCLUSION = 'conclusion'
}

export interface Slide {
  id: string;
  order: number;
  type: SlideType;
  title?: string;
  content: SlideElement[];
  notes?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'chart' | 'list';
  position: { x: number; y: number; width: number; height: number };
  content: any;
  style: Record<string, any>;
}

export interface PresentationSettings {
  theme: string;
  transition: string;
  autoPlay: boolean;
  duration?: number;
}

// Video Studio

export interface VideoProject {
  id: string;
  courseId: string;
  title: string;
  script: VideoScript;
  timeline: VideoTimeline;
  settings: VideoSettings;
  status: VideoProjectStatus;
  outputUrl?: string;
  generatedBy?: AIGenerationInfo;
  createdAt: Date;
  updatedAt: Date;
}

export enum VideoProjectStatus {
  DRAFT = 'draft',
  GENERATING = 'generating',
  READY = 'ready',
  ERROR = 'error'
}

export interface VideoScript {
  scenes: ScriptScene[];
  totalDuration: number;
}

export interface ScriptScene {
  id: string;
  order: number;
  speaker: string;
  text: string;
  duration: number;
  visuals?: SceneVisual[];
}

export interface SceneVisual {
  type: 'image' | 'video' | 'avatar' | 'text';
  content: string;
  timing: { start: number; end: number };
}

export interface VideoTimeline {
  tracks: TimelineTrack[];
  duration: number;
}

export interface TimelineTrack {
  id: string;
  type: 'audio' | 'video' | 'text' | 'overlay';
  clips: TimelineClip[];
}

export interface TimelineClip {
  id: string;
  start: number;
  end: number;
  content: string;
  properties: Record<string, any>;
}

export interface VideoSettings {
  resolution: '720p' | '1080p' | '4K';
  frameRate: number;
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high';
  avatar?: AvatarSettings;
}

export interface AvatarSettings {
  character: string;
  voice: string;
  style: Record<string, any>;
}

// Analytics & Dashboard

export interface DashboardStats {
  courses: CourseStats;
  aiUsage: AIUsageStats;
  performance: PerformanceStats;
  users: UserStats;
}

export interface CourseStats {
  total: number;
  published: number;
  draft: number;
  inProgress: number;
  totalViews: number;
  totalEnrollments: number;
}

export interface AIUsageStats {
  totalExecutions: number;
  byAgent: Record<AIAgentType, number>;
  totalCost: number;
  averageExecutionTime: number;
}

export interface PerformanceStats {
  averageGenerationTime: number;
  successRate: number;
  errorRate: number;
  userSatisfaction: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
}

// System Configuration

export interface SystemConfig {
  ai: AIConfig;
  storage: StorageConfig;
  features: FeatureFlags;
  limits: SystemLimits;
}

export interface AIConfig {
  defaultModel: string;
  models: AIModel[];
  rateLimit: number;
  timeout: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  costPerToken: number;
  capabilities: string[];
}

export interface StorageConfig {
  provider: 'local' | 'minio' | 's3';
  endpoint?: string;
  bucket: string;
  maxFileSize: number;
  allowedTypes: string[];
}

export interface FeatureFlags {
  aiAgents: boolean;
  videoStudio: boolean;
  multilingual: boolean;
  presentationGenerator: boolean;
  analytics: boolean;
}

export interface SystemLimits {
  maxCoursesPerUser: number;
  maxFileSize: number;
  maxAIExecutionsPerMonth: number;
  maxStoragePerUser: number;
}