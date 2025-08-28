document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  const loginBtn = document.getElementById("loginBtn")
  const errorMessage = document.getElementById("errorMessage")

  // Use global auth variable
  const auth = window.auth

  // Check if user is already logged in
  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "dashboard.html"
    }
  })

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    // Show loading state
    showLoading(true)
    hideError()

    try {
      await auth.signInWithEmailAndPassword(email, password)
      // Redirect will happen automatically via onAuthStateChanged
    } catch (error) {
      console.error("Login error:", error)
      showError()
      showLoading(false)
    }
  })

  function showLoading(loading) {
    const btnText = loginBtn.querySelector(".btn-text")
    const spinner = loginBtn.querySelector(".loading-spinner")

    if (loading) {
      btnText.style.display = "none"
      spinner.style.display = "block"
      loginBtn.disabled = true
    } else {
      btnText.style.display = "block"
      spinner.style.display = "none"
      loginBtn.disabled = false
    }
  }

  function showError() {
    errorMessage.style.display = "block"
    errorMessage.textContent = "Your credentials are incorrect."
  }

  function hideError() {
    errorMessage.style.display = "none"
  }

  // Add scroll animation
  const loginCard = document.querySelector(".login-card")
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-slide-up")
      }
    })
  })

  observer.observe(loginCard)
})
