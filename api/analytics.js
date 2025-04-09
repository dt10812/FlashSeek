/**
 * Analytics API Endpoint
 * This file handles the /api/analytics endpoint for tracking user activity
 * 
 * Usage: Place in your server's API routes directory
 * - For Node.js/Express: Use as a route handler
 * - For Next.js: Place in /pages/api/ directory
 */

// Import required modules (uncomment based on your environment)
// const fs = require('fs');
// const path = require('path');
// const { anonymizeIP } = require('../utils/analytics-helpers');

/**
 * Analytics API Handler
 * 
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
function handleAnalytics(req, res) {
  try {
    // Get client IP address
    const clientIP = req.headers["x-forwarded-for"] || 
                    req.connection.remoteAddress || 
                    "unknown";
    
    // Anonymize IP by removing last octet
    const anonymizedIP = anonymizeIP(clientIP);
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Extract data from request body
    const { type, sessionId, data } = req.body;
    
    // Create analytics data object
    const analyticsData = {
      type: type || "unknown",
      timestamp: timestamp,
      sessionId: sessionId || "unknown",
      data: data || {},
      ip: anonymizedIP,
      userAgent: req.headers["user-agent"] || "unknown",
      referrer: req.headers.referer || "direct"
    };
    
    // Log the analytics data
    logAnalyticsData(analyticsData);
    
    // Send success response
    res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Error processing analytics:", error);
    
    // Send error response
    res.status(500).json({ 
      status: "error", 
      message: "Internal server error" 
    });
  }
}

/**
 * Helper function to anonymize IP addresses
 * 
 * @param {string} ip - The IP address to anonymize
 * @returns {string} - The anonymized IP address
 */
function anonymizeIP(ip) {
  if (!ip || ip === "unknown") return "unknown";
  
  // Handle IPv4
  if (ip.includes(".")) {
    return ip.split(".").slice(0, 3).join(".") + ".0";
  }
  
  // Handle IPv6
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + ":0000:0000:0000:0000";
  }
  
  return "unknown";
}

/**
 * Helper function to log analytics data
 * 
 * @param {Object} data - The analytics data to log
 */
function logAnalyticsData(data) {
  // In a production environment, you would write to a database or file
  // For this example, we'll just log to console
  console.log("[Analytics]", JSON.stringify(data));
  
  // Example file logging implementation (uncomment to use)
  /*
  const logDir = path.join(process.cwd(), 'logs');
  const today = new Date();
  const logFile = path.join(
    logDir, 
    `analytics-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.log`
  );
  
  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Append to log file
  fs.appendFile(
    logFile, 
    JSON.stringify(data) + '\n', 
    (err) => {
      if (err) {
        console.error('Error writing to analytics log:', err);
      }
    }
  );
  */
}

// Export for different environments
// For Express.js
module.exports = handleAnalytics;

// For Next.js API routes
export default function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  handleAnalytics(req, res);
}
