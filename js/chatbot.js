document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const chatForm = document.getElementById("chat-form")
  const chatInput = document.getElementById("chat-input")
  const sendButton = document.getElementById("send-message")
  const voiceButton = document.getElementById("voice-chat")
  const chatMessages = document.getElementById("chat-messages")
  const clearChatBtn = document.getElementById("clear-chat")
  const suggestedQuestions = document.querySelectorAll(".suggested-question")
  const loadingIndicator = document.getElementById("loading-indicator")
  const themeToggleBtn = document.getElementById("theme-toggle-btn")
  const moonIcon = document.getElementById("moon-icon")
  const sunIcon = document.getElementById("sun-icon")

  // State
  let chatHistory = JSON.parse(localStorage.getItem("chatHistory")) || []
  let isProcessing = false
  let isDarkMode = localStorage.getItem("darkMode") === "true"

  // Initialize
  init()

  // Functions
  function init() {
    // Set up event listeners
    chatForm.addEventListener("submit", handleSendMessage)
    voiceButton.addEventListener("click", startVoiceInput)
    clearChatBtn.addEventListener("click", clearChat)

    // Set up suggested questions
    suggestedQuestions.forEach((question) => {
      question.addEventListener("click", () => {
        chatInput.value = question.textContent
        handleSendMessage(new Event("submit"))
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

    // Load chat history
    loadChatHistory()

    // Focus on input
    chatInput.focus()
  }

  function handleSendMessage(e) {
    e.preventDefault()

    const message = chatInput.value.trim()

    if (message.length === 0 || isProcessing) return

    // Add user message to chat
    addMessageToChat(message, "user")

    // Clear input
    chatInput.value = ""

    // Process message and get response
    processMessage(message)
  }

  function addMessageToChat(message, sender) {
    const messageElement = document.createElement("div")
    messageElement.className = `message ${sender}-message`

    let avatarSvg = ""

    if (sender === "bot") {
      avatarSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
        </svg>
      `
    } else {
      avatarSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      `
    }

    messageElement.innerHTML = `
      <div class="message-avatar">
        ${avatarSvg}
      </div>
      <div class="message-content">
        <p>${formatMessage(message)}</p>
      </div>
    `

    chatMessages.appendChild(messageElement)

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight

    // Save to history
    chatHistory.push({
      sender: sender,
      message: message,
      timestamp: new Date().toISOString(),
    })

    saveChatHistory()
  }

  function formatMessage(message) {
    // Convert URLs to clickable links
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return message.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
  }

  function processMessage(message) {
    isProcessing = true

    // Show typing indicator
    showTypingIndicator()

    // Simulate API call delay
    setTimeout(
      () => {
        // Remove typing indicator
        removeTypingIndicator()

        // Get AI response
        const response = getAIResponse(message)

        // Add bot message to chat
        addMessageToChat(response, "bot")

        isProcessing = false
      },
      1000 + Math.random() * 1000,
    ) // Random delay between 1-2 seconds
  }

  function showTypingIndicator() {
    const typingIndicator = document.createElement("div")
    typingIndicator.className = "message bot-message typing-indicator"
    typingIndicator.innerHTML = `
      <div class="message-avatar">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
        </svg>
      </div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `

    chatMessages.appendChild(typingIndicator)
    chatMessages.scrollTop = chatMessages.scrollHeight
  }

  function removeTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator")
    if (typingIndicator) {
      typingIndicator.remove()
    }
  }

  function getAIResponse(message) {
    // Simple response logic - in a real app, this would call an AI API
    message = message.toLowerCase()

    if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
      return "Hello there! How can I assist you today?"
    } else if (message.includes("how are you")) {
      return "I'm doing well, thank you for asking! How about you?"
    } else if (message.includes("name")) {
      return "I'm FlashSeek AI Assistant, your helpful chat companion!"
    } else if (message.includes("weather")) {
      return "I don't have access to real-time weather data, but I can suggest checking a weather service like weather.com or accuweather.com for the most up-to-date information."
    } else if (message.includes("help") || message.includes("what can you do")) {
      return "I can help you with information, answer questions, provide recommendations, or just chat! Feel free to ask me anything."
    } else if (message.includes("search") || message.includes("flashseek")) {
      return "FlashSeek is a lightning-fast search engine designed to provide accurate and relevant results. You can use it by typing your query in the search box on the home page."
    } else if (message.includes("thank")) {
      return "You're welcome! Is there anything else I can help you with?"
    } else if (message.includes("bye") || message.includes("goodbye")) {
      return "Goodbye! Feel free to come back anytime you need assistance."
    } else if (message.includes("book") || message.includes("recommend") || message.includes("reading")) {
      return "I'd recommend checking out 'Project Hail Mary' by Andy Weir if you enjoy sci-fi, 'The Midnight Library' by Matt Haig for something thought-provoking, or 'Atomic Habits' by James Clear for personal development."
    } else if (message.includes("tech") || message.includes("news") || message.includes("technology")) {
      return "Some recent tech trends include advancements in AI, quantum computing, and sustainable technology. For the latest news, I'd recommend checking tech news sites like TechCrunch, The Verge, or Wired."
    } else if (message.includes("joke")) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "Why did the JavaScript developer wear glasses? Because he couldn't C#!",
        "How many programmers does it take to change a light bulb? None, that's a hardware problem!",
        "Why do programmers always mix up Halloween and Christmas? Because Oct 31 = Dec 25!",
        "Why was the computer cold? It left its Windows open!",
      ]
      return jokes[Math.floor(Math.random() * jokes.length)]
    } else {
      const genericResponses = [
        "That's an interesting question. While I don't have all the information, I'd be happy to discuss this further.",
        "I understand you're asking about that. Could you provide more details so I can give you a better response?",
        "Thanks for your question. I'm continuously learning and improving my knowledge base.",
        "I appreciate your inquiry. Let me know if you'd like more specific information on this topic.",
        "That's a great question! I'm designed to provide helpful information on a wide range of topics.",
      ]
      return genericResponses[Math.floor(Math.random() * genericResponses.length)]
    }
  }

  function startVoiceInput() {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onstart = () => {
        voiceButton.classList.add("listening")
        chatInput.placeholder = "Listening..."
      }

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        chatInput.value = transcript
        handleSendMessage(new Event("submit"))
      }

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
        voiceButton.classList.remove("listening")
        chatInput.placeholder = "Type your message here..."
      }

      recognition.onend = () => {
        voiceButton.classList.remove("listening")
        chatInput.placeholder = "Type your message here..."
      }

      recognition.start()
    } else {
      alert("Voice input is not supported in your browser.")
    }
  }

  function clearChat() {
    // Ask for confirmation
    if (confirm("Are you sure you want to clear the chat history?")) {
      chatMessages.innerHTML = `
        <div class="message bot-message">
          <div class="message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
            </svg>
          </div>
          <div class="message-content">
            <p>Hello! I'm FlashSeek AI Assistant. How can I help you today?</p>
          </div>
        </div>
        
        <div class="message bot-message">
          <div class="message-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"></path>
            </svg>
          </div>
          <div class="message-content">
            <p>You can ask me questions, get recommendations, or just chat. I'm here to assist!</p>
          </div>
        </div>
      `

      // Clear history
      chatHistory = []
      localStorage.removeItem("chatHistory")
    }
  }

  function loadChatHistory() {
    if (chatHistory.length > 0) {
      // Clear default messages
      chatMessages.innerHTML = ""

      // Load messages from history (limit to last 50)
      const recentHistory = chatHistory.slice(-50)

      recentHistory.forEach((item) => {
        addMessageToChat(item.message, item.sender)
      })
    }
  }

  function saveChatHistory() {
    // Limit history to last 100 messages
    if (chatHistory.length > 100) {
      chatHistory = chatHistory.slice(-100)
    }

    localStorage.setItem("chatHistory", JSON.stringify(chatHistory))
  }

  // Toggle theme function (reused from main.js)
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
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
    })
  }
})

// Declare webkitSpeechRecognition to avoid undefined errors
var webkitSpeechRecognition = window.webkitSpeechRecognition

