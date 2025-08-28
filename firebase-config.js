
// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBIXLuTbVGQQ_AIEiux4aUxPUXM3X0kmt8",
  authDomain: "try-works-cf160.firebaseapp.com",
  databaseURL: "https://try-works-cf160-default-rtdb.firebaseio.com",
  projectId: "try-works-cf160",
  storageBucket: "try-works-cf160.appspot.com", // Fixed typo here
  messagingSenderId: "1054086023674",
  appId: "1:1054086023674:web:ece08f3e8e6f3a91293c43",
  measurementId: "G-CWNFCBEW2K"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
const auth = firebase.auth();

// This now works because the compat database library is loaded
const database = firebase.database()

// Cloudinary configuration - UPDATE THESE WITH YOUR CLOUDINARY CREDENTIALS
const CLOUDINARY_CONFIG = {
  cloudName: "drtbjmsir", 
  uploadPreset: "brimx_unsigned", 
}

// Utility functions
function generateMembershipId(branchCode) {
  const uniqueId = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `FDAG/${branchCode}/${uniqueId}`
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-GB")
}

function formatDateTime(date) {
  return new Date(date).toLocaleString("en-GB")
}

// Branch code mapping
const BRANCH_CODES = {
  "Greater Accra": "GA",
  "Ashanti": "AS",
  "Central": "CR",
  "Western": "WR",
  "Eastern": "ER",
  "Volta": "VR",
  "Northern": "NR",
  "Upper East": "UE",
  "Upper West": "UW",
  "Bono": "BO",
  "Bono East": "BE",
  "Ahafo": "AH",
  "Western North": "WN",
  "Oti": "OT",
  "Savannah": "SV",
  "North East": "NE"
}

// Make functions globally available
window.generateMembershipId = generateMembershipId
window.formatDate = formatDate
window.formatDateTime = formatDateTime
window.BRANCH_CODES = BRANCH_CODES
window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG
window.auth = auth
window.database = database
