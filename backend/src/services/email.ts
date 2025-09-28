import nodemailer from 'nodemailer'
import { logger } from '@/utils/logger'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export class EmailService {
  private transporter: nodemailer.Transporter
  private fromAddress: string

  constructor() {
    this.fromAddress = process.env.SMTP_FROM || 'noreply@courseforge.com'
    
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }

    this.transporter = nodemailer.createTransporter(config)
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, token: string, userName: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`
    
    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Verify Your CourseForge Account',
      html: this.getVerificationEmailTemplate(userName, verificationUrl),
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Verification email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send verification email:', error)
      throw error
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
    
    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Reset Your CourseForge Password',
      html: this.getPasswordResetEmailTemplate(userName, resetUrl),
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Password reset email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send password reset email:', error)
      throw error
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<void> {
    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: 'Welcome to CourseForge!',
      html: this.getWelcomeEmailTemplate(userName),
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Welcome email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send welcome email:', error)
      throw error
    }
  }

  /**
   * Send course completion email
   */
  async sendCourseCompletionEmail(
    email: string,
    userName: string,
    courseTitle: string
  ): Promise<void> {
    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: `Congratulations! You've completed "${courseTitle}"`,
      html: this.getCourseCompletionEmailTemplate(userName, courseTitle),
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`Course completion email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send course completion email:', error)
      throw error
    }
  }

  /**
   * Send AI agent notification email
   */
  async sendAIAgentNotificationEmail(
    email: string,
    userName: string,
    agentType: string,
    courseTitle: string,
    result: string
  ): Promise<void> {
    const mailOptions = {
      from: this.fromAddress,
      to: email,
      subject: `AI Agent Completed: ${agentType} for "${courseTitle}"`,
      html: this.getAIAgentNotificationTemplate(userName, agentType, courseTitle, result),
    }

    try {
      await this.transporter.sendMail(mailOptions)
      logger.info(`AI agent notification email sent to ${email}`)
    } catch (error) {
      logger.error('Failed to send AI agent notification email:', error)
      throw error
    }
  }

  /**
   * Verification email template
   */
  private getVerificationEmailTemplate(userName: string, verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 CourseForge</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to CourseForge! We're excited to have you on board.</p>
            <p>To complete your registration and start creating amazing courses with AI, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e8e8e8; padding: 10px; border-radius: 5px;">
              ${verificationUrl}
            </p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
            <p>AI-Powered Course Creation Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Password reset email template
   */
  private getPasswordResetEmailTemplate(userName: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 CourseForge</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>We received a request to reset your password for your CourseForge account.</p>
            <p>To reset your password, click the button below:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #e8e8e8; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This reset link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
            <p>If you need help, contact our support team</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Welcome email template
   */
  private getWelcomeEmailTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CourseForge</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 10px; }
          .feature-list { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to CourseForge!</h1>
            <p>Your AI-Powered Course Creation Journey Starts Now</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Congratulations on joining CourseForge! You now have access to the most advanced AI-powered course creation platform.</p>
            
            <div class="feature-list">
              <h3>🚀 What you can do with CourseForge:</h3>
              <ul>
                <li><strong>🏗️ Architect Agent:</strong> Structure your courses with AI</li>
                <li><strong>🔍 Research Agent:</strong> Gather and verify content</li>
                <li><strong>✍️ Writing Agent:</strong> Create engaging content</li>
                <li><strong>🎨 Design Agent:</strong> Beautiful visual layouts</li>
                <li><strong>✅ Quality Agent:</strong> Ensure compliance and quality</li>
                <li><strong>📢 Marketing Agent:</strong> Optimize for distribution</li>
                <li><strong>🎬 Video Studio:</strong> Create professional videos</li>
                <li><strong>🌍 Multilingual:</strong> Translate to any language</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Start Creating</a>
              <a href="${process.env.FRONTEND_URL}/docs" class="button" style="background: #6c757d;">View Documentation</a>
            </div>

            <p>Need help getting started? Check out our comprehensive guides and tutorials in the documentation.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
            <p>Happy course creating! 🎓</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Course completion email template
   */
  private getCourseCompletionEmailTemplate(userName: string, courseTitle: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Course Completed!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .achievement { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; border: 2px solid #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Congratulations!</h1>
            <p>Course Completed Successfully</p>
          </div>
          <div class="content">
            <h2>Amazing work, ${userName}!</h2>
            <p>You've successfully completed your course creation:</p>
            
            <div class="achievement">
              <h3>📚 "${courseTitle}"</h3>
              <p>🎉 Your course is now ready for the world!</p>
            </div>

            <p>What's next? Here are some suggestions:</p>
            <ul>
              <li>📤 Publish your course to reach your audience</li>
              <li>📊 Monitor analytics and engagement</li>
              <li>🔄 Create more courses with your AI agents</li>
              <li>🌟 Share your success with the community</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/courses" class="button">View Your Courses</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
            <p>Keep creating amazing content! 🚀</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * AI agent notification email template
   */
  private getAIAgentNotificationTemplate(
    userName: string,
    agentType: string,
    courseTitle: string,
    result: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Agent Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .agent-result { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #6f42c1; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Agent Completed</h1>
            <p>Your ${agentType} Agent has finished working</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Great news! Your ${agentType} Agent has completed its work on your course:</p>
            
            <div class="agent-result">
              <h3>📚 Course: "${courseTitle}"</h3>
              <h4>🎯 Agent: ${agentType}</h4>
              <p><strong>Result:</strong></p>
              <p>${result}</p>
            </div>

            <p>You can now review the AI-generated content and continue with your course creation process.</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/courses" class="button">Review Results</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; 2024 CourseForge. All rights reserved.</p>
            <p>AI-Powered Course Creation 🚀</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      logger.info('Email service connection verified')
      return true
    } catch (error) {
      logger.error('Email service connection failed:', error)
      return false
    }
  }
}