/**
 * Error Handling Utilities
 * Custom error classes and error handling middleware
 */

class AgentError extends Error {
  constructor(agentName, message, originalError = null) {
    super(message);
    this.name = 'AgentError';
    this.agentName = agentName;
    this.originalError = originalError;
    this.timestamp = new Date();
  }
}

class ValidationError extends Error {
  constructor(message, fields = []) {
    super(message);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

class MLModelError extends Error {
  constructor(modelName, message, originalError = null) {
    super(message);
    this.name = 'MLModelError';
    this.modelName = modelName;
    this.originalError = originalError;
  }
}

class DatabaseError extends Error {
  constructor(operation, message, originalError = null) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Express error middleware
const errorMiddleware = (err, req, res, next) => {
  const { logger } = require('./logger');
  
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    type: err.name
  });

  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      fields: err.fields
    });
  }

  if (err instanceof AgentError) {
    return res.status(500).json({
      success: false,
      error: `Agent error in ${err.agentName}: ${err.message}`
    });
  }

  if (err instanceof MLModelError) {
    return res.status(500).json({
      success: false,
      error: `ML Model error in ${err.modelName}: ${err.message}`
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  AgentError,
  ValidationError,
  MLModelError,
  DatabaseError,
  asyncHandler,
  errorMiddleware
};
