// Import Firebase modules
import firebase from "firebase/app"
import "firebase/auth"
import "firebase/database"
import CryptoJS from "crypto-js"

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

// Initialize Firebase
firebase.initializeApp(firebaseConfig)

// Get a reference to the database service
const database = firebase.database()
const auth = firebase.auth()

// Simple encryption function for password (not for production use)
function encryptPassword(password) {
  // In a real application, you would use a proper hashing library
  // This is a simple implementation for demonstration purposes
  return CryptoJS.SHA256(password).toString()
}

// Function to encrypt search history
function encryptData(data, userKey) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), userKey).toString()
}

// Function to decrypt search history
function decryptData(encryptedData, userKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, userKey)
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8))
}

// Save user data to Firebase
function saveUserData(userId, name, email, encryptedPassword) {
  return database.ref("users/" + userId).set({
    name: name,
    email: email,
    password: encryptedPassword,
    createdAt: new Date().toISOString(),
  })
}

// Save search history to Firebase
function saveSearchHistory(userId, encryptedHistory) {
  return database.ref("users/" + userId + "/searchHistory").set({
    history: encryptedHistory,
    updatedAt: new Date().toISOString(),
  })
}

// Get user search history from Firebase
async function getSearchHistory(userId, userKey) {
  try {
    const snapshot = await database.ref("users/" + userId + "/searchHistory").once("value")
    const data = snapshot.val()
    if (data && data.history) {
      return decryptData(data.history, userKey)
    }
    return []
  } catch (error) {
    console.error("Error fetching search history:", error)
    return []
  }
}


