# 🎓 CourseForge - AI-Powered Course Creation SaaS

> **Forge your course, by hand or with AI** 🤖✨

[![GitHub Stars](https://img.shields.io/github/stars/thebestsystem/CourseForge?style=for-the-badge)](https://github.com/thebestsystem/CourseForge/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)

## 🌟 **What is CourseForge?**

CourseForge is a **comprehensive SaaS platform** that revolutionizes course creation by combining traditional authoring tools with **7 specialized AI agents**. Whether you prefer manual creation or AI assistance, CourseForge adapts to your workflow and helps you create **professional, engaging courses** in record time.

---

## 🚀 **Key Features**

### ✨ **Implemented Modules**

#### 🔐 **Module A - Authentication & User Management**
- JWT-based secure authentication system
- Role-based access control (Educator, Admin, Student)  
- Subscription management with Stripe integration
- User profiles and comprehensive permissions

#### 📁 **Module B - Document Manager** ⭐ *Recently Completed*
- **Advanced file upload system** (PDF, DOCX, PPTX, images, videos)
- **AI-powered content extraction** and analysis
- **Real-time document statistics** and analytics dashboard
- **Advanced search and filtering** by type, status, and content
- **Grid/list view toggle** with responsive design
- **Bulk operations** and AI analysis for multiple documents
- **Complete document lifecycle** management (upload/analyze/delete)
- **Professional REST API** with comprehensive endpoints
- **Security-focused** file handling and validation

#### 🤖 **Module D - AI Engine & Configuration**
- **7 Specialized AI Agents** for different course creation aspects:
  1. 🏗️ **Architect Agent** - Course structure and learning objectives
  2. 🔍 **Research Agent** - Content research and fact-checking  
  3. ✍️ **Writing Agent** - Content creation and narrative
  4. ✏️ **Editing Agent** - Review and improvement
  5. 🎨 **Design Agent** - Visual formatting and layout
  6. 🎯 **Quality Agent** - Compliance and standards validation
  7. 📈 **Marketing Agent** - Promotion and distribution strategies

- **Multi-LLM Provider Support**:
  - OpenAI (GPT-4, GPT-3.5)
  - DeepSeek (deepseek-chat, deepseek-coder)
  - Anthropic Claude (3.5 Sonnet, 3 Haiku)
  - Google Gemini (1.5 Pro, 1.5 Flash)
  - Cohere (Command R+, Command R)
  - Groq (Llama 3.1, Mixtral 8x7B)
  - Ollama (Local LLMs)

- **Advanced Configuration**:
  - System prompt management
  - Generation parameters and settings
  - Complete generation history and versioning
  - Encrypted API key storage
  - Mock response system for demos

---

## 🎯 **Coming Soon - Available Modules**

### **🎓 Module C - Course Planner** 🚧 *Next Priority*
- **🏗️ Visual Course Builder**: Drag & drop interface, hierarchical organization (Cours → Modules → Chapitres → Leçons)
- **📚 Professional Templates**: Business, Technology, Education, Creative pre-built structures
- **🤖 AI-Powered Generation**: Document analysis, Architect Agent integration, smart content distribution
- **📊 Advanced Planning**: Duration estimation, SMART objectives, competency sequencing, prerequisite mapping

### **✏️ Module E - Content Editor**
- Advanced WYSIWYG editor with AI integration
- Multi-agent contribution visualization
- Real-time collaboration
- Multimedia content integration

### **📊 Module G - Presentation Generator** 
- Template-based presentation creation
- Export to PowerPoint/PDF formats
- Visual customization tools
- Animation and transition effects

### **🎬 Module H - Video Studio**
- AI script generation
- Text-to-Speech integration
- Automated video editing
- Virtual avatar integration

### **🌍 Module F - Multilingual Manager**
- Multi-language support system
- AI-powered translation with cultural adaptation
- Language-specific content management

### **📈 Module I - Dashboard & Analytics**
- Comprehensive project overview
- Performance metrics and KPIs
- AI agent usage tracking
- Detailed analytics and reports

---

## 🛠️ **Technology Stack**

### **Frontend**
- ⚡ **Next.js 14** with App Router
- 🔷 **TypeScript** for type safety
- 🎨 **Tailwind CSS** + shadcn/ui components
- 🚀 **Zustand** for state management  
- 📝 **React Hook Form** + Zod validation
- 🔄 **Axios** + React Query for API calls

### **Backend**
- 🟢 **Node.js 18+** with Express.js
- 🔷 **TypeScript** throughout
- 🐘 **PostgreSQL** + Prisma ORM
- 🔐 **JWT** + Passport.js authentication
- ☁️ **AWS S3** or local file storage
- 🤖 **Multi-LLM AI Integration**
- 💳 **Stripe** payment processing

### **Infrastructure**
- 🐳 **Docker** containerization
- 🔴 **Redis** caching and sessions
- 📁 **MinIO** or AWS S3 file storage
- 🚀 **Docker Compose** deployment

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

### **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/thebestsystem/CourseForge.git
cd CourseForge

# 2. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 3. Install dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies  
cd frontend && npm install && cd ..

# 4. Database setup
cd backend
npm run db:generate
npm run db:push
npm run db:seed
cd ..

# 5. Start development servers
docker-compose up -d  # Start PostgreSQL & Redis
npm run dev           # Start both frontend and backend
```

### **Access the Application**

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:3001
- 📊 **Complete Dashboard**: Open `complete-dashboard.html` in browser
- 🛠️ **Demo Settings**: Open `demo-settings-ui.html` in browser

---

## 📱 **Demo Interfaces**

### **Complete Dashboard**
Professional interface with full document management, AI agents execution, and comprehensive analytics.

**Features:**
- Modern sidebar navigation
- Real-time statistics dashboard  
- Document upload and management
- AI agent execution panel
- Professional notifications system

### **Demo Settings UI**
Simplified interface for testing AI configurations without full setup.

**Features:**
- API key management for all providers
- Quick AI agent testing
- Mock response system for demos
- Provider switching and configuration

---

## 🎯 **Key Workflows**

### **Document-to-Course Creation**
1. 📤 **Upload** documents (PDF, DOCX, images, videos)
2. 🔍 **Extract** content using AI
3. 🏗️ **Structure** course with Architect Agent
4. ✍️ **Generate** content with Writing Agent
5. ✏️ **Refine** with Editing Agent
6. 🎨 **Design** layout with Design Agent
7. 🎯 **Validate** quality with Quality Agent

### **Manual Course Creation**  
1. 🎓 **Plan** course structure manually
2. ✏️ **Write** content with AI assistance
3. 📊 **Generate** presentations
4. 🎬 **Create** video content
5. 🌍 **Translate** for multiple languages

---

## 🔧 **Configuration**

### **Environment Variables**

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/courseforge"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# AI Providers (Optional - has fallback mock system)
OPENAI_API_KEY="sk-..."
DEEPSEEK_API_KEY="sk-..."  
ANTHROPIC_API_KEY="sk-..."
GOOGLE_API_KEY="..."
COHERE_API_KEY="..."
GROQ_API_KEY="gsk_..."

# File Storage
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key" 
AWS_S3_BUCKET="your-bucket"

# Payment
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 📋 **API Documentation**

### **Authentication**
```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### **Documents**
```http
GET    /api/documents              # List documents with filters
POST   /api/documents/upload       # Upload new document
GET    /api/documents/:id          # Get document details
DELETE /api/documents/:id          # Delete document
POST   /api/documents/:id/extract  # Extract content
POST   /api/documents/:id/analyze  # AI analysis
POST   /api/documents/analyze/bulk # Bulk AI analysis
GET    /api/documents/stats        # Document statistics
```

### **AI Agents**
```http
POST /api/ai-agents/execute        # Execute AI agent
GET  /api/ai-agents/history        # Execution history
GET  /api/ai-agents/providers      # Available providers
```

### **Settings**
```http
GET    /api/settings/llm-providers # Get LLM providers
PUT    /api/settings/api-keys      # Update API keys
GET    /api/settings/user          # User settings
```

---

## 🧪 **Testing**

```bash
# Run backend tests
cd backend
npm test
npm run test:coverage

# Run frontend tests  
cd frontend
npm test
npm run test:e2e

# Integration tests
npm run test:integration
```

---

## 📦 **Deployment**

### **Production Deployment**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use Docker
docker-compose -f docker-compose.prod.yml up -d
```

### **Environment-specific Configs**
- 📝 `.env.local` - Local development
- 🚀 `.env.production` - Production settings
- 📋 `.env.example` - Template with all options

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Workflow**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📈 **Roadmap**

### **Phase 1** ✅ *Completed*
- ✅ Authentication & User Management (Module A)
- ✅ Document Manager with AI (Module B) 
- ✅ AI Engine & 7 Specialized Agents (Module D)

### **Phase 2** 🚧 *In Progress*  
- 🔄 Course Planner (Module C)
- 🔄 Content Editor (Module E)
- 🔄 Dashboard & Analytics (Module I)

### **Phase 3** 📋 *Planned*
- 📋 Presentation Generator (Module G)
- 📋 Video Studio (Module H)
- 📋 Multilingual Manager (Module F)

### **Phase 4** 🔮 *Future*
- 🔮 Mobile applications
- 🔮 Advanced integrations
- 🔮 Enterprise features

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎉 **Acknowledgments**

- 🤖 **AI Providers**: OpenAI, Anthropic, DeepSeek, Google, Cohere, Groq
- 🛠️ **Framework Teams**: Next.js, Express.js, Prisma, Tailwind CSS
- 👥 **Open Source Community** for amazing tools and libraries

---

## 📞 **Support & Contact**

- 📧 **Email**: support@courseforge.ai
- 💬 **Discord**: [CourseForge Community](https://discord.gg/courseforge)
- 🐦 **Twitter**: [@CourseForge](https://twitter.com/courseforge)
- 📖 **Documentation**: [docs.courseforge.ai](https://docs.courseforge.ai)

---

<div align="center">

**Made with ❤️ by the CourseForge Team**

[⭐ Star us on GitHub](https://github.com/thebestsystem/CourseForge) • [🚀 Try CourseForge](https://courseforge.ai) • [📖 Documentation](https://docs.courseforge.ai)

</div>