// Security utility functions

/**
 * Obfuscates sensitive data like API keys before sending to client
 * @param data The data to obfuscate
 * @returns Obfuscated data
 */
export function obfuscateSensitiveData(data: any): any {
  if (!data) return data

  // Create a deep copy to avoid modifying the original
  const obfuscated = JSON.parse(JSON.stringify(data))

  // Recursively process the object
  const processObject = (obj: any) => {
    if (!obj || typeof obj !== "object") return

    for (const key in obj) {
      // Check for sensitive key names
      if (
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("password")
      ) {
        if (typeof obj[key] === "string" && obj[key].length > 8) {
          // Show only first and last 4 characters
          const value = obj[key]
          obj[key] = `${value.substring(0, 4)}****${value.substring(value.length - 4)}`
        }
      } else if (typeof obj[key] === "object") {
        // Recursively process nested objects
        processObject(obj[key])
      }
    }
  }

  processObject(obfuscated)
  return obfuscated
}

/**
 * Generates a client-side security script to prevent developer tools and debugging
 * @returns JavaScript code as a string
 */
export function generateSecurityScript(): string {
  return `
    // Anti-debugging techniques
    (function() {
      // Detect and prevent DevTools
      const devtools = {
        isOpen: false,
        orientation: undefined
      };
      
      // Function to check if DevTools is open
      const checkDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (
          !(heightThreshold && widthThreshold) &&
          ((window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) ||
            widthThreshold ||
            heightThreshold)
        ) {
          if (!devtools.isOpen) {
            devtools.isOpen = true;
            takeSecurityAction();
          }
        } else {
          if (devtools.isOpen) {
            devtools.isOpen = false;
          }
        }
      };
      
      // Check on interval
      setInterval(checkDevTools, 1000);
      
      // Detect right-click
      document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
      });
      
      // Detect keyboard shortcuts for developer tools
      document.addEventListener('keydown', function(e) {
        // Check for F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
        if (
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
        ) {
          e.preventDefault();
          takeSecurityAction();
          return false;
        }
        
        // Check for Ctrl+S (save page)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
          e.preventDefault();
          return false;
        }
        
        // Check for view source Ctrl+U
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
          e.preventDefault();
          return false;
        }
      });
      
      // Function to take action when security is breached
      function takeSecurityAction() {
        // Clear sensitive data from localStorage and sessionStorage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
        
        // Redirect to homepage or show warning
        if (window.location.pathname.includes('/dashboard') || 
            window.location.pathname.includes('/admin')) {
          window.location.href = '/security-violation';
        }
      }
      
      // Detect debugger statements
      const originalSetTimeout = window.setTimeout;
      window.setTimeout = function() {
        const stack = new Error().stack || '';
        if (stack.includes('debugger')) {
          takeSecurityAction();
          return 1;
        }
        return originalSetTimeout.apply(this, arguments);
      };
      
      // Detect console opening
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;
      const originalConsoleInfo = console.info;
      
      console.log = function() {
        const stack = new Error().stack || '';
        if (stack.includes('devtools')) {
          takeSecurityAction();
          return;
        }
        return originalConsoleLog.apply(this, arguments);
      };
      
      console.error = function() {
        const stack = new Error().stack || '';
        if (stack.includes('devtools')) {
          takeSecurityAction();
          return;
        }
        return originalConsoleError.apply(this, arguments);
      };
      
      console.warn = function() {
        const stack = new Error().stack || '';
        if (stack.includes('devtools')) {
          takeSecurityAction();
          return;
        }
        return originalConsoleWarn.apply(this, arguments);
      };
      
      console.info = function() {
        const stack = new Error().stack || '';
        if (stack.includes('devtools')) {
          takeSecurityAction();
          return;
        }
        return originalConsoleInfo.apply(this, arguments);
      };
      
      // Prevent view source
      document.onkeydown = function(e) {
        if (e.ctrlKey && 
            (e.key === 'u' || e.key === 'U' || 
             e.key === 's' || e.key === 'S' || 
             e.key === 'p' || e.key === 'P')) {
          return false;
        }
      };
    })();
  `
}

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The user input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return input

  // Replace potentially dangerous characters
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .replace(/\\/g, "&#x5C;")
    .replace(/`/g, "&#96;")
}

/**
 * Validates and sanitizes search queries
 * @param type The type of search
 * @param query The search query
 * @returns Sanitized query or null if invalid
 */
export function validateSearchQuery(type: string, query: string): string | null {
  if (!query || !type) return null

  // Sanitize the input
  const sanitizedQuery = sanitizeInput(query.trim())

  // Validate based on type
  switch (type.toLowerCase()) {
    case "email":
      // Basic email validation
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedQuery) ? sanitizedQuery : null

    case "domain":
      // Basic domain validation
      return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(sanitizedQuery) ? sanitizedQuery : null

    case "ip":
      // Basic IP validation (IPv4)
      return /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        sanitizedQuery,
      )
        ? sanitizedQuery
        : null

    case "phone":
      // Basic phone validation (remove non-digits and validate)
      const digitsOnly = sanitizedQuery.replace(/\D/g, "")
      return digitsOnly.length >= 7 ? digitsOnly : null

    case "username":
      // Username validation (alphanumeric, underscore, dash, 3-30 chars)
      return /^[a-zA-Z0-9_-]{3,30}$/.test(sanitizedQuery) ? sanitizedQuery : null

    default:
      return sanitizedQuery
  }
}

// Add the missing rateLimit function
/**
 * Simple rate limiting function to prevent abuse
 * @param identifier Unique identifier for the rate limit (e.g., IP address, user ID)
 * @param maxRequests Maximum number of requests allowed in the time window
 * @param timeWindow Time window in milliseconds
 * @returns Object with isRateLimited flag and resetTime
 */
export function rateLimit(
  identifier: string,
  maxRequests = 10,
  timeWindow = 60000,
): { isRateLimited: boolean; resetTime: Date; remainingRequests: number } {
  // Use a Map to store rate limit data in memory
  // In a production environment, you might want to use Redis or another persistent store
  const rateLimitMap = new Map<string, { count: number; resetTime: Date }>()

  // Get current time
  const now = new Date()

  // Check if identifier exists in the map
  if (rateLimitMap.has(identifier)) {
    const limitData = rateLimitMap.get(identifier)!

    // Check if the time window has passed
    if (now > limitData.resetTime) {
      // Reset the counter
      rateLimitMap.set(identifier, {
        count: 1,
        resetTime: new Date(now.getTime() + timeWindow),
      })
      return {
        isRateLimited: false,
        resetTime: new Date(now.getTime() + timeWindow),
        remainingRequests: maxRequests - 1,
      }
    }

    // Check if the request count exceeds the limit
    if (limitData.count >= maxRequests) {
      return {
        isRateLimited: true,
        resetTime: limitData.resetTime,
        remainingRequests: 0,
      }
    }

    // Increment the counter
    limitData.count++
    rateLimitMap.set(identifier, limitData)
    return {
      isRateLimited: false,
      resetTime: limitData.resetTime,
      remainingRequests: maxRequests - limitData.count,
    }
  } else {
    // First request from this identifier
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: new Date(now.getTime() + timeWindow),
    })
    return {
      isRateLimited: false,
      resetTime: new Date(now.getTime() + timeWindow),
      remainingRequests: maxRequests - 1,
    }
  }
}
