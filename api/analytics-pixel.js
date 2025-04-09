/**
 * Analytics Pixel Endpoint
 * This file handles the /api/analytics-pixel endpoint for tracking users with JavaScript disabled
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
 * Analytics Pixel Handler
 * 
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
function handleAnalyticsPixel(req, res) {
  try {
    // Get client IP address
    const clientIP = req.headers["x-forwarded-for"] || 
                    req.connection.remoteAddress || 
                    "unknown";
    
    // Anonymize IP by removing last octet
    const anonymizedIP = anonymizeIP(clientIP);
    
    // Get current timestamp
    const timestamp = new Date().toISOString();
    
    // Extract data from query parameters
    const page = req.query.page || "unknown";
    const referrer = req.headers.referer || "direct";
    const userAgent = req.headers["user-agent"] || "unknown";
    
    // Create analytics data object
    const analyticsData = {
      type: "pageview",
      timestamp: timestamp,
      sessionId: "noscript",
      data: {
        page: page,
        referrer: referrer,
        nojs: true
      },
      ip: anonymizedIP,
      userAgent: userAgent
    };
    
    // Log the analytics data
    logAnalyticsData(analyticsData);
    
    // Send a 1x1 transparent GIF
    const transparentGif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", 
      "base64"
    );
    
    // Set response headers
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": transparentGif.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    });
    
    // Send the response
    res.end(transparentGif);
  } catch (error) {
    console.error("Error processing pixel analytics:", error);
    
    // Send error response
    if (!res.headersSent) {
      res.status(500).send("Error");
    }
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
  console.log("[Analytics Pixel]", JSON.stringify(data));
  
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
module.exports = handleAnalyticsPixel;

// For Next.js API routes
export default function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).end();
  }
  
  handleAnalyticsPixel(req, res);
}
