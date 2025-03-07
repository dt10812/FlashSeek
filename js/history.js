document.addEventListener("DOMContentLoaded", () => {
    const historyList = document.getElementById("history-list")
    const clearHistoryBtn = document.getElementById("clear-history")
  
    // Load and display search history
    displaySearchHistory()
  
    // Add event listener for clearing history
    clearHistoryBtn.addEventListener("click", clearSearchHistory)
  
    function displaySearchHistory() {
      const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
  
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
      const searchHistory = JSON.parse(localStorage.getItem("searchHistory")) || []
      searchHistory.splice(index, 1)
      localStorage.setItem("searchHistory", JSON.stringify(searchHistory))
      displaySearchHistory()
    }
  
    function clearSearchHistory() {
      localStorage.removeItem("searchHistory")
      displaySearchHistory()
    }
  })
  
  