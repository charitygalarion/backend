const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configure your email service (use Gmail for testing)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email
        pass: process.env.EMAIL_PASS, // App password
      },
    });
  }

  async sendPasswordResetEmail(email, token, resetUrl) {
    const mailOptions = {
      from: `"FreshRecipe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password - FreshRecipe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff6b6b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .token-box { background: #fff; border: 2px dashed #ff6b6b; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .token { font-size: 24px; font-weight: bold; color: #ff6b6b; letter-spacing: 2px; font-family: monospace; }
            .button { background: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>FreshRecipe</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password. Use the token below to reset your password in the app:</p>
              
              <div class="token-box">
                <p style="margin: 0 0 5px 0;">Your Reset Token:</p>
                <div class="token">${token}</div>
              </div>
              
              <p>Or click the button below:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              
              <p>This token will expire in 30 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
              
              <hr style="margin: 20px 0;" />
              <p style="font-size: 14px; color: #666;">
                <strong>Instructions:</strong><br/>
                1. Open the FreshRecipe mobile app<br/>
                2. Go to Forgot Password screen<br/>
                3. Paste this token: <strong>${token}</strong><br/>
                4. Enter your new password<br/>
                5. Your password will be reset!
              </p>
            </div>
            <div class="footer">
              <p>&copy; 2024 FreshRecipe. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Email send error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();