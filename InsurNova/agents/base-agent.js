/**
 * Base Agent Class
 * All agents extend this class for consistent interface
 */

const { createAgentLogger } = require('../shared/utils/logger');
const { AgentResponse } = require('../shared/types');

class BaseAgent {
  constructor(name) {
    this.name = name;
    this.logger = createAgentLogger(name);
    this.initialized = false;
  }

  /**
   * Initialize agent (override in subclass if needed)
   */
  async initialize() {
    this.logger.info(`${this.name} initializing...`);
    this.initialized = true;
    return true;
  }

  /**
   * Main execution method (must be implemented by subclass)
   */
  async execute(input) {
    throw new Error(`execute() method must be implemented by ${this.name}`);
  }

  /**
   * Validate input (override in subclass)
   */
  validateInput(input) {
    if (!input) {
      throw new Error('Input is required');
    }
    return true;
  }

  /**
   * Success response helper
   */
  success(data, metadata = {}) {
    this.logger.info(`${this.name} completed successfully`, { data });
    return new AgentResponse(true, data, null, {
      agent: this.name,
      ...metadata
    });
  }

  /**
   * Error response helper
   */
  error(message, error = null, metadata = {}) {
    this.logger.error(`${this.name} failed: ${message}`, { error });
    return new AgentResponse(false, null, message, {
      agent: this.name,
      originalError: error,
      ...metadata
    });
  }

  /**
   * Log execution start
   */
  logStart(input) {
    this.logger.info(`${this.name} started`, { input });
  }

  /**
   * Log execution end
   */
  logEnd(result) {
    this.logger.info(`${this.name} ended`, { 
      success: result.success,
      hasData: !!result.data
    });
  }

  /**
   * Safe execution wrapper with error handling
   */
  async safeExecute(input) {
    const startTime = Date.now();
    
    try {
      // Validate input
      this.validateInput(input);
      
      // Log start
      this.logStart(input);
      
      // Execute
      const result = await this.execute(input);
      
      // Log end
      this.logEnd(result);
      
      // Add execution time
      result.metadata.executionTime = Date.now() - startTime;
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return this.error(error.message, error, { executionTime });
    }
  }
}

module.exports = BaseAgent;
