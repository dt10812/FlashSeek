document.addEventListener("DOMContentLoaded", () => {
  // Import Firebase and CryptoJS libraries
  const firebase = window.firebase
  const CryptoJS = window.CryptoJS

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

  // Function to decrypt data
  function decryptData(encryptedData, userKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, userKey)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  }

  const historyList = document.getElementById("history-list")
  const clearHistoryBtn = document.getElementById("clear-history")

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
  const userId = localStorage.getItem("userId")
  const userKey = localStorage.getItem("userKey")

  // Add user info to the UI if logged in
  if (isLoggedIn && document.getElementById("user-info")) {
    const userEmail = localStorage.getItem("userEmail")
    document.getElementById("user-info").textContent = userEmail
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
  clearHistoryBtn.addEventListener("click", clearSearchHistory)

  // Handle user logout
  async function handleLogout() {
    try {
      await auth.signOut()

      // Clear user data from localStorage
      localStorage.removeItem("userId")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userKey")
      localStorage.removeItem("isLoggedIn")

      // Redirect to login page
      window.location.href = "login.html"
    } catch (error) {
      console.error("Error logging out:", error)
      alert("Error logging out. Please try again.")
    }
  }

  async function loadSearchHistory() {
    let searchHistory = []

    // If user is logged in, try to fetch from Firestore first
    if (isLoggedIn && userId && userKey) {
      try {
        const historyDoc = await db.collection("users").doc(userId).collection("userData").doc("searchHistory").get()

        if (historyDoc.exists) {
          const data = historyDoc.data()
          if (data && data.history) {
            // Decrypt the search history
            searchHistory = decryptData(data.history, userKey)
            // Update localStorage with the latest from Firestore
            localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
          } else {
            // Initialize with empty history if no history found
            searchHistory = []
          }
        } else {
          // Initialize with empty history if document doesn't exist
          searchHistory = []
        }
      } catch (error) {
        console.error("Error fetching search history from Firestore:", error)
        // Fall back to localStorage if Firestore fails
        searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
      }
    } else {
      // Not logged in, use localStorage
      searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
    }

    displaySearchHistory(searchHistory)
  }

  function displaySearchHistory(searchHistory) {
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

  async function deleteHistoryItem(index) {
    const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
    searchHistory.splice(index, 1)
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory))

    // If user is logged in, update Firestore
    if (isLoggedIn && userId && userKey) {
      try {
        const encryptedHistory = encryptData(searchHistory, userKey)
        await db.collection("users").doc(userId).collection("userData").doc("searchHistory").set({
          history: encryptedHistory,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      } catch (error) {
        console.error("Error updating search history in Firestore:", error)
      }
    }

    displaySearchHistory(searchHistory)
  }

  async function clearSearchHistory() {
    localStorage.removeItem("searchHistory")

    // If user is logged in, update Firestore
    if (isLoggedIn && userId && userKey) {
      try {
        const encryptedHistory = encryptData([], userKey)
        await db.collection("users").doc(userId).collection("userData").doc("searchHistory").set({
          history: encryptedHistory,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
      } catch (error) {
        console.error("Error clearing search history in Firestore:", error)
      }
    }

    displaySearchHistory([])
  }
})

