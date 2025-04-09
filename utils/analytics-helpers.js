/**
 * Analytics Helper Functions
 * Utility functions for analytics processing
 */

/**
 * Anonymize an IP address by removing the last octet (IPv4) or last 64 bits (IPv6)
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
 * Generate a random session ID
 * 
 * @returns {string} - A random UUID v4 session ID
 */
function generateSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Remove query parameters from a URL for privacy
 * 
 * @param {string} url - The URL to clean
 * @returns {string} - The URL without query parameters
 */
function removeQueryParams(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname;
  } catch (e) {
    // If URL parsing fails, return as is
    return url;
  }
}

/**
 * Clean up old log files based on retention period
 * 
 * @param {string} logDir - Directory containing log files
 * @param {number} retentionDays - Number of days to keep logs
 */
function cleanupOldLogs(logDir, retentionDays = 90) {
  const fs = require('fs');
  const path = require('path');
  
  fs.readdir(logDir, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err);
      return;
    }

    const now = new Date();
    const cutoffDate = new Date(now.setDate(now.getDate() - retentionDays));

    files.forEach((file) => {
      if (!file.startsWith("analytics-")) return;

      // Extract date from filename
      const dateParts = file.replace("analytics-", "").replace(".log", "").split("-");
      if (dateParts.length !== 3) return;

      const fileDate = new Date(
        Number.parseInt(dateParts[0]),
        Number.parseInt(dateParts[1]) - 1,
        Number.parseInt(dateParts[2])
      );

      if (fileDate < cutoffDate) {
        fs.unlink(path.join(logDir, file), (err) => {
          if (err) {
            console.error(`Error deleting old log file ${file}:`, err);
          } else {
            console.log(`Deleted old log file: ${file}`);
          }
        });
      }
    });
  });
}

// Export the functions
module.exports = {
  anonymizeIP,
  generateSessionId,
  removeQueryParams,
  cleanupOldLogs
};

// For ES modules
export {
  anonymizeIP,
  generateSessionId,
  removeQueryParams,
  cleanupOldLogs
};
