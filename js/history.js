document.addEventListener("DOMContentLoaded", () => {
  const historyList = document.getElementById("history-list")
  const clearHistoryBtn = document.getElementById("clear-history")

  // Check if user is logged in
  const isLoggedIn = isUserLoggedIn()

  // Add user info to the UI if logged in
  if (isLoggedIn && document.getElementById("user-info")) {
    const userData = getUserData()
    document.getElementById("user-info").textContent = userData.username
    document.getElementById("user-section").classList.remove("hidden")
    document.getElementById("login-section").classList.add("hidden")
  }

  // Set up logout button if it exists
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout)
  }

  // Load and display search history
  loadSearchHistory()

  // Add event listener for clearing history
  clearHistoryBtn.addEventListener("click", clearAllHistory)

  // Handle user logout
  function handleLogout() {
    logoutUser()
    window.location.href = "login.html"
  }

  function loadSearchHistory() {
    let searchHistory = []

    // If user is logged in, get search history from cookie
    if (isLoggedIn) {
      const userData = getUserData()
      searchHistory = userData.searchHistory || []
    }

    displaySearchHistory(searchHistory)
  }

  function displaySearchHistory(searchHistory) {
    if (!isLoggedIn) {
      historyList.innerHTML = '<p class="no-history">Please log in to view your search history.</p>'
      clearHistoryBtn.disabled = true
      return
    }

    if (searchHistory.length === 0) {
      historyList.innerHTML = '<p class="no-history">No search history available.</p>'
      return
    }

    historyList.innerHTML = ""
    searchHistory.forEach((item, index) => {
      const historyItem = document.createElement("div")
      historyItem.className = "history-item"

      const date = new Date(item.timestamp)
      const formattedDate = date.toLocaleDateString() + " " + date.toLocaleTimeString()

      historyItem.innerHTML = `
        <span class="history-query">${item.query}</span>
        <span class="history-time">${formattedDate}</span>
        <button class="delete-history" data-index="${index}" aria-label="Delete from history">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </button>
      `

      historyItem.querySelector(".history-query").addEventListener("click", () => {
        window.location.href = `index.html?q=${encodeURIComponent(item.query)}`
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

    // Update the UI
    displaySearchHistory(userData.searchHistory)
  }

  function clearAllHistory() {
    if (!isLoggedIn) return

    // Clear search history in cookie
    clearSearchHistory()

    // Update the UI
    displaySearchHistory([])
  }

  // Mock functions for user authentication and data management
  // In a real application, these would be implemented properly
  function isUserLoggedIn() {
    // Replace with actual authentication logic
    return localStorage.getItem("loggedIn") === "true"
  }

  function getUserData() {
    // Replace with actual data retrieval logic (e.g., from cookies or local storage)
    const storedData = localStorage.getItem("userData")
    return storedData
      ? JSON.parse(storedData)
      : { username: "Guest", searchHistory: [], settings: { safeSearch: false } }
  }

  function logoutUser() {
    // Replace with actual logout logic
    localStorage.removeItem("loggedIn")
  }

  function saveUserData(username, password, searchHistory, settings = { safeSearch: false }) {
    // Replace with actual data saving logic
    const userData = { username: username, searchHistory: searchHistory, settings: settings }
    localStorage.setItem("userData", JSON.stringify(userData))
  }

  function clearSearchHistory() {
    // Replace with actual search history clearing logic
    const userData = getUserData()
    userData.searchHistory = []
    saveUserData(userData.username, "", userData.searchHistory, userData.settings)
  }
})

