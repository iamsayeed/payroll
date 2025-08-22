// This file provides a runtime configuration approach
// It can be useful when environment variables aren't working as expected

// Default configuration
const config = {
    apiBaseUrl: "http://localhost:8000/api/v1", // Default
    apiTimeout: 30000,
    apiVersion: "v1",
};

// Override with environment variable if available
if (import.meta.env.VITE_API_BASE_URL) {
    config.apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
}

export default config;

  
  