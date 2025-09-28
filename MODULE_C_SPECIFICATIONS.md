# 🎓 Module C - Course Planner - Technical Specifications

**Version**: 1.0  
**Date**: September 28, 2024  
**Status**: Ready for Implementation  

---

## 📋 **Overview & Objectives**

The Course Planner module is designed to provide educators with a comprehensive, AI-powered course creation and planning system. It seamlessly integrates with the existing Document Manager (Module B) and AI Engine (Module D) to create a complete course development workflow.

### **Key Goals**
- Transform uploaded documents into structured, pedagogically sound courses
- Provide intuitive visual tools for course organization
- Leverage AI agents for intelligent course structure optimization
- Enable scalable course template management
- Deliver data-driven insights for course improvement

---

## 🏗️ **Feature 1: Visual Course Structure Builder**

### **User Interface Components**

#### **Main Course Builder Canvas**
```typescript
interface CourseBuilderCanvas {
  courseTree: CourseTreeComponent;
  dragDropZone: DragDropZone;
  toolbarPanel: ToolbarPanel;
  propertyPanel: PropertyPanel;
  previewPane: PreviewPane;
}
```

#### **Hierarchical Structure**
```typescript
interface CourseHierarchy {
  course: {
    id: string;
    title: string;
    description: string;
    modules: CourseModule[];
  };
}

interface CourseModule {
  id: string;
  title: string;
  description: string;
  position: number;
  chapters: CourseChapter[];
}

interface CourseChapter {
  id: string;
  title: string;
  description: string;
  position: number;
  lessons: CourseLesson[];
}

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'video' | 'quiz' | 'assignment';
  duration: number; // in minutes
  position: number;
  prerequisites: string[]; // lesson IDs
}
```

#### **Drag & Drop Implementation**
- **Library**: React DnD or @dnd-kit/core for React components
- **Features**:
  - Drag lessons between chapters
  - Drag chapters between modules  
  - Drag modules within course
  - Visual drop zones with highlighting
  - Undo/redo functionality
  - Auto-save during drag operations

#### **Visual Elements**
```css
/* Course Tree Styling */
.course-tree {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
}

.course-module {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.course-module.dragging {
  opacity: 0.5;
  transform: rotate(3deg);
}

.drop-zone.active {
  border: 2px dashed #3b82f6;
  background: #dbeafe;
}
```

### **Technical Implementation**

#### **Backend API Endpoints**
```typescript
// Course structure management
GET    /api/courses                     // List all courses
POST   /api/courses                     // Create new course
GET    /api/courses/:id                 // Get course details
PUT    /api/courses/:id                 // Update course
DELETE /api/courses/:id                 // Delete course

// Course structure operations
PUT    /api/courses/:id/structure       // Update entire structure
POST   /api/courses/:id/modules         // Add module
PUT    /api/courses/:id/modules/:moduleId // Update module
DELETE /api/courses/:id/modules/:moduleId // Delete module

// Chapter and lesson operations  
POST   /api/courses/:id/modules/:moduleId/chapters
PUT    /api/courses/:id/modules/:moduleId/chapters/:chapterId
POST   /api/courses/:id/modules/:moduleId/chapters/:chapterId/lessons
```

#### **Database Schema**
```sql
-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  template_id UUID REFERENCES course_templates(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  estimated_duration INTEGER, -- in minutes
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  tags TEXT[],
  is_published BOOLEAN DEFAULT FALSE
);

-- Course modules table
CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  estimated_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course chapters table  
CREATE TABLE course_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  estimated_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course lessons table
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES course_chapters(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  lesson_type VARCHAR(20) DEFAULT 'text',
  duration INTEGER, -- in minutes
  position INTEGER NOT NULL,
  prerequisites UUID[], -- array of lesson IDs
  learning_objectives TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📚 **Feature 2: Predefined Templates System**

### **Template Categories & Structure**

#### **Template Definition**
```typescript
interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // in hours
  structure: TemplateStructure;
  learningObjectives: string[];
  prerequisites: string[];
  targetAudience: string;
  tags: string[];
}

interface TemplateStructure {
  modules: TemplateModule[];
}

interface TemplateModule {
  title: string;
  description: string;
  chapters: TemplateChapter[];
}

interface TemplateChapter {
  title: string;
  description: string;
  suggestedLessons: string[];
  estimatedDuration: number;
}
```

#### **Business & Corporate Templates**
```json
{
  "leadership_development": {
    "name": "Leadership Development Program",
    "modules": [
      {
        "title": "Foundations of Leadership",
        "chapters": [
          "Leadership Theories and Styles",
          "Self-Assessment and Emotional Intelligence", 
          "Building Personal Leadership Brand"
        ]
      },
      {
        "title": "Team Management",
        "chapters": [
          "Building High-Performance Teams",
          "Communication and Feedback",
          "Conflict Resolution"
        ]
      },
      {
        "title": "Strategic Leadership",
        "chapters": [
          "Vision and Goal Setting",
          "Change Management",
          "Performance Management"
        ]
      }
    ]
  }
}
```

#### **Technology Templates**
```json
{
  "python_programming": {
    "name": "Complete Python Programming",
    "modules": [
      {
        "title": "Python Fundamentals",
        "chapters": [
          "Syntax and Basic Concepts",
          "Data Types and Variables",
          "Control Flow and Functions"
        ]
      },
      {
        "title": "Object-Oriented Programming",
        "chapters": [
          "Classes and Objects",
          "Inheritance and Polymorphism",
          "Design Patterns"
        ]
      },
      {
        "title": "Advanced Topics",
        "chapters": [
          "Web Development with Flask/Django",
          "Data Science Libraries",
          "Testing and Debugging"
        ]
      }
    ]
  }
}
```

### **Template Management System**

#### **Template Selection Interface**
```typescript
interface TemplateSelector {
  categories: TemplateCategory[];
  searchFilter: string;
  difficultyFilter: string[];
  durationFilter: { min: number; max: number };
  selectedTemplate: CourseTemplate | null;
}

interface TemplatePreview {
  template: CourseTemplate;
  estimatedTimeToComplete: string;
  moduleCount: number;
  chapterCount: number;
  customizationOptions: CustomizationOption[];
}
```

#### **Template Customization**
- **Module Addition/Removal**: Allow users to add or remove modules
- **Chapter Modification**: Customize chapter content and order
- **Duration Adjustment**: Modify estimated durations based on audience
- **Objective Customization**: Adapt learning objectives to specific needs
- **Prerequisite Management**: Add or modify prerequisites

---

## 🤖 **Feature 3: AI-Powered Course Generation**

### **Document Analysis Pipeline**

#### **Content Analysis Process**
```typescript
interface DocumentAnalysisRequest {
  documentIds: string[];
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  preferredDuration: number; // in hours
  learningObjectives?: string[];
  templateSuggestion?: string;
}

interface DocumentAnalysisResult {
  extractedTopics: Topic[];
  suggestedStructure: CourseStructure;
  estimatedDuration: number;
  difficultyAssessment: DifficultyLevel;
  learningObjectives: string[];
  prerequisites: string[];
}

interface Topic {
  title: string;
  importance: number; // 0-1 scale
  complexity: number; // 0-1 scale
  keyPoints: string[];
  suggestedDuration: number;
  relatedTopics: string[];
}
```

#### **Architect Agent Integration**
```typescript
class CourseArchitectAgent {
  async analyzeCourseStructure(documents: Document[], requirements: CourseRequirements): Promise<CourseStructure> {
    const prompt = `
    Analyze the following documents and create an optimal course structure:
    
    Documents: ${documents.map(d => d.extractedContent).join('\n\n')}
    
    Requirements:
    - Target Audience: ${requirements.audience}
    - Duration: ${requirements.duration} hours
    - Learning Objectives: ${requirements.objectives}
    
    Create a hierarchical course structure with:
    1. Logical module progression
    2. Balanced chapter distribution
    3. Appropriate lesson sequencing
    4. Clear learning objectives for each section
    5. Prerequisite mapping
    
    Provide the response in JSON format following the CourseStructure interface.
    `;
    
    return await this.executeAgent(prompt);
  }
}
```

### **Smart Content Distribution Algorithm**

#### **Content Chunking Logic**
```typescript
interface ContentChunkingService {
  chunkContent(content: string, targetDuration: number): ContentChunk[];
  optimizeChunkSize(chunks: ContentChunk[]): ContentChunk[];
  identifyKeyConceptBoundaries(content: string): ConceptBoundary[];
}

interface ContentChunk {
  content: string;
  estimatedReadingTime: number;
  keyConceptsCount: number;
  complexity: number;
  suggestedBreakPoints: number[];
}
```

#### **Learning Path Optimization**
```typescript
interface LearningPathOptimizer {
  optimizePath(lessons: Lesson[]): OptimizedPath;
  identifyDependencies(lessons: Lesson[]): DependencyMap;
  calculateDifficultyProgression(path: Lesson[]): DifficultyProgression;
}

interface OptimizedPath {
  lessons: Lesson[];
  estimatedCompletionTime: number;
  difficultyProgression: number[];
  assessmentPoints: number[];
  breakpoints: number[];
}
```

---

## 📊 **Feature 4: Advanced Course Planning & Analytics**

### **Duration Estimation System**

#### **AI-Powered Time Calculation**
```typescript
interface DurationEstimator {
  estimateReadingTime(content: string): number;
  estimateVideoTime(videoLength: number): number;
  estimateAssignmentTime(complexity: number): number;
  calculateTotalDuration(course: Course): CourseDuration;
}

interface CourseDuration {
  totalHours: number;
  moduleBreakdown: ModuleDuration[];
  learningPaceOptions: {
    fast: number;    // 1.5x speed
    normal: number;  // 1x speed  
    slow: number;    // 0.7x speed
  };
  timeDistribution: {
    reading: number;
    video: number;
    assignments: number;
    assessments: number;
  };
}
```

### **Learning Objectives Framework**

#### **SMART Objectives Generator**
```typescript
interface LearningObjective {
  id: string;
  statement: string;
  bloomLevel: BloomLevel; // Remember, Understand, Apply, Analyze, Evaluate, Create
  measurementMethod: AssessmentMethod;
  timeframe: string;
  prerequisites: string[];
}

enum BloomLevel {
  REMEMBER = 'remember',
  UNDERSTAND = 'understand', 
  APPLY = 'apply',
  ANALYZE = 'analyze',
  EVALUATE = 'evaluate',
  CREATE = 'create'
}

interface ObjectiveGenerator {
  generateSMARTObjectives(content: string, difficulty: string): LearningObjective[];
  validateObjectiveQuality(objective: LearningObjective): ValidationResult;
  suggestMeasurementMethods(objective: LearningObjective): AssessmentMethod[];
}
```

### **Competency Mapping System**

#### **Skill Dependency Graph**
```typescript
interface CompetencyMap {
  competencies: Competency[];
  dependencies: DependencyRelation[];
  progressionPaths: LearningPath[];
}

interface Competency {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[]; // competency IDs
  assessmentCriteria: string[];
  estimatedTimeToMaster: number;
}

interface DependencyRelation {
  prerequisite: string; // competency ID
  dependent: string;    // competency ID
  relationshipType: 'required' | 'recommended' | 'optional';
  strength: number;     // 0-1 scale
}
```

---

## 🛠️ **Technical Implementation Plan**

### **Phase 1: Foundation (Week 1)**
1. **Database Schema Setup**
   - Create tables for courses, modules, chapters, lessons
   - Set up template storage system
   - Implement basic CRUD operations

2. **Basic UI Framework** 
   - Set up React components for course builder
   - Implement basic drag & drop functionality
   - Create template selection interface

### **Phase 2: Core Features (Week 2)**
1. **Visual Course Builder**
   - Complete drag & drop implementation
   - Add real-time preview functionality
   - Implement undo/redo system

2. **Template System**
   - Load predefined templates
   - Template customization interface
   - Template-based course generation

### **Phase 3: AI Integration (Week 3)**
1. **Document Analysis Pipeline**
   - Integration with existing Document Manager
   - Content extraction and analysis
   - Topic identification and structuring

2. **Architect Agent Integration**
   - Course structure generation
   - Learning path optimization
   - Content distribution algorithms

### **Phase 4: Advanced Features (Week 4)**
1. **Duration Estimation**
   - AI-powered time calculations
   - Multi-pace learning options
   - Time distribution analytics

2. **Learning Objectives & Competencies**
   - SMART objectives generation
   - Competency mapping system
   - Prerequisites and dependencies

---

## 🧪 **Testing Strategy**

### **Unit Testing**
- Component testing for React UI elements
- API endpoint testing
- Database operation testing
- AI agent response validation

### **Integration Testing**  
- Course creation workflow end-to-end
- Document-to-course generation pipeline
- Template application and customization
- Drag & drop operations with data persistence

### **User Acceptance Testing**
- Course creation user journey
- Template usage and customization
- AI-generated structure quality
- Performance with large courses (100+ lessons)

---

## 📋 **Success Metrics**

### **Functional Metrics**
- Course creation time reduction: 70%+ improvement
- Template usage rate: 80%+ of new courses
- AI structure acceptance rate: 85%+ user satisfaction
- Duration estimation accuracy: Within 15% of actual completion time

### **Technical Metrics**
- Page load time: < 2 seconds for course builder
- Drag & drop responsiveness: < 100ms latency
- Course save operations: < 1 second
- Template load time: < 500ms

### **User Experience Metrics**
- User satisfaction score: 4.5+ out of 5
- Feature adoption rate: 90%+ within first month
- Support ticket reduction: 50%+ decrease in course creation issues

---

**This specification document serves as the complete technical blueprint for implementing Module C - Course Planner, ensuring all requested features are properly documented and planned for development.**