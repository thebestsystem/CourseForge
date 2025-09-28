# 🤝 Contributing to CourseForge

We love your input! We want to make contributing to CourseForge as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code  
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🚀 **Development Process**

We use GitHub to host code, track issues and feature requests, and accept pull requests.

### **Our Workflow**
1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## 🐛 **Report Issues Using GitHub Issues**

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/thebestsystem/CourseForge/issues).

### **Great Bug Reports Include:**
- A quick summary and/or background
- Steps to reproduce (be specific!)
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## 📋 **Development Setup**

### **Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- Git

### **Setup Steps**
```bash
# 1. Fork and clone your fork
git clone https://github.com/YOUR_USERNAME/CourseForge.git
cd CourseForge

# 2. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start development environment
docker-compose up -d  # PostgreSQL & Redis
npm run dev          # Backend & Frontend
```

## 🎯 **Module Development Guidelines**

CourseForge follows a **modular architecture**. Each module should be self-contained and follow these patterns:

### **Backend Module Structure**
```
backend/src/
├── controllers/module-name.ts    # Business logic
├── routes/module-name.ts         # API routes  
├── services/module-name.ts       # External integrations
├── models/module-name.ts         # Data models
└── __tests__/module-name.test.ts # Tests
```

### **Frontend Module Structure**
```
frontend/src/
├── app/module-name/              # Pages
├── components/module-name/       # Components
├── services/module-name.ts       # API calls
├── types/module-name.ts          # TypeScript types
└── __tests__/module-name.test.ts # Tests
```

## 📝 **Coding Standards**

### **TypeScript**
- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### **Code Style**
```typescript
// ✅ Good
interface DocumentUploadRequest {
  file: File;
  title?: string;
  autoExtract: boolean;
}

const uploadDocument = async (request: DocumentUploadRequest): Promise<DocumentResponse> => {
  // Implementation
};

// ❌ Bad
const upload = (data: any) => {
  // Implementation
};
```

### **API Design**
- Follow RESTful conventions
- Use consistent response formats
- Include proper error handling
- Document all endpoints

```typescript
// ✅ Good API Response Format
{
  "success": true,
  "data": {...},
  "message": "Operation successful",
  "pagination": {...}  // If applicable
}

// ✅ Good Error Response Format  
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "details": {...}     // If applicable
}
```

## 🧪 **Testing Guidelines**

### **Write Tests For**
- All new API endpoints
- New React components
- Business logic functions
- AI agent implementations

### **Testing Structure**
```typescript
describe('DocumentController', () => {
  describe('uploadDocument', () => {
    it('should successfully upload a PDF document', async () => {
      // Test implementation
    });
    
    it('should reject invalid file types', async () => {
      // Test implementation  
    });
  });
});
```

### **Run Tests**
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd frontend && npm test

# Integration tests
npm run test:integration

# Coverage
npm run test:coverage
```

## 🎨 **UI/UX Guidelines**

### **Design Principles**
- **Consistency**: Use established design patterns
- **Accessibility**: Follow WCAG guidelines
- **Responsiveness**: Mobile-first approach
- **Performance**: Optimize for speed

### **Component Guidelines**
```typescript
// ✅ Good Component Structure
interface DocumentCardProps {
  document: Document;
  onAnalyze: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ 
  document, 
  onAnalyze, 
  onDelete 
}) => {
  // Component implementation
};
```

## 🤖 **AI Agent Development**

When adding new AI agents, follow this structure:

### **Agent Implementation**
```typescript
interface AIAgent {
  name: string;
  description: string;
  systemPrompt: string;
  execute(prompt: string, context?: any): Promise<AIResponse>;
}

export class NewAgent implements AIAgent {
  name = "New Agent";
  description = "Description of what this agent does";
  systemPrompt = "System prompt for the agent";
  
  async execute(prompt: string, context?: any): Promise<AIResponse> {
    // Implementation
  }
}
```

### **Register Agent**
Add to `backend/src/services/ai-engine.ts`:
```typescript
const agents = {
  // ... existing agents
  NEW_AGENT: new NewAgent(),
};
```

## 📚 **Documentation Standards**

### **Code Documentation**
- Use JSDoc for functions and classes
- Include usage examples
- Document complex business logic

### **API Documentation**
- Document all endpoints with examples
- Include request/response schemas
- Specify error conditions

### **README Updates**
- Update feature lists when adding modules
- Include setup instructions for new dependencies
- Add usage examples

## 🔄 **Pull Request Process**

### **Before Submitting**
1. ✅ Code follows style guidelines
2. ✅ Tests pass locally  
3. ✅ Documentation updated
4. ✅ No console errors
5. ✅ Responsive design tested

### **PR Description Template**
```markdown
## Changes Made
- Brief description of changes

## Module/Feature
- Which module this affects

## Testing
- How this was tested
- Screenshots for UI changes

## Breaking Changes
- Any breaking changes (if applicable)

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated  
- [ ] No console errors
- [ ] Mobile responsive (for UI changes)
```

## 🏗️ **Module Priority & Roadmap**

### **High Priority Modules**
1. **Module C** - Course Planner
2. **Module G** - Presentation Generator  
3. **Module I** - Dashboard & Analytics

### **Medium Priority Modules**
4. **Module E** - Content Editor
5. **Module F** - Multilingual Manager

### **Complex Modules** 
6. **Module H** - Video Studio

## 🎯 **Contribution Areas**

### **Easy Contributions**
- Bug fixes
- Documentation improvements
- UI/UX enhancements
- Test coverage improvements

### **Medium Complexity**  
- New AI agent implementations
- API endpoint additions
- New UI components
- Performance optimizations

### **High Complexity**
- New module development
- Architecture improvements
- Advanced AI integrations
- Security enhancements

## 📞 **Getting Help**

- 📧 **Email**: dev@courseforge.ai
- 💬 **Discord**: [CourseForge Dev Community](https://discord.gg/courseforge-dev)
- 📖 **Docs**: [Developer Documentation](https://docs.courseforge.ai/dev)
- 🐛 **Issues**: [GitHub Issues](https://github.com/thebestsystem/CourseForge/issues)

## 📜 **License**

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to CourseForge! 🎓✨**