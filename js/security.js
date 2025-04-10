/**
 * Security utilities for the FlashSeek website
 * Includes CSRF protection and security headers
 */

;(() => {
  // Generate a CSRF token
  function generateCSRFToken() {
    const array = new Uint8Array(16)
    window.crypto.getRandomValues(array)
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
  }

  // Set a CSRF token if one doesn't exist
  function ensureCSRFToken() {
    let token = localStorage.getItem("csrf_token")
    if (!token) {
      token = generateCSRFToken()
      localStorage.setItem("csrf_token", token)
    }
    return token
  }

  // Add CSRF token to forms
  function addCSRFToForms() {
    const token = ensureCSRFToken()
    const forms = document.querySelectorAll("form")

    forms.forEach((form) => {
      // Skip forms that already have a CSRF token
      if (form.querySelector('input[name="csrf_token"]')) {
        return
      }

      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "csrf_token"
      input.value = token
      form.appendChild(input)
    })
  }

  // Add CSRF token to AJAX requests
  const originalFetch = window.fetch
  window.fetch = function (url, options = {}) {
    // Only add CSRF token to same-origin POST requests
    if (options.method && options.method.toUpperCase() === "POST" && isSameOrigin(url)) {
      const token = ensureCSRFToken()
      options.headers = options.headers || {}
      options.headers["X-CSRF-Token"] = token
    }
    return originalFetch.call(this, url, options)
  }

  // Check if URL is same origin
  function isSameOrigin(url) {
    try {
      const urlObj = new URL(url, window.location.origin)
      return urlObj.origin === window.location.origin
    } catch (e) {
      // If URL parsing fails, assume it's a relative URL (same origin)
      return true
    }
  }

  // Initialize security features
  function init() {
    addCSRFToForms()

    // Add event listener to handle dynamically added forms
    document.addEventListener("DOMNodeInserted", (e) => {
      if (e.target.nodeName === "FORM") {
        addCSRFToForms()
      }
    })
  }

  // Run initialization when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init)
  } else {
    init()
  }
})()
