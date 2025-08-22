// Import the runtime configuration
import config from "./runtime-config"

// Export the configuration values
export const API_BASE_URL = config.apiBaseUrl
export const API_TIMEOUT = config.apiTimeout
export const API_VERSION = config.apiVersion

// Log for debugging
console.log("Using API_BASE_URL:", API_BASE_URL)

