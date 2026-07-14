/**
 * Wallet Agent
 * Handles payout processing and transaction management
 */

const BaseAgent = require('../base-agent');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { Transaction, Claim, User } = require('../../shared/database/models');
const config = require('../../shared/config');

class WalletAgent extends BaseAgent {
  constructor() {
    super('WalletAgent');
    this.paymentGatewayUrl = config.payment.gatewayUrl;
    this.paymentApiKey = config.payment.apiKey;
  }

  async execute(input) {
    const { userId, claimId, amount, currency = 'USD' } = input;

    try {
      // Create transaction ID
      const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8)}`;

      this.logger.info('Processing payout', { userId, claimId, amount, transactionId });

      // Create transaction record
      const transaction = new Transaction({
        transactionId,
        userId,
        claimId,
        type: 'CLAIM_PAYOUT',
        amount,
        currency,
        status: 'PROCESSING',
        paymentMethod: 'DIGITAL_WALLET',
        paymentGateway: 'InsurNova_Wallet'
      });

      await transaction.save();

      // Process payment through gateway
      const paymentResult = await this.processPayment({
        transactionId,
        userId,
        amount,
        currency
      });

      if (paymentResult.success) {
        // Update transaction status
        transaction.status = 'COMPLETED';
        transaction.gatewayTransactionId = paymentResult.gatewayTxnId;
        transaction.processedAt = new Date();
        await transaction.save();

        // Update claim status
        await Claim.findOneAndUpdate(
          { claimId },
          { 
            status: 'PAID',
            'amount.paid': amount,
            paidAt: new Date()
          }
        );

        // Update user wallet balance
        await User.findOneAndUpdate(
          { userId },
          { $inc: { 'wallet.balance': amount } }
        );

        this.logger.info('Payout completed successfully', {
          transactionId,
          gatewayTxnId: paymentResult.gatewayTxnId
        });

        return this.success({
          transactionId,
          gatewayTransactionId: paymentResult.gatewayTxnId,
          amount,
          currency,
          status: 'COMPLETED'
        });

      } else {
        // Payment failed
        transaction.status = 'FAILED';
        transaction.metadata = { error: paymentResult.error };
        await transaction.save();

        this.logger.error('Payment failed', { error: paymentResult.error });
        return this.error('Payment processing failed', paymentResult.error);
      }

    } catch (error) {
      this.logger.error('Wallet processing failed', { error });
      return this.error('Wallet processing failed', error);
    }
  }

  /**
   * Process payment through payment gateway
   */
  async processPayment({ transactionId, userId, amount, currency }) {
    try {
      // In production, this would call actual payment gateway API
      // For now, simulate payment processing
      
      if (this.paymentGatewayUrl) {
        const response = await axios.post(
          `${this.paymentGatewayUrl}/payout`,
          {
            transaction_id: transactionId,
            user_id: userId,
            amount,
            currency,
            method: 'wallet'
          },
          {
            headers: {
              'Authorization': `Bearer ${this.paymentApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        return {
          success: response.data.success,
          gatewayTxnId: response.data.transaction_id,
          error: response.data.error
        };
      } else {
        // Simulation mode for development
        this.logger.warn('Payment gateway not configured, simulating payment');
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 95% success rate in simulation
        const success = Math.random() > 0.05;

        if (success) {
          return {
            success: true,
            gatewayTxnId: `SIM-${uuidv4().substring(0, 12)}`,
            error: null
          };
        } else {
          return {
            success: false,
            gatewayTxnId: null,
            error: 'Simulated payment failure'
          };
        }
      }

    } catch (error) {
      this.logger.error('Payment gateway error', { error: error.message });
      return {
        success: false,
        gatewayTxnId: null,
        error: error.message
      };
    }
  }

  validateInput(input) {
    if (!input.userId || !input.claimId || !input.amount) {
      throw new Error('userId, claimId, and amount are required');
    }

    if (input.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    return true;
  }
}

module.exports = WalletAgent;
