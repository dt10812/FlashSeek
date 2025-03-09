// Cookie and encryption utilities

// CryptoJS should be included in the HTML files
const CryptoJS = window.CryptoJS

// Master encryption key (in a real app, this would be more securely managed)
const MASTER_KEY = "FlashSeek_Secret_Key_2025"

// Function to encrypt data
function encryptData(data, key = MASTER_KEY) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
}

// Function to decrypt data
function decryptData(encryptedData, key = MASTER_KEY) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key)
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
  } catch (error) {
    console.error("Error decrypting data:", error)
    return null
  }
}

// Function to hash password
function hashPassword(password) {
  return CryptoJS.SHA256(password).toString()
}

// Function to set a cookie with expiration
function setCookie(name, value, days = 30) {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = "expires=" + date.toUTCString()
  document.cookie = name + "=" + value + ";" + expires + ";path=/;SameSite=Strict"
}

// Function to get a cookie by name
function getCookie(name) {
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

// Function to delete a cookie
function deleteCookie(name) {
  document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;"
}

// Function to save user data in the specified format: "username-password-searchhistory"
function saveUserData(username, password, searchHistory = []) {
  // Hash the password for security
  const hashedPassword = password ? hashPassword(password) : ""

  // Create the data object in the required format
  const userData = {
    username: username,
    password: hashedPassword,
    searchHistory: searchHistory,
  }

  // Create the string in the format "username-password-searchhistory"
  const dataString = `${username}-${hashedPassword}-${JSON.stringify(searchHistory)}`

  // Encrypt the entire data string
  const encryptedData = encryptData(dataString)

  // Save to cookie
  setCookie("flashseek_user_data", encryptedData)

  return true
}

// Function to get user data from cookie
function getUserData() {
  const encryptedData = getCookie("flashseek_user_data")

  if (!encryptedData) {
    return null
  }

  // Decrypt the data
  const dataString = decryptData(encryptedData)

  if (!dataString) {
    return null
  }

  // Parse the string in the format "username-password-searchhistory"
  const parts = dataString.split("-")

  if (parts.length < 3) {
    return null
  }

  const username = parts[0]
  const password = parts[1]
  let searchHistory = []

  try {
    // The search history is the rest of the string after the second dash
    const historyString = parts.slice(2).join("-")
    searchHistory = JSON.parse(historyString)
  } catch (error) {
    console.error("Error parsing search history:", error)
  }

  return {
    username: username,
    password: password,
    searchHistory: Array.isArray(searchHistory) ? searchHistory : [],
  }
}

// Function to update search history
function updateSearchHistory(query) {
  const userData = getUserData()

  if (!userData) {
    return false
  }

  // Remove duplicate if exists
  userData.searchHistory = userData.searchHistory.filter((item) => item.query !== query)

  // Add new search to the beginning of the array
  userData.searchHistory.unshift({
    query: query,
    timestamp: new Date().toISOString(),
  })

  // Limit history to 50 items
  if (userData.searchHistory.length > 50) {
    userData.searchHistory.pop()
  }

  // Save updated data
  saveUserData(userData.username, "", userData.searchHistory)

  return true
}

// Function to clear search history
function clearSearchHistory() {
  const userData = getUserData()

  if (!userData) {
    return false
  }

  // Clear the search history
  userData.searchHistory = []

  // Save updated data
  saveUserData(userData.username, "", userData.searchHistory)

  return true
}

// Function to check if user is logged in
function isUserLoggedIn() {
  return getUserData() !== null
}

// Function to logout user
function logoutUser() {
  deleteCookie("flashseek_user_data")
  return true
}

// Make functions available globally
window.encryptData = encryptData
window.decryptData = decryptData
window.hashPassword = hashPassword
window.setCookie = setCookie
window.getCookie = getCookie
window.deleteCookie = deleteCookie
window.saveUserData = saveUserData
window.getUserData = getUserData
window.updateSearchHistory = updateSearchHistory
window.clearSearchHistory = clearSearchHistory
window.isUserLoggedIn = isUserLoggedIn
window.logoutUser = logoutUser

