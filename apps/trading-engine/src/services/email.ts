import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('Email service not configured - missing SMTP environment variables');
      return;
    }

    this.config = {
      host,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user,
      pass
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass
      }
    });
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email service connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }

  generateMagicToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendSignupEmail(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyUrl = `${frontendUrl}/auth/verify?token=${token}&email=${email}`;

    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Welcome to Exness Trading Platform</h2>
        <p>Hi there!</p>
        <p>Click the button below to verify your email and complete your signup:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${verifyUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p>Or copy this link: ${verifyUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>Thanks!</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config!.user,
        to: email,
        subject: 'Verify your email - Exness Trading',
        html: htmlContent
      });
      return true;
    } catch (error) {
      console.error('Failed to send signup email:', error);
      return false;
    }
  }

  async sendLoginEmail(email: string, token: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const loginUrl = `${frontendUrl}/auth/verify?token=${token}&email=${email}`;

    const htmlContent = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2>Login to Exness Trading Platform</h2>
        <p>Hi there!</p>
        <p>Click the button below to login to your account:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${loginUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 4px; display: inline-block;">
            Login Now
          </a>
        </div>
        <p>Or copy this link: ${loginUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>Thanks!</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config!.user,
        to: email,
        subject: 'Login link - Exness Trading',
        html: htmlContent
      });
      return true;
    } catch (error) {
      console.error('Failed to send login email:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const emailService = new EmailService();
