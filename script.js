/**
 * EL ASSIMA EGYPT - Core Logic
 * Access Codes: 0101 (Saisie) | 2020 (Full Access)
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
let userAccessLevel = null;

// --- APP LIFECYCLE ---
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  document.getElementById('current-date').textContent = now.toLocaleDateString('fr-FR');

  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.opacity = '0';
    setTimeout(() => { splash.style.display = 'none'; }, 800);
  }, 2000);

  // Auto-submit PIN after 4 digits
  const pinInput = document.getElementById('pin-input');
  if (pinInput) {
    pinInput.addEventListener('input', (e) => {
      if (e.target.value.length === 4) handleLogin();
    });
    pinInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
  }

  initFirebaseListeners();
});

// --- AUTH ---
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
    errorMsg.textContent = "Code PIN invalide";
    pinInput.value = "";
    setTimeout(() => { errorMsg.textContent = ""; }, 3000);
  }
}

function unlockApp() {
  document.getElementById('login-screen').classList.add('hidden');
  const app = document.getElementById('app');
  app.style.display = 'flex';
  setTimeout(() => app.classList.add('visible'), 50);

  // Apply Permissions
  if (userAccessLevel === 'form') {
    document.getElementById('nav-list').style.display = 'none';
    switchPage('form');
  } else {
    document.getElementById('nav-list').style.display = 'flex';
  }
  
  showToast("🔓 Session ouverte");
}

function logout() {
  location.reload(); 
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
  document.getElementById(`btn-tab-${tabId}`).classList.add('active');
}

// --- FORM ---
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
  submitBtn.textContent = "CHARGEMENT...";

  try {
    await db.collection("registrations").add(data);
    showToast("✅ Enregistrement réussi !");
    event.target.reset();
    if (userAccessLevel === 'full') {
       setTimeout(() => switchPage('list'), 1000);
    }
  } catch (error) {
    showToast("❌ Erreur de réseau");
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
    const emptyMsg = '<p style="text-align:center; padding:2rem; color:rgba(255,255,255,0.1)">Aucune donnée disponible</p>';
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
        <span class="entry-dates">${label}: <b>${formatDate(dateToShow)}</b><br>Séjour: ${formatDate(data.arrival)} au ${formatDate(data.departure)}</span>
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
