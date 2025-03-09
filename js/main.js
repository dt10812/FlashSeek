document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const searchForm = document.getElementById("search-form")
  const searchInput = document.getElementById("search-input")
  const searchButton = document.getElementById("search-button")
  const voiceSearchButton = document.getElementById("voice-search")
  const clearSearchBtn = document.getElementById("clear-search")
  const searchSuggestions = document.getElementById("search-suggestions")
  const searchResults = document.getElementById("search-results")
  const searchStats = document.getElementById("search-stats")
  const resultCount = document.getElementById("result-count")
  const searchTime = document.getElementById("search-time")
  const pagination = document.getElementById("pagination")
  const prevPageBtn = document.getElementById("prev-page")
  const nextPageBtn = document.getElementById("next-page")
  const pageNumbers = document.getElementById("page-numbers")
  const historyToggle = document.getElementById("history-toggle")
  const historyPanel = document.getElementById("search-history-panel")
  const historyList = document.getElementById("history-list")
  const clearHistoryBtn = document.getElementById("clear-history")
  const themeToggleBtn = document.getElementById("theme-toggle-btn")
  const moonIcon = document.getElementById("moon-icon")
  const sunIcon = document.getElementById("sun-icon")
  const filterBtns = document.querySelectorAll(".filter-btn")
  const trendingTags = document.querySelectorAll(".trending-tag")
  const loadingIndicator = document.getElementById("loading-indicator")

  // Declare CryptoJS to avoid undefined errors
  let CryptoJS

  // Add a fallback for CryptoJS if it's not available
  if (typeof CryptoJS === "undefined") {
    console.warn("CryptoJS is not available, encryption functions will not work properly")
    CryptoJS = {
      AES: {
        encrypt: (data, key) => ({ toString: () => btoa(data) }),
        decrypt: (data, key) => ({ toString: (format) => atob(data) }),
      },
      SHA256: (data) => ({ toString: () => data }),
    }
  }

  // User authentication and data management functions
  function isUserLoggedIn() {
    return getCookie("flashseek_user_data") !== ""
  }

  function getUserData() {
    const userData = window.getUserData ? window.getUserData() : null
    return userData || { username: "Guest", searchHistory: [] }
  }

  function logoutUser() {
    if (window.logoutUser) {
      window.logoutUser()
    } else {
      deleteCookie("flashseek_user_data")
    }
  }

  function updateSearchHistory(query) {
    if (window.updateSearchHistory) {
      window.updateSearchHistory(query)
    } else {
      const userData = getUserData()
      const timestamp = new Date().toISOString()
      userData.searchHistory = userData.searchHistory || []
      userData.searchHistory.push({ query: query, timestamp: timestamp })
      saveUserData(userData.username, "", userData.searchHistory)
    }
  }

  function saveUserData(username, password, searchHistory) {
    if (window.saveUserData) {
      window.saveUserData(username, password, searchHistory)
    } else {
      // Fallback if cookie-utils.js is not loaded
      const userData = {
        username: username,
        searchHistory: searchHistory,
      }
      localStorage.setItem("userData", JSON.stringify(userData))
    }
  }

  function clearSearchHistory() {
    if (window.clearSearchHistory) {
      window.clearSearchHistory()
    } else {
      const userData = getUserData()
      userData.searchHistory = []
      saveUserData(userData.username, "", userData.searchHistory)
    }
  }

  // Cookie utility functions (fallbacks if cookie-utils.js is not loaded)
  function setCookie(name, value, days = 30) {
    if (window.setCookie) {
      window.setCookie(name, value, days)
    } else {
      const date = new Date()
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
      const expires = "expires=" + date.toUTCString()
      document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Strict"
    }
  }

  function getCookie(name) {
    if (window.getCookie) {
      return window.getCookie(name)
    } else {
      const cookieName = name + "="
      const decodedCookie = decodeURIComponent(document.cookie)
      const cookieArray = decodedCookie.split(";")

      for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i]
        while (cookie.charAt(0) === " ") {
          cookie = cookie.substring(1)
        }
        if (cookie.indexOf(cookieName) === 0) {
          return cookie.substring(cookieName.length, cookie.length)
        }
      }
      return ""
    }
  }

  function deleteCookie(name) {
    if (window.deleteCookie) {
      window.deleteCookie(name)
    } else {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;"
    }
  }

  // Check if user is logged in
  const isLoggedIn = isUserLoggedIn()

  // Add user info to the UI if logged in
  if (isLoggedIn && document.getElementById("user-info")) {
    const userData = getUserData()
    document.getElementById("user-info").textContent = userData.username
    document.getElementById("user-section").classList.remove("hidden")
    document.getElementById("login-section").classList.add("hidden")
  }

  // State
  let currentQuery = ""
  let currentPage = 1
  const resultsPerPage = 10
  let currentResults = []
  let currentFilter = "all"
  let searchHistory = isLoggedIn ? getUserData().searchHistory : []
  let isDarkMode = localStorage.getItem("darkMode") === "true"

  // Initialize
  init()

  // Functions
  function init() {
    console.log("Initializing search functionality")

    // Set up event listeners
    if (searchForm) {
      searchForm.addEventListener("submit", handleSearch)
      console.log("Search form event listener attached")
    }

    if (searchInput) {
      searchInput.addEventListener("input", handleInput)
      searchInput.addEventListener("focus", showSuggestions)
      searchInput.addEventListener("blur", () => {
        // Delay hiding suggestions to allow for clicks
        setTimeout(() => {
          if (searchSuggestions) {
            searchSuggestions.classList.remove("active")
          }
        }, 200)
      })
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener("click", clearSearch)
    }

    if (prevPageBtn) {
      prevPageBtn.addEventListener("click", () => changePage(currentPage - 1))
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener("click", () => changePage(currentPage + 1))
    }

    if (historyToggle) {
      historyToggle.addEventListener("click", toggleHistoryPanel)
    }

    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", clearHistory)
    }

    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", toggleTheme)
    }

    if (voiceSearchButton) {
      voiceSearchButton.addEventListener("click", startVoiceSearch)
    }

    // Add a fallback for webkitSpeechRecognition if it's not available
    if (typeof webkitSpeechRecognition === "undefined") {
      console.warn("webkitSpeechRecognition is not available, voice search will not work")
      window.webkitSpeechRecognition = function () {
        this.start = () => alert("Voice search is not supported in your browser.")
        this.continuous = false
        this.interimResults = false
        this.lang = "en-US"
      }
    }

    // Set up logout button if it exists
    const logoutBtn = document.getElementById("logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout)
    }

    // Set up filter buttons
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveFilter(btn.dataset.filter)
      })
    })

    // Set up trending tags
    trendingTags.forEach((tag) => {
      tag.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = tag.textContent
          handleSearch(new Event("submit"))
        }
      })
    })

    // Initialize theme
    if (isDarkMode) {
      document.body.classList.add("dark")
      if (moonIcon) moonIcon.classList.remove("hidden")
      if (sunIcon) sunIcon.classList.add("hidden")
    } else {
      if (moonIcon) moonIcon.classList.add("hidden")
      if (sunIcon) sunIcon.classList.remove("hidden")
    }

    // Render search history
    renderSearchHistory()

    // Check for URL parameters (for sharing searches)
    const urlParams = new URLSearchParams(window.location.search)
    const queryParam = urlParams.get("q")
    if (queryParam && searchInput) {
      searchInput.value = queryParam
      handleSearch(new Event("submit"))
    }

    // Add a direct event listener to the search button as a fallback
    if (searchButton && searchInput) {
      searchButton.addEventListener("click", (e) => {
        e.preventDefault()
        console.log("Search button clicked directly")
        handleSearch(new Event("submit"))
      })
    }
  }

  // Handle user logout
  function handleLogout() {
    logoutUser()
    window.location.href = "login.html"
  }

  // Add this function to save search queries to history
  function addToHistory(query) {
    if (!isLoggedIn) {
      return // Don't save history if not logged in
    }

    // Update search history
    updateSearchHistory(query)

    // Update local searchHistory variable
    searchHistory = getUserData().searchHistory

    // Update the UI
    renderSearchHistory()
  }

  // Update the handleSearch function to include addToHistory
  async function handleSearch(e) {
    e.preventDefault()
    console.log("Search form submitted")

    if (!searchInput) {
      console.error("Search input element not found")
      return
    }

    const query = searchInput.value.trim()

    if (query.length === 0) {
      console.log("Empty query, search aborted")
      return
    }

    currentQuery = query
    currentPage = 1

    // Show loading indicator
    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden")
      console.log("Loading indicator shown")
    }

    // Perform search
    try {
      console.log("Performing search for:", query)
      await performSearch(query)
      // Add this line to save the search to history
      addToHistory(query)
    } catch (error) {
      console.error("Search error:", error)
      if (searchResults) {
        searchResults.innerHTML = '<div class="error">An error occurred while searching. Please try again later.</div>'
      }
    } finally {
      // Hide loading indicator
      if (loadingIndicator) {
        loadingIndicator.classList.add("hidden")
        console.log("Loading indicator hidden")
      }
    }

    // Update URL for sharing
    const url = new URL(window.location)
    url.searchParams.set("q", query)
    window.history.pushState({}, "", url)
  }

  // Update the performSearch function to add more logging
  async function performSearch(query) {
    const startTime = performance.now()
    console.log("Starting search API call")

    // Wikipedia API endpoint
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`
    console.log("API URL:", apiUrl)

    try {
      const response = await fetch(apiUrl)
      console.log("API response received:", response.status)

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("API data parsed, results:", data.query.search.length)

      currentResults = data.query.search.map((result) => ({
        title: result.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
        description: result.snippet,
        timestamp: result.timestamp,
      }))

      const endTime = performance.now()
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2)
      console.log(`Search completed in ${timeTaken} seconds`)

      // Update search stats
      if (resultCount) resultCount.textContent = data.query.searchinfo.totalhits
      if (searchTime) searchTime.textContent = timeTaken

      // Render results
      renderResults()
      console.log("Results rendered")

      // Show clear button and search stats
      if (clearSearchBtn) clearSearchBtn.classList.remove("hidden")
      if (searchStats) searchStats.classList.remove("hidden")
    } catch (error) {
      console.error("Error in performSearch:", error)
      throw error
    }
  }

  function renderResults() {
    if (!searchResults) return

    // Clear previous results
    searchResults.innerHTML = ""

    // Calculate pagination
    const startIndex = (currentPage - 1) * resultsPerPage
    const endIndex = Math.min(startIndex + resultsPerPage, currentResults.length)
    const paginatedResults = currentResults.slice(startIndex, endIndex)

    // No results
    if (paginatedResults.length === 0) {
      searchResults.innerHTML = `
        <div class="no-results">
          <h2>No results found for "${currentQuery}"</h2>
          <p>Try different keywords or check your spelling.</p>
        </div>
      `
      if (pagination) pagination.classList.add("hidden")
      return
    }

    // Render each result
    paginatedResults.forEach((result) => {
      const resultElement = document.createElement("div")
      resultElement.className = "result-item"

      // Format the timestamp
      const date = new Date(result.timestamp)
      const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

      resultElement.innerHTML = `
        <span class="result-url">${result.url}</span>
        <a href="${result.url}" class="result-title" target="_blank">${result.title}</a>
        <p class="result-description">${result.description}</p>
        <span class="result-date">Last updated: ${formattedDate}</span>
      `
      searchResults.appendChild(resultElement)
    })

    // Update pagination
    renderPagination()
  }

  function renderPagination() {
    if (!pagination || !pageNumbers) return

    const totalPages = Math.ceil(currentResults.length / resultsPerPage)

    if (totalPages <= 1) {
      pagination.classList.add("hidden")
      return
    }

    pagination.classList.remove("hidden")
    pageNumbers.innerHTML = ""

    // Determine which page numbers to show
    let startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(totalPages, startPage + 4)

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4)
    }

    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      const pageNumber = document.createElement("div")
      pageNumber.className = `page-number ${i === currentPage ? "active" : ""}`
      pageNumber.textContent = i
      pageNumber.addEventListener("click", () => changePage(i))
      pageNumbers.appendChild(pageNumber)
    }

    // Update prev/next buttons
    if (prevPageBtn) prevPageBtn.disabled = currentPage === 1
    if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages
  }

  function changePage(page) {
    currentPage = page
    renderResults()

    // Scroll to top of results
    if (searchResults) {
      searchResults.scrollIntoView({ behavior: "smooth" })
    }
  }

  function handleInput() {
    if (!searchInput || !clearSearchBtn) return

    const query = searchInput.value.trim()

    // Show/hide clear button
    if (query.length > 0) {
      clearSearchBtn.classList.remove("hidden")
      showSuggestions()
    } else {
      clearSearchBtn.classList.add("hidden")
      if (searchSuggestions) {
        searchSuggestions.classList.remove("active")
      }
    }
  }

  async function showSuggestions() {
    if (!searchInput || !searchSuggestions) return

    const query = searchInput.value.trim()

    if (query.length === 0) {
      searchSuggestions.classList.remove("active")
      return
    }

    // Wikipedia API for suggestions
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*`

    try {
      const response = await fetch(apiUrl)
      const data = await response.json()
      const suggestions = data[1]

      if (suggestions.length > 0) {
        searchSuggestions.innerHTML = ""

        suggestions.forEach((suggestion) => {
          const suggestionElement = document.createElement("div")
          suggestionElement.className = "suggestion-item"
          suggestionElement.textContent = suggestion
          suggestionElement.addEventListener("click", () => {
            searchInput.value = suggestion
            searchSuggestions.classList.remove("active")
            handleSearch(new Event("submit"))
          })
          searchSuggestions.appendChild(suggestionElement)
        })

        searchSuggestions.classList.add("active")
      } else {
        searchSuggestions.classList.remove("active")
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      searchSuggestions.classList.remove("active")
    }
  }

  function clearSearch() {
    if (!searchInput || !clearSearchBtn || !searchSuggestions) return

    searchInput.value = ""
    clearSearchBtn.classList.add("hidden")
    searchSuggestions.classList.remove("active")
    searchInput.focus()
  }

  function setActiveFilter(filter) {
    currentFilter = filter

    // Update active filter button
    filterBtns.forEach((btn) => {
      if (btn.dataset.filter === filter) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })

    // If we have results, re-render them
    if (currentResults.length > 0) {
      renderResults()
    }
  }

  function renderSearchHistory() {
    if (!historyList) return

    historyList.innerHTML = ""

    if (!isLoggedIn || searchHistory.length === 0) {
      historyList.innerHTML = '<li class="no-history">No search history yet</li>'
      return
    }

    searchHistory.forEach((item, index) => {
      const historyItem = document.createElement("li")
      historyItem.className = "history-item"

      // Format timestamp
      const date = new Date(item.timestamp)
      const formattedTime =
        date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      historyItem.innerHTML = `
        <span class="history-query">${item.query}</span>
        <span class="history-time">${formattedTime}</span>
        <button class="delete-history" data-index="${index}" aria-label="Delete from history">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      `

      // Add event listeners
      historyItem.querySelector(".history-query").addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = item.query
          handleSearch(new Event("submit"))
          toggleHistoryPanel()
        }
      })

      historyItem.querySelector(".delete-history").addEventListener("click", (e) => {
        e.stopPropagation()
        deleteHistoryItem(index)
      })

      historyList.appendChild(historyItem)
    })
  }

  function deleteHistoryItem(index) {
    if (!isLoggedIn) return

    // Get current user data
    const userData = getUserData()

    // Remove the item at the specified index
    userData.searchHistory.splice(index, 1)

    // Save updated data
    saveUserData(userData.username, "", userData.searchHistory)

    // Update local searchHistory variable
    searchHistory = userData.searchHistory

    // Update the UI
    renderSearchHistory()
  }

  function clearHistory() {
    if (!isLoggedIn) return

    // Clear search history
    clearSearchHistory()

    // Update local searchHistory variable
    searchHistory = []

    // Update the UI
    renderSearchHistory()
  }

  function toggleHistoryPanel() {
    if (!historyPanel) return
    historyPanel.classList.toggle("active")
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode
    document.body.classList.toggle("dark")

    if (moonIcon && sunIcon) {
      if (isDarkMode) {
        moonIcon.classList.remove("hidden")
        sunIcon.classList.add("hidden")
      } else {
        moonIcon.classList.add("hidden")
        sunIcon.classList.remove("hidden")
      }
    }

    localStorage.setItem("darkMode", isDarkMode)
  }

  function startVoiceSearch() {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        if (voiceSearchButton) {
          voiceSearchButton.classList.add("listening")
        }
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        if (searchInput) {
          searchInput.value = transcript
          handleSearch(new Event("submit"))
        }
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
      }

      recognition.onend = () => {
        if (voiceSearchButton) {
          voiceSearchButton.classList.remove("listening")
        }
      }

      recognition.start()
    } else {
      alert("Voice search is not supported in your browser.")
    }
  }

  // Close history panel when clicking outside
  document.addEventListener("click", (e) => {
    if (
      historyPanel &&
      historyPanel.classList.contains("active") &&
      !historyPanel.contains(e.target) &&
      e.target !== historyToggle
    ) {
      historyPanel.classList.remove("active")
    }
  })
})

// Declare webkitSpeechRecognition
var webkitSpeechRecognition = window.webkitSpeechRecognition

