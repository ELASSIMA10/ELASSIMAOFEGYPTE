/**
 * EL ASSIMA EGYPT - Logic for Registration & Planning
 * With Access Controls:
 * 0101 -> Saisie Only
 * 2020 -> Full Access
 */

const firebaseConfig = {
  apiKey: "AIzaSyBgK8ZKmZ0N329vOTfpiAyYAhPu_mhyTAM",
  authDomain: "app-10-1b5fd.firebaseapp.com",
  projectId: "app-10-1b5fd",
  storageBucket: "app-10-1b5fd.appspot.com",
  messagingSenderId: "179443689337",
  appId: "1:179443689337:web:31ca73ac50811b286931a8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allRegistrations = [];
let userAccessLevel = null; // 'form' or 'full'

// --- APP LIFECYCLE ---
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; }, 800);
  }, 2000);

  initFirebaseListeners();
});

// --- AUTH LOGIC ---
function handleLogin() {
  const pinInput = document.getElementById('pin-input');
  const errorMsg = document.getElementById('pin-error');
  const pin = pinInput.value;

  if (pin === "0101") {
    userAccessLevel = 'form';
    unlockApp();
  } else if (pin === "2020") {
    userAccessLevel = 'full';
    unlockApp();
  } else {
    errorMsg.textContent = "Code incorrect";
    pinInput.value = "";
    setTimeout(() => { errorMsg.textContent = ""; }, 3000);
  }
}

function unlockApp() {
  document.getElementById('login-screen').style.display = 'none';
  const app = document.getElementById('app');
  app.style.display = 'flex';

  // Apply restrictions
  if (userAccessLevel === 'form') {
    document.getElementById('nav-list').style.display = 'none';
    switchPage('form');
  } else {
    document.getElementById('nav-list').style.display = 'flex';
  }
  
  showToast("✅ Bienvenue");
}

function logout() {
  location.reload(); // Simple way to reset state and show login
}

// --- NAVIGATION ---
function switchPage(pageId) {
  if (userAccessLevel === 'form' && pageId === 'list') return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  
  document.getElementById(`page-${pageId}`).classList.add('active');
  document.getElementById(`nav-${pageId}`).classList.add('active');
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.view-tabs button').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`tab-${tabId}`).classList.add('active');
  event.currentTarget.classList.add('active');
}

// --- FORM SUBMISSION ---
async function submitForm(event) {
  event.preventDefault();
  const submitBtn = event.target.querySelector('button');
  
  const data = {
    fullname: document.getElementById('fullname').value,
    arrival: document.getElementById('arrival-date').value,
    departure: document.getElementById('departure-date').value,
    zone: document.getElementById('zone').value,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "EN COURS...";

  try {
    await db.collection("registrations").add(data);
    showToast("✅ Enregistré !");
    event.target.reset();
    if (userAccessLevel === 'full') switchPage('list');
  } catch (error) {
    showToast("❌ Erreur");
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "ENREGISTRER";
  }
}

// --- REAL-TIME DATA ---
function initFirebaseListeners() {
  db.collection("registrations").onSnapshot((snapshot) => {
    allRegistrations = [];
    snapshot.forEach(doc => allRegistrations.push({ id: doc.id, ...doc.data() }));
    renderLists();
  });
}

function renderLists() {
  const arrivalsContainer = document.getElementById('arrivals-container');
  const departuresContainer = document.getElementById('departures-container');

  const sortedByArrival = [...allRegistrations].sort((a, b) => a.arrival.localeCompare(b.arrival));
  const sortedByDeparture = [...allRegistrations].sort((a, b) => a.departure.localeCompare(b.departure));

  arrivalsContainer.innerHTML = sortedByArrival.map(reg => createCard(reg, 'arrival')).join('');
  departuresContainer.innerHTML = sortedByDeparture.map(reg => createCard(reg, 'departure')).join('');

  if (allRegistrations.length === 0) {
    const emptyMsg = '<p style="text-align:center; padding:2rem; color:rgba(255,255,255,0.2)">Aucune donnée</p>';
    arrivalsContainer.innerHTML = emptyMsg;
    departuresContainer.innerHTML = emptyMsg;
  }
}

function createCard(data, type) {
  const dateToShow = type === 'arrival' ? data.arrival : data.departure;
  const label = type === 'arrival' ? 'Arrivée' : 'Sortie';
  return `
    <div class="entry-card">
      <div class="entry-info">
        <span class="entry-name">${data.fullname}</span>
        <span class="entry-dates">${label} : <b>${formatDate(dateToShow)}</b></span>
      </div>
      <div class="entry-zone">${data.zone}</div>
    </div>
  `;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = "show";
  setTimeout(() => { toast.className = ""; }, 3000);
}
