/**
 * Simple Analytics - A lightweight, privacy-focused analytics solution
 * This script handles basic page view tracking and sends data to your analytics endpoint
 */

;(() => {
  // Configuration
  const config = {
    endpoint: "https://flashseek.netlify.app/collect",
    pixelEndpoint: "https://flashseek.netlify.app/pixel.gif",
    respectDoNotTrack: true,
    anonymizeData: true,
  }

  // Check if Do Not Track is enabled
  function isDoNotTrackEnabled() {
    return navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.msDoNotTrack === "1"
  }

  // If DNT is enabled and we're respecting it, exit early
  if (config.respectDoNotTrack && isDoNotTrackEnabled()) {
    console.log("Respecting Do Not Track setting. Analytics disabled.")
    return
  }

  // Generate a session ID
  function generateSessionId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Get or create session ID
  let sessionId = localStorage.getItem("analytics_session_id")
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem("analytics_session_id", sessionId)
  }

  // Collect basic page data
  function collectPageData() {
    const data = {
      sessionId: sessionId,
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer || "direct",
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }

    // Anonymize data if configured
    if (config.anonymizeData) {
      // Remove query parameters from URL and referrer
      data.url = data.url.split("?")[0]
      if (data.referrer && data.referrer !== "direct") {
        data.referrer = data.referrer.split("?")[0]
      }
    }

    return data
  }

  // Send data to analytics endpoint
  function sendAnalyticsData(data) {
    // Use sendBeacon if available for more reliable data sending
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
      navigator.sendBeacon(config.endpoint, blob)
    } else {
      // Fallback to fetch with keepalive
      fetch(config.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        keepalive: true,
      }).catch((err) => {
        console.error("Analytics error:", err)

        // If the POST request fails, fall back to pixel tracking
        const img = new Image()
        const params = new URLSearchParams({
          sid: data.sessionId,
          p: data.path,
          ref: data.referrer,
          t: data.timestamp,
          fallback: "true",
        })
        img.src = `${config.pixelEndpoint}?${params.toString()}`
      })
    }
  }

  // Track page view on load
  function trackPageView() {
    const data = collectPageData()
    sendAnalyticsData(data)
  }

  // Track page exit
  function trackPageExit() {
    const data = collectPageData()
    data.event = "exit"
    data.timeOnPage = Math.round((new Date() - new Date(data.timestamp)) / 1000)

    // Use sendBeacon for exit tracking
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" })
      navigator.sendBeacon(config.endpoint, blob)
    }
  }

  // Track events (can be called from other scripts)
  window.trackEvent = (category, action, label, value) => {
    const data = collectPageData()
    data.event = "custom"
    data.category = category
    data.action = action
    data.label = label || ""
    data.value = value || ""

    sendAnalyticsData(data)
  }

  // Set up event listeners
  document.addEventListener("DOMContentLoaded", trackPageView)
  window.addEventListener("beforeunload", trackPageExit)

  // Track search form submissions
  const searchForm = document.getElementById("search-form")
  if (searchForm) {
    searchForm.addEventListener("submit", () => {
      const searchInput = document.getElementById("search-input")
      if (searchInput && searchInput.value.trim()) {
        window.trackEvent("search", "query", searchInput.value.trim())
      }
    })
  }
})()
