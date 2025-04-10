/**
 * Simple server for the static site with analytics support
 */
const express = require("express")
const path = require("path")
const fs = require("fs")
const app = express()
const PORT = process.env.PORT || 3000

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs")
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

// Serve static files
app.use(express.static(path.join(__dirname)))
app.use(express.json())

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

// Analytics data collection endpoint
app.post("/collect", (req, res) => {
  try {
    const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress

    // Process the analytics data
    const analyticsData = {
      ...req.body,
      ip: anonymizeIP(clientIP),
      userAgent: req.headers["user-agent"] || "unknown",
      referer: req.headers.referer || "direct",
      timestamp: new Date().toISOString(),
    }

    // Log to file
    const logFile = path.join(logsDir, `analytics-${new Date().toISOString().split("T")[0]}.log`)
    fs.appendFileSync(logFile, JSON.stringify(analyticsData) + "\n")

    res.status(200).json({ status: "success" })
  } catch (error) {
    console.error("Error processing analytics:", error)
    res.status(500).json({ status: "error", message: "Internal server error" })
  }
})

// Analytics pixel for no-JS users
app.get("/pixel.gif", (req, res) => {
  try {
    const clientIP = req.headers["x-forwarded-for"] || req.connection.remoteAddress

    // Create analytics data from query parameters
    const analyticsData = {
      type: "pageview",
      sessionId: req.query.sid || "noscript",
      data: {
        page: req.query.p || req.query.page || "unknown",
        referrer: req.query.ref || req.headers.referer || "direct",
        nojs: true,
      },
      ip: anonymizeIP(clientIP),
      userAgent: req.headers["user-agent"] || "unknown",
      timestamp: new Date().toISOString(),
    }

    // Log to file
    const logFile = path.join(logsDir, `analytics-${new Date().toISOString().split("T")[0]}.log`)
    fs.appendFileSync(logFile, JSON.stringify(analyticsData) + "\n")

    // Send a 1x1 transparent GIF
    const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    res.writeHead(200, {
      "Content-Type": "image/gif",
      "Content-Length": transparentGif.length,
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    })
    res.end(transparentGif)
  } catch (error) {
    console.error("Error processing pixel analytics:", error)

    // Still send the image even on error to prevent broken images
    const transparentGif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")
    res.writeHead(200, { "Content-Type": "image/gif" })
    res.end(transparentGif)
  }
})

// Fallback route to serve index.html for any unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"))
})

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Analytics logs stored in ${logsDir}`)
})

// Cleanup function to delete logs older than 90 days
function cleanupOldLogs() {
  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error("Error reading logs directory:", err)
      return
    }

    const now = new Date()
    const cutoffDate = new Date(now.setDate(now.getDate() - 90)) // 90 days retention

    files.forEach((file) => {
      if (!file.startsWith("analytics-")) return

      // Extract date from filename (format: analytics-YYYY-MM-DD.log)
      const datePart = file.replace("analytics-", "").replace(".log", "")
      const fileDate = new Date(datePart)

      if (fileDate < cutoffDate) {
        fs.unlink(path.join(logsDir, file), (err) => {
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
setTimeout(cleanupOldLogs, 5000)
