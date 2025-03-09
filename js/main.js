document.addEventListener("DOMContentLoaded", () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCa5qBEF-62mIr9tbquE5dfipBzeWk4q1k",
    authDomain: "gring-916c9.firebaseapp.com",
    databaseURL: "https://gring-916c9-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "gring-916c9",
    storageBucket: "gring-916c9.firebasestorage.app",
    messagingSenderId: "680919854293",
    appId: "1:680919854293:web:0ce7a3e15f289e444dc65c",
    measurementId: "G-VY1VQHMQKK"
  }

  // Initialize Firebase if not already initialized
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }

  const db = firebase.firestore()
  const auth = firebase.auth()

  // Function to encrypt data
  function encryptData(data, userKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), userKey).toString()
  }

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
  const safeSearchCheckbox = document.getElementById("safe-search-checkbox")

  // List of potentially explicit terms for SafeSearch filtering
  const explicitTerms = [
    "porn",
    "xxx",
    "sex",
    "adult",
    "nude",
    "naked",
    "explicit",
    "nsfw",
    "obscene",
    "violence",
    "gore",
    "drug",
    "gambling",
  ]

  // Mock functions for user authentication and data management
  // Replace these with your actual implementation
  function isUserLoggedIn() {
    // Check if the user is logged in (e.g., check for a token in localStorage)
    return localStorage.getItem("userToken") !== null
  }

  function getUserData() {
    // Retrieve user data from localStorage or a database
    const userData = localStorage.getItem("userData")
    return userData ? JSON.parse(userData) : { username: "Guest", searchHistory: [], settings: { safeSearch: true } }
  }

  function logoutUser() {
    // Clear user data from localStorage and redirect to login page
    localStorage.removeItem("userToken")
    localStorage.removeItem("userData")
  }

  function updateSearchHistory(query) {
    const userData = getUserData()
    const timestamp = new Date().toISOString()
    userData.searchHistory = userData.searchHistory || []
    userData.searchHistory.push({ query: query, timestamp: timestamp })
    localStorage.setItem("userData", JSON.stringify(userData))
  }

  function saveUserData(username, token, searchHistory, settings = { safeSearch: true }) {
    const userData = {
      username: username,
      searchHistory: searchHistory,
      settings: settings,
    }
    localStorage.setItem("userData", JSON.stringify(userData))
    if (token) {
      localStorage.setItem("userToken", token)
    }
  }

  function updateUserSettings(settings) {
    const userData = getUserData()
    userData.settings = { ...userData.settings, ...settings }
    localStorage.setItem("userData", JSON.stringify(userData))
  }

  function clearSearchHistory() {
    const userData = getUserData()
    userData.searchHistory = []
    localStorage.setItem("userData", JSON.stringify(userData))
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
  let isSafeSearchEnabled = false // Default to false

  // Initialize
  init()

  // Functions
  function init() {
    // Set up event listeners
    searchForm.addEventListener("submit", handleSearch)
    searchInput.addEventListener("input", handleInput)
    searchInput.addEventListener("focus", showSuggestions)
    searchInput.addEventListener("blur", () => {
      // Delay hiding suggestions to allow for clicks
      setTimeout(() => {
        searchSuggestions.classList.remove("active")
      }, 200)
    })
    clearSearchBtn.addEventListener("click", clearSearch)
    prevPageBtn.addEventListener("click", () => changePage(currentPage - 1))
    nextPageBtn.addEventListener("click", () => changePage(currentPage + 1))
    historyToggle.addEventListener("click", toggleHistoryPanel)
    clearHistoryBtn.addEventListener("click", clearHistory)
    themeToggleBtn.addEventListener("click", toggleTheme)
    voiceSearchButton.addEventListener("click", startVoiceSearch)
    safeSearchCheckbox.addEventListener("change", toggleSafeSearch)

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
        searchInput.value = tag.textContent
        handleSearch(new Event("submit"))
      })
    })

    // Initialize theme
    if (isDarkMode) {
      document.body.classList.add("dark")
      moonIcon.classList.remove("hidden")
      sunIcon.classList.add("hidden")
    } else {
      moonIcon.classList.add("hidden")
      sunIcon.classList.remove("hidden")
    }

    // Initialize SafeSearch from user settings
    if (isLoggedIn) {
      const userData = getUserData()
      isSafeSearchEnabled = userData.settings?.safeSearch === true
    } else {
      isSafeSearchEnabled = false // Default for non-logged in users
    }
    safeSearchCheckbox.checked = isSafeSearchEnabled

    // Render search history
    renderSearchHistory()

    // Check for URL parameters (for sharing searches)
    const urlParams = new URLSearchParams(window.location.search)
    const queryParam = urlParams.get("q")
    if (queryParam) {
      searchInput.value = queryParam
      handleSearch(new Event("submit"))
    }
  }

  // Handle user logout
  function handleLogout() {
    logoutUser()
    window.location.href = "login.html"
  }

  // Toggle SafeSearch
  function toggleSafeSearch() {
    isSafeSearchEnabled = safeSearchCheckbox.checked

    // Save setting if logged in
    if (isLoggedIn) {
      updateUserSettings({ safeSearch: isSafeSearchEnabled })
    }

    // If we have results, re-filter and re-render them
    if (currentResults.length > 0) {
      filterAndRenderResults()
    }
  }

  // Add this function to save search queries to history
  function addToHistory(query) {
    if (!isLoggedIn) {
      return // Don't save history if not logged in
    }

    // Update search history in cookie
    updateSearchHistory(query)

    // Update local searchHistory variable
    searchHistory = getUserData().searchHistory

    // Update the UI
    renderSearchHistory()
  }

  // Update the handleSearch function to include addToHistory
  async function handleSearch(e) {
    e.preventDefault()
    const query = searchInput.value.trim()

    if (query.length === 0) return

    // Check if SafeSearch is enabled and query contains explicit terms
    if (isSafeSearchEnabled && containsExplicitTerms(query)) {
      searchResults.innerHTML = `
        <div class="no-results">
          <h2>SafeSearch is enabled</h2>
          <p>Your search may contain explicit content. Please disable SafeSearch or try a different search term.</p>
        </div>
      `
      searchStats.classList.add("hidden")
      pagination.classList.add("hidden")
      return
    }

    currentQuery = query
    currentPage = 1

    // Show loading indicator
    loadingIndicator.classList.remove("hidden")

    // Perform search
    try {
      await performSearch(query)
      // Add this line to save the search to history
      addToHistory(query)
    } catch (error) {
      console.error("Search error:", error)
      searchResults.innerHTML = '<div class="error">An error occurred while searching. Please try again later.</div>'
    } finally {
      // Hide loading indicator
      loadingIndicator.classList.add("hidden")
    }

    // Update URL for sharing
    const url = new URL(window.location)
    url.searchParams.set("q", query)
    window.history.pushState({}, "", url)
  }

  // Check if a query contains explicit terms
  function containsExplicitTerms(query) {
    const lowerQuery = query.toLowerCase()
    return explicitTerms.some((term) => lowerQuery.includes(term))
  }

  // Filter results for SafeSearch
  function filterResultsForSafeSearch(results) {
    if (!isSafeSearchEnabled) {
      return results // Return all results if SafeSearch is disabled
    }

    // Filter out results that might contain explicit content
    return results.filter((result) => {
      const combinedText = (result.title + " " + result.description).toLowerCase()
      return !explicitTerms.some((term) => combinedText.includes(term))
    })
  }

  async function performSearch(query) {
    const startTime = performance.now()

    // Wikipedia API endpoint
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`

    const response = await fetch(apiUrl)
    const data = await response.json()

    currentResults = data.query.search.map((result) => ({
      title: result.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
      description: result.snippet,
      timestamp: result.timestamp,
    }))

    // Apply SafeSearch filtering
    if (isSafeSearchEnabled) {
      currentResults = filterResultsForSafeSearch(currentResults)
    }

    const endTime = performance.now()
    const timeTaken = ((endTime - startTime) / 1000).toFixed(2)

    // Update search stats
    resultCount.textContent = currentResults.length
    searchTime.textContent = timeTaken

    // Render results
    renderResults()

    // Show clear button and search stats
    clearSearchBtn.classList.remove("hidden")
    searchStats.classList.remove("hidden")
  }

  // Filter and re-render results (used when SafeSearch is toggled)
  function filterAndRenderResults() {
    // Apply SafeSearch filtering
    if (isSafeSearchEnabled) {
      currentResults = filterResultsForSafeSearch(currentResults)
    }

    // Update result count
    resultCount.textContent = currentResults.length

    // Render results
    renderResults()
  }

  function renderResults() {
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
          ${isSafeSearchEnabled ? "<p>You have SafeSearch enabled. Try disabling it for more results.</p>" : ""}
        </div>
      `
      pagination.classList.add("hidden")
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
    prevPageBtn.disabled = currentPage === 1
    nextPageBtn.disabled = currentPage === totalPages
  }

  function changePage(page) {
    currentPage = page
    renderResults()

    // Scroll to top of results
    searchResults.scrollIntoView({ behavior: "smooth" })
  }

  function handleInput() {
    const query = searchInput.value.trim()

    // Show/hide clear button
    if (query.length > 0) {
      clearSearchBtn.classList.remove("hidden")
      showSuggestions()
    } else {
      clearSearchBtn.classList.add("hidden")
      searchSuggestions.classList.remove("active")
    }
  }

  async function showSuggestions() {
    const query = searchInput.value.trim()

    if (query.length === 0) {
      searchSuggestions.classList.remove("active")
      return
    }

    // Skip suggestions for potentially explicit queries if SafeSearch is enabled
    if (isSafeSearchEnabled && containsExplicitTerms(query)) {
      searchSuggestions.classList.remove("active")
      return
    }

    // Wikipedia API for suggestions
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&namespace=0&format=json&origin=*`

    try {
      const response = await fetch(apiUrl)
      const data = await response.json()
      const suggestions = data[1]

      // Filter suggestions if SafeSearch is enabled
      const filteredSuggestions = isSafeSearchEnabled
        ? suggestions.filter((suggestion) => !containsExplicitTerms(suggestion))
        : suggestions

      if (filteredSuggestions.length > 0) {
        searchSuggestions.innerHTML = ""

        filteredSuggestions.forEach((suggestion) => {
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
        searchInput.value = item.query
        handleSearch(new Event("submit"))
        toggleHistoryPanel()
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
    saveUserData(userData.username, "", userData.searchHistory, userData.settings)

    // Update local searchHistory variable
    searchHistory = userData.searchHistory

    // Update the UI
    renderSearchHistory()
  }

  function clearHistory() {
    if (!isLoggedIn) return

    // Clear search history in cookie
    clearSearchHistory()

    // Update local searchHistory variable
    searchHistory = []

    // Update the UI
    renderSearchHistory()
  }

  function toggleHistoryPanel() {
    historyPanel.classList.toggle("active")
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode
    document.body.classList.toggle("dark")

    if (isDarkMode) {
      moonIcon.classList.remove("hidden")
      sunIcon.classList.add("hidden")
    } else {
      moonIcon.classList.add("hidden")
      sunIcon.classList.remove("hidden")
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
        voiceSearchButton.classList.add("listening")
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        searchInput.value = transcript
        handleSearch(new Event("submit"))
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
      }

      recognition.onend = () => {
        voiceSearchButton.classList.remove("listening")
      }

      recognition.start()
    } else {
      alert("Voice search is not supported in your browser.")
    }
  }

  // Close history panel when clicking outside
  document.addEventListener("click", (e) => {
    if (historyPanel.classList.contains("active") && !historyPanel.contains(e.target) && e.target !== historyToggle) {
      historyPanel.classList.remove("active")
    }
  })

  // Check for URL parameters (for sharing searches or coming from history page)
  const urlParams = new URLSearchParams(window.location.search)
  const queryParam = urlParams.get("q")
  if (queryParam) {
    searchInput.value = queryParam
    handleSearch(new Event("submit"))
  }
})

// Declare firebase
var firebase = window.firebase

// Declare CryptoJS
var CryptoJS = window.CryptoJS

// Declare webkitSpeechRecognition
var webkitSpeechRecognition = window.webkitSpeechRecognition

