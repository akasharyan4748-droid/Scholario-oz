/**
 * SCHOLARIO-OS — Enterprise Centralized Validation Layer
 * Type-safe input schema definitions and validators for forms, APIs, and business rules.
 */

export const ValidationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phoneIndian: /^[6-9]\d{9}$/,
  aadhaar: /^\d{12}$/,
  pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  rollNumber: /^[a-zA-Z0-9-]{3,15}$/,
  pincodeIndian: /^\d{6}$/,
};

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const Validators = {
  isValidEmail(email: string): ValidationResult {
    if (!email || !email.trim()) return { isValid: false, error: 'Email address is required' };
    if (!ValidationPatterns.email.test(email.trim())) return { isValid: false, error: 'Invalid email format' };
    return { isValid: true };
  },

  isValidPhone(phone: string): ValidationResult {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return { isValid: false, error: 'Mobile number is required' };
    if (!ValidationPatterns.phoneIndian.test(cleaned)) return { isValid: false, error: 'Enter a valid 10-digit mobile number' };
    return { isValid: true };
  },

  isValidAadhaar(aadhaar: string): ValidationResult {
    const cleaned = aadhaar.replace(/\D/g, '');
    if (!cleaned) return { isValid: true }; // Optional field check
    if (!ValidationPatterns.aadhaar.test(cleaned)) return { isValid: false, error: 'Aadhaar must be a 12-digit number' };
    return { isValid: true };
  },

  isValidPAN(pan: string): ValidationResult {
    const cleaned = pan.trim().toUpperCase();
    if (!cleaned) return { isValid: true };
    if (!ValidationPatterns.pan.test(cleaned)) return { isValid: false, error: 'Invalid PAN card format (e.g. ABCDE1234F)' };
    return { isValid: true };
  },

  isRequired(value: unknown, fieldName: string): ValidationResult {
    if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  },
};
