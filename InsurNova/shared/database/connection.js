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
      // Accept both SUPABASE_SERVICE_ROLE_KEY (correct JWT) and SUPABASE_SERVICE_KEY
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        || process.env.SUPABASE_SERVICE_KEY
        || '';

      if (!supabaseUrl || !supabaseKey) {
        logger.warn(
          '[DB] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in .env — ' +
          'Supabase features will be disabled. Get your service_role JWT from: ' +
          'https://supabase.com/dashboard/project/_/settings/api'
        );
        return null;
      }

      // Validate it at least looks like a JWT (three dot-separated segments)
      if (supabaseKey.split('.').length !== 3) {
        logger.error(
          '[DB] SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT. ' +
          'It must start with eyJhbGci... not sb_secret_... ' +
          'Copy the service_role key from the Supabase Settings > API page.'
        );
        return null;
      }

      this.client = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      // Test connection
      const { error } = await this.client
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) {
        logger.warn('[DB] Supabase test query failed — check RLS policies and key.', { error: error.message });
        // Non-fatal: return client anyway; individual queries will surface errors
      }

      this.connected = true;
      logger.info('Supabase connected successfully', { url: supabaseUrl });
      return this.client;

    } catch (error) {
      logger.error('[DB] Supabase connection threw unexpectedly:', { message: error.message });
      // Non-fatal: platform continues without Supabase
      return null;
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
