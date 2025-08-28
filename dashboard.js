document.addEventListener("DOMContentLoaded", () => {
  let currentPage = 1
  const recordsPerPage = 30
  let allMembers = []
  let filteredMembers = []
  let currentEditMemberId = null
  let currentDeleteMemberId = null

  // Use global variables
  const auth = window.auth
  const database = window.database
  const formatDate = window.formatDate
  const formatDateTime = window.formatDateTime

  // Check authentication
  auth.onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = "login.html"
    } else {
      loadDashboardData()
    }
  })

  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(() => {
      window.location.href = "login.html"
    })
  })

  // Search functionality
  document.getElementById("searchBtn").addEventListener("click", performSearch)
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch()
    }
  })

  // Filter functionality
  const filterElements = [
    "genderFilter",
    "districtFilter",
    "branchFilter",
    "educationFilter",
    "dateFromFilter",
    "dateToFilter",
  ]
  filterElements.forEach((filterId) => {
    document.getElementById(filterId).addEventListener("change", applyFilters)
  })

  // Clear filters
  document.getElementById("clearFilters").addEventListener("click", clearFilters)

  // Export functionality
  document.getElementById("exportAllBtn").addEventListener("click", () => exportData(allMembers))
  document.getElementById("exportFilteredBtn").addEventListener("click", () => exportData(filteredMembers))

  // Pagination
  document.getElementById("prevPageBtn").addEventListener("click", () => changePage(currentPage - 1))
  document.getElementById("nextPageBtn").addEventListener("click", () => changePage(currentPage + 1))

  async function loadDashboardData() {
    showLoading(true)

    try {
      const snapshot = await database.ref("members").once("value")
      const data = snapshot.val()

      if (data) {
        allMembers = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }))

        // Sort by submission date (newest first)
        allMembers.sort((a, b) => new Date(b.submissionDateTime) - new Date(a.submissionDateTime))

        filteredMembers = [...allMembers]
        updateStats()
        displayMembers()
        setupPagination()
      } else {
        allMembers = []
        filteredMembers = []
        updateStats()
        showNoData()
      }
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error loading member data. Please refresh the page.")
    } finally {
      showLoading(false)
    }
  }

  // Rest of the functions remain the same...
  function updateStats() {
    const totalMembers = allMembers.length
    const pendingMembers = allMembers.filter((member) => !member.idCardIssued).length
    const today = new Date().toISOString().split("T")[0]
    const todayRegistrations = allMembers.filter((member) => member.submissionDate === today).length

    document.getElementById("totalMembers").textContent = totalMembers
    document.getElementById("pendingMembers").textContent = pendingMembers
    document.getElementById("todayRegistrations").textContent = todayRegistrations
  }

  function displayMembers() {
    const tableBody = document.getElementById("membersTableBody")
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = startIndex + recordsPerPage
    const membersToShow = filteredMembers.slice(startIndex, endIndex)

    if (membersToShow.length === 0) {
      showNoData()
      return
    }

    tableBody.innerHTML = membersToShow
      .map(
        (member) => `
            <tr>
                <td>
                    <img src="${member.photoUrl || "/placeholder.svg?height=50&width=50"}" 
                         alt="Photo" 
                         class="photo-thumbnail" 
                         onclick="openImageModal('${member.photoUrl || "/placeholder.svg?height=400&width=400"}', '${member.fullName}')">
                </td>
                <td>${member.fullName}</td>
                <td>${formatDate(member.dateOfBirth)}</td>
                <td>${member.gender}</td>
                <td>${member.regionalBranch}</td>
                <td>${member.membershipId}</td>
                <td>
                    <span class="status-badge ${member.declaration ? "completed" : "pending"}">
                        ${member.declaration ? "Completed" : "Pending"}
                    </span>
                </td>
                <td>${formatDateTime(member.submissionDateTime)}</td>
                <td>
                    <input type="checkbox" 
                           class="id-card-checkbox" 
                           ${member.idCardIssued ? "checked" : ""} 
                           onchange="toggleIdCardStatus('${member.id}', this.checked)">
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="openEditModal('${member.id}')">Edit</button>
                        <button class="action-btn delete-btn" onclick="openDeleteModal('${member.id}', '${member.fullName}')">Delete</button>
                    </div>
                </td>
            </tr>
        `,
      )
      .join("")

    updatePaginationInfo()
  }

  // Continue with all the other functions from the original dashboard.js...
  // (The rest of the functions remain exactly the same)

  function performSearch() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()

    if (!searchTerm) {
      filteredMembers = [...allMembers]
    } else {
      filteredMembers = allMembers.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchTerm) ||
          member.membershipId.toLowerCase().includes(searchTerm) ||
          (member.businessName && member.businessName.toLowerCase().includes(searchTerm)),
      )
    }

    currentPage = 1
    displayMembers()
    setupPagination()
  }

  function applyFilters() {
    const filters = {
      gender: document.getElementById("genderFilter").value,
      district: document.getElementById("districtFilter").value,
      branch: document.getElementById("branchFilter").value,
      education: document.getElementById("educationFilter").value,
      dateFrom: document.getElementById("dateFromFilter").value,
      dateTo: document.getElementById("dateToFilter").value,
    }

    filteredMembers = allMembers.filter((member) => {
      if (filters.gender && member.gender !== filters.gender) return false
      if (filters.district && member.fdagDistrict !== filters.district) return false
      if (filters.branch && member.regionalBranch !== filters.branch) return false
      if (filters.education && member.education !== filters.education) return false

      if (filters.dateFrom) {
        const memberDate = new Date(member.submissionDate)
        const fromDate = new Date(filters.dateFrom)
        if (memberDate < fromDate) return false
      }

      if (filters.dateTo) {
        const memberDate = new Date(member.submissionDate)
        const toDate = new Date(filters.dateTo)
        if (memberDate > toDate) return false
      }

      return true
    })

    currentPage = 1
    displayMembers()
    setupPagination()
  }

  function clearFilters() {
    document.getElementById("genderFilter").value = ""
    document.getElementById("districtFilter").value = ""
    document.getElementById("branchFilter").value = ""
    document.getElementById("educationFilter").value = ""
    document.getElementById("dateFromFilter").value = ""
    document.getElementById("dateToFilter").value = ""
    document.getElementById("searchInput").value = ""

    filteredMembers = [...allMembers]
    currentPage = 1
    displayMembers()
    setupPagination()
  }

  function setupPagination() {
    const totalPages = Math.ceil(filteredMembers.length / recordsPerPage)
    const pageNumbers = document.getElementById("pageNumbers")

    // Update pagination buttons
    document.getElementById("prevPageBtn").disabled = currentPage === 1
    document.getElementById("nextPageBtn").disabled = currentPage === totalPages || totalPages === 0

    // Generate page numbers
    pageNumbers.innerHTML = ""
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement("button")
      pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`
      pageBtn.textContent = i
      pageBtn.onclick = () => changePage(i)
      pageNumbers.appendChild(pageBtn)
    }
  }

  function changePage(page) {
    const totalPages = Math.ceil(filteredMembers.length / recordsPerPage)
    if (page >= 1 && page <= totalPages) {
      currentPage = page
      displayMembers()
      setupPagination()
    }
  }

  function updatePaginationInfo() {
    const startIndex = (currentPage - 1) * recordsPerPage + 1
    const endIndex = Math.min(currentPage * recordsPerPage, filteredMembers.length)
    const total = filteredMembers.length

    document.getElementById("paginationInfo").textContent = `Showing ${startIndex}-${endIndex} of ${total} members`
  }

  async function toggleIdCardStatus(memberId, isChecked) {
    try {
      await database.ref(`members/${memberId}/idCardIssued`).set(isChecked)

      // Update local data
      const member = allMembers.find((m) => m.id === memberId)
      if (member) {
        member.idCardIssued = isChecked
      }

      updateStats()
    } catch (error) {
      console.error("Error updating ID card status:", error)
      alert("Error updating ID card status. Please try again.")
    }
  }

  function exportData(data) {
    if (data.length === 0) {
      alert("No data to export.")
      return
    }

    const headers = [
      "Full Name",
      "Date of Birth",
      "Gender",
      "Contact Number",
      "National ID",
      "FDAG District",
      "Regional Branch",
      "Education Level",
      "Emergency Contact Name",
      "Emergency Contact Number",
      "Home Address",
      "GPS Address",
      "Membership Type",
      "Business Name",
      "Business Location",
      "Business GPS",
      "Business Registration Number",
      "TIN Number",
      "Social Media",
      "Position",
      "Years in Business",
      "Trade Skills",
      "Membership ID",
      "Declaration",
      "Submission Date",
      "ID Card Issued",
    ]

    const csvContent = [
      headers.join(","),
      ...data.map((member) =>
        [
          `"${member.fullName || ""}"`,
          `"${member.dateOfBirth || ""}"`,
          `"${member.gender || ""}"`,
          `"${member.contactNumber || ""}"`,
          `"${member.nationalId || ""}"`,
          `"${member.fdagDistrict || ""}"`,
          `"${member.regionalBranch || ""}"`,
          `"${member.education || ""}"`,
          `"${member.emergencyContactName || ""}"`,
          `"${member.emergencyContactNumber || ""}"`,
          `"${member.homeAddress || ""}"`,
          `"${member.gpsAddress || ""}"`,
          `"${member.membershipType || ""}"`,
          `"${member.businessName || ""}"`,
          `"${member.businessLocation || ""}"`,
          `"${member.businessGps || ""}"`,
          `"${member.businessRegNumber || ""}"`,
          `"${member.tinNumber || ""}"`,
          `"${member.socialMedia || ""}"`,
          `"${member.position || ""}"`,
          `"${member.yearsInBusiness || ""}"`,
          `"${Array.isArray(member.tradeSkills) ? member.tradeSkills.join("; ") : ""}"`,
          `"${member.membershipId || ""}"`,
          `"${member.declaration ? "Yes" : "No"}"`,
          `"${member.submissionDate || ""}"`,
          `"${member.idCardIssued ? "Yes" : "No"}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `FDAG_Members_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function showLoading(show) {
    const loadingIndicator = document.getElementById("loadingIndicator")
    const tableBody = document.getElementById("membersTableBody")
    const noDataMessage = document.getElementById("noDataMessage")

    if (show) {
      loadingIndicator.style.display = "block"
      tableBody.innerHTML = ""
      noDataMessage.style.display = "none"
    } else {
      loadingIndicator.style.display = "none"
    }
  }

  function showNoData() {
    document.getElementById("membersTableBody").innerHTML = ""
    document.getElementById("noDataMessage").style.display = "block"
    document.getElementById("paginationInfo").textContent = "Showing 0-0 of 0 members"
  }

  // Global functions for modal operations
  window.openImageModal = (imageUrl, memberName) => {
    document.getElementById("modalImage").src = imageUrl
    document.getElementById("downloadImageBtn").href = imageUrl
    document.getElementById("downloadImageBtn").download = `${memberName}_photo.jpg`
    document.getElementById("imageModal").style.display = "flex"
  }

  window.closeImageModal = () => {
    document.getElementById("imageModal").style.display = "none"
  }

  window.openEditModal = (memberId) => {
    const member = allMembers.find((m) => m.id === memberId)
    if (!member) return

    currentEditMemberId = memberId

    // Populate form fields
    document.getElementById("editMemberId").value = memberId
    document.getElementById("editFullName").value = member.fullName || ""
    document.getElementById("editContactNumber").value = member.contactNumber || ""
    document.getElementById("editGender").value = member.gender || ""
    document.getElementById("editEducation").value = member.education || ""
    document.getElementById("editHomeAddress").value = member.homeAddress || ""

    document.getElementById("editModal").style.display = "flex"
  }

  window.closeEditModal = () => {
    document.getElementById("editModal").style.display = "none"
    currentEditMemberId = null
  }

  window.saveEdit = () => {
    if (!currentEditMemberId) return

    const updatedData = {
      fullName: document.getElementById("editFullName").value,
      contactNumber: document.getElementById("editContactNumber").value,
      gender: document.getElementById("editGender").value,
      education: document.getElementById("editEducation").value,
      homeAddress: document.getElementById("editHomeAddress").value,
    }

    // Confirm before saving
    if (confirm("Are you sure you want to save these changes?")) {
      database
        .ref(`members/${currentEditMemberId}`)
        .update(updatedData)
        .then(() => {
          alert("Member information updated successfully!")
          window.closeEditModal()
          loadDashboardData() // Reload data
        })
        .catch((error) => {
          console.error("Error updating member:", error)
          alert("Error updating member information. Please try again.")
        })
    }
  }

  window.openDeleteModal = (memberId, memberName) => {
    currentDeleteMemberId = memberId
    document.getElementById("deleteMemberName").textContent = memberName
    document.getElementById("deleteModal").style.display = "flex"
  }

  window.closeDeleteModal = () => {
    document.getElementById("deleteModal").style.display = "none"
    currentDeleteMemberId = null
  }

  window.confirmDelete = () => {
    if (!currentDeleteMemberId) return

    database
      .ref(`members/${currentDeleteMemberId}`)
      .remove()
      .then(() => {
        alert("Successfully deleted member")
        window.closeDeleteModal()
        loadDashboardData() // Reload data
      })
      .catch((error) => {
        console.error("Error deleting member:", error)
        alert("Error deleting member. Please try again.")
      })
  }

  // Make toggleIdCardStatus globally available
  window.toggleIdCardStatus = toggleIdCardStatus

  // Close modals when clicking outside
  window.addEventListener("click", (event) => {
    const modals = ["imageModal", "editModal", "deleteModal"]
    modals.forEach((modalId) => {
      const modal = document.getElementById(modalId)
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  })
})

const regionDistrictMap = {
  "Greater Accra": [
  "Ablekuma Central Municipal","Ablekuma North","Ablekuma West","Accra Metropolitan","Ada East District","Adentan Municipal",
  "Ashaiman Municipal","Ayawaso Central","Ayawaso East Municipal",
  "Ayawaso North Municipal","Ayawaso West Municipal","Ga Central District","Ga East",
  "Ga North Municipal","Ga South District",
  "Ga West District","Korle Klottey Municipal","Kpone Katamanso Municipal","Krowor Municipal","La Dadekotopon BAC","La Nkwantanang","Ledzokuku Municipal",
  "Ningo-Prampram","Okaikwei North Municipal","Shai Osudoku District","Tema Metropolitan","Tema West Municipal","Weija Gbawe Municipal"
],

  "Ashanti": [
  "Adansi Asokwa","Adansi North","Adansi South","Afigya Kwabre","Afigya Kwabre North","Ahafo Ano North Municipal","Ahafo Ano South East","Ahafo Ano South West","Akrofuom District","Amansie Central","Amansie South","Amansie West","Asante Akim Central","Asante Akim South Municipal","Asante Akim North District","Asokore Municipal","Asokore Mampong Municipal","Asokwa Municipal","Atwima Kwanwoma","Atwima Mponua","Atwima Nwabiagya","Atwima Nwabiagya North","Bekwai Municipal","Bosome Freho-Asiwa","Bosomtwe District","Ejisu Municipal","Ejura Sekyeredumase Municipal","Juaben Municipal",
  "Kumasi Metro","Kwabre East Municipal","Kwadaso Municipal","Mampong Municipal","Obuasi East","Obuasi Municipal","Offinso Municipal","Offinso North","Oforikrom Municipal","Sekyere Afram Plains","Sekyere Central","Sekyere East","Sekyere Kumawu","Sekyere South","Suame Municipal","Tano Municipal"
],

  "Central": [
  "Abura Asebu Kwamankese District","Agona East District","Agona West District","Ajumako Enyan Essiam District","Asikuma Odoben Brakwa District","Assin Central Municipal","Assin North","Assin South Municipal","Awutu Senya East Municipal","Awutu Senya West Municipal","Cape Coast Metropolitan","Effutu Municipal","Ekumfi District","Gomoa Central District","Gomoa East","Gomoa West District","Komenda Edina Eguafo Abirem Municipal","Mfantseman Municipal","Twifo Atti Morkwa District","Twifo Hemang Lower Denkyira District","Upper Denkyira East District","Upper Denkyira West District"
],

  "Western": [
  "Ahanta West Municipal","Amenfi Central District","Effia Kwesimintsim District","Ellembele District","Jomoro Municipal","Mporhor District","Nzema East Municipal","Prestea Huni-Valley Municipal","Sekondi Takoradi Metropolitan Assembly","Shama District","Tarkwa Nsuaem Municipal","Wassa Amenfi East","Wassa Amenfi West","Wassa East"
],


  "Eastern": [
  "Abuakwa North Municipal","Abuakwa South Municipal","Achiase District","Akwapim South","Akwapim North","Akyemansa","Asene Manso Akroso",
  "Asuogyaman District","Atiwa East",
  "Atiwa West","Ayensuano",
  "Birim Central","Birim North",
  "Birim South","Denkyembour District","Fanteakwa","Fanteakwa South",
  "Kwaebibirem Municipal","Kwahu Afram Plains North","Kwahu Afram Plains South","Kwahu East","Kwahu South","Kwahu West","Lower Manya Krobo","New Juaben North","New Juaben South Municipal","Nsawam Adoagyiri","Okere","Suhum Municipal","Upper Manya Krobo","Upper West Akim","West Akim","Yilo Krobo"
],

  "Volta": [
  "Adaklu Waya","Afadzato South District","Agotime Ziope District","Akatsi North District","Anloga District","Central Tongu District","Ho Municipal","Ho West District","Hohoe Municipal","Keta Municipal","Ketu North Municipal","Ketu South Municipal","Kpando Municipal","North Dayi District","North Tongu","South Dayi District","South Tongu District"
],


  "Northern": [
  "Gushegu Municipal","Karaga District","Kpandai District","Kumbungu District","Mion District","Nanton District","Nanumba North Municipal","Saboba District","Sagnarigu Municipal","Savelugu Municipal","Tamale Metro","Tatale-Sanguli District","Tolon District","Yendi Municipal","Zabzugu District"
],

  "Upper West": [
  "Daffiama-Bussie-Issah","Jirapa Municipal","Lambussie Karni District","Lawra Municipal","Nadowli-Kaleo District","Nandom District","Sissala East Municipal","Sissala West District","Wa East District","Wa Municipal","Wa West District"
],

"Upper East": [
  "Bawku Municipal","Bawku West District","Binduri District","Bolgatanga East District","Bolgatanga Municipal","Bongo District","Builsa North District","Builsa South District","Garu District","Kassena-Nankana Municipal","Kassena-Nankana West","Nabdam District","Pusiga District","Talensi District"
],

"Bono": ["Banda","Berekum Municipal","Brekum West","Dormaa Central Municipal","Dormaa East","Dormaa West","Jaman North","Jaman South","Sunyani","Sunyani West","Tain","Wenchi Municipal"
],

"Bono East": [
  "Atebubu-Amantin Municipal","Kintampo North","Kintampo South","Nkoranza North Municipal","Nkoranza South Municipal","Pru East","Pru West","Sene East","Sene West","Techiman North","Techiman South Municipal"
],

  "Ahafo": [
  "Asunafo North","Asunafo South","Asutifi North","Asutifi South","Tano North","Tano South Municipal"
],

  "Western North": [
  "Aowin Municipal","Bia East District","Bia West District","Bibiani Anhwiaso Bekwai District","Bodi District","Juaboso District","Sefwi Akontombra District","Sefwi Wiawso Municipal","Suaman District"
],

  "Oti": [
  "Biakoye District","Guan District","Jasikan District","Kadjebi Districts","Krachi East Municipal","Krachi Nchumuru District","Krakye West District","Nkwanta North District","Nkwanta South Municipal"
],

  "Savannah": [
  "Bole District","Central Gonja District","East Gonja District","North Gonja District","Northeast Gonja","Sawla-Tuna-Kalba District","West Gonja Municipal"
],

  "North East": [
  "Bunkpurugu District","Chereponi District","East Mamprusi Municipal","Mamprugu Moagduri District","West Mamprusi Municipal","Yunyoo-Nasuan District"
],
}

function populateDistrictFilter() {
  const districtFilter = document.getElementById("districtFilter")
  const allDistricts = []

  // Collect all unique districts
  Object.values(regionDistrictMap).forEach(districts => {
    allDistricts.push(...districts)
  })

  // Sort and remove duplicates just in case
  const uniqueDistricts = [...new Set(allDistricts)].sort()

  // Populate select element
  uniqueDistricts.forEach(district => {
    const option = document.createElement("option")
    option.value = district
    option.textContent = district
    districtFilter.appendChild(option)
  })
}

// Call it when the page loads
document.addEventListener("DOMContentLoaded", populateDistrictFilter)