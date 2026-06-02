import { Request, Response, NextFunction } from "express";

// Validation middleware factory
export function validateBody(schema: Record<string, (value: any) => boolean | string>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];
    
    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body[field];
      const result = validator(value);
      
      if (result !== true) {
        errors.push(result || `${field} is invalid`);
      }
    }
    
    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }
    
    next();
  };
}

// Common validators
export const validators = {
  // String validators
  nonEmptyString: (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    if (value.trim().length === 0) return 'cannot be empty';
    return true;
  },
  
  stringOfLength: (min: number, max: number) => (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    if (value.length < min) return `must be at least ${min} characters`;
    if (value.length > max) return `must be at most ${max} characters`;
    return true;
  },
  
  // Number validators
  positiveNumber: (value: any): boolean | string => {
    if (typeof value !== 'number') return 'must be a number';
    if (value <= 0) return 'must be positive';
    return true;
  },
  
  // Enum validators
  enum: (allowedValues: string[]) => (value: any): boolean | string => {
    if (!allowedValues.includes(value)) return `must be one of: ${allowedValues.join(', ')}`;
    return true;
  },
  
  // Email validator
  email: (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'must be a valid email';
    return true;
  },
  
  // URL validator
  url: (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    try {
      new URL(value);
      return true;
    } catch {
      return 'must be a valid URL';
    }
  },
  
  // UUID validator
  uuid: (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) return 'must be a valid UUID';
    return true;
  },
  
  // Safe UUID validator for route parameters (allows both UUID and simple IDs like "me", "wife")
  safeId: (value: any): boolean | string => {
    if (typeof value !== 'string') return 'must be a string';
    // Allow simple IDs like "me", "wife" or valid UUIDs
    const simpleIdRegex = /^[a-zA-Z0-9_-]+$/;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!simpleIdRegex.test(value) && !uuidRegex.test(value)) return 'must be a valid ID';
    return true;
  },
};

// Request size limiter
export function limitRequestBody(maxSize: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    
    if (contentLength > maxSize) {
      res.status(413).json({ error: 'Request entity too large' });
      return;
    }
    
    next();
  };
}

// Route parameter validation middleware
export function validateRouteParams(params: { [key: string]: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // If no specific params provided, validate all route parameters automatically
    const paramsToValidate = Object.keys(params).length > 0 ? params : req.params;
    
    for (const [paramName, validator] of Object.entries(paramsToValidate)) {
      const paramValue = req.params[paramName];
      
      if (!paramValue) {
        res.status(400).json({ error: `Missing required parameter: ${paramName}` });
        return;
      }
      
      // Handle array parameters (Express can send arrays)
      const value = Array.isArray(paramValue) ? paramValue[0] : paramValue;
      
      // Apply validation
      const validatorType = typeof validator === 'string' ? validator : 'safeId';
      
      if (validatorType === 'safeId') {
        const safeIdRegex = /^[a-zA-Z0-9_-]+$/;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!safeIdRegex.test(value) && !uuidRegex.test(value)) {
          res.status(400).json({ error: `Invalid parameter format: ${paramName}` });
          return;
        }
      } else if (validatorType === 'uuid') {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(value)) {
          res.status(400).json({ error: `Invalid UUID format: ${paramName}` });
          return;
        }
      }
    }
    
    next();
  };
}
