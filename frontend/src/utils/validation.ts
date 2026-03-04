export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export const validateRequired = (value: unknown, fieldName: string): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    return {
      isValid: false,
      errors: [`${fieldName} is required`],
    };
  }
  return { isValid: true, errors: [] };
};

export const validateNumber = (value: unknown, fieldName: string, min?: number, max?: number): ValidationResult => {
  const errors: string[] = [];
  
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      errors: [`${fieldName} must be a valid number`],
    };
  }
  
  if (min !== undefined && value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  
  if (max !== undefined && value > max) {
    errors.push(`${fieldName} must be at most ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateString = (value: unknown, fieldName: string, minLength?: number, maxLength?: number): ValidationResult => {
  const errors: string[] = [];
  
  if (typeof value !== 'string') {
    return {
      isValid: false,
      errors: [`${fieldName} must be a string`],
    };
  }
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push(`${fieldName} must be at least ${minLength} characters`);
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(`${fieldName} must be at most ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateIP = (value: string, fieldName: string): ValidationResult => {
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  if (!ipPattern.test(value)) {
    return {
      isValid: false,
      errors: [`${fieldName} must be a valid IP address`],
    };
  }
  
  const octets = value.split('.').map(Number);
  const invalidOctets = octets.filter(octet => octet < 0 || octet > 255);
  
  if (invalidOctets.length > 0) {
    return {
      isValid: false,
      errors: [`${fieldName} contains invalid IP address octets`],
    };
  }
  
  return { isValid: true, errors: [] };
};

export const combineValidationResults = (...results: ValidationResult[]): ValidationResult => {
  const allErrors = results.flatMap(result => result.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};