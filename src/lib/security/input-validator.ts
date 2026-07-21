type ValidationType =
  | "string"
  | "number"
  | "boolean"
  | "email"
  | "phone"
  | "url"
  | "id"
  | "date"
  | "enum"
  | "array"
  | "object";

interface ValidationRule {
  type: ValidationType;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: readonly (string | number)[];
  custom?: (value: any) => boolean | string;
  each?: ValidationRule;
  keys?: Record<string, ValidationRule>;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  sanitized: any;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FETCH|DECLARE|TRUNCATE)\b)/i,
  /(-{2})|(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i,
  /(\/\*)|(\*\/)|(;)/,
  /(union\s+select|drop\s+table|;\s*delete|;\s*update|--\s*$)/i,
  /\b(0x[0-9a-f]+)\b/i,
  /\b(WAITFOR\s+DELAY)\b/i,
  /\b(BENCHMARK\s*\()/i,
  /\b(SLEEP\s*\()/i,
];

const XSS_PATTERNS = [
  /<script[\s>]/i,
  /javascript\s*:/i,
  /on\w+\s*=\s*["']/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<form[\s>]/i,
  /expression\s*\(/i,
  /data\s*:\s*text\/html/i,
  /vbscript\s*:/i,
  /<link[\s>]/i,
  /<meta[\s>]/i,
];

const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$]/,
  /\$\(/,
  /\b(exec|system|eval|passthru|shell_exec|popen|proc_open)\b/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//,
  /\.\.\\/,
  /\.\.%2[fF]/,
  /%2[eE]%2[eE]/,
  /\.\.%00/,
  /\.\.%c0%af/i,
  /\.\.%c1%9c/i,
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const ID_REGEX = /^[a-zA-Z0-9_-]{1,50}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

function checkPatterns(value: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(value));
}

function sanitizeString(value: string, maxLength: number = 500): string {
  let sanitized = value.trim().substring(0, maxLength);
  sanitized = sanitized.replace(/[<>"'&]/g, (match) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "&": "&amp;",
    };
    return entities[match] || match;
  });
  return sanitized;
}

function validateSingle(
  value: any,
  rule: ValidationRule,
  fieldPath: string
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null || value === "") {
    if (rule.required) {
      errors.push({
        field: fieldPath,
        message: `${fieldPath} is required`,
        code: "REQUIRED",
      });
    }
    return errors;
  }

  if (checkPatterns(String(value), SQL_INJECTION_PATTERNS)) {
    errors.push({
      field: fieldPath,
      message: "Potentially malicious input detected",
      code: "SQL_INJECTION",
    });
    return errors;
  }

  if (checkPatterns(String(value), XSS_PATTERNS)) {
    errors.push({
      field: fieldPath,
      message: "Potentially malicious content detected",
      code: "XSS_DETECTED",
    });
    return errors;
  }

  if (checkPatterns(String(value), COMMAND_INJECTION_PATTERNS)) {
    errors.push({
      field: fieldPath,
      message: "Potentially dangerous command detected",
      code: "COMMAND_INJECTION",
    });
    return errors;
  }

  if (checkPatterns(String(value), PATH_TRAVERSAL_PATTERNS)) {
    errors.push({
      field: fieldPath,
      message: "Path traversal attempt detected",
      code: "PATH_TRAVERSAL",
    });
    return errors;
  }

  switch (rule.type) {
    case "string": {
      const str = String(value);
      if (rule.minLength && str.length < rule.minLength) {
        errors.push({
          field: fieldPath,
          message: `Minimum length is ${rule.minLength}`,
          code: "MIN_LENGTH",
        });
      }
      if (rule.maxLength && str.length > rule.maxLength) {
        errors.push({
          field: fieldPath,
          message: `Maximum length is ${rule.maxLength}`,
          code: "MAX_LENGTH",
        });
      }
      if (rule.pattern && !rule.pattern.test(str)) {
        errors.push({
          field: fieldPath,
          message: "Invalid format",
          code: "PATTERN",
        });
      }
      break;
    }

    case "number": {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({
          field: fieldPath,
          message: "Must be a number",
          code: "INVALID_NUMBER",
        });
      } else {
        if (rule.min !== undefined && num < rule.min) {
          errors.push({
            field: fieldPath,
            message: `Minimum value is ${rule.min}`,
            code: "MIN_VALUE",
          });
        }
        if (rule.max !== undefined && num > rule.max) {
          errors.push({
            field: fieldPath,
            message: `Maximum value is ${rule.max}`,
            code: "MAX_VALUE",
          });
        }
      }
      break;
    }

    case "boolean": {
      const boolVal = value === true || value === "true" || value === "1";
      if (typeof value !== "boolean" && !["true", "false", "0", "1"].includes(String(value))) {
        errors.push({
          field: fieldPath,
          message: "Must be a boolean",
          code: "INVALID_BOOLEAN",
        });
      }
      break;
    }

    case "email": {
      const emailStr = String(value).toLowerCase().trim();
      if (!EMAIL_REGEX.test(emailStr) || emailStr.length > 254) {
        errors.push({
          field: fieldPath,
          message: "Invalid email address",
          code: "INVALID_EMAIL",
        });
      }
      break;
    }

    case "phone": {
      const phoneStr = String(value).trim();
      if (!PHONE_REGEX.test(phoneStr)) {
        errors.push({
          field: fieldPath,
          message: "Invalid phone number",
          code: "INVALID_PHONE",
        });
      }
      break;
    }

    case "url": {
      const urlStr = String(value).trim();
      try {
        const parsed = new URL(urlStr);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          errors.push({
            field: fieldPath,
            message: "Only HTTP/HTTPS URLs allowed",
            code: "INVALID_URL_PROTOCOL",
          });
        }
      } catch {
        errors.push({
          field: fieldPath,
          message: "Invalid URL",
          code: "INVALID_URL",
        });
      }
      break;
    }

    case "id": {
      const idStr = String(value);
      if (!ID_REGEX.test(idStr)) {
        errors.push({
          field: fieldPath,
          message: "Invalid ID format",
          code: "INVALID_ID",
        });
      }
      break;
    }

    case "date": {
      const dateStr = String(value);
      if (!DATE_REGEX.test(dateStr) || isNaN(Date.parse(dateStr))) {
        errors.push({
          field: fieldPath,
          message: "Invalid date format",
          code: "INVALID_DATE",
        });
      }
      break;
    }

    case "enum": {
      if (rule.enum && !rule.enum.includes(value)) {
        errors.push({
          field: fieldPath,
          message: `Must be one of: ${rule.enum.join(", ")}`,
          code: "INVALID_ENUM",
        });
      }
      break;
    }

    case "array": {
      if (!Array.isArray(value)) {
        errors.push({
          field: fieldPath,
          message: "Must be an array",
          code: "INVALID_ARRAY",
        });
      } else if (rule.each) {
        value.forEach((item, i) => {
          errors.push(...validateSingle(item, rule.each!, `${fieldPath}[${i}]`));
        });
      }
      break;
    }

    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push({
          field: fieldPath,
          message: "Must be an object",
          code: "INVALID_OBJECT",
        });
      } else if (rule.keys) {
        for (const [key, subRule] of Object.entries(rule.keys)) {
          errors.push(...validateSingle(value[key], subRule, `${fieldPath}.${key}`));
        }
      }
      break;
    }
  }

  if (rule.custom) {
    const result = rule.custom(value);
    if (typeof result === "string") {
      errors.push({
        field: fieldPath,
        message: result,
        code: "CUSTOM_VALIDATION",
      });
    } else if (!result) {
      errors.push({
        field: fieldPath,
        message: "Validation failed",
        code: "CUSTOM_VALIDATION",
      });
    }
  }

  return errors;
}

export function validate(
  data: Record<string, any>,
  schema: Record<string, ValidationRule>
): ValidationResult {
  const errors: ValidationError[] = [];
  const sanitized: Record<string, any> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = data[field];
    errors.push(...validateSingle(value, rule, field));

    if (value !== undefined && value !== null && typeof value === "string") {
      const maxLen = rule.maxLength || 5000;
      sanitized[field] = sanitizeString(String(value), maxLen);
    } else {
      sanitized[field] = value;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized,
  };
}

export function validateBody(
  body: any,
  schema: Record<string, ValidationRule>
): { valid: boolean; error?: string; sanitized?: any } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Invalid request body" };
  }

  const result = validate(body, schema);
  if (!result.valid) {
    return {
      valid: false,
      error: result.errors.map((e) => e.message).join("; "),
    };
  }

  return { valid: true, sanitized: result.sanitized };
}

export function sanitizeInput(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  trimWhitespace?: boolean;
} = {}): string {
  const { maxLength = 5000, allowHtml = false, trimWhitespace = true } = options;

  let result = input;
  if (trimWhitespace) result = result.trim();
  result = result.substring(0, maxLength);

  if (!allowHtml) {
    result = result.replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entities[match] || match;
    });
  }

  return result;
}

export function detectThreats(input: string): {
  safe: boolean;
  threats: string[];
} {
  const threats: string[] = [];

  if (checkPatterns(input, SQL_INJECTION_PATTERNS)) threats.push("SQL_INJECTION");
  if (checkPatterns(input, XSS_PATTERNS)) threats.push("XSS");
  if (checkPatterns(input, COMMAND_INJECTION_PATTERNS)) threats.push("COMMAND_INJECTION");
  if (checkPatterns(input, PATH_TRAVERSAL_PATTERNS)) threats.push("PATH_TRAVERSAL");

  return {
    safe: threats.length === 0,
    threats,
  };
}

export function validateFileUpload(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  const MAX_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ];
  const BLOCKED_EXTENSIONS = [
    ".exe", ".bat", ".cmd", ".com", ".msi", ".scr", ".pif",
    ".js", ".vbs", ".wsf", ".ps1", ".psm1",
    ".php", ".phtml", ".php3", ".php4", ".php5",
    ".sh", ".bash", ".csh", ".ksh",
    ".jar", ".class", ".war",
    ".dll", ".sys", ".ocx",
  ];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "File size exceeds 5MB limit" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }

  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: "File extension not allowed" };
  }

  if (checkPatterns(file.name, PATH_TRAVERSAL_PATTERNS)) {
    return { valid: false, error: "Invalid file name" };
  }

  return { valid: true };
}

export function createValidator(schema: Record<string, ValidationRule>) {
  return (data: Record<string, any>) => validate(data, schema);
}

export const CommonSchemas = {
  shop: {
    name: { type: "string" as const, required: true, minLength: 2, maxLength: 100 },
    phone: { type: "phone" as const, required: true },
    whatsapp: { type: "phone" as const, required: true },
    address: { type: "string" as const, required: true, minLength: 5, maxLength: 500 },
    location: { type: "string" as const, required: false, maxLength: 200 },
  },
  portfolio: {
    name: { type: "string" as const, required: true, minLength: 1, maxLength: 100 },
    karat: { type: "number" as const, required: true, min: 1, max: 24 },
    weight: { type: "number" as const, required: true, min: 0.01, max: 10000 },
    buyPrice: { type: "number" as const, required: true, min: 0, max: 10000000 },
    buyDate: { type: "date" as const, required: true },
    notes: { type: "string" as const, required: false, maxLength: 500 },
  },
  alert: {
    karat: { type: "enum" as const, required: true, enum: ["24", "21", "18", "pound"] as const },
    targetPrice: { type: "number" as const, required: true, min: 0, max: 10000000 },
    condition: { type: "enum" as const, required: true, enum: ["above", "below"] as const },
  },
  email: {
    email: { type: "email" as const, required: true },
  },
};
