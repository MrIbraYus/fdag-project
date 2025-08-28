document.addEventListener("DOMContentLoaded", () => {
  const registrationForm = document.getElementById("registrationForm")
  const submitBtn = document.getElementById("submitBtn")
  const photoInput = document.getElementById("photo")
  const photoPreview = document.getElementById("photoPreview")

  // Use global variables
  const database = window.database
  const generateMembershipId = window.generateMembershipId
  const CLOUDINARY_CONFIG = window.CLOUDINARY_CONFIG

  // Photo preview functionality
  photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        photoPreview.innerHTML = `<img src="${e.target.result}" alt="Photo Preview" style="max-width: 100px; max-height: 100px; border-radius: 8px;">`
      }
      reader.readAsDataURL(file)
    }
  })

  // Handle "Others" radio button
  const membershipTypeRadios = document.querySelectorAll('input[name="membershipType"]')
  const otherMembershipInput = document.getElementById("otherMembershipType")

  membershipTypeRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "Others") {
        otherMembershipInput.style.display = "block"
        otherMembershipInput.required = true
      } else {
        otherMembershipInput.style.display = "none"
        otherMembershipInput.required = false
        otherMembershipInput.value = ""
      }
    })
  })

  // Handle "Others" checkbox for trade skills
  const tradeSkillsCheckboxes = document.querySelectorAll('input[name="tradeSkills"]')
  const otherTradeSkillsInput = document.getElementById("otherTradeSkills")

  tradeSkillsCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      if (this.value === "Others" && this.checked) {
        otherTradeSkillsInput.style.display = "block"
      } else if (this.value === "Others" && !this.checked) {
        otherTradeSkillsInput.style.display = "none"
        otherTradeSkillsInput.value = ""
      }
    })
  })

  // Form submission
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    showLoading(true)

    try {
      // Upload photo to Cloudinary
      const photoFile = photoInput.files[0]
      let photoUrl = ""

      if (photoFile) {
        photoUrl = await uploadToCloudinary(photoFile)
      }

      // Generate membership ID
      const branchSelect = document.getElementById("regionalBranch")
      const selectedOption = branchSelect.options[branchSelect.selectedIndex]
      const branchCode = selectedOption.getAttribute("data-code") || ""
      const membershipId = generateMembershipId(branchCode)

      // Collect form data
      const formData = collectFormData()
      formData.membershipId = membershipId
      formData.photoUrl = photoUrl
      formData.submissionDate = new Date().toISOString().split("T")[0]
      formData.submissionTime = new Date().toLocaleTimeString()
      formData.submissionDateTime = new Date().toISOString()
      formData.idCardIssued = false

      // Save to Firebase
      await database.ref("members").push(formData)

      // Show success modal
      showSuccessModal(membershipId)
    } catch (error) {
      console.error("Registration error:", error)
      alert("Registration failed. Please try again.")
    } finally {
      showLoading(false)
    }
  })

  function collectFormData() {
    const formData = {}

    // Basic form fields
    const fields = [
      "fullName",
      "dateOfBirth",
      "gender",
      "contactNumber",
      "nationalId",
      "fdagDistrict",
      "regionalBranch",
      "education",
      "emergencyContactName",
      "emergencyContactNumber",
      "homeAddress",
      "gpsAddress",
      "businessName",
      "businessLocation",
      "businessGps",
      "businessRegNumber",
      "tinNumber",
      "socialMedia",
      "position",
      "yearsInBusiness",
    ]

    fields.forEach((field) => {
      const element = document.getElementById(field)
      if (element) {
        formData[field] = element.value
      }
    })

    // Membership type
    const membershipType = document.querySelector('input[name="membershipType"]:checked')
    if (membershipType) {
      formData.membershipType = membershipType.value
      if (membershipType.value === "Others") {
        formData.otherMembershipType = document.getElementById("otherMembershipType").value
      }
    }

    // Trade skills
    const tradeSkills = []
    const tradeSkillsCheckboxes = document.querySelectorAll('input[name="tradeSkills"]:checked')
    tradeSkillsCheckboxes.forEach((checkbox) => {
      tradeSkills.push(checkbox.value)
    })
    formData.tradeSkills = tradeSkills

    if (tradeSkills.includes("Others")) {
      formData.otherTradeSkills = document.getElementById("otherTradeSkills").value
    }

    // Declaration
    formData.declaration = document.getElementById("declaration").checked

    return formData
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset)

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()
    return data.secure_url
  }

  function showLoading(loading) {
    const btnText = submitBtn.querySelector(".btn-text")
    const spinner = submitBtn.querySelector(".loading-spinner")

    if (loading) {
      btnText.style.display = "none"
      spinner.style.display = "block"
      submitBtn.disabled = true
    } else {
      btnText.style.display = "block"
      spinner.style.display = "none"
      submitBtn.disabled = false
    }
  }

  function showSuccessModal(membershipId) {
    document.getElementById("generatedMembershipId").textContent = membershipId
    document.getElementById("successModal").style.display = "flex"
  }

  // Add scroll animations
  const animatedElements = document.querySelectorAll(".animate-fade-in, .animate-slide-up")
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  })

  animatedElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out"
    observer.observe(el)
  })
})

function closeSuccessModal() {
  document.getElementById("successModal").style.display = "none"
  // Reset form
  document.getElementById("registrationForm").reset()
  document.getElementById("photoPreview").innerHTML = ""
}

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

// Region selector
const regionalBranch = document.getElementById("regionalBranch")
const districtSelect = document.getElementById("fdagDistrict")

regionalBranch.addEventListener("change", () => {
  const selectedRegion = regionalBranch.value
  const districts = regionDistrictMap[selectedRegion] || []

  // Clear current district options
  districtSelect.innerHTML = `<option value="">Select District</option>`

  // Populate new districts
  districts.forEach(district => {
    const option = document.createElement("option")
    option.value = district
    option.textContent = district
    districtSelect.appendChild(option)
  })
})

