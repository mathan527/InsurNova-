/**
 * Supabase Database Connection
 * Replaces MongoDB/Mongoose with Supabase PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

class Database {
  constructor() {
    this.client = null;
    this.connected = false;
  }

  async connect() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      // Test connection
      const { data, error } = await this.client.from('users').select('count', { count: 'exact', head: true });
      
      if (error) {
        throw error;
      }

      this.connected = true;
      logger.info('Supabase connected successfully', { 
        url: supabaseUrl.replace(/\/\/.*@/, '//***@')
      });

      return this.client;
    } catch (error) {
      logger.error('Supabase connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    this.connected = false;
    this.client = null;
    logger.info('Supabase connection closed');
  }

  isConnected() {
    return this.connected;
  }

  getClient() {
    return this.client;
  }
}

module.exports = new Database();
