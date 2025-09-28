import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Basic middleware
app.use(cors())
app.use(express.json())

// Test route
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'AI Agents Backend is running!'
  })
})

// Test AI agents route  
app.get('/api/ai-agents', (req, res) => {
  res.json({
    success: true,
    message: 'AI Agents endpoint is working',
    data: [
      {
        id: '1',
        type: 'ARCHITECT',
        name: 'Architect Agent',
        description: 'Structures courses and defines learning objectives',
        isEnabled: true
      },
      {
        id: '2', 
        type: 'RESEARCH',
        name: 'Research Agent',
        description: 'Conducts research and fact-checking',
        isEnabled: true
      }
    ]
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Test CourseForge API Server running on port ${PORT}`)
  console.log(`📚 Health check: http://localhost:${PORT}/health`)
  console.log(`🤖 AI Agents test: http://localhost:${PORT}/api/ai-agents`)
})