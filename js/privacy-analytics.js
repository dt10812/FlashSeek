/**
 * Privacy-Focused Analytics
 * A first-party analytics solution that respects user privacy
 */

// Initialize analytics with default settings
const PrivacyAnalytics = {
  // Configuration
  config: {
    anonymizeIP: true,
    respectDoNotTrack: true,
    cookieExpiration: 30, // days
    sessionTimeout: 30, // minutes
    consentRequired: true,
  },

  // State
  state: {
    hasConsent: false,
    sessionId: null,
    lastActivity: null,
    initialized: false,
  },

  // Initialize the analytics
  init: function () {
    if (this.state.initialized) return

    // Check for existing consent
    this.state.hasConsent = this.getConsentFromCookie()

    // Check Do Not Track setting
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.log("Respecting Do Not Track setting. Analytics disabled.")
      return
    }

    // Initialize session if consent is given
    if (this.state.hasConsent) {
      this.initSession()
    }

    this.state.initialized = true

    // Add event listeners
    window.addEventListener("beforeunload", () => this.trackPageExit())
  },

  // Check if Do Not Track is enabled in the browser
  isDoNotTrackEnabled: () =>
    navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.msDoNotTrack === "1",

  // Get consent status from cookie
  getConsentFromCookie: () =>
    document.cookie.split(";").some((item) => item.trim().startsWith("analytics_consent=true")),

  // Set consent in cookie
  setConsentCookie: function (consent) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + this.config.cookieExpiration)
    document.cookie = `analytics_consent=${consent}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`
  },

  // Set user consent
  setConsent: function (consent) {
    this.state.hasConsent = consent
    this.setConsentCookie(consent)

    if (consent) {
      this.initSession()
      // Track current page immediately after consent
      this.trackPageView()
    } else {
      // Clear any existing session data
      this.clearSession()
    }

    // Update UI
    this.updateConsentUI(consent)
  },

  // Initialize or resume a session
  initSession: function () {
    // Check for existing session
    const existingSession = localStorage.getItem("analytics_session")
    const now = new Date().getTime()

    if (existingSession) {
      const session = JSON.parse(existingSession)
      // Check if session has expired
      if (now - session.lastActivity < this.config.sessionTimeout * 60 * 1000) {
        this.state.sessionId = session.id
        this.state.lastActivity = now
        localStorage.setItem(
          "analytics_session",
          JSON.stringify({
            id: this.state.sessionId,
            lastActivity: now,
          }),
        )
        return
      }
    }

    // Create new session
    this.state.sessionId = this.generateSessionId()
    this.state.lastActivity = now
    localStorage.setItem(
      "analytics_session",
      JSON.stringify({
        id: this.state.sessionId,
        lastActivity: now,
      }),
    )
  },

  // Clear session data
  clearSession: function () {
    localStorage.removeItem("analytics_session")
    this.state.sessionId = null
    this.state.lastActivity = null
  },

  // Generate a random session ID
  generateSessionId: () =>
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === "x" ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }),

  // Track a page view
  trackPageView: function () {
    if (!this.state.hasConsent || !this.state.sessionId) return

    const data = this.collectPageData()
    this.sendAnalyticsData("pageview", data)

    // Update last activity
    this.state.lastActivity = new Date().getTime()
    localStorage.setItem(
      "analytics_session",
      JSON.stringify({
        id: this.state.sessionId,
        lastActivity: this.state.lastActivity,
      }),
    )
  },

  // Track page exit
  trackPageExit: function () {
    if (!this.state.hasConsent || !this.state.sessionId) return

    const data = {
      timeOnPage: new Date().getTime() - this.state.lastActivity,
    }

    // Use sendBeacon for more reliable exit tracking
    if (navigator.sendBeacon) {
      const blob = new Blob(
        [
          JSON.stringify({
            type: "exit",
            sessionId: this.state.sessionId,
            data: data,
          }),
        ],
        { type: "application/json" },
      )

      navigator.sendBeacon("/api/analytics", blob)
    } else {
      // Fallback to sync XHR
      this.sendAnalyticsData("exit", data)
    }
  },

  // Track a custom event
  trackEvent: function (category, action, label, value) {
    if (!this.state.hasConsent || !this.state.sessionId) return

    const data = {
      category: category,
      action: action,
      label: label || "",
      value: value || "",
    }

    this.sendAnalyticsData("event", data)
  },

  // Collect basic page data
  collectPageData: function () {
    return {
      title: document.title,
      url: this.config.anonymizeIP ? this.removeQueryParams(window.location.href) : window.location.href,
      referrer: this.config.anonymizeIP ? this.removeQueryParams(document.referrer) : document.referrer,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    }
  },

  // Remove query parameters from URL for privacy
  removeQueryParams: (url) => {
    try {
      const urlObj = new URL(url)
      return urlObj.origin + urlObj.pathname
    } catch (e) {
      // If URL parsing fails, return as is
      return url
    }
  },

  // Send data to analytics endpoint
  sendAnalyticsData: function (type, data) {
    // For demonstration, we'll log to console
    // In production, this would send to your server
    console.log("Analytics:", type, data)

    // Simulate sending to server
    fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: type,
        sessionId: this.state.sessionId,
        data: data,
      }),
      // Don't wait for response
      keepalive: true,
    }).catch((err) => {
      console.error("Analytics error:", err)
    })
  },

  // Update consent UI elements
  updateConsentUI: (consent) => {
    const banner = document.getElementById("consent-banner")
    if (banner) {
      banner.style.display = consent ? "none" : "flex"
    }

    const status = document.getElementById("analytics-status")
    if (status) {
      status.textContent = consent ? "Analytics: Active" : "Analytics: Disabled"
    }
  },

  // Show the consent banner
  showConsentBanner: function () {
    if (this.state.hasConsent) return

    const banner = document.getElementById("consent-banner")
    if (banner) {
      banner.style.display = "flex"
    }
  },
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  PrivacyAnalytics.init()

  // If consent is required, show the banner
  if (PrivacyAnalytics.config.consentRequired && !PrivacyAnalytics.state.hasConsent) {
    PrivacyAnalytics.showConsentBanner()
  }

  // If consent is already given, track the page view
  if (PrivacyAnalytics.state.hasConsent) {
    PrivacyAnalytics.trackPageView()
  }

  // Set up event listeners for consent buttons
  const acceptBtn = document.getElementById("accept-analytics")
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      PrivacyAnalytics.setConsent(true)
    })
  }

  const declineBtn = document.getElementById("decline-analytics")
  if (declineBtn) {
    declineBtn.addEventListener("click", () => {
      PrivacyAnalytics.setConsent(false)
    })
  }
})

// Make available globally
window.PrivacyAnalytics = PrivacyAnalytics
