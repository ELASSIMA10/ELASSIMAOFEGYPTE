/**
 * EL ASSIMA EGYPT - Core Logic
 */

const firebaseConfig = {
  apiKey: "AIzaSyBgK8ZKmZ0N329vOTfpiAyYAhPu_mhyTAM",
  authDomain: "app-10-1b5fd.firebaseapp.com",
  projectId: "app-10-1b5fd",
  storageBucket: "app-10-1b5fd.appspot.com",
  messagingSenderId: "179443689337",
  appId: "1:179443689337:web:31ca73ac50811b286931a8"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allRegistrations = [];
let userAccessLevel = null;

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    // Current Date
    const now = new Date();
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.textContent = now.toLocaleDateString('fr-FR');

    // Splash
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => splash.style.display = 'none', 800);
        }
    }, 2000);

    // PIN Input Handling
    const pinInput = document.getElementById('pin-input');
    if (pinInput) {
        pinInput.addEventListener('input', (e) => {
            if (e.target.value.length === 4) handleLogin();
        });
        pinInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleLogin();
        });
    }

    initFirebaseListeners();
});

// --- AUTH LOGIC ---
function handleLogin() {
    const pinInput = document.getElementById('pin-input');
    const errorMsg = document.getElementById('pin-error');
    if (!pinInput) return;

    const pin = pinInput.value.trim();

    if (pin === "0101") {
        userAccessLevel = 'form';
        unlockApp();
    } else if (pin === "2020") {
        userAccessLevel = 'full';
        unlockApp();
    } else if (pin.length === 4) {
        if (errorMsg) {
            errorMsg.textContent = "CODE INCORRECT";
            setTimeout(() => { errorMsg.textContent = ""; }, 2000);
        }
        pinInput.value = "";
    }
}

function unlockApp() {
    const loginScreen = document.getElementById('login-screen');
    const app = document.getElementById('app');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (app) {
        app.style.display = 'flex';
        setTimeout(() => app.classList.add('visible'), 50);
    }

    // Permissions
    const navList = document.getElementById('nav-list');
    if (userAccessLevel === 'form') {
        if (navList) navList.style.display = 'none';
        switchPage('form');
    } else {
        if (navList) navList.style.display = 'flex';
    }
    
    showToast("🔓 SESSION ACTIVÉE");
}

function logout() {
    location.reload(); 
}

// --- NAVIGATION ---
function switchPage(pageId) {
    if (userAccessLevel === 'form' && pageId === 'list') return;

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageId}`);
    const targetNav = document.getElementById(`nav-${pageId}`);
    
    if (targetPage) targetPage.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.view-tabs button').forEach(b => b.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabId}`);
    const targetBtn = document.getElementById(`btn-tab-${tabId}`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetBtn) targetBtn.classList.add('active');
}

// --- DATA ---
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

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "ENVOI...";
    }

    try {
        await db.collection("registrations").add(data);
        showToast("✅ RÉSERVÉ !");
        event.target.reset();
        if (userAccessLevel === 'full') {
            setTimeout(() => switchPage('list'), 800);
        }
    } catch (error) {
        showToast("❌ ERREUR RÉSEAU");
        console.error(error);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "VALIDER";
        }
    }
}

function initFirebaseListeners() {
    db.collection("registrations").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        allRegistrations = [];
        snapshot.forEach(doc => allRegistrations.push({ id: doc.id, ...doc.data() }));
        renderLists();
    });
}

function renderLists() {
    const arrivalsContainer = document.getElementById('arrivals-container');
    const departuresContainer = document.getElementById('departures-container');
    if (!arrivalsContainer || !departuresContainer) return;

    const sortedByArrival = [...allRegistrations].sort((a, b) => (a.arrival || "").localeCompare(b.arrival || ""));
    const sortedByDeparture = [...allRegistrations].sort((a, b) => (a.departure || "").localeCompare(b.departure || ""));

    arrivalsContainer.innerHTML = sortedByArrival.map(reg => createCard(reg, 'arrival')).join('');
    departuresContainer.innerHTML = sortedByDeparture.map(reg => createCard(reg, 'departure')).join('');

    if (allRegistrations.length === 0) {
        const empty = '<p style="text-align:center; padding:2rem; opacity:0.3">VIDE</p>';
        arrivalsContainer.innerHTML = empty;
        departuresContainer.innerHTML = empty;
    }
}

function createCard(data, type) {
    const dateToShow = type === 'arrival' ? data.arrival : data.departure;
    const label = type === 'arrival' ? 'ARRIVÉE' : 'SORTIE';
    return `
        <div class="entry-card">
            <div class="entry-info">
                <span class="entry-name">${data.fullname}</span>
                <span class="entry-dates">${label}: <b>${formatDate(dateToShow)}</b></span>
            </div>
            <div class="entry-zone">${data.zone}</div>
        </div>
    `;
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.className = "show";
        setTimeout(() => { toast.className = ""; }, 3000);
    }
}
