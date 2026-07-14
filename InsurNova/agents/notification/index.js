/**
 * Notification Agent
 * Sends notifications to users via email/SMS
 */

const BaseAgent = require('../base-agent');
const axios = require('axios');
const config = require('../../shared/config');

class NotificationAgent extends BaseAgent {
  constructor() {
    super('NotificationAgent');
    this.sendgridApiKey = config.notification?.sendgrid?.apiKey;
    this.twilioConfig = config.notification?.twilio || {};
  }

  async execute(input) {
    const { userId, claimId, amount, status, reason, channel = 'email' } = input;

    try {
      const message = this.buildMessage({ claimId, amount, status, reason });

      let result;
      if (channel === 'email') {
        result = await this.sendEmail(userId, message);
      } else if (channel === 'sms') {
        result = await this.sendSMS(userId, message);
      } else {
        // Send both
        const emailResult = await this.sendEmail(userId, message);
        const smsResult = await this.sendSMS(userId, message);
        result = { email: emailResult, sms: smsResult };
      }

      this.logger.info('Notification sent', { userId, channel, claimId });

      return this.success({
        sent: true,
        channel,
        timestamp: new Date(),
        result
      });

    } catch (error) {
      this.logger.error('Notification failed', { error });
      return this.error('Notification failed', error);
    }
  }

  /**
   * Build notification message
   */
  buildMessage({ claimId, amount, status, reason }) {
    const statusMessages = {
      'PAID': {
        subject: '✅ Insurance Claim Approved & Paid',
        body: `Great news! Your insurance claim (${claimId}) has been approved and processed.\n\nAmount: $${amount}\nStatus: Paid\n\nThe amount has been credited to your wallet.`
      },
      'APPROVED': {
        subject: '✅ Insurance Claim Approved',
        body: `Your insurance claim (${claimId}) has been approved.\n\nApproved Amount: $${amount}\nStatus: Approved\n\nPayment will be processed shortly.`
      },
      'REJECTED': {
        subject: '❌ Insurance Claim Rejected',
        body: `We regret to inform you that your insurance claim (${claimId}) has been rejected.\n\nReason: ${reason}\n\nIf you have questions, please contact our support team.`
      },
      'FRAUD_DETECTED': {
        subject: '⚠️ Insurance Claim Under Review',
        body: `Your insurance claim (${claimId}) is under review for verification.\n\nOur team will contact you shortly for additional information.`
      },
      'EXCLUDED': {
        subject: '❌ Insurance Claim Not Covered',
        body: `Your insurance claim (${claimId}) is not covered under your policy.\n\nReason: ${reason}\n\nPlease review your policy coverage details.`
      }
    };

    return statusMessages[status] || {
      subject: 'Insurance Claim Update',
      body: `Your insurance claim (${claimId}) status: ${status}`
    };
  }

  /**
   * Send email notification
   */
  async sendEmail(userId, message) {
    try {
      // Get user email from database
      const { User } = require('../../shared/database/models');
      const user = await User.findOne({ userId });
      
      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      if (this.sendgridApiKey) {
        // Use SendGrid API
        const response = await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email: user.email }],
                subject: message.subject
              }
            ],
            from: { email: 'noreply@insurnova.com', name: 'InsurNova' },
            content: [
              {
                type: 'text/plain',
                value: message.body
              }
            ]
          },
          {
            headers: {
              'Authorization': `Bearer ${this.sendgridApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );

        return { success: true, provider: 'sendgrid' };
      } else {
        // Simulation mode
        this.logger.warn('SendGrid not configured, simulating email');
        console.log(`\n📧 Email to ${user.email}:\nSubject: ${message.subject}\n${message.body}\n`);
        return { success: true, provider: 'simulation' };
      }

    } catch (error) {
      this.logger.error('Email sending failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  async sendSMS(userId, message) {
    try {
      // Get user phone from database
      const { User } = require('../../shared/database/models');
      const user = await User.findOne({ userId });
      
      if (!user || !user.phone) {
        throw new Error('User phone not found');
      }

      if (this.twilioConfig.accountSid && this.twilioConfig.authToken) {
        // Use Twilio API
        const auth = Buffer.from(`${this.twilioConfig.accountSid}:${this.twilioConfig.authToken}`).toString('base64');
        
        const response = await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${this.twilioConfig.accountSid}/Messages.json`,
          new URLSearchParams({
            To: user.phone,
            From: this.twilioConfig.phoneNumber,
            Body: `${message.subject}\n\n${message.body}`
          }),
          {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          }
        );

        return { success: true, provider: 'twilio' };
      } else {
        // Simulation mode
        this.logger.warn('Twilio not configured, simulating SMS');
        console.log(`\n📱 SMS to ${user.phone}:\n${message.subject}\n${message.body}\n`);
        return { success: true, provider: 'simulation' };
      }

    } catch (error) {
      this.logger.error('SMS sending failed', { error: error.message });
      throw error;
    }
  }

  validateInput(input) {
    if (!input.userId || !input.status) {
      throw new Error('userId and status are required');
    }
    return true;
  }
}

module.exports = NotificationAgent;
