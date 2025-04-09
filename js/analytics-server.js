/**
 * Server-side analytics processing
 * This would be implemented in your backend
 *
 * Example implementation for Node.js/Express
 */

const express = require("express")
const router = express.Router()
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")

// Configuration
const config = {
  logDirectory: path.join(__dirname, "../logs/analytics"),
  anonymizeIP: true,
  retentionPeriod: 90, // days
}

// Ensure log directory exists
if (!fs.existsSync(config.logDirectory)) {
  fs.mkdirSync(config.logDirectory, { recursive: true })
}

// Anonymize IP address by removing last octet
function anonymizeIP(ip) {
  if (!ip) return "unknown"

  // Handle IPv4
  if (ip.includes(".")) {
    return ip.split(".").slice(0, 3).join(".") + ".0"
  }

  // Handle IPv6
  if (ip.includes(":")) {
    return ip.split(":").slice(0, 4).join(":") + ":0000:0000:0000:0000"
  }

  return "unknown"
}

// Generate a daily log filename
function getLogFilename() {
  const date = new Date()
  return `analytics-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.log`
}

// Log analytics data
function logAnalyticsData(data) {
  const logFile = path.join(config.logDirectory, getLogFilename())
  const timestamp = new Date().toISOString()

  // Add timestamp to data
  data.timestamp = timestamp

  // Write to log file
  fs.appendFile(logFile, JSON.stringify(data) + "\n", (err) => {
    if (err) {
      console.error("Error writing to analytics log:", err)
    }
  })
}

// Clean up old logs based on retention period
function cleanupOldLogs() {
  fs.readdir(config.logDirectory, (err, files) => {
    if (err) {
      console.error("Error reading log directory:", err)
      return
    }

    const now = new Date()
    const cutoffDate = new Date(now.setDate(now.getDate() - config.retentionPeriod))

    files.forEach((file) => {
      if (!file.startsWith("analytics-")) return

      // Extract date from filename
      const dateParts = file.replace("analytics-", "").replace(".log", "").split("-")
      if (dateParts.length !== 3) return

      const fileDate = new Date(
        Number.parseInt(dateParts[0]),
        Number.parseInt(dateParts[1]) - 1,
        Number.parseInt(dateParts[2]),
      )

      if (fileDate < cutoffDate) {
        fs.unlink(path.join(config.logDirectory, file), (err) => {
          if (err) {
            console.error(`Error deleting old log file ${file}:`, err)
          } else {
            console.log(`Deleted old log file: ${file}`)
          }
        })
      }
    })
  })
}

// Run cleanup daily
setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000)
// Also run on startup
cleanupOldLogs()

// API endpoint for analytics
router.post("/analytics", (req, res) => {
  try {
    const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress

    // Process the analytics data
    const analyticsData = {
      ...req.body,
      ip: config.anonymizeIP ? anonymizeIP(clientIP) : clientIP,
      userAgent: req.headers["user-agent"] || "unknown",
      referer: req.headers.referer || "direct",
    }

    // Log the data
    logAnalyticsData(analyticsData)

    // Send success response
    res.status(200).send({ status: "success" })
  } catch (error) {
    console.error("Error processing analytics:", error)
    res.status(500).send({ status: "error", message: "Internal server error" })
  }
})

// Fallback pixel endpoint for browsers with JavaScript disabled
router.get("/analytics-pixel", (req, res) => {
  try {
    const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress

    // Process the analytics data from query parameters
    const analyticsData = {
      type: "pageview",
      sessionId: "noscript",
      data: {
        url: req.query.page || "unknown",
        referrer: req.headers.referer || "direct",
        nojs: true,
      },
      ip: config.anonymizeIP ? anonymizeIP(clientIP) : clientIP,
      userAgent: req.headers["user-agent"] || "unknown",
    }

    // Log the data
    logAnalyticsData(analyticsData)

    // Send a 1x1 transparent GIF
    const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": transparentGif.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    })
    res.end(transparentGif)
  } catch (error) {
    console.error("Error processing pixel analytics:", error)
    res.status(500).send("Error")
  }
})

module.exports = router
