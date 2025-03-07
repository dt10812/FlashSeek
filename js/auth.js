document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form")
    const signupForm = document.getElementById("signup-form")
  
    if (loginForm) {
      loginForm.addEventListener("submit", handleLogin)
    }
  
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignup)
    }
  })
  
  function handleLogin(e) {
    e.preventDefault()
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
  
    if (!validateEmail(email)) {
      showError("email", "Please enter a valid email address")
      return
    }
  
    if (password.length < 6) {
      showError("password", "Password must be at least 6 characters long")
      return
    }
  
    // Simulate login process
    simulateAuth(email, password, "login")
  }
  
  function handleSignup(e) {
    e.preventDefault()
    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value
    const confirmPassword = document.getElementById("confirm-password").value
  
    if (name.trim().length === 0) {
      showError("name", "Please enter your full name")
      return
    }
  
    if (!validateEmail(email)) {
      showError("email", "Please enter a valid email address")
      return
    }
  
    if (password.length < 6) {
      showError("password", "Password must be at least 6 characters long")
      return
    }
  
    if (password !== confirmPassword) {
      showError("confirm-password", "Passwords do not match")
      return
    }
  
    // Simulate signup process
    simulateAuth(email, password, "signup", name)
  }
  
  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }
  
  function showError(fieldId, message) {
    const field = document.getElementById(fieldId)
    const errorElement = field.nextElementSibling
  
    if (errorElement && errorElement.classList.contains("error-message")) {
      errorElement.textContent = message
    } else {
      const errorDiv = document.createElement("div")
      errorDiv.className = "error-message"
      errorDiv.textContent = message
      field.parentNode.insertBefore(errorDiv, field.nextSibling)
    }
  }
  
  function clearErrors() {
    const errorMessages = document.querySelectorAll(".error-message")
    errorMessages.forEach((error) => error.remove())
  }
  
  function simulateAuth(email, password, action, name = "") {
    clearErrors()
    const form = document.querySelector(".auth-form")
    const loadingMessage = document.createElement("div")
    loadingMessage.textContent = `${action === "login" ? "Logging in" : "Signing up"}...`
    loadingMessage.className = "success-message"
    form.appendChild(loadingMessage)
  
    setTimeout(() => {
      loadingMessage.remove()
      const successMessage = document.createElement("div")
      successMessage.className = "success-message"
  
      if (action === "login") {
        successMessage.textContent = "Login successful! Redirecting to dashboard..."
      } else {
        successMessage.textContent = "Sign up successful! Please check your email to verify your account."
      }
  
      form.appendChild(successMessage)
  
      // Simulate redirect or further actions
      setTimeout(() => {
        if (action === "login") {
          window.location.href = "index.html" // Redirect to home page or dashboard
        } else {
          window.location.href = "login.html" // Redirect to login page after signup
        }
      }, 2000)
    }, 2000)
  }
  
  