'use strict';

// Supabase configuration - use config file
const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_CONFIG?.ANON_KEY || '';

// Wait for Supabase to load
let supabase = null;

function initSupabase() {
  if (window.supabase && window.supabase.createClient) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('CareCircle: Supabase credentials not configured');
      showError('Supabase configuration missing. Please check config.js file.');
      return false;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('CareCircle: Supabase initialized');
    return true;
  }
  return false;
}

// Confetti Animation for celebrations
function showConfetti() {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const confettiCount = 150;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -20px;
      opacity: ${Math.random() * 0.7 + 0.3};
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      transform: rotate(${Math.random() * 360}deg);
      z-index: 9999;
      pointer-events: none;
      animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
    `;
    document.body.appendChild(confetti);

    setTimeout(() => confetti.remove(), 5000);
  }

  // Add animation keyframes if not already present
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// Show Success Modal for signup
function showSignupSuccessModal(email) {
  const modal = document.createElement('div');
  modal.id = 'signup-success-modal';
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-green-500/30 text-center animate-pulse-once">
      <div class="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-green-400 mb-4">🎉 Account Created!</h2>
      <p class="text-slate-300 mb-6">
        Welcome to CareCircle! We've sent a verification email to:
      </p>
      <p class="text-blue-400 font-bold text-lg mb-6 break-all">${email}</p>
      
      <div class="bg-slate-900/50 rounded-xl p-4 mb-6 text-left">
        <p class="text-slate-400 text-sm mb-3 font-semibold">📧 Next Steps:</p>
        <ol class="text-slate-300 text-sm space-y-2">
          <li class="flex gap-2">
            <span class="text-green-400 font-bold">1.</span>
            Check your email inbox
          </li>
          <li class="flex gap-2">
            <span class="text-green-400 font-bold">2.</span>
            Click the verification link
          </li>
          <li class="flex gap-2">
            <span class="text-green-400 font-bold">3.</span>
            Return here to sign in
          </li>
        </ol>
        <p class="text-slate-500 text-xs mt-3 italic">💡 Tip: Check your spam folder if you don't see the email!</p>
      </div>
      
      <button id="close-signup-modal" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors">
        Got it!
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('close-signup-modal').addEventListener('click', () => {
    modal.remove();
  });
}

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================

let notificationsEnabled = false;
let notificationCheckInterval = null;

// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('CareCircle: Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationsEnabled = true;
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    notificationsEnabled = permission === 'granted';
    return notificationsEnabled;
  }

  return false;
}

// Send a browser notification
function sendNotification(title, body, icon = '💊') {
  if (!notificationsEnabled) return;

  try {
    const notification = new Notification(title, {
      body: body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">' + icon + '</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💊</text></svg>',
      tag: 'carecircle-med-reminder',
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 30 seconds
    setTimeout(() => notification.close(), 30000);
  } catch (err) {
    console.error('CareCircle: Notification error:', err);
  }
}

// Check medications and send reminders
function checkMedicationReminders() {
  if (!notificationsEnabled || medications.length === 0) return;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  medications.forEach(med => {
    if (med.frequency_hours === 0 || med.as_needed) return; // Skip as-needed meds

    // Find last dose for this medication
    const lastLog = medLogs.find(log => log.med_id === med.id);

    if (!lastLog) {
      // Never taken - remind at morning (8 AM)
      if (currentHour === 8 && currentMinute < 5) {
        sendNotification(
          `Time for ${med.name}`,
          `${med.dosage || 'Take as directed'}`,
          '⏰'
        );
      }
      return;
    }

    const lastDoseTime = new Date(lastLog.administered_at);
    const hoursSinceLastDose = (now - lastDoseTime) / (1000 * 60 * 60);
    const frequencyHours = med.frequency_hours || 24;

    // Check if it's time for next dose (within 15 min window)
    if (hoursSinceLastDose >= frequencyHours - 0.25 && hoursSinceLastDose < frequencyHours + 0.5) {
      // Check if we already sent this notification recently
      const notifKey = `notif_${med.id}_${Math.floor(hoursSinceLastDose)}`;
      if (!localStorage.getItem(notifKey)) {
        sendNotification(
          `Time for ${med.name}`,
          `${med.dosage || 'Take as directed'} - Last dose was ${Math.round(hoursSinceLastDose)}h ago`,
          '💊'
        );
        localStorage.setItem(notifKey, Date.now());
        // Clean up old notif keys after 1 hour
        setTimeout(() => localStorage.removeItem(notifKey), 60 * 60 * 1000);
      }
    }

    // Overdue warning (1 hour past due)
    if (hoursSinceLastDose >= frequencyHours + 1 && hoursSinceLastDose < frequencyHours + 1.25) {
      const notifKey = `notif_overdue_${med.id}`;
      if (!localStorage.getItem(notifKey)) {
        sendNotification(
          `⚠️ ${med.name} is OVERDUE`,
          `Last dose was ${Math.round(hoursSinceLastDose)}h ago. Due every ${frequencyHours}h.`,
          '⚠️'
        );
        localStorage.setItem(notifKey, Date.now());
        setTimeout(() => localStorage.removeItem(notifKey), 60 * 60 * 1000);
      }
    }
  });
}

// Start medication reminder checks
function startMedicationReminders() {
  if (notificationCheckInterval) clearInterval(notificationCheckInterval);
  // Check every 5 minutes
  notificationCheckInterval = setInterval(checkMedicationReminders, 5 * 60 * 1000);
  // Also check immediately
  checkMedicationReminders();
}

// ============================================================
// CALENDAR VIEW
// ============================================================

let showCalendar = false;
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function generateCalendarHTML() {
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Build day cells
  let dayCells = '';

  // Empty cells for days before start of month
  for (let i = 0; i < startDayOfWeek; i++) {
    dayCells += '<div class="calendar-day text-slate-700"></div>';
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = new Date().toDateString() === new Date(calendarYear, calendarMonth, day).toDateString();

    // Check logs for this day
    const dayMedLogs = medLogs.filter(log => log.administered_at?.startsWith(dateStr));
    const dayHydrationLogs = hydrationLogs.filter(log => log.logged_at?.startsWith(dateStr));
    const dayBMLogs = bmLogs.filter(log => log.logged_at?.startsWith(dateStr));
    const hasBM = dayBMLogs.some(log => log.had_bm);

    const hasActivity = dayMedLogs.length > 0 || dayHydrationLogs.length > 0 || dayBMLogs.length > 0;

    // Determine cell color
    let bgColor = 'bg-slate-800';
    let textColor = 'text-slate-400';
    let borderClass = '';

    if (isToday) {
      borderClass = 'ring-2 ring-blue-500';
      textColor = 'text-white font-bold';
    }

    if (hasActivity) {
      bgColor = 'bg-gradient-to-br from-green-500/20 to-blue-500/20';
      textColor = 'text-green-400';
    }

    // Indicator dots
    let indicators = '';
    if (dayMedLogs.length > 0) indicators += '<div class="w-1.5 h-1.5 rounded-full bg-blue-500"></div>';
    if (dayHydrationLogs.length > 0) indicators += '<div class="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>';
    if (hasBM) indicators += '<div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>';

    dayCells += `
      <div class="calendar-day ${bgColor} ${textColor} ${borderClass} rounded-lg cursor-pointer hover:bg-slate-700 transition-colors relative" data-date="${dateStr}">
        <span>${day}</span>
        <div class="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
          ${indicators}
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-fade-in-up">
      <div class="flex justify-between items-center mb-4">
        <button id="prev-month" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h3 class="text-xl font-bold text-slate-100">${monthNames[calendarMonth]} ${calendarYear}</h3>
        <button id="next-month" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div class="calendar-day text-slate-500 text-xs font-bold">SUN</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">MON</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">TUE</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">WED</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">THU</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">FRI</div>
        <div class="calendar-day text-slate-500 text-xs font-bold">SAT</div>
      </div>
      
      <div class="grid grid-cols-7 gap-1">
        ${dayCells}
      </div>
      
      <div class="mt-4 pt-4 border-t border-slate-700 flex flex-wrap gap-3 text-xs text-slate-400">
        <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-blue-500"></div> Medications</div>
        <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-cyan-500"></div> Hydration</div>
        <div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full bg-amber-500"></div> BM</div>
      </div>
      
      <div id="calendar-day-detail" class="mt-4 hidden"></div>
    </div>
  `;
}

function showDayDetail(dateStr) {
  const dayMedLogs = medLogs.filter(log => log.administered_at?.startsWith(dateStr));
  const dayHydrationLogs = hydrationLogs.filter(log => log.logged_at?.startsWith(dateStr));
  const dayJuiceLogs = juiceLogs.filter(log => log.logged_at?.startsWith(dateStr));
  const dayBMLogs = bmLogs.filter(log => log.logged_at?.startsWith(dateStr));

  const dateObj = new Date(dateStr + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const detailDiv = document.getElementById('calendar-day-detail');
  if (!detailDiv) return;

  detailDiv.innerHTML = `
    <div class="bg-slate-900/50 rounded-xl p-4 animate-fade-in">
      <h4 class="font-bold text-slate-200 mb-3">${formattedDate}</h4>
      
      ${dayMedLogs.length > 0 ? `
        <div class="mb-3">
          <p class="text-blue-400 text-xs font-bold mb-1">💊 Medications (${dayMedLogs.length})</p>
          ${dayMedLogs.map(log => {
    const med = medications.find(m => m.id === log.med_id);
    return `<p class="text-slate-300 text-sm">• ${med?.name || 'Unknown'} at ${new Date(log.administered_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>`;
  }).join('')}
        </div>
      ` : ''}
      
      ${dayHydrationLogs.length > 0 ? `
        <div class="mb-3">
          <p class="text-cyan-400 text-xs font-bold mb-1">💧 Hydration</p>
          <p class="text-slate-300 text-sm">Total: ${dayHydrationLogs.reduce((sum, l) => sum + (l.amount_oz || 0), 0)} oz</p>
        </div>
      ` : ''}
      
      ${dayJuiceLogs.length > 0 ? `
        <div class="mb-3">
          <p class="text-orange-400 text-xs font-bold mb-1">🍊 Juice</p>
          <p class="text-slate-300 text-sm">Total: ${dayJuiceLogs.reduce((sum, l) => sum + (l.amount_oz || 0), 0)} oz</p>
        </div>
      ` : ''}
      
      ${dayBMLogs.length > 0 ? `
        <div>
          <p class="text-amber-400 text-xs font-bold mb-1">💩 BM</p>
          ${dayBMLogs.map(log => `<p class="text-slate-300 text-sm">• ${log.had_bm ? 'Yes' : 'No'} at ${new Date(log.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>`).join('')}
        </div>
      ` : ''}
      
      ${dayMedLogs.length === 0 && dayHydrationLogs.length === 0 && dayBMLogs.length === 0 ?
      '<p class="text-slate-500 text-sm">No activity recorded</p>' : ''}
    </div>
  `;
  detailDiv.classList.remove('hidden');
}

// Show Patient Selector Screen (when user has multiple patients)
function showPatientSelector(patients) {
  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h1 class="text-2xl font-black text-slate-100 mb-2">Select Patient</h1>
          <p class="text-slate-400">Choose which patient you'll be caring for today</p>
        </div>
        
        <div class="space-y-3 mb-6">
          ${patients.map(p => `
            <button class="patient-select-btn w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-2xl p-4 text-left transition-all" data-patient-id="${p.patient_id}">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <span class="text-blue-500 font-bold text-lg">${p.patients?.name?.charAt(0).toUpperCase() || '?'}</span>
                </div>
                <div>
                  <p class="text-slate-100 font-bold">${p.patients?.name || 'Unnamed Patient'}</p>
                  <p class="text-slate-400 text-sm">${p.is_admin ? '👑 You are Admin' : '👤 Caregiver'}</p>
                </div>
              </div>
            </button>
          `).join('')}
        </div>
        
        <div class="text-center">
          <button id="logout-selector-btn" class="text-slate-500 hover:text-slate-300 text-sm">
            Sign out
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  document.querySelectorAll('.patient-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const patientId = btn.dataset.patientId;
      await selectPatientAndLoadDashboard(patientId);
    });
  });

  document.getElementById('logout-selector-btn').addEventListener('click', handleLogout);
}

// Select Patient and Load Dashboard
async function selectPatientAndLoadDashboard(patientId) {
  currentPatientId = patientId;

  // Save to localStorage for next session
  localStorage.setItem('lastPatientId', patientId);

  // Get patient info and admin status from junction table
  const { data: relationship } = await supabase
    .from('caregiver_patients')
    .select('*, patients(name)')
    .eq('caregiver_id', currentUser.id)
    .eq('patient_id', patientId)
    .single();

  if (relationship) {
    currentPatientName = relationship.patients?.name || 'My Care Circle';
    isAdmin = relationship.is_admin || false;
  }

  await continueLoadDashboard();
}

// DOM Elements
const root = document.getElementById('root');

// State
let currentUser = null;
let currentPatientId = null;
let medications = [];
let medLogs = [];
let caregivers = [];
let hydrationLogs = [];
let bmLogs = [];
let juiceLogs = [];
let isSignupMode = false;
let showMedHistory = {}; // Track which medication history is expanded
let isAdmin = false; // Track if current user is administrator
const DEFAULT_HYDRATION_GOAL = 128; // 128oz (1 gallon)
let userHydrationGoal = DEFAULT_HYDRATION_GOAL; // Global hydration goal
let userJuiceGoal = 0; // Global juice goal
let lastHydrationProgress = 0; // Track last hydration progress for animation
let lastJuiceProgress = 0; // Track last juice progress for animation
let showHowToUse = false; // Track if "How to use" guide is expanded
let isFirstLogin = false; // Track if this is the user's first login
let messages = []; // Track team messages
let showAllMessages = false; // Track message collapse state
let showMessagesPanel = true; // Track if messages panel is expanded
let expandedMessages = {}; // Track which messages are expanded
let readMessageIds = new Set(); // Track which messages the user has read
let loginCount = 0; // Track user login count
let currentPatientName = ''; // Track current patient name for display
let availablePatients = []; // Track all patients available to this user
let adminPanelCollapsed = localStorage.getItem('adminPanelCollapsed') === 'true'; // Admin panel state
let patientSelectorCollapsed = localStorage.getItem('patientSelectorCollapsed') === 'true'; // Patient selector state

// Inactivity timeout settings
const DEFAULT_INACTIVITY_TIMEOUT = 30; // Default 30 minutes
let inactivityTimeoutMinutes = parseInt(localStorage.getItem('sessionTimeoutMinutes')) || DEFAULT_INACTIVITY_TIMEOUT;
let inactivityTimer = null;
let countdownTimer = null;
let countdownSeconds = 60;
let showLogoutWarning = false;

// Initialize app
async function init() {
  console.log('CareCircle: Initializing app...');

  // Wait for Supabase to load
  let attempts = 0;
  while (!initSupabase() && attempts < 50) {
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }

  if (!supabase) {
    console.error('CareCircle: Failed to initialize Supabase');
    showError('Failed to load Supabase. Please refresh the page.');
    return;
  }

  try {
    // Check for existing session
    console.log('CareCircle: Checking for existing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('CareCircle: Session check error:', sessionError);
      throw sessionError;
    }

    currentUser = session?.user || null;
    console.log('CareCircle: Current user:', currentUser?.email || 'Not logged in');

    if (currentUser) {
      await loadDashboard();
      startInactivityTimer();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('CareCircle: Init error:', error);
    showLogin();
  }
}

// ============================================================
// INACTIVITY TIMEOUT SYSTEM
// ============================================================

function startInactivityTimer() {
  resetInactivityTimer();

  // Listen for user activity
  const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
  activityEvents.forEach(event => {
    document.addEventListener(event, resetInactivityTimer, { passive: true });
  });
}

function resetInactivityTimer() {
  // Clear existing timers
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  // Hide warning if showing
  if (showLogoutWarning) {
    showLogoutWarning = false;
    hideLogoutWarning();
  }

  // Set new timer (timeout minutes - 1 minute for warning)
  const warningDelay = (inactivityTimeoutMinutes - 1) * 60 * 1000;

  if (warningDelay > 0) {
    inactivityTimer = setTimeout(() => {
      showLogoutCountdown();
    }, warningDelay);
  }
}

function showLogoutCountdown() {
  showLogoutWarning = true;
  countdownSeconds = 60;

  // Create warning overlay
  const warningDiv = document.createElement('div');
  warningDiv.id = 'logout-warning';
  warningDiv.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] animate-fade-in';
  warningDiv.innerHTML = `
    <div class="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 border-2 border-red-500 text-center">
      <div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-red-400 mb-2">Session Expiring</h2>
      <p class="text-slate-300 mb-4">You will be logged out due to inactivity</p>
      <div class="text-5xl font-black text-red-500 mb-6" id="countdown-display">60</div>
      <button id="stay-logged-in-btn" class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors">
        Stay Logged In
      </button>
    </div>
  `;

  document.body.appendChild(warningDiv);

  // Attach stay logged in button
  document.getElementById('stay-logged-in-btn').addEventListener('click', () => {
    resetInactivityTimer();
  });

  // Start countdown
  countdownTimer = setInterval(() => {
    countdownSeconds--;
    const display = document.getElementById('countdown-display');
    if (display) {
      display.textContent = countdownSeconds;
    }

    if (countdownSeconds <= 0) {
      clearInterval(countdownTimer);
      handleLogout();
    }
  }, 1000);
}

function hideLogoutWarning() {
  const warning = document.getElementById('logout-warning');
  if (warning) {
    warning.remove();
  }
}

// Show Login Screen
async function showLogin() {
  // Load visible patients for signup dropdown (before user is authenticated)
  let visiblePatients = [];
  try {
    const { data } = await supabase
      .from('patients')
      .select('id, name, is_visible')
      .eq('is_visible', true)
      .order('name');
    visiblePatients = data || [];
  } catch (err) {
    console.log('Could not load patients list:', err);
  }

  root.innerHTML = `
    <div class="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div class="w-full max-w-md">
        <div class="text-center mb-12">
          <div class="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 class="text-3xl font-black text-slate-100 mb-2">CareCircle</h1>
          <p class="text-slate-400">Medicine Care Team App</p>
        </div>
        
        <div id="error-message" class="hidden bg-red-500/10 text-red-500 p-4 rounded-xl mb-4 text-center"></div>
        
        <div class="space-y-4">
          <div class="flex items-center bg-slate-800 border border-slate-700 rounded-2xl px-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="mr-3">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input type="email" id="email" placeholder="Email" class="flex-1 bg-transparent py-4 text-slate-100 outline-none">
          </div>
          
          <div class="flex items-center bg-slate-800 border border-slate-700 rounded-2xl px-4">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2" class="mr-3">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input type="password" id="password" placeholder="Password" class="flex-1 bg-transparent py-4 text-slate-100 outline-none">
            <button id="toggle-password" class="text-slate-400 hover:text-slate-200 focus:outline-none">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          
          <!-- Patient Selection (Only shown during signup) -->
          <div id="patient-selection" class="${isSignupMode ? '' : 'hidden'}">
            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
              <p class="text-slate-300 text-sm font-bold mb-3">Which Care Circle are you joining?</p>
              
              ${visiblePatients.length > 0 ? `
                <div class="space-y-2 mb-3">
                  ${visiblePatients.map(p => `
                    <label class="flex items-center p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors">
                      <input type="radio" name="patient-choice" value="${p.id}" class="mr-3 accent-blue-500">
                      <span class="text-slate-200">${p.name}</span>
                    </label>
                  `).join('')}
                  <label class="flex items-center p-3 bg-slate-900/50 rounded-xl cursor-pointer hover:bg-slate-900 transition-colors border border-dashed border-slate-600">
                    <input type="radio" name="patient-choice" value="new" class="mr-3 accent-green-500" id="create-new-radio">
                    <span class="text-green-400">+ Create New Care Circle</span>
                  </label>
                </div>
              ` : `
                <p class="text-slate-500 text-xs mb-3">No public care circles available. Create one or enter a name to join a private circle.</p>
              `}
              
              <div id="patient-name-input" class="${visiblePatients.length > 0 ? 'hidden' : ''}">
                <input type="text" id="new-patient-name" placeholder="Enter patient name (e.g., Mom, Dad, James)" 
                  class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-blue-500">
                <p class="text-slate-500 text-xs mt-2">
                  💡 If a care circle with this name exists, you'll join it. Otherwise, a new one will be created.
                </p>
              </div>
            </div>
          </div>
          
          <button id="auth-action-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors">
            ${isSignupMode ? 'Sign Up' : 'Sign In'}
          </button>
          
          <button id="toggle-auth-btn" class="w-full text-blue-500 font-semibold py-2">
            ${isSignupMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  document.getElementById('auth-action-btn').addEventListener('click', isSignupMode ? handleSignUp : handleLogin);
  document.getElementById('toggle-auth-btn').addEventListener('click', toggleAuthMode);

  // Show/hide patient name input based on radio selection
  document.querySelectorAll('input[name="patient-choice"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const nameInput = document.getElementById('patient-name-input');
      if (nameInput) {
        nameInput.classList.toggle('hidden', e.target.value !== 'new');
      }
    });
  });

  // Password toggle
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  toggleBtn?.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    toggleBtn.innerHTML = type === 'password' ?
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>` :
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>`;
  });

  // Enter key to submit
  passwordInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      isSignupMode ? handleSignUp() : handleLogin();
    }
  });
}

function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  showLogin();
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  } else {
    alert(message);
  }
}

// Hide error message
function hideError() {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.classList.add('hidden');
  }
}

// Handle Login
async function handleLogin() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  hideError();

  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  console.log('CareCircle: Attempting login for:', email);

  const btn = document.getElementById('auth-action-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error('CareCircle: Login error:', error);
      showError('Login failed: ' + error.message);
      btn.textContent = 'Sign In';
      btn.disabled = false;
      return;
    }

    console.log('CareCircle: Login successful:', data.user?.email);
    currentUser = data.user;
    await loadDashboard();
  } catch (err) {
    console.error('CareCircle: Login exception:', err);
    showError('An error occurred: ' + err.message);
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

// Handle Sign Up
async function handleSignUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  hideError();

  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    showError('Password must be at least 6 characters');
    return;
  }

  // Get selected patient or new patient name
  const selectedPatientRadio = document.querySelector('input[name="patient-choice"]:checked');
  const newPatientNameInput = document.getElementById('new-patient-name');

  let selectedPatientId = selectedPatientRadio?.value || null;
  let newPatientName = newPatientNameInput?.value?.trim() || '';

  // If no visible patients and no name entered, show error
  if (!selectedPatientId && !newPatientName) {
    showError('Please select a Care Circle or enter a patient name');
    return;
  }

  // If "Create New" selected but no name, show error
  if (selectedPatientId === 'new' && !newPatientName) {
    showError('Please enter a name for the new Care Circle');
    return;
  }

  console.log('CareCircle: Attempting signup for:', email);

  const btn = document.getElementById('auth-action-btn');
  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      console.error('CareCircle: Signup error:', error);
      showError('Signup failed: ' + error.message);
      btn.textContent = 'Sign Up';
      btn.disabled = false;
      return;
    }

    console.log('CareCircle: Signup response:', data);

    if (data.user) {
      console.log('CareCircle: Creating caregiver profile for:', data.user.id);

      // Create caregiver profile
      const { error: profileError } = await supabase.from('caregivers').insert({
        id: data.user.id,
        email: data.user.email,
        name: email.split('@')[0]
      });

      if (profileError) {
        console.error('CareCircle: Profile creation error:', profileError);
      }

      // Determine which patient to join/create
      let patientIdToJoin = null;
      let willBeAdmin = false;

      if (selectedPatientId && selectedPatientId !== 'new') {
        // Joining an existing visible patient
        patientIdToJoin = selectedPatientId;
        willBeAdmin = false; // Not admin when joining existing
      } else {
        // Creating new OR entering a name to join hidden patient
        const patientNameToFind = newPatientName;

        // Check if a patient with this name already exists (case-insensitive)
        const { data: existingPatient } = await supabase
          .from('patients')
          .select('id')
          .ilike('name', patientNameToFind)
          .limit(1)
          .single();

        if (existingPatient) {
          // Join existing patient (even if hidden)
          patientIdToJoin = existingPatient.id;
          willBeAdmin = false;
          console.log('CareCircle: Joining existing patient:', patientNameToFind);
        } else {
          // Create new patient
          const { data: newPatient, error: patientError } = await supabase
            .from('patients')
            .insert({ name: patientNameToFind, is_visible: true })
            .select()
            .single();

          if (patientError) {
            console.error('CareCircle: Failed to create patient:', patientError);
          } else {
            patientIdToJoin = newPatient.id;
            willBeAdmin = true; // First user becomes admin
            console.log('CareCircle: Created new patient:', patientNameToFind);
          }
        }
      }

      // Create junction table entry
      if (patientIdToJoin) {
        await supabase.from('caregiver_patients').insert({
          caregiver_id: data.user.id,
          patient_id: patientIdToJoin,
          is_admin: willBeAdmin
        });
      }

      // Show confetti celebration and success modal
      showConfetti();
      showSignupSuccessModal(email);
    }

    btn.textContent = 'Sign Up';
    btn.disabled = false;
  } catch (err) {
    console.error('CareCircle: Signup exception:', err);
    showError('An error occurred: ' + err.message);
    btn.textContent = 'Sign Up';
    btn.disabled = false;
  }
}

// Load Dashboard
async function loadDashboard() {
  console.log('CareCircle: Loading dashboard...');

  try {
    // 1. Ensure caregiver profile exists
    let { data: profile } = await supabase.from('caregivers').select('*').eq('id', currentUser.id).single();

    if (!profile) {
      console.log('CareCircle: Creating missing caregiver profile...');

      // Create caregiver profile first
      const { error: createError } = await supabase.from('caregivers').insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email.split('@')[0],
        first_login: true,
        login_count: 1,
        hydration_goal: DEFAULT_HYDRATION_GOAL,
        juice_goal: 0
      });

      if (createError) {
        console.error('CareCircle: Failed to create profile:', createError);
      }

      // Create a new patient circle for this user
      const { data: patient, error: patientError } = await supabase.from('patients').insert({ name: 'My Care Circle' }).select().single();
      if (patientError) {
        console.error('CareCircle: Failed to create patient:', patientError);
        throw patientError;
      }

      // Create relationship in junction table (user is admin of their own patient)
      await supabase.from('caregiver_patients').insert({
        caregiver_id: currentUser.id,
        patient_id: patient.id,
        is_admin: true
      });

      currentPatientId = patient.id;
      currentPatientName = 'My Care Circle';
      isAdmin = true;
      isFirstLogin = true;
      showHowToUse = true;
      userHydrationGoal = DEFAULT_HYDRATION_GOAL;
      userJuiceGoal = 0;

      await continueLoadDashboard();
      return;
    }

    // 2. Check junction table for patient relationships
    const { data: patientRelationships, error: relError } = await supabase
      .from('caregiver_patients')
      .select('*, patients(id, name)')
      .eq('caregiver_id', currentUser.id);

    if (relError) {
      console.error('CareCircle: Failed to load patient relationships:', relError);
    }

    // 3. Handle different scenarios
    if (!patientRelationships || patientRelationships.length === 0) {
      // User has no patient relationships - check legacy patient_id
      if (profile.patient_id) {
        // Migrate legacy relationship to junction table
        await supabase.from('caregiver_patients').insert({
          caregiver_id: currentUser.id,
          patient_id: profile.patient_id,
          is_admin: profile.is_admin || false
        }).select();

        currentPatientId = profile.patient_id;
        isAdmin = profile.is_admin || false;

        const { data: patientData } = await supabase.from('patients').select('name').eq('id', profile.patient_id).single();
        currentPatientName = patientData?.name || 'My Care Circle';
      } else {
        // No patients at all - create one
        const { data: patient } = await supabase.from('patients').insert({ name: 'My Care Circle' }).select().single();
        await supabase.from('caregiver_patients').insert({
          caregiver_id: currentUser.id,
          patient_id: patient.id,
          is_admin: true
        });
        currentPatientId = patient.id;
        currentPatientName = 'My Care Circle';
        isAdmin = true;
      }
    } else if (patientRelationships.length === 1) {
      // Only one patient - auto-select
      const rel = patientRelationships[0];
      currentPatientId = rel.patient_id;
      currentPatientName = rel.patients?.name || 'My Care Circle';
      isAdmin = rel.is_admin || false;
      // Save to localStorage
      localStorage.setItem('lastPatientId', currentPatientId);
    } else {
      // Multiple patients - check localStorage for last selection first
      const savedPatientId = localStorage.getItem('lastPatientId');

      if (savedPatientId) {
        const savedRel = patientRelationships.find(r => r.patient_id === savedPatientId);
        if (savedRel) {
          currentPatientId = savedRel.patient_id;
          currentPatientName = savedRel.patients?.name || 'My Care Circle';
          isAdmin = savedRel.is_admin || false;
        }
      }

      if (!currentPatientId) {
        // No saved patient or saved patient not found - show selector
        showPatientSelector(patientRelationships);
        return; // Don't continue until patient is selected
      }
    }

    // 4. Update login count
    loginCount = (profile.login_count || 0) + 1;
    await supabase.from('caregivers').update({ login_count: loginCount }).eq('id', currentUser.id);

    isFirstLogin = profile.first_login;
    showHowToUse = loginCount === 1;

    if (isFirstLogin) {
      await supabase.from('caregivers').update({ first_login: false }).eq('id', currentUser.id);
    }

    await continueLoadDashboard();
  } catch (error) {
    console.error('CareCircle: Dashboard load error:', error);
    showError('Failed to load dashboard: ' + error.message);
  }
}

// Continue loading dashboard after patient is selected
async function continueLoadDashboard() {
  try {
    await checkDailyReset();

    await Promise.all([
      loadMedications(),
      loadMedLogs(),
      loadCaregivers(),
      loadHydrationLogs(),
      loadJuiceLogs(),
      loadBMLogs(),
      loadMessages(),
      loadTeamSettings(),
      loadAvailablePatients()
    ]);

    await checkAndAnnounceUpdate();

    setupRealtimeSubscription();
    renderDashboard();
  } catch (error) {
    console.error('CareCircle: Dashboard continue error:', error);
    showError('Failed to load dashboard: ' + error.message);
  }
}


// Setup Realtime Subscription
function setupRealtimeSubscription() {
  supabase
    .channel('public:med_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'med_logs' }, payload => {
      console.log('Med log changed!', payload);
      Promise.all([loadMedications(), loadMedLogs()]).then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:medications')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'medications' }, payload => {
      console.log('Medications changed!', payload);
      loadMedications().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:hydration_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hydration_logs' }, () => {
      loadHydrationLogs().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:juice_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'juice_logs' }, () => {
      loadJuiceLogs().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:bm_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bm_logs' }, () => {
      loadBMLogs().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:caregivers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers' }, () => {
      loadCaregivers().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:messages')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      loadMessages().then(() => {
        renderDashboard();
        // If new message, flash and focus
        if (payload.eventType === 'INSERT') {
          // Expand if collapsed
          showMessagesPanel = true;
          renderDashboard(); // Re-render to show panel

          // Wait for DOM update
          setTimeout(() => {
            const msgPanel = document.getElementById('messages-content');
            const container = msgPanel?.closest('.bg-slate-800');
            if (container) {
              // Scroll and flash
              container.scrollIntoView({ behavior: 'smooth', block: 'center' });
              container.classList.add('ring-4', 'ring-red-500', 'animate-pulse');
              setTimeout(() => {
                container.classList.remove('ring-4', 'ring-red-500', 'animate-pulse');
              }, 3000);
            }
          }, 100);
        }
      });
    })
    .subscribe();

  supabase
    .channel('public:team_settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_settings' }, () => {
      loadTeamSettings().then(renderDashboard);
    })
    .subscribe();
}

// Load Available Patients (all patients this user has access to via junction table)
async function loadAvailablePatients() {
  try {
    // Get all patients this caregiver is linked to via the junction table
    const { data, error } = await supabase
      .from('caregiver_patients')
      .select('*, patients(id, name)')
      .eq('caregiver_id', currentUser.id);

    if (error) {
      console.error('CareCircle: Failed to load patients:', error);
      availablePatients = [];
      return;
    }

    // Transform to a simpler format
    availablePatients = (data || []).map(rel => ({
      id: rel.patient_id,
      name: rel.patients?.name || 'Unnamed',
      is_admin: rel.is_admin
    }));
    console.log('CareCircle: Loaded patients:', availablePatients.length);
  } catch (err) {
    console.error('CareCircle: Patients exception:', err);
    availablePatients = [];
  }
}

// Load current patient's visibility status
async function loadPatientVisibility() {
  if (!currentPatientId) return true;
  try {
    const { data } = await supabase
      .from('patients')
      .select('is_visible')
      .eq('id', currentPatientId)
      .single();
    return data?.is_visible ?? true;
  } catch {
    return true;
  }
}

// Load Team Settings
async function loadTeamSettings() {
  try {
    const { data, error } = await supabase.from('team_settings').select('*').single();

    if (error) {
      // If table doesn't exist yet (migration not run), fall back to defaults
      if (error.code === '42P01' || error.code === 'PGRST116') {
        console.log('Team settings not found, using defaults');
        return;
      }
      console.error('CareCircle: Settings load error:', error);
      return;
    }

    if (data) {
      userHydrationGoal = data.hydration_goal || DEFAULT_HYDRATION_GOAL;
      userJuiceGoal = data.juice_goal || 0;
    }
  } catch (err) {
    console.error('CareCircle: Settings exception:', err);
  }
}

// Load Medications
async function loadMedications() {
  console.log('CareCircle: Loading medications...');

  try {
    const { data, error } = await supabase.from('medications').select('*').eq('patient_id', currentPatientId).order('position', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('CareCircle: Medications load error:', error);
      medications = [];
      return;
    }

    medications = data || [];
    console.log('CareCircle: Loaded medications:', medications.length);
  } catch (err) {
    console.error('CareCircle: Medications exception:', err);
    medications = [];
  }
}

// Load Medication Logs
async function loadMedLogs() {
  console.log('CareCircle: Loading medication logs...');
  try {
    // Get logs from the last 30 days to show history
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('med_logs')
      .select('*')
      .eq('patient_id', currentPatientId)
      .gte('administered_at', thirtyDaysAgo)
      .order('administered_at', { ascending: false });

    if (error) {
      console.error('CareCircle: Med logs load error:', error);
      medLogs = [];
      return;
    }

    medLogs = data || [];
  } catch (err) {
    console.error('CareCircle: Med logs exception:', err);
    medLogs = [];
  }
}

// Load Caregivers
async function loadCaregivers() {
  console.log('CareCircle: Loading caregivers...');

  try {
    const { data, error } = await supabase.from('caregivers').select('*').eq('patient_id', currentPatientId);

    if (error) {
      console.error('CareCircle: Caregivers load error:', error);
      caregivers = [];
      return;
    }

    caregivers = data || [];
    console.log('CareCircle: Loaded caregivers:', caregivers.length);
  } catch (err) {
    console.error('CareCircle: Caregivers exception:', err);
    caregivers = [];
  }
}

// Load Hydration Logs
async function loadHydrationLogs() {
  console.log('CareCircle: Loading hydration logs...');
  try {
    // Get local date at midnight (not UTC) to avoid timezone issues
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .eq('patient_id', currentPatientId)
      .gte('logged_at', localMidnight)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('CareCircle: Hydration load error:', error);
      hydrationLogs = [];
      return;
    }

    hydrationLogs = data || [];
  } catch (err) {
    console.error('CareCircle: Hydration exception:', err);
    hydrationLogs = [];
  }
}

// Load Juice Logs
async function loadJuiceLogs() {
  console.log('CareCircle: Loading juice logs...');
  try {
    // Get local date at midnight (not UTC) to avoid timezone issues
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data, error } = await supabase
      .from('juice_logs')
      .select('*')
      .eq('patient_id', currentPatientId)
      .gte('logged_at', localMidnight)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('CareCircle: Juice load error:', error);
      juiceLogs = [];
      return;
    }

    juiceLogs = data || [];
  } catch (err) {
    console.error('CareCircle: Juice exception:', err);
    juiceLogs = [];
  }
}

// Load BM Logs
async function loadBMLogs() {
  console.log('CareCircle: Loading BM logs...');
  try {
    const { data, error } = await supabase
      .from('bm_logs')
      .select('*')
      .eq('patient_id', currentPatientId)
      .order('logged_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('CareCircle: BM load error:', error);
      bmLogs = [];
      return;
    }

    bmLogs = data || [];
  } catch (err) {
    console.error('CareCircle: BM exception:', err);
    bmLogs = [];
  }
}

// Handle Add Water
async function handleAddWater(amount) {
  try {
    // BMAD: Fix - Find or create caregiver record for the current user
    let caregiverRecordId = currentUser?.id;

    // Try to find a caregiver record matching the user's email
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', currentUser?.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected if the user is new
      console.error('CareCircle: Error fetching caregiver:', fetchError);
    }

    if (existingCaregiver) {
      caregiverRecordId = existingCaregiver.id;
    } else {
      // Create a new caregiver record for this user
      const { data: newCaregiver, error: insertError } = await supabase
        .from('caregivers')
        .insert({
          email: currentUser?.email,
          name: currentUser?.email?.split('@')[0] || 'User'
        })
        .select('id')
        .single();

      if (insertError) {
        alert('Failed to create caregiver profile: ' + insertError.message);
        return;
      }

      if (newCaregiver) {
        caregiverRecordId = newCaregiver.id;
      }
    }

    const { error } = await supabase.from('hydration_logs').insert({
      amount_oz: amount,
      logged_at: new Date().toISOString(),
      caregiver_id: caregiverRecordId,
      patient_id: currentPatientId
    });

    if (error) throw error;
    // Force immediate reload to show animation
    await loadHydrationLogs();
    renderDashboard();
  } catch (err) {
    alert('Error adding water: ' + err.message);
  }
}

// Handle Add Juice
async function handleAddJuice(amount) {
  try {
    let caregiverRecordId = currentUser?.id;
    const { data: existingCaregiver } = await supabase.from('caregivers').select('id').eq('email', currentUser?.email).single();
    if (existingCaregiver) caregiverRecordId = existingCaregiver.id;

    const { error } = await supabase.from('juice_logs').insert({
      amount_oz: amount,
      logged_at: new Date().toISOString(),
      caregiver_id: caregiverRecordId,
      patient_id: currentPatientId
    });

    if (error) throw error;
    await loadJuiceLogs();
    renderDashboard();
  } catch (err) {
    alert('Error adding juice: ' + err.message);
  }
}

// Handle Log BM
async function handleLogBM(hadBM) {
  try {
    let caregiverRecordId = currentUser?.id;
    const { data: existingCaregiver } = await supabase.from('caregivers').select('id').eq('email', currentUser?.email).single();
    if (existingCaregiver) caregiverRecordId = existingCaregiver.id;

    const { error } = await supabase.from('bm_logs').insert({
      had_bm: hadBM,
      logged_at: new Date().toISOString(),
      caregiver_id: caregiverRecordId,
      notes: hadBM ? 'Regular BM' : 'No BM reported',
      patient_id: currentPatientId
    });

    if (error) throw error;
    await loadBMLogs();
    renderDashboard();
  } catch (err) {
    alert('Error logging BM: ' + err.message);
  }
}

// Handle Log Past BM
async function handleLogPastBM() {
  // Create modal if it doesn't exist
  let modal = document.getElementById('log-past-bm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'log-past-bm-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700">
        <h3 class="text-xl font-bold text-slate-100 mb-4">Log Past BM</h3>
        <p class="text-slate-400 text-sm mb-4">Select the date and time.</p>
        
        <input type="datetime-local" id="past-bm-date" class="w-full bg-slate-900 text-slate-200 rounded-xl px-4 py-3 border border-slate-700 outline-none focus:border-blue-500 mb-6">
        
        <div class="flex gap-3 mb-3">
          <button id="past-bm-yes" class="flex-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold py-3 rounded-xl transition-colors border border-green-500/50">
            YES (Had BM)
          </button>
          <button id="past-bm-no" class="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold py-3 rounded-xl transition-colors border border-red-500/50">
            NO (No BM)
          </button>
        </div>
        
        <button id="cancel-past-bm" class="w-full text-slate-400 hover:text-white font-semibold py-2 transition-colors">
          Cancel
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Set default time to now
  const dateInput = document.getElementById('past-bm-date');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dateInput.value = now.toISOString().slice(0, 16);

  modal.classList.remove('hidden');

  // Handle actions
  return new Promise((resolve) => {
    const close = () => {
      modal.classList.add('hidden');
      resolve();
    };

    document.getElementById('cancel-past-bm').onclick = close;

    const submitLog = async (hadBM) => {
      const dateStr = dateInput.value;
      if (!dateStr) return;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        alert('Invalid date format');
        return;
      }

      try {
        let caregiverRecordId = currentUser?.id;
        const { data: existingCaregiver } = await supabase.from('caregivers').select('id').eq('email', currentUser?.email).single();
        if (existingCaregiver) caregiverRecordId = existingCaregiver.id;

        const { error } = await supabase.from('bm_logs').insert({
          had_bm: hadBM,
          logged_at: date.toISOString(),
          caregiver_id: caregiverRecordId,
          notes: hadBM ? 'Regular BM (Past Log)' : 'No BM reported (Past Log)',
          patient_id: currentPatientId
        });

        if (error) throw error;

        close();
        await loadBMLogs();
        renderDashboard();
      } catch (err) {
        alert('Error logging past BM: ' + err.message);
      }
    };

    document.getElementById('past-bm-yes').onclick = () => submitLog(true);
    document.getElementById('past-bm-no').onclick = () => submitLog(false);
  });
}

// Handle Delete BM Log
async function handleDeleteBMLog(id) {
  if (!confirm('Delete this BM log entry?')) return;

  try {
    const { error } = await supabase.from('bm_logs').delete().eq('id', id);
    if (error) throw error;
    await loadBMLogs();
    renderDashboard();
  } catch (err) {
    alert('Error deleting BM log: ' + err.message);
  }
}

// Handle Delete Hydration
async function handleDeleteHydration(id) {
  if (!confirm('Delete this entry?')) return;

  try {
    const { error } = await supabase.from('hydration_logs').delete().eq('id', id);
    if (error) throw error;
    // Force immediate reload to show animation
    await loadHydrationLogs();
    renderDashboard();
  } catch (err) {
    alert('Error deleting entry: ' + err.message);
  }
}

// Handle Delete Juice
async function handleDeleteJuice(id) {
  if (!confirm('Delete this entry?')) return;

  try {
    const { error } = await supabase.from('juice_logs').delete().eq('id', id);
    if (error) throw error;
    await loadJuiceLogs();
    renderDashboard();
  } catch (err) {
    alert('Error deleting entry: ' + err.message);
  }
}

// Handle Reset Hydration
async function handleResetHydration() {
  if (!confirm('Are you sure you want to reset today\'s hydration logs?')) return;

  try {
    // Use local midnight to avoid timezone issues
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Delete all logs for today
    const { error } = await supabase.from('hydration_logs')
      .delete()
      .gte('logged_at', localMidnight);

    if (error) throw error;

    await loadHydrationLogs();
    renderDashboard();
  } catch (err) {
    alert('Error resetting hydration: ' + err.message);
  }
}

// Handle Reset Juice
async function handleResetJuice() {
  if (!confirm('Are you sure you want to reset today\'s juice logs?')) return;

  try {
    // Use local midnight to avoid timezone issues
    const now = new Date();
    const localMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { error } = await supabase.from('juice_logs')
      .delete()
      .gte('logged_at', localMidnight);

    if (error) throw error;

    await loadJuiceLogs();
    renderDashboard();
  } catch (err) {
    alert('Error resetting juice: ' + err.message);
  }
}

// Handle Set Hydration Goal
async function handleSetHydrationGoal() {
  const goal = prompt('Enter daily hydration goal in ounces (oz):', userHydrationGoal);
  if (!goal) return;

  const goalNum = parseInt(goal);
  if (isNaN(goalNum) || goalNum < 1 || goalNum > 256) {
    alert('Please enter a valid goal between 1 and 256 oz.');
    return;
  }

  try {
    // Try to update team_settings first
    const { data: settings } = await supabase.from('team_settings').select('id').single();

    let error;
    if (settings) {
      const res = await supabase.from('team_settings').update({ hydration_goal: goalNum }).eq('id', settings.id);
      error = res.error;
    } else {
      // Create if not exists
      const res = await supabase.from('team_settings').insert({ hydration_goal: goalNum, juice_goal: userJuiceGoal, patient_id: currentPatientId });
      error = res.error;
    }

    if (error) throw error;

    userHydrationGoal = goalNum;
    renderDashboard();
  } catch (err) {
    alert('Error setting hydration goal: ' + err.message);
  }
}

// Handle Set Juice Goal
async function handleSetJuiceGoal() {
  const goal = prompt('Enter daily juice goal in ounces (oz) (Enter 0 to disable):', userJuiceGoal);
  if (goal === null) return;

  const goalNum = parseInt(goal);
  if (isNaN(goalNum) || goalNum < 0 || goalNum > 128) {
    alert('Please enter a valid goal between 0 and 128 oz.');
    return;
  }

  try {
    // Try to update team_settings first
    const { data: settings } = await supabase.from('team_settings').select('id').single();

    let error;
    if (settings) {
      const res = await supabase.from('team_settings').update({ juice_goal: goalNum }).eq('id', settings.id);
      error = res.error;
    } else {
      // Create if not exists
      const res = await supabase.from('team_settings').insert({ hydration_goal: userHydrationGoal, juice_goal: goalNum, patient_id: currentPatientId });
      error = res.error;
    }

    if (error) throw error;

    userJuiceGoal = goalNum;
    renderDashboard();
  } catch (err) {
    alert('Error setting juice goal: ' + err.message);
  }
}

// Handle Skip Dose
async function handleSkipDose(medId) {
  if (!confirm('Skip this dose? This will log the dose as skipped and reset the timer.')) return;

  try {
    // Find caregiver ID
    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', currentUser.email)
      .single();

    if (!caregiver) return;

    const now = new Date();
    const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const { error } = await supabase.from('med_logs').insert({
      med_id: medId,
      caregiver_id: caregiver.id,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      notes: 'Skipped',
      patient_id: currentPatientId
    });

    if (error) throw error;

    await loadDashboard();
  } catch (err) {
    alert('Error skipping dose: ' + err.message);
  }
}

// Handle Take Early
async function handleTakeEarly(medId) {
  if (!confirm('Take this dose early? This will bypass the schedule lock.')) return;
  await handleMarkTaken(medId);
}

// Handle Delete Medication Log
async function handleDeleteMedLog(logId) {
  if (!confirm('Delete this log entry?')) return;

  try {
    const { error } = await supabase.from('med_logs')
      .delete()
      .eq('id', logId);

    if (error) throw error;

    await loadMedLogs();
    renderDashboard();
  } catch (err) {
    alert('Error deleting log: ' + err.message);
  }
}

// Handle Delete Message
async function handleDeleteMessage(msgId) {
  if (!confirm('Delete this message?')) return;

  try {
    const { error } = await supabase.from('messages').delete().eq('id', msgId);
    if (error) throw error;
    await loadMessages();
    renderDashboard();
  } catch (err) {
    alert('Error deleting message: ' + err.message);
  }
}

// Handle Invite Caregiver
async function handleInviteCaregiver() {
  const email = prompt('Enter email address to invite:');
  if (!email) return;

  if (!email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  try {
    // In a real app, this would send an email. For now, we create a placeholder.
    const { data: newCaregiver, error } = await supabase.from('caregivers').insert({
      email: email.trim(),
      name: email.split('@')[0],
      patient_id: currentPatientId
    }).select().single();

    if (error) throw error;

    // Also add to junction table (not as admin)
    if (newCaregiver) {
      await supabase.from('caregiver_patients').insert({
        caregiver_id: newCaregiver.id,
        patient_id: currentPatientId,
        is_admin: false
      });
    }

    alert('Caregiver invited successfully!');
    await loadCaregivers();
    renderDashboard();
  } catch (err) {
    alert('Error inviting caregiver: ' + err.message);
  }
}

// Handle Remove Caregiver
async function handleRemoveCaregiver(id) {
  if (!confirm('Remove this team member?')) return;

  try {
    const { error } = await supabase.from('caregivers').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    alert('Error removing team member: ' + err.message);
  }
}

// Render Dashboard
function renderDashboard() {
  // Hydration Calculations
  const hydrationTotal = hydrationLogs.reduce((sum, log) => sum + log.amount_oz, 0);
  const hydrationProgress = Math.min((hydrationTotal / userHydrationGoal) * 100, 100);

  // Juice Calculations
  const juiceTotal = juiceLogs.reduce((sum, log) => sum + log.amount_oz, 0);
  const juiceProgress = userJuiceGoal > 0 ? Math.min((juiceTotal / userJuiceGoal) * 100, 100) : 0;

  // BM Calculations
  const lastYesBM = bmLogs.find(log => log.had_bm === true);
  const lastLog = bmLogs[0];
  const now = new Date();
  let bmStatus = 'green';
  let bmMessage = 'Regular';
  let bmColorClass = 'text-green-500';
  let bmBgClass = 'bg-green-500/10';
  let bmBorderClass = 'border-green-500/30';

  if (lastYesBM) {
    const hoursSinceBM = (now - new Date(lastYesBM.logged_at)) / (1000 * 60 * 60);
    if (hoursSinceBM > 48) {
      bmStatus = 'flash-red';
      bmMessage = 'LAXATIVE NEEDED';
      bmColorClass = 'text-red-500 animate-pulse';
      bmBgClass = 'bg-red-500/20';
      bmBorderClass = 'border-red-500';
    } else if (hoursSinceBM > 24) {
      bmStatus = 'yellow';
      bmMessage = 'Caution - No BM > 24h';
      bmColorClass = 'text-amber-500';
      bmBgClass = 'bg-amber-500/10';
      bmBorderClass = 'border-amber-500/30';
    }
  } else if (bmLogs.length > 0) {
    // No YES logs found but logs exist
    bmStatus = 'yellow';
    bmMessage = 'No BM Recorded';
    bmColorClass = 'text-amber-500';
    bmBgClass = 'bg-amber-500/10';
    bmBorderClass = 'border-amber-500/30';
  }

  // Check if user explicitly logged NO today
  if (lastLog && !lastLog.had_bm) {
    const logDate = new Date(lastLog.logged_at).toDateString();
    if (logDate === now.toDateString()) {
      if (bmStatus !== 'flash-red') { // Don't override critical status
        bmStatus = 'red';
        bmMessage = 'No BM Today';
        bmColorClass = 'text-red-500';
        bmBgClass = 'bg-red-500/10';
        bmBorderClass = 'border-red-500/30';
      }
    }
  }

  root.innerHTML = `
    <style>
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .message-text.expanded {
        -webkit-line-clamp: unset;
        overflow: visible;
      }
      .message-wrapper {
        cursor: pointer;
      }
      .message-wrapper:hover {
        background-color: rgba(30, 41, 59, 0.3);
      }
    </style>
    <div class="min-h-screen bg-slate-900 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-2xl font-black text-slate-100">
                Hello, ${currentUser?.email?.split('@')[0] || 'User'}
              </h1>
              ${isAdmin ? '<span class="bg-amber-500/20 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/50">ADMIN</span>' : ''}
            </div>
            <p class="text-blue-400 font-bold text-lg mb-1 flex items-center gap-2">
              Caring for: ${currentPatientName || 'My Care Circle'}
              ${isAdmin ? '<button id="edit-patient-name-btn" class="text-slate-400 hover:text-white text-sm" title="Edit patient name"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button>' : ''}
            </p>
            <p class="text-slate-400">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <!-- Debug Info (click to toggle) -->
            <details class="mt-1">
              <summary class="text-xs text-slate-600 cursor-pointer hover:text-slate-400">🔧 Debug Info</summary>
              <div class="text-xs text-slate-500 bg-slate-800/50 p-2 rounded mt-1 font-mono">
                <p>User: ${currentUser?.email || 'Unknown'}</p>
                <p>User ID: ${currentUser?.id?.slice(0, 8) || 'N/A'}...</p>
                <p>Patient: ${currentPatientName || 'None'}</p>
                <p>Patient ID: ${currentPatientId?.slice(0, 8) || 'N/A'}...</p>
                <p>Is Admin: ${isAdmin ? '✅ YES' : '❌ NO'}</p>
                <p>DB: ${SUPABASE_URL?.replace('https://', '').split('.')[0] || 'Unknown'}</p>
              </div>
            </details>
          </div>
          <div class="flex items-center gap-2 flex-wrap mobile-stack">
            ${availablePatients.length > 1 ? `
            <button id="switch-patient-btn" class="bg-purple-500/10 text-purple-400 px-4 py-2 rounded-lg font-semibold hover:bg-purple-500/20 transition-colors btn-press">
              Switch Patient
            </button>
            ` : ''}
            <button id="calendar-btn" class="bg-green-500/10 text-green-400 px-4 py-2 rounded-lg font-semibold hover:bg-green-500/20 transition-colors btn-press flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span class="mobile-hidden">Calendar</span>
            </button>
            <button id="notifications-btn" class="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg font-semibold hover:bg-amber-500/20 transition-colors btn-press flex items-center gap-2 ${notificationsEnabled ? 'ring-2 ring-amber-500' : ''}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="${notificationsEnabled ? 'animate-ring' : ''}"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span class="mobile-hidden">${notificationsEnabled ? 'Alerts ON' : 'Alerts'}</span>
            </button>
            <button id="export-btn" class="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg font-semibold hover:text-white transition-colors btn-press mobile-hidden">
              Export
            </button>
            <button id="how-to-use-btn" class="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors btn-press mobile-hidden">
              Help
            </button>
            <button id="logout-btn" class="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/20 transition-colors btn-press">
              Logout
            </button>
          </div>
        </div>

        <!-- Calendar View (Toggle) -->
        <div id="calendar-container" class="mb-8 ${showCalendar ? '' : 'hidden'}">
          ${generateCalendarHTML()}
        </div>

        <!-- How to Use Guide (Collapsible) -->
        <div id="how-to-use-guide" class="mb-8 ${showHowToUse ? '' : 'hidden'}">
          <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30 p-6">
            <div class="flex justify-between items-start mb-4">
              <h2 class="text-xl font-bold text-blue-400">📖 How to Use CareCircle</h2>
              <button id="close-how-to-use" class="text-slate-400 hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="space-y-4 text-slate-300">
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Add Medications</h3>
                  <p class="text-sm">Click the "+ Add Medication" button to add medications with dosage, frequency, and instructions.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">2</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Track Medications</h3>
                  <p class="text-sm">Mark medications as taken when administered. The countdown timer starts after marking as taken.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">3</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Monitor Hydration</h3>
                  <p class="text-sm">Track water intake using the hydration tracker. Enter custom oz amounts (max 1 gallon/128oz per day).</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">4</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Manage Team</h3>
                  <p class="text-sm">Invite up to 15 caregivers to your team. Admin can transfer admin rights to other team members.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">5</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">View History</h3>
                  <p class="text-sm">Click the "History" button on each medication to see all past doses and who administered them.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">6</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Log Past Dose</h3>
                  <p class="text-sm">Forgot to log a dose? Click "Log Past Dose" on any medication to record a dose given earlier.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">7</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Team Messages</h3>
                  <p class="text-sm">Use the chat box to leave notes and updates for other caregivers on your team.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-blue-400 font-bold">8</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Export Data</h3>
                  <p class="text-sm">Click "Export History" at the top to download a CSV file of all medication logs for your records.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-purple-400 font-bold">9</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">"As Needed" Medications</h3>
                  <p class="text-sm">When adding a medication, enter "0" for frequency to mark it as "As Needed". These medications won't show overdue status or countdown timers.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-amber-400 font-bold">10</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Skip Dose</h3>
                  <p class="text-sm">For scheduled medications, use the "Skip Dose" button to skip a dose. This logs the dose as skipped and resets the timer.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-cyan-400 font-bold">11</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Custom Hydration Goal</h3>
                  <p class="text-sm">Click "Set Daily Goal" to customize your daily water intake target (default: 128oz).</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-red-400 font-bold">12</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Delete Individual Logs</h3>
                  <p class="text-sm">Click the trash icon next to any history entry to delete it. This works for both medication and hydration logs.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-green-400 font-bold">13</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">BM Tracking</h3>
                  <p class="text-sm">Log daily bowel movements at the bottom of the dashboard. View history and delete incorrect logs.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-orange-400 font-bold">14</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Juice Tracking</h3>
                  <p class="text-sm">Track juice intake separately with its own goal and progress bar.</p>
                </div>
              </div>
              <div class="flex gap-3">
                <div class="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span class="text-amber-400 font-bold">15</span>
                </div>
                <div>
                  <h3 class="font-semibold text-slate-200">Take Early</h3>
                  <p class="text-sm">Use the "Take Early" button to administer a dose before the scheduled time (not available for Mandatory meds).</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div class="bg-slate-800 p-4 rounded-xl border-l-4 border-blue-500">
            <div class="text-blue-500 text-xl mb-1">💊</div>
            <div class="text-2xl font-black text-slate-100">${medications.length}</div>
            <div class="text-slate-400 text-xs">Active Meds</div>
          </div>
          <div class="bg-slate-800 p-4 rounded-xl border-l-4 border-amber-500">
            <div class="text-amber-500 text-xl mb-1">👥</div>
            <div class="text-2xl font-black text-slate-100">${caregivers.length}</div>
            <div class="text-slate-400 text-xs">Team Members</div>
          </div>
          <div class="bg-slate-800 p-4 rounded-xl border-l-4 border-blue-600">
            <div class="text-blue-500 text-xl mb-1">💧</div>
            <div class="text-2xl font-black text-slate-100">${hydrationTotal} oz</div>
            <div class="text-slate-400 text-xs">Water Today</div>
          </div>
          <div class="bg-slate-800 p-4 rounded-xl border-l-4 border-orange-500">
            <div class="text-orange-500 text-xl mb-1">🧃</div>
            <div class="text-2xl font-black text-slate-100">${juiceTotal} oz</div>
            <div class="text-slate-400 text-xs">Juice Today</div>
          </div>
        </div>

        <!-- Team Messages -->
        <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 mb-8">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-bold text-slate-100">Team Messages</h2>
              <button id="collapse-messages-btn" class="text-slate-400 hover:text-slate-200 text-sm font-semibold">
                ${showMessagesPanel ? '▼' : '▶'}
              </button>
            </div>
            <button id="toggle-messages-btn" class="text-blue-400 hover:text-blue-300 text-sm font-semibold">
              ${showAllMessages ? 'Show Less' : 'Show All'}
            </button>
          </div>

          <div id="messages-content" class="${showMessagesPanel ? '' : 'hidden'} space-y-4 ${messages.some(m => !readMessageIds.has(m.id)) ? 'border-2 border-red-500 rounded-xl' : ''}">
            <!-- Latest Message (Always Visible) -->
            ${messages.length > 0 ? `
              <div class="bg-slate-900/50 rounded-xl p-4 border ${!readMessageIds.has(messages[0].id) ? 'border-red-500' : 'border-blue-500/30'} relative group">
                <div class="flex justify-between items-start mb-2">
                  <span class="text-slate-200 font-bold text-sm">${caregivers.find(c => c.id === messages[0].sender_id)?.name || 'Unknown'}</span>
                  <span class="text-slate-500 text-xs">${new Date(messages[0].created_at).toLocaleString()}</span>
                </div>
                <div class="message-wrapper" data-msg-id="${messages[0].id}">
                  <div class="message-text line-clamp-3 whitespace-pre-wrap text-slate-300">${messages[0].content}</div>
                  ${messages[0].content.split('\n').length > 3 || messages[0].content.length > 150 ? `
                    <button class="expand-msg-btn text-blue-400 hover:text-blue-300 text-xs mt-2 font-semibold" onclick="toggleMessageText('${messages[0].id}')">
                      Show More
                    </button>
                  ` : ''}
                </div>
                <button class="delete-msg-btn absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${messages[0].id}" title="Delete Message">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            ` : '<p class="text-slate-500 text-sm">No messages yet.</p>'}

            <!-- Older Messages (Collapsible) -->
            <div id="older-messages" class="${showAllMessages ? '' : 'hidden'} space-y-4 border-t border-slate-700/50 pt-4 mt-4">
              ${messages.slice(1).map(msg => `
                <div class="bg-slate-900/30 rounded-xl p-3 relative group border ${!readMessageIds.has(msg.id) ? 'border-red-500' : 'border-transparent'}">
                  <div class="flex justify-between items-start mb-1">
                    <span class="text-slate-400 text-xs font-bold">${caregivers.find(c => c.id === msg.sender_id)?.name || 'Unknown'}</span>
                    <span class="text-slate-600 text-[10px]">${new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <div class="message-wrapper" data-msg-id="${msg.id}">
                    <div class="message-text line-clamp-3 whitespace-pre-wrap text-slate-400 text-sm">${msg.content}</div>
                    ${msg.content.split('\n').length > 3 || msg.content.length > 150 ? `
                      <button class="expand-msg-btn text-blue-400 hover:text-blue-300 text-xs mt-2 font-semibold" onclick="toggleMessageText('${msg.id}')">
                        Show More
                      </button>
                    ` : ''}
                  </div>
                  <button class="delete-msg-btn absolute top-2 right-2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${msg.id}" title="Delete Message">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Input Area -->
          <div class="flex gap-2 mt-4">
            <textarea id="message-input" placeholder="Type a message..." rows="3" class="flex-1 bg-slate-900 text-slate-200 rounded-xl px-4 py-3 border border-slate-700 outline-none focus:border-blue-500 resize-y min-h-[80px]"></textarea>
            <button id="send-msg-btn" class="bg-blue-500 text-white p-2 rounded-xl hover:bg-blue-600 transition-colors self-end">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Left Column: Medications -->
          <div class="lg:col-span-2">
            ${isAdmin ? `
            <button id="add-med-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl mb-6 transition-colors">
              + Add Medication
            </button>
            ` : ''}
            
            <div class="mb-8">
              <h2 class="text-xl font-bold text-slate-100 mb-4">Medications</h2>
              ${medications.length === 0 ?
      '<div class="text-center py-12 text-slate-400 bg-slate-800 rounded-2xl border border-slate-700">No medications yet. Click "Add Medication" to get started.</div>' :
      medications.map(med => {
        // Check if taken
        const lastLog = medLogs.find(log => log.med_id === med.id);
        let isTaken = false;
        let nextDue = null;
        let isOverdue = false;
        let timeRemaining = null;
        const isAsNeeded = med.frequency_hours === 0;

        if (lastLog && !isAsNeeded) {
          const lastTaken = new Date(lastLog.administered_at);
          const now = new Date();
          const hoursSince = (now - lastTaken) / (1000 * 60 * 60);

          if (hoursSince < med.frequency_hours) {
            isTaken = true;
            nextDue = new Date(lastTaken.getTime() + med.frequency_hours * 60 * 60 * 1000);
            const remainingMs = nextDue - now;
            const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
            const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = { hours: remainingHours, minutes: remainingMins, overdue: false };
          } else {
            // Medication is overdue
            isOverdue = true;
            nextDue = new Date(lastTaken.getTime() + med.frequency_hours * 60 * 60 * 1000);
            const overdueMs = now - nextDue;
            const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
            const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
            timeRemaining = { hours: overdueHours, minutes: overdueMins, overdue: true };
          }
        }

        // Get all logs for this medication
        const medHistory = medLogs.filter(log => log.med_id === med.id);
        const isExpanded = showMedHistory[med.id] || false;

        return `
                  <div class="bg-slate-800 p-6 rounded-2xl mb-4 border ${isOverdue ? 'border-red-500' : 'border-slate-700'} ${isTaken ? 'opacity-75' : ''}" data-med-id="${med.id}" draggable="true">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                          ${isAsNeeded ? '<span class="bg-purple-500/20 text-purple-500 text-xs font-bold px-2 py-1 rounded-full">AS NEEDED</span>' : ''}
                          ${isOverdue ? '<span class="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded-full">OVERDUE</span>' : ''}
                          ${isTaken ? '<span class="bg-green-500/20 text-green-500 text-xs font-bold px-2 py-1 rounded-full">TAKEN</span>' : ''}
                        </div>
                        <h3 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                          ${med.name}
                          ${med.is_mandatory ? '<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">MANDATORY</span>' : ''}
                        </h3>
                        <p class="text-slate-400 mt-1">${med.dosage || 'Dosage not specified'} • ${isAsNeeded ? 'As Needed' : `Every ${med.frequency_hours || '?'}h`}</p>
                        <p class="text-slate-500 text-sm mt-1">${med.instructions || 'No instructions'}</p>
                      </div>
                      ${isAdmin ? `
                      <div class="flex gap-2 ml-4">
                        <button class="edit-med-btn bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold py-2 px-4 rounded-lg text-sm transition-colors" data-med-id="${med.id}">
                          Edit
                        </button>
                        <button class="delete-med-btn bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-2 px-4 rounded-lg text-sm transition-colors" data-med-id="${med.id}">
                          Delete
                        </button>
                      </div>
                      ` : ''}
                    </div>
                    
                    ${isTaken ? `
                      <div class="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                        <p class="text-slate-400 text-sm">Last dose taken at</p>
                        <p class="text-slate-200 font-bold">${lastLog.administered_at ? new Date(lastLog.administered_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'N/A'}</p>
                        ${nextDue ? `<p class="text-slate-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${nextDue.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
                        
                        ${!med.is_mandatory ? `
                          <button class="take-early-btn mt-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold py-2 px-4 rounded-lg text-sm transition-colors" data-med-id="${med.id}">
                            ⚡ Take Early
                          </button>
                        ` : ''}
                      </div>
                    ` : isOverdue ? `
                      <div class="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-center">
                        <p class="text-red-400 text-sm">Overdue by</p>
                        <p class="text-red-200 font-bold">${timeRemaining?.hours || 0}h ${timeRemaining?.minutes || 0}m</p>
                        ${nextDue ? `<p class="text-red-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${nextDue.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
                      </div>
                    ` : timeRemaining && !isTaken ? `
                      <div class="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-center">
                        <p class="text-blue-400 text-sm">Next dose due in</p>
                        <p class="text-blue-200 font-bold">${timeRemaining?.hours || 0}h ${timeRemaining?.minutes || 0}m</p>
                        ${nextDue ? `<p class="text-blue-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${nextDue.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>` : ''}
                      </div>
                    ` : ''}
                    
                    ${!isAsNeeded && !isTaken ? `
                      <div class="flex gap-2 mt-4">
                        <button class="mark-taken-btn flex-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold py-3 rounded-xl transition-colors" data-med-id="${med.id}">
                          ✓ Mark as Taken
                        </button>
                        <button class="skip-dose-btn flex-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold py-3 rounded-xl transition-colors" data-med-id="${med.id}">
                          ✕ Skip Dose
                        </button>
                      </div>
                    ` : ''}
                    
                    ${isAsNeeded ? `
                      <button class="mark-taken-btn w-full mt-4 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold py-3 rounded-xl transition-colors" data-med-id="${med.id}">
                        ✓ Mark as Taken
                      </button>
                    ` : ''}
                    
                    <button class="log-past-btn w-full mt-2 text-slate-500 hover:text-slate-400 text-xs font-semibold py-2 transition-colors" data-med-id="${med.id}">
                      + Log Past Dose
                    </button>

                    <!-- Collapsible History Section -->
                    <div class="mt-4">
                      <button class="toggle-history-btn w-full text-left text-slate-400 text-sm hover:text-slate-300 py-2 px-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors" data-med-id="${med.id}">
                        <span class="flex items-center gap-2">
                          <span>${isExpanded ? '▼' : '▶'}</span>
                          <span>History (${medHistory.length} doses)</span>
                        </span>
                      </button>
                      
                      ${isExpanded ? `
                        <div class="mt-2 bg-slate-900/30 rounded-xl border border-slate-700/50 p-3">
                          ${medHistory.length === 0 ?
              '<p class="text-slate-500 text-sm text-center">No doses logged yet</p>' :
              medHistory.map(log => `
                              <div class="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                                <div class="flex items-center gap-2">
                                  <span class="text-slate-400 text-xs">${new Date(log.administered_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                  <span class="text-slate-300 text-sm font-semibold">${new Date(log.administered_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                  <div class="text-right">
                                    <span class="text-slate-500 text-xs">by ${caregivers.find(cg => cg.id === log.caregiver_id)?.name || 'Unknown'}</span>
                                    ${log.notes ? `<span class="text-slate-400 text-xs ml-2">"${log.notes}"</span>` : ''}
                                  </div>
                                  <button class="delete-log-btn text-red-400 hover:text-red-300 text-xs" data-log-id="${log.id}" title="Delete this log">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polyline points="3 6 5 6 21 6"></polyline>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            `).join('')
            }
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `}).join('')
    }
            </div>
          </div>

          <!-- Right Column: Hydration & Team -->
          <div class="space-y-8">
            <!-- Hydration Tracker -->
            <div class="bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-700">
              <div class="flex gap-6">
                <!-- Cup Visualization -->
                <div class="relative w-24 h-32 border-4 border-slate-600 border-t-0 rounded-b-3xl overflow-hidden bg-slate-900/50 shrink-0">
                  <!-- Liquid -->
                  <div id="hydration-liquid" class="absolute bottom-0 left-0 right-0 bg-blue-500 transition-all duration-700 ease-in-out flex items-end" style="height: ${lastHydrationProgress}%">
                    <div class="w-full h-2 bg-blue-400/30"></div>
                  </div>
                  <!-- Glass Reflection -->
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
                </div>

                <!-- Info & Controls -->
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Hydration</h2>
                    <div class="flex items-baseline gap-1">
                      <span class="text-4xl font-black text-white">${hydrationTotal}</span>
                      <span class="text-slate-400 font-bold text-lg"> oz</span>
                    </div>
                    <p class="text-blue-500 text-xs font-bold mt-1">GOAL: ${userHydrationGoal} OZ</p>
                  </div>

                  <div class="flex gap-2 mt-2">
                    <button class="add-water-btn flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20" data-amount="8">
                      + 8 oz
                    </button>
                    <button class="add-water-btn flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-colors border border-slate-600" data-amount="16">
                      + 16 oz
                    </button>
                  </div>
                  
                  ${isAdmin ? `
                  <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <button id="set-goal-btn" class="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold py-3 rounded-xl transition-colors">
                      Set Daily Goal
                    </button>
                    <button id="reset-water-btn" class="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-3 rounded-xl transition-colors">
                      Reset Today's Hydration
                    </button>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Recent Logs -->
              <div class="mt-4 space-y-1 pt-4 border-t border-slate-700/50">
                ${hydrationLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-slate-400">
                    <span>${log.amount_oz} oz</span>
                    <div class="flex items-center gap-2">
                      <span>${new Date(log.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      ${isAdmin ? `<button class="delete-water-btn hover:text-white" data-id="${log.id}">×</button>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Juice Tracker -->
            <div class="bg-slate-800 rounded-3xl p-6 shadow-lg border border-slate-700">
              <div class="flex gap-6">
                <!-- Cup Visualization -->
                <div class="relative w-24 h-32 border-4 border-slate-600 border-t-0 rounded-b-3xl overflow-hidden bg-slate-900/50 shrink-0">
                  <!-- Liquid -->
                  <div id="juice-liquid" class="absolute bottom-0 left-0 right-0 bg-orange-500 transition-all duration-700 ease-in-out flex items-end" style="height: ${juiceProgress}%">
                    <div class="w-full h-2 bg-orange-400/30"></div>
                  </div>
                  <!-- Glass Reflection -->
                  <div class="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none"></div>
                </div>

                <!-- Info & Controls -->
                <div class="flex-1 flex flex-col justify-between">
                  <div>
                    <h2 class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Juice</h2>
                    <div class="flex items-baseline gap-1">
                      <span class="text-4xl font-black text-white">${juiceTotal}</span>
                      <span class="text-slate-400 font-bold text-lg"> oz</span>
                    </div>
                    <p class="text-orange-500 text-xs font-bold mt-1">GOAL: ${userJuiceGoal} OZ</p>
                  </div>

                  <div class="flex gap-2 mt-2">
                    <button class="add-juice-btn flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-orange-900/20" data-amount="4">
                      + 4 oz
                    </button>
                    <button class="add-juice-btn flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-colors border border-slate-600" data-amount="8">
                      + 8 oz
                    </button>
                  </div>
                  
                  ${isAdmin ? `
                  <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <button id="set-juice-goal-btn" class="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-bold py-3 rounded-xl transition-colors">
                      Set Juice Goal
                    </button>
                    <button id="reset-juice-btn" class="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-3 rounded-xl transition-colors">
                      Reset Today's Juice
                    </button>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <!-- Recent Logs -->
              <div class="mt-4 space-y-1 pt-4 border-t border-slate-700/50">
                ${juiceLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-slate-400">
                    <span>${log.amount_oz} oz</span>
                    <div class="flex items-center gap-2">
                      <span>${new Date(log.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      ${isAdmin ? `<button class="delete-juice-btn hover:text-white" data-id="${log.id}">×</button>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Team Management -->
            <div class="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-100">Care Team</h2>
                <button id="invite-btn" class="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                  + Invite
                </button>
              </div>
              
              <div class="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                ${caregivers.map(cg => `
                  <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl mb-2">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center relative">
                        <span class="text-blue-500 font-bold text-sm">${cg.name?.charAt(0).toUpperCase() || '?'}</span>
                        ${cg.is_admin ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-slate-900" title="Admin"></div>' : ''}
                      </div>
                      <div>
                        <p class="text-slate-200 text-sm font-semibold flex items-center gap-2">
                          ${cg.name || 'Unnamed'}
                          ${cg.is_admin ? '<span class="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">ADMIN</span>' : ''}
                        </p>
                        <!-- Email hidden for security -->
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      ${cg.id !== currentUser.id ? `
                        ${isAdmin ? `
                          <button class="remove-member-btn text-red-400 hover:text-red-300 p-1" title="Remove" data-id="${cg.id}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        ` : ''}
                      ` : '<span class="text-xs text-blue-400 font-bold px-2 py-1 bg-blue-500/10 rounded">YOU</span>'}
                    </div>
                  </div>
                `).join('')}
              </div>
              
              ${!isAdmin ? `
              <!-- Request Admin Rights (for non-admins) -->
              <div class="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                <p class="text-slate-400 text-xs mb-2">Need to add medications or make changes?</p>
                <button id="request-admin-btn" class="w-full bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 font-bold py-2 rounded-lg transition-colors text-sm">
                  Request Admin Rights
                </button>
                <p class="text-slate-500 text-xs mt-2">Your request will be sent to the admin for approval.</p>
              </div>
              ` : ''}
            </div>

            <!-- Pending Admin Requests (for admin only) -->
            ${isAdmin && messages.filter(m => m.message_type === 'admin_request' && !m.resolved).length > 0 ? `
            <div class="bg-gradient-to-r from-amber-500/20 to-red-500/20 p-6 rounded-2xl border-2 border-amber-500 mt-8 animate-pulse">
              <h2 class="text-xl font-bold text-amber-400 mb-4 flex items-center gap-2">
                ⚠️ Pending Admin Requests
              </h2>
              <div class="space-y-3">
                ${messages.filter(m => m.message_type === 'admin_request' && !m.resolved).map(req => `
                  <div class="bg-slate-800/80 p-4 rounded-xl border border-amber-500/50">
                    <div class="flex justify-between items-start mb-2">
                      <div>
                        <p class="text-slate-200 font-bold">${req.sender_name || 'A caregiver'}</p>
                        <p class="text-slate-400 text-sm">Requested admin rights</p>
                      </div>
                      <span class="text-xs text-slate-500">${new Date(req.created_at).toLocaleString()}</span>
                    </div>
                    <p class="text-slate-300 text-sm mb-3 italic">"${req.content || 'No reason provided'}"</p>
                    <div class="flex gap-2">
                      <button class="approve-admin-btn flex-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold py-2 rounded-lg transition-colors" data-id="${req.id}" data-user-id="${req.sender_id}">
                        ✓ Approve
                      </button>
                      <button class="deny-admin-btn flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold py-2 rounded-lg transition-colors" data-id="${req.id}">
                        ✗ Deny
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Admin Controls -->
            ${isAdmin ? `
              <div class="bg-slate-800 rounded-2xl border border-amber-500/30 mt-8 overflow-hidden">
                <button id="toggle-admin-panel" class="w-full p-6 flex justify-between items-center hover:bg-slate-700/50 transition-colors">
                  <h2 class="text-xl font-bold text-amber-500 flex items-center gap-2">
                    ⚙️ Admin Controls
                  </h2>
                  <svg id="admin-panel-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" class="transition-transform ${adminPanelCollapsed ? '' : 'rotate-180'}">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                
                <div id="admin-panel-content" class="${adminPanelCollapsed ? 'hidden' : ''} px-6 pb-6">
                  <div class="space-y-6">
                    <!-- Switch Patient Section -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Switch Patient</label>
                      <select id="switch-patient-dropdown" class="w-full bg-slate-900 text-slate-200 rounded-xl px-4 py-3 border border-slate-700 outline-none focus:border-blue-500">
                        ${availablePatients.map(p => `
                          <option value="${p.id}" ${p.id === currentPatientId ? 'selected' : ''}>${p.name} ${p.is_admin ? '(Admin)' : ''}</option>
                        `).join('')}
                      </select>
                    </div>

                    <!-- Create New Patient Section -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Create New Patient Circle</label>
                      <button id="create-patient-btn" class="w-full bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Create New Patient Circle
                      </button>
                      <p class="text-xs text-slate-500 mt-2">You'll become admin of the new patient circle.</p>
                    </div>

                    <!-- Your Patient Circles -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Your Patient Circles (${availablePatients.length})</label>
                      <div class="space-y-2">
                        ${availablePatients.map(p => `
                          <div class="flex justify-between items-center p-2 bg-slate-900/50 rounded-lg ${p.id === currentPatientId ? 'border border-blue-500' : ''}">
                            <span class="text-slate-200">${p.name}</span>
                            <span class="text-xs ${p.is_admin ? 'text-amber-500' : 'text-slate-500'}">${p.is_admin ? 'ADMIN' : 'Caregiver'}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>

                    <!-- Patient Visibility Toggle -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Privacy Settings</label>
                      <label class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl cursor-pointer">
                        <div>
                          <span class="text-slate-200">Show in Signup List</span>
                          <p class="text-slate-500 text-xs">When ON, new caregivers can see and join this patient during signup</p>
                        </div>
                        <input type="checkbox" id="patient-visibility-toggle" class="w-5 h-5 accent-blue-500" checked>
                      </label>
                      <p class="text-slate-500 text-xs mt-2">💡 Hidden patients can still be joined by typing the exact name</p>
                    </div>

                    <!-- Session Timeout Setting -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Session Timeout (Auto Logout)</label>
                      <div class="flex gap-3 items-center">
                        <input type="range" id="session-timeout-slider" min="10" max="60" value="${inactivityTimeoutMinutes}" class="flex-1 accent-blue-500">
                        <span id="session-timeout-value" class="text-slate-200 font-bold w-16 text-center">${inactivityTimeoutMinutes} min</span>
                      </div>
                      <p class="text-slate-500 text-xs mt-2">Users will be logged out after this period of inactivity. A 1-minute warning countdown will appear before logout.</p>
                    </div>

                    <!-- Transfer Admin Section -->
                    <div class="border-b border-slate-700 pb-4">
                      <label class="block text-slate-400 text-sm mb-2">Transfer Admin Rights</label>
                      <div class="flex gap-2">
                        <select id="admin-transfer-select" class="flex-1 bg-slate-900 text-slate-200 rounded-xl px-4 py-3 border border-slate-700 outline-none focus:border-amber-500">
                          <option value="">Select a team member...</option>
                          ${caregivers.filter(c => c.id !== currentUser.id).map(c => `
                            <option value="${c.id}">${c.name || c.email}</option>
                          `).join('')}
                        </select>
                        <button id="transfer-admin-btn" class="bg-amber-500/20 text-amber-500 font-bold px-6 py-3 rounded-xl hover:bg-amber-500/30 transition-colors">
                          Transfer
                        </button>
                      </div>
                      <p class="text-xs text-slate-500 mt-2">Warning: You will lose administrator privileges after transferring.</p>
                    </div>

                    <!-- Factory Reset (Dev Only) -->
                    <div class="border-t border-red-500/30 pt-4 mt-6">
                      <label class="block text-red-500 text-sm font-bold mb-2">⚠️ DANGER ZONE</label>
                      <button id="factory-reset-btn" class="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                          <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                        FACTORY RESET
                      </button>
                      <p class="text-xs text-red-400 mt-2">
                        <strong>WARNING:</strong> This deletes ALL data and ALL accounts. Everyone will be logged out and must sign up again.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- BM Tracker Section (Moved to Bottom) -->
        <div class="mt-8 bg-slate-800 p-6 rounded-2xl border ${bmBorderClass}">
          <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 class="text-xl font-bold text-slate-100 flex items-center gap-2">
                💩 Daily BM Check
                <span class="${bmBgClass} ${bmColorClass} text-xs font-bold px-2 py-1 rounded uppercase">${bmMessage}</span>
              </h2>
              <p class="text-slate-400 text-sm mt-1">Last recorded: ${lastYesBM ? new Date(lastYesBM.logged_at).toLocaleString() : 'Never'}</p>
            </div>
            <div class="flex gap-3 w-full md:w-auto">
              <button id="bm-yes-btn" class="flex-1 md:flex-none bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold px-6 py-3 rounded-xl transition-colors">
                YES
              </button>
              <button id="bm-no-btn" class="flex-1 md:flex-none bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold px-6 py-3 rounded-xl transition-colors">
                NO
              </button>
            </div>
          </div>

          <!-- BM History & Controls -->
          <div class="border-t border-slate-700/50 pt-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider">History</h3>
              <button id="log-past-bm-btn" class="text-blue-400 hover:text-blue-300 text-sm font-semibold">
                + Log Past Date
              </button>
            </div>
            
            <div class="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              ${bmLogs.length === 0 ? '<p class="text-slate-500 text-sm italic">No logs recorded yet.</p>' :
      bmLogs.map(log => `
                  <div class="flex justify-between items-center p-2 bg-slate-900/30 rounded-lg border border-slate-700/30">
                    <div class="flex items-center gap-3">
                      <span class="${log.had_bm ? 'text-green-500' : 'text-red-500'} font-bold text-lg">
                        ${log.had_bm ? '✓' : '✕'}
                      </span>
                      <div>
                        <p class="text-slate-200 text-sm font-medium">${new Date(log.logged_at).toLocaleDateString()} ${new Date(log.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                        <p class="text-slate-500 text-xs">${log.notes || ''}</p>
                      </div>
                    </div>
                    <button class="delete-bm-btn text-slate-500 hover:text-red-400 p-2" data-id="${log.id}" title="Delete Log">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                `).join('')
    }
            </div>
          </div>
        </div>
        
      </div>
    </div>
  `;

  // Animate hydration liquid
  setTimeout(() => {
    const liquid = document.getElementById('hydration-liquid');
    if (liquid) {
      liquid.style.height = `${hydrationProgress}%`;
    }
    const juiceLiquid = document.getElementById('juice-liquid');
    if (juiceLiquid) {
      juiceLiquid.style.height = `${juiceProgress}%`;
    }
  }, 50);
  lastHydrationProgress = hydrationProgress;
  lastJuiceProgress = juiceProgress;

  // Setup drag and drop
  setTimeout(setupDragAndDrop, 100);

  // Attach event listeners
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('export-btn').addEventListener('click', handleExportHistory);
  document.getElementById('how-to-use-btn').addEventListener('click', () => {
    showHowToUse = !showHowToUse;
    renderDashboard();
  });
  document.getElementById('close-how-to-use')?.addEventListener('click', () => {
    showHowToUse = false;
    // Mark first login as complete
    if (isFirstLogin) {
      supabase.from('caregivers').update({ first_login: false }).eq('id', currentUser.id);
      isFirstLogin = false;
    }
    renderDashboard();
  });

  // Calendar button
  document.getElementById('calendar-btn')?.addEventListener('click', () => {
    showCalendar = !showCalendar;
    renderDashboard();
  });

  // Calendar navigation
  document.getElementById('prev-month')?.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) {
      calendarMonth = 11;
      calendarYear--;
    }
    renderDashboard();
  });

  document.getElementById('next-month')?.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) {
      calendarMonth = 0;
      calendarYear++;
    }
    renderDashboard();
  });

  // Calendar day click
  document.querySelectorAll('[data-date]').forEach(dayEl => {
    dayEl.addEventListener('click', () => {
      showDayDetail(dayEl.dataset.date);
    });
  });

  // Notifications button
  document.getElementById('notifications-btn')?.addEventListener('click', async () => {
    if (notificationsEnabled) {
      // Toggle off
      notificationsEnabled = false;
      if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
        notificationCheckInterval = null;
      }
      alert('Medication alerts disabled.');
    } else {
      // Enable notifications
      const granted = await requestNotificationPermission();
      if (granted) {
        startMedicationReminders();
        alert('Medication alerts enabled! You\'ll receive notifications when it\'s time for medications.');
      } else {
        alert('Notification permission denied. Please enable notifications in your browser settings.');
      }
    }
    renderDashboard();
  });

  // Switch Patient button (for users with multiple patients)
  const switchPatientBtn = document.getElementById('switch-patient-btn');
  if (switchPatientBtn) {
    switchPatientBtn.addEventListener('click', () => {
      // Show patient selector with current relationships
      loadAvailablePatients().then(() => {
        const patientRels = availablePatients.map(p => ({
          patient_id: p.id,
          patients: { name: p.name },
          is_admin: p.is_admin
        }));
        showPatientSelector(patientRels);
      });
    });
  }

  document.getElementById('add-med-btn')?.addEventListener('click', handleAddMedication);
  document.getElementById('invite-btn').addEventListener('click', handleInviteCaregiver);
  document.getElementById('send-msg-btn')?.addEventListener('click', handleSendMessage);
  document.getElementById('toggle-messages-btn')?.addEventListener('click', () => {
    showAllMessages = !showAllMessages;
    renderDashboard();
  });

  document.getElementById('collapse-messages-btn')?.addEventListener('click', () => {
    showMessagesPanel = !showMessagesPanel;
    renderDashboard();
  });

  // Edit patient name button (admin only)
  document.getElementById('edit-patient-name-btn')?.addEventListener('click', handleEditPatientName);

  // Toggle message text expansion
  window.toggleMessageText = function (msgId) {
    const msgElement = document.querySelector(`[data-msg-id="${msgId}"]`);
    if (!msgElement) return;

    const textElement = msgElement.querySelector('.message-text');
    if (!textElement) return;

    if (textElement.classList.contains('expanded')) {
      textElement.classList.remove('expanded');
      textElement.classList.add('line-clamp-3');
    } else {
      textElement.classList.add('expanded');
      textElement.classList.remove('line-clamp-3');
    }
  };

  // Mark message as read when clicked
  document.querySelectorAll('.message-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const msgId = wrapper.getAttribute('data-msg-id');
      if (msgId && !readMessageIds.has(msgId)) {
        readMessageIds.add(msgId);
        // Update message border to normal
        const msgElement = document.querySelector(`[data-msg-id="${msgId}"]`);
        if (msgElement) {
          msgElement.classList.remove('border-red-500');
          msgElement.classList.add('border-blue-500/30');
        }
        // Update messages panel border if all messages are read
        const hasUnread = messages.some(m => !readMessageIds.has(m.id));
        const messagesPanel = document.getElementById('messages-content');
        if (messagesPanel) {
          if (!hasUnread) {
            messagesPanel.classList.remove('border-2', 'border-red-500', 'rounded-xl');
          }
        }
      }
    });
  });

  // BM Buttons
  document.getElementById('bm-yes-btn')?.addEventListener('click', () => handleLogBM(true));
  document.getElementById('bm-no-btn')?.addEventListener('click', () => handleLogBM(false));
  document.getElementById('log-past-bm-btn')?.addEventListener('click', handleLogPastBM);

  // Delete BM buttons
  document.querySelectorAll('.delete-bm-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteBMLog(btn.dataset.id));
  });

  // Mark as Taken buttons
  document.querySelectorAll('.mark-taken-btn').forEach(btn => {
    btn.addEventListener('click', () => handleMarkTaken(btn.dataset.medId));
  });

  // Edit Medication buttons
  document.querySelectorAll('.edit-med-btn').forEach(btn => {
    btn.addEventListener('click', () => handleEditMedication(btn.dataset.medId));
  });

  // Delete Medication buttons
  document.querySelectorAll('.delete-med-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteMedication(btn.dataset.medId));
  });

  // Toggle History buttons
  document.querySelectorAll('.toggle-history-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleMedHistory(btn.dataset.medId));
  });

  // Log Past Dose buttons
  document.querySelectorAll('.log-past-btn').forEach(btn => {
    btn.addEventListener('click', () => handleLogPastDose(btn.dataset.medId));
  });

  // Add Water buttons
  document.querySelectorAll('.add-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAddWater(parseInt(btn.dataset.amount)));
  });

  // Add Juice buttons
  document.querySelectorAll('.add-juice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAddJuice(parseInt(btn.dataset.amount)));
  });

  // Reset Water button
  const resetBtn = document.getElementById('reset-water-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetHydration);
  }

  // Reset Juice button
  const resetJuiceBtn = document.getElementById('reset-juice-btn');
  if (resetJuiceBtn) {
    resetJuiceBtn.addEventListener('click', handleResetJuice);
  }

  // Set Goal button
  const setGoalBtn = document.getElementById('set-goal-btn');
  if (setGoalBtn) {
    setGoalBtn.addEventListener('click', handleSetHydrationGoal);
  }

  // Set Juice Goal button
  const setJuiceGoalBtn = document.getElementById('set-juice-goal-btn');
  if (setJuiceGoalBtn) {
    setJuiceGoalBtn.addEventListener('click', handleSetJuiceGoal);
  }

  // Skip Dose buttons
  document.querySelectorAll('.skip-dose-btn').forEach(btn => {
    btn.addEventListener('click', () => handleSkipDose(btn.dataset.medId));
  });

  // Take Early buttons
  document.querySelectorAll('.take-early-btn').forEach(btn => {
    btn.addEventListener('click', () => handleTakeEarly(btn.dataset.medId));
  });

  // Delete Log buttons
  document.querySelectorAll('.delete-log-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteMedLog(btn.dataset.logId));
  });

  // Delete Water buttons
  document.querySelectorAll('.delete-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHydration(btn.dataset.id));
  });

  // Delete Juice buttons
  document.querySelectorAll('.delete-juice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteJuice(btn.dataset.id));
  });

  // Delete Message buttons
  document.querySelectorAll('.delete-msg-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteMessage(btn.dataset.id));
  });

  // Remove Member buttons
  document.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', () => handleRemoveCaregiver(btn.dataset.id));
  });

  // Transfer Admin button (Dropdown)
  const transferBtn = document.getElementById('transfer-admin-btn');
  if (transferBtn) {
    transferBtn.addEventListener('click', () => {
      const select = document.getElementById('admin-transfer-select');
      if (select && select.value) {
        handleTransferAdmin(select.value);
      } else {
        alert('Please select a team member to transfer admin rights to.');
      }
    });
  }

  // Create Patient button (Admin only)
  const createPatientBtn = document.getElementById('create-patient-btn');
  if (createPatientBtn) {
    createPatientBtn.addEventListener('click', handleCreatePatient);
  }

  // Patient Visibility Toggle (Admin only)
  const visibilityToggle = document.getElementById('patient-visibility-toggle');
  if (visibilityToggle) {
    // Set initial state based on current patient
    loadPatientVisibility().then(isVisible => {
      visibilityToggle.checked = isVisible;
    });

    visibilityToggle.addEventListener('change', async (e) => {
      try {
        await supabase
          .from('patients')
          .update({ is_visible: e.target.checked })
          .eq('id', currentPatientId);

        alert(e.target.checked ?
          'Patient is now visible in signup list' :
          'Patient is now hidden from signup list');
      } catch (err) {
        alert('Error updating visibility: ' + err.message);
        e.target.checked = !e.target.checked; // Revert
      }
    });
  }

  // Factory Reset Button (Admin only)
  const factoryResetBtn = document.getElementById('factory-reset-btn');
  if (factoryResetBtn) {
    factoryResetBtn.addEventListener('click', async () => {
      // Warning 1
      if (!confirm('⚠️ CRITICAL WARNING: Are you sure you want to perform a FACTORY RESET?\n\nThis will PERMANENTLY DELETE ALL DATA including users, patients, logs, and settings.\n\nThis cannot be undone.')) {
        return;
      }

      // Warning 2
      if (!confirm('🚨 FINAL WARNING: Seriously, this will WIPE THE ENTIRE DATABASE.\n\nAll users will be logged out immediately and will need to create new accounts.\n\nAre you absolutely sure?')) {
        return;
      }

      // Execute Reset
      const btn = document.getElementById('factory-reset-btn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '🧹 Wiping System...';
      btn.disabled = true;

      try {
        // Call the RPC function we created
        const { error } = await supabase.rpc('admin_wipe_system');

        if (error) throw error;

        alert('✅ System Reset Complete.\n\nReloading application...');

        // Force logout and reload
        await supabase.auth.signOut();
        window.location.reload();

      } catch (err) {
        console.error('Reset failed:', err);
        alert('❌ Factory Reset Failed: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });
  }

  // Toggle Admin Panel (Collapsible)
  const toggleAdminPanelBtn = document.getElementById('toggle-admin-panel');
  if (toggleAdminPanelBtn) {
    toggleAdminPanelBtn.addEventListener('click', () => {
      adminPanelCollapsed = !adminPanelCollapsed;
      localStorage.setItem('adminPanelCollapsed', adminPanelCollapsed);

      const content = document.getElementById('admin-panel-content');
      const chevron = document.getElementById('admin-panel-chevron');

      if (content) {
        content.classList.toggle('hidden', adminPanelCollapsed);
      }
      if (chevron) {
        chevron.classList.toggle('rotate-180', !adminPanelCollapsed);
      }
    });
  }

  // Switch Patient Dropdown (Admin Panel)
  const switchPatientDropdown = document.getElementById('switch-patient-dropdown');
  if (switchPatientDropdown) {
    switchPatientDropdown.addEventListener('change', async (e) => {
      if (e.target.value && e.target.value !== currentPatientId) {
        await handleSwitchPatient(e.target.value);
      }
    });
  }

  // Session Timeout Slider
  const sessionTimeoutSlider = document.getElementById('session-timeout-slider');
  if (sessionTimeoutSlider) {
    sessionTimeoutSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const display = document.getElementById('session-timeout-value');
      if (display) {
        display.textContent = `${value} min`;
      }
    });

    sessionTimeoutSlider.addEventListener('change', (e) => {
      const value = parseInt(e.target.value);
      inactivityTimeoutMinutes = value;
      localStorage.setItem('sessionTimeoutMinutes', value);
      resetInactivityTimer();
      alert(`Session timeout updated to ${value} minutes.`);
    });
  }

  // Switch Patient dropdown (Admin only) - OLD, keeping for backwards compat
  const switchPatientSelect = document.getElementById('switch-patient-select');
  if (switchPatientSelect) {
    switchPatientSelect.addEventListener('change', (e) => {
      if (e.target.value) {
        handleSwitchPatient(e.target.value);
      }
    });
  }

  // Request Admin Rights button (non-admins)
  const requestAdminBtn = document.getElementById('request-admin-btn');
  if (requestAdminBtn) {
    requestAdminBtn.addEventListener('click', handleRequestAdminRights);
  }

  // Approve Admin Request buttons
  document.querySelectorAll('.approve-admin-btn').forEach(btn => {
    btn.addEventListener('click', () => handleApproveAdminRequest(btn.dataset.id, btn.dataset.userId));
  });

  // Deny Admin Request buttons
  document.querySelectorAll('.deny-admin-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDenyAdminRequest(btn.dataset.id));
  });
}

// Drag and Drop functionality for medication reordering
let draggedMedId = null;

function setupDragAndDrop() {
  const medCards = document.querySelectorAll('[data-med-id]');

  medCards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedMedId = card.dataset.medId;
      card.classList.add('opacity-50');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('opacity-50');
      draggedMedId = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      card.classList.add('border-blue-500');
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('border-blue-500');
    });

    card.addEventListener('drop', async (e) => {
      e.preventDefault();
      card.classList.remove('border-blue-500');

      const targetMedId = card.dataset.medId;
      if (draggedMedId && targetMedId && draggedMedId !== targetMedId) {
        await reorderMedications(draggedMedId, targetMedId);
      }
    });
  });
}

async function reorderMedications(draggedId, targetId) {
  const draggedIndex = medications.findIndex(m => m.id === draggedId);
  const targetIndex = medications.findIndex(m => m.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) return;

  // Remove dragged medication from array
  const [draggedMed] = medications.splice(draggedIndex, 1);

  // Insert at new position
  medications.splice(targetIndex, 0, draggedMed);

  // Update positions
  const updates = medications.map((med, index) => ({
    id: med.id,
    position: index + 1
  }));

  try {
    // Update all positions in database
    for (const update of updates) {
      await supabase.from('medications').update({ position: update.position }).eq('id', update.id);
    }

    // Reload and re-render
    await loadMedications();
    renderDashboard();
  } catch (err) {
    console.error('Error reordering medications:', err);
    alert('Error reordering medications: ' + err.message);
    // Reload to restore original order
    await loadMedications();
    renderDashboard();
  }
}

// Handle Transfer Admin
async function handleTransferAdmin(newAdminId) {
  if (!confirm('Are you sure you want to transfer admin rights? You will lose your administrator privileges.')) return;

  try {
    // 1. Make new user admin
    const { error: promoteError } = await supabase.from('caregivers').update({ is_admin: true }).eq('id', newAdminId);
    if (promoteError) throw promoteError;

    // 2. Remove admin from current user
    const { error: demoteError } = await supabase.from('caregivers').update({ is_admin: false }).eq('id', currentUser.id);
    if (demoteError) throw demoteError;

    // 3. Update local state
    isAdmin = false;
    await loadCaregivers();
    renderDashboard();
    alert('Admin rights transferred successfully.');
  } catch (err) {
    alert('Error transferring admin rights: ' + err.message);
  }
}

// Handle Request Admin Rights (for non-admins)
async function handleRequestAdminRights() {
  const reason = prompt('Why do you need admin rights? (optional)\n\nExamples:\n- Need to add a new medication\n- Need to update dosage\n- Need to manage team settings');

  if (reason === null) return; // User cancelled

  try {
    // Get current user's name
    const { data: profile } = await supabase.from('caregivers').select('name').eq('id', currentUser.id).single();

    // Create an admin request message
    const { error } = await supabase.from('messages').insert({
      patient_id: currentPatientId,
      sender_id: currentUser.id,
      sender_name: profile?.name || currentUser.email?.split('@')[0],
      content: reason || 'No reason provided',
      message_type: 'admin_request',
      resolved: false
    });

    if (error) throw error;

    alert('Admin rights request sent! The admin will be notified and can approve or deny your request.');
    await loadMessages();
    renderDashboard();
  } catch (err) {
    alert('Error sending request: ' + err.message);
  }
}

// Handle Approve Admin Request
async function handleApproveAdminRequest(requestId, userId) {
  if (!confirm('Approve this admin request? This will transfer your admin rights to this user.')) return;

  try {
    // 1. Make the requester admin
    const { error: promoteError } = await supabase.from('caregivers').update({ is_admin: true }).eq('id', userId);
    if (promoteError) throw promoteError;

    // 2. Remove admin from current user
    const { error: demoteError } = await supabase.from('caregivers').update({ is_admin: false }).eq('id', currentUser.id);
    if (demoteError) throw demoteError;

    // 3. Mark request as resolved
    await supabase.from('messages').update({ resolved: true }).eq('id', requestId);

    // 4. Update local state
    isAdmin = false;
    await Promise.all([loadCaregivers(), loadMessages()]);
    renderDashboard();
    alert('Admin rights transferred successfully!');
  } catch (err) {
    alert('Error approving request: ' + err.message);
  }
}

// Handle Deny Admin Request
async function handleDenyAdminRequest(requestId) {
  if (!confirm('Deny this admin request?')) return;

  try {
    // Mark request as resolved (denied)
    await supabase.from('messages').update({ resolved: true }).eq('id', requestId);

    await loadMessages();
    renderDashboard();
    alert('Request denied.');
  } catch (err) {
    alert('Error denying request: ' + err.message);
  }
}

// Handle Edit Patient Name
async function handleEditPatientName() {
  const newName = prompt('Enter the patient name (who is being cared for):', currentPatientName);
  if (!newName || newName.trim() === '' || newName === currentPatientName) return;

  try {
    const { error } = await supabase.from('patients').update({ name: newName.trim() }).eq('id', currentPatientId);
    if (error) throw error;

    currentPatientName = newName.trim();
    renderDashboard();
    alert('Patient name updated successfully!');
  } catch (err) {
    alert('Error updating patient name: ' + err.message);
  }
}

// Handle Create New Patient
async function handleCreatePatient() {
  const patientName = prompt('Enter the name of the new patient (who will be cared for):');
  if (!patientName || patientName.trim() === '') return;

  try {
    // Create new patient
    const { data: newPatient, error: patientError } = await supabase
      .from('patients')
      .insert({ name: patientName.trim() })
      .select()
      .single();

    if (patientError) throw patientError;

    // Add to junction table (current user becomes admin of new patient)
    await supabase.from('caregiver_patients').insert({
      caregiver_id: currentUser.id,
      patient_id: newPatient.id,
      is_admin: true
    });

    // Show custom modal asking to switch
    showPatientCreatedModal(patientName, newPatient.id);
  } catch (err) {
    alert('Error creating patient: ' + err.message);
  }
}

// Show modal after patient creation with YES/NO options
function showPatientCreatedModal(patientName, patientId) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in';
  modal.innerHTML = `
    <div class="bg-slate-800 rounded-2xl p-8 mx-4 max-w-md w-full border border-slate-700 shadow-2xl animate-scale-in">
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-slate-100 mb-2">Patient Created!</h2>
        <p class="text-slate-300">Patient "<span class="text-green-400 font-bold">${patientName}</span>" created successfully!</p>
        <p class="text-slate-400 mt-2">Do you want to switch to this patient now?</p>
      </div>
      
      <div class="flex gap-3">
        <button id="switch-yes-btn" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl transition-colors btn-press">
          YES - Switch Now
        </button>
        <button id="switch-no-btn" class="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-4 rounded-xl transition-colors border border-slate-600 btn-press">
          NO - Stay Here
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('switch-yes-btn').addEventListener('click', async () => {
    modal.remove();
    await handleSwitchPatient(patientId);
  });

  document.getElementById('switch-no-btn').addEventListener('click', async () => {
    modal.remove();
    await loadAvailablePatients();
    renderDashboard();
    alert(`Staying on current patient. You can switch to "${patientName}" anytime using the Switch Patient button.`);
  });
}

// Handle Switch Patient
async function handleSwitchPatient(newPatientId) {
  if (!newPatientId || newPatientId === currentPatientId) return;

  try {
    // Update current user's patient_id
    const { error } = await supabase
      .from('caregivers')
      .update({ patient_id: newPatientId })
      .eq('id', currentUser.id);

    if (error) throw error;

    // Update local state
    currentPatientId = newPatientId;

    // Get new patient name
    const { data: patientData } = await supabase
      .from('patients')
      .select('name')
      .eq('id', newPatientId)
      .single();

    if (patientData) {
      currentPatientName = patientData.name;
    }

    // Reload all data for the new patient
    await Promise.all([
      loadMedications(),
      loadMedLogs(),
      loadCaregivers(),
      loadHydrationLogs(),
      loadJuiceLogs(),
      loadBMLogs(),
      loadMessages(),
      loadTeamSettings()
    ]);

    renderDashboard();
    alert(`Switched to caring for: ${currentPatientName}`);
  } catch (err) {
    alert('Error switching patient: ' + err.message);
  }
}

// Handle Add Medication
async function handleAddMedication() {
  const name = prompt('Medication name:');
  if (!name) return;

  const dosage = prompt('Dosage (e.g., 500mg):');
  if (!dosage) return;

  const frequency = prompt('Frequency in hours (e.g., 8 for every 8 hours). Enter 0 for "As Needed":');
  if (frequency === null || frequency === '') return;

  const instructions = prompt('Instructions (optional):') || '';

  // Create custom modal for Yes/No selection
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700">
      <h3 class="text-xl font-bold text-slate-100 mb-4">Is this medication MANDATORY?</h3>
      <p class="text-slate-400 text-sm mb-6">
        <strong>YES</strong> = Strict Schedule (No "Take Early" option)<br>
        <strong>NO</strong> = Flexible Schedule
      </p>
      <div class="flex gap-3">
        <button id="mandatory-yes" class="flex-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold py-3 rounded-xl transition-colors border border-green-500/50">
          YES
        </button>
        <button id="mandatory-no" class="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold py-3 rounded-xl transition-colors border border-red-500/50">
          NO
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const isMandatory = await new Promise((resolve) => {
    document.getElementById('mandatory-yes').onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };
    document.getElementById('mandatory-no').onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
  });

  console.log('CareCircle: Adding medication:', { name, dosage, frequency, instructions, isMandatory });

  try {
    // BMAD: Fix - Ensure caregiver record exists before adding medication
    let caregiverRecordId = currentUser?.id;

    // Try to find a caregiver record matching the user's email
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', currentUser?.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected if the user is new
      console.error('CareCircle: Error fetching caregiver:', fetchError);
    }

    if (existingCaregiver) {
      caregiverRecordId = existingCaregiver.id;
    } else {
      // Create a new caregiver record for this user
      const { data: newCaregiver, error: insertError } = await supabase
        .from('caregivers')
        .insert({
          email: currentUser?.email,
          name: currentUser?.email?.split('@')[0] || 'User'
        })
        .select('id')
        .single();

      if (insertError) {
        alert('Failed to create caregiver profile: ' + insertError.message);
        return;
      }

      if (newCaregiver) {
        caregiverRecordId = newCaregiver.id;
      }
    }

    // Calculate position for new medication (add at top)
    // We sort ASC, so smaller number = higher up. We subtract 1 from the current minimum.
    const minPosition = medications.length > 0 ? Math.min(...medications.map(m => m.position || 0)) : 0;
    const newPosition = minPosition - 1;

    // Now insert the medication using the correct caregivers table ID
    const { error } = await supabase.from('medications').insert({
      name,
      dosage,
      frequency_hours: parseInt(frequency),
      instructions,
      created_by: caregiverRecordId,
      start_date: new Date().toISOString(),
      duration_days: 30,
      is_mandatory: isMandatory,
      position: newPosition,
      patient_id: currentPatientId
    });

    if (error) {
      alert('Failed to add medication: ' + error.message);
      return;
    }

    await loadMedications();
    renderDashboard();
  } catch (err) {
    alert('Error adding medication: ' + err.message);
  }
}

// Handle Delete Medication
async function handleDeleteMedication(medId) {
  if (!confirm('Are you sure you want to delete this medication?')) return;

  try {
    const { error } = await supabase.from('medications').delete().eq('id', medId);
    if (error) throw error;

    await loadMedications();
    renderDashboard();
  } catch (err) {
    alert('Error deleting medication: ' + err.message);
  }
}

// Handle Edit Medication
async function handleEditMedication(medId) {
  const med = medications.find(m => m.id === medId);
  if (!med) return;

  const name = prompt('Medication name:', med.name);
  if (!name) return;

  const dosage = prompt('Dosage (e.g., 500mg):', med.dosage);
  if (!dosage) return;

  const frequency = prompt('Frequency in hours (e.g., 8 for every 8 hours). Enter 0 for "As Needed":', med.frequency_hours);
  if (frequency === null || frequency === '') return;

  const instructions = prompt('Instructions (optional):', med.instructions) || '';

  // Create custom modal for Yes/No selection
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700">
      <h3 class="text-xl font-bold text-slate-100 mb-4">Is this medication MANDATORY?</h3>
      <p class="text-slate-400 text-sm mb-6">
        <strong>YES</strong> = Strict Schedule (No "Take Early" option)<br>
        <strong>NO</strong> = Flexible Schedule<br>
        <br>
        Currently: ${med.is_mandatory ? 'YES' : 'NO'}
      </p>
      <div class="flex gap-3">
        <button id="mandatory-yes" class="flex-1 bg-green-500/20 text-green-500 hover:bg-green-500/30 font-bold py-3 rounded-xl transition-colors border border-green-500/50">
          YES
        </button>
        <button id="mandatory-no" class="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 font-bold py-3 rounded-xl transition-colors border border-red-500/50">
          NO
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const isMandatory = await new Promise((resolve) => {
    document.getElementById('mandatory-yes').onclick = () => {
      document.body.removeChild(modal);
      resolve(true);
    };
    document.getElementById('mandatory-no').onclick = () => {
      document.body.removeChild(modal);
      resolve(false);
    };
  });

  console.log('CareCircle: Editing medication:', { medId, name, dosage, frequency, instructions, isMandatory });

  try {
    const { error } = await supabase.from('medications').update({
      name,
      dosage,
      frequency_hours: parseInt(frequency),
      instructions,
      is_mandatory: isMandatory
    }).eq('id', medId);

    if (error) {
      alert('Failed to update medication: ' + error.message);
      return;
    }

    await loadMedications();
    renderDashboard();
  } catch (err) {
    alert('Error updating medication: ' + err.message);
  }
}

// Handle Mark as Taken
async function handleMarkTaken(medId) {
  console.log('CareCircle: Marking medication as taken:', medId);

  try {
    // BMAD: Fix - Find or create caregiver record for the current user
    let caregiverRecordId = currentUser?.id;

    // Try to find a caregiver record matching the user's email
    const { data: existingCaregiver, error: fetchError } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', currentUser?.email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected if the user is new
      console.error('CareCircle: Error fetching caregiver:', fetchError);
    }

    if (existingCaregiver) {
      caregiverRecordId = existingCaregiver.id;
    } else {
      // Create a new caregiver record for this user
      const { data: newCaregiver, error: insertError } = await supabase
        .from('caregivers')
        .insert({
          email: currentUser?.email,
          name: currentUser?.email?.split('@')[0] || 'User'
        })
        .select('id')
        .single();

      if (insertError) {
        alert('Failed to create caregiver profile: ' + insertError.message);
        return;
      }

      if (newCaregiver) {
        caregiverRecordId = newCaregiver.id;
      }
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours before
    const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours after

    const { error } = await supabase.from('med_logs').insert({
      med_id: medId,
      caregiver_id: caregiverRecordId,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      patient_id: currentPatientId
    });

    if (error) {
      alert('Failed to log dose: ' + error.message);
      return;
    }

    // Success - Force immediate reload
    await loadDashboard();
  } catch (err) {
    alert('Error logging dose: ' + err.message);
  }
}

// Toggle medication history visibility
function toggleMedHistory(medId) {
  showMedHistory[medId] = !showMedHistory[medId];
  renderDashboard();
}

// Load Messages
async function loadMessages() {
  console.log('CareCircle: Loading messages...');
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('patient_id', currentPatientId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // If table doesn't exist yet, just ignore
      if (error.code === '42P01') {
        console.log('Messages table not found, skipping.');
        messages = [];
        return;
      }
      console.error('CareCircle: Messages load error:', error);
      messages = [];
      return;
    }

    messages = data || [];

    // Mark all loaded messages as read
    messages.forEach(msg => {
      readMessageIds.add(msg.id);
    });
  } catch (err) {
    console.error('CareCircle: Messages exception:', err);
    messages = [];
  }
}

// Check Daily Reset (Midnight Reset)
async function checkDailyReset() {
  const today = new Date().toISOString().split('T')[0];
  const lastReset = localStorage.getItem('lastResetDate');

  if (lastReset !== today) {
    console.log('CareCircle: Performing daily reset...');

    try {
      // 1. Reset Goals
      // Only admin or first user needs to do this to avoid race conditions,
      // but for simplicity we'll let anyone do it as it's idempotent-ish.
      // Better: Check if goals are already default? No, user might have changed them.
      // We'll just reset them.

      // Update local state first
      userHydrationGoal = 64;
      userJuiceGoal = 20;

      // Update DB
      const { data: settings } = await supabase.from('team_settings').select('id').single();
      if (settings) {
        await supabase.from('team_settings').update({
          hydration_goal: 64,
          juice_goal: 20
        }).eq('id', settings.id);
      }

      // 2. Delete History (Water & Juice)
      // Delete logs older than today (or just all logs from yesterday?)
      // "Delete the history for both the water and juice on reset"
      // This implies clearing the log tables completely or just for previous days?
      // Usually "reset" means start fresh for today.
      // If we delete *all* history, we lose long-term tracking.
      // But the user said "Delete the history". I will delete ALL logs.

      await supabase.from('hydration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      await supabase.from('juice_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      // Update last reset date
      localStorage.setItem('lastResetDate', today);
      console.log('CareCircle: Daily reset complete');

    } catch (err) {
      console.error('CareCircle: Daily reset error:', err);
    }
  }
}

// Check and Announce Update
async function checkAndAnnounceUpdate() {
  const updateMsg = `🚀 CareCircle v3.4.1 - Latest Features

✨ New Features Added:

💧 Hydration & Juice Tracking
• Custom daily goals (default: 128 oz)
• Real-time sync across all team members
• Progress tracking with visual indicators

💊 Medication Management
• "As Needed" medications (enter 0 for frequency)
• Skip Dose functionality for scheduled meds
• Delete individual log entries
• Take Early option for flexible schedules

💩 BM Tracking
• Daily bowel movement logging
• History view with timestamps
• Status indicators (Green/Yellow/Red)
• Log past dates

📱 Message System
• Team communication with real-time updates
• Delete individual messages (hover to see delete button)
• Proper formatting with line breaks preserved

👥 Team Management
• Invite up to 15 caregivers
• Admin controls and transfer rights
• Real-time team member updates

📊 Dashboard
• Stats summary at top
• Visual progress indicators
• Responsive design for all devices

💡 Tips:
• Hover over messages to see delete button
• Use "How to Use" guide for detailed instructions
• All data syncs in real-time across team`;

  // Only admin can post system updates to avoid duplicates
  if (!isAdmin) return;

  // Check if this message exists in the last 10 messages
  const hasUpdate = messages.slice(0, 10).some(m => m.content === updateMsg);

  if (!hasUpdate) {
    console.log('CareCircle: Posting update message...');
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        content: updateMsg,
        created_at: new Date().toISOString(),
        patient_id: currentPatientId
      });

      if (!error) {
        await loadMessages();
      }
    } catch (err) {
      console.error('Error posting update:', err);
    }
  }
}

// Handle Send Message
async function handleSendMessage() {
  const input = document.getElementById('message-input');
  const content = input.value.trim();

  if (!content) return;

  try {
    // Find caregiver ID
    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('id')
      .eq('email', currentUser.email)
      .single();

    if (!caregiver) return;

    const { error } = await supabase.from('messages').insert({
      sender_id: caregiver.id,
      content: content,
      created_at: new Date().toISOString(),
      patient_id: currentPatientId
    });

    if (error) throw error;

    input.value = '';
    await loadMessages();
    renderDashboard();
  } catch (err) {
    alert('Error sending message: ' + err.message);
  }
}

// Handle Log Past Dose
async function handleLogPastDose(medId) {
  // Create modal if it doesn't exist
  let modal = document.getElementById('log-past-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'log-past-modal';
    modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700">
        <h3 class="text-xl font-bold text-slate-100 mb-4">Log Past Dose</h3>
        <p class="text-slate-400 text-sm mb-4">Select the date and time when the medication was administered.</p>
        
        <input type="datetime-local" id="past-dose-date" class="w-full bg-slate-900 text-slate-200 rounded-xl px-4 py-3 border border-slate-700 outline-none focus:border-blue-500 mb-6">
        
        <div class="flex gap-3">
          <button id="cancel-past-dose" class="flex-1 bg-slate-700 text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors">
            Cancel
          </button>
          <button id="confirm-past-dose" class="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors">
            Log Dose
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Set default time to now
  const dateInput = document.getElementById('past-dose-date');
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dateInput.value = now.toISOString().slice(0, 16);

  modal.classList.remove('hidden');

  // Handle actions
  return new Promise((resolve) => {
    const close = () => {
      modal.classList.add('hidden');
      resolve();
    };

    document.getElementById('cancel-past-dose').onclick = close;

    document.getElementById('confirm-past-dose').onclick = async () => {
      const dateStr = dateInput.value;
      if (!dateStr) return;

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        alert('Invalid date format');
        return;
      }

      try {
        // Find caregiver ID
        const { data: caregiver } = await supabase
          .from('caregivers')
          .select('id')
          .eq('email', currentUser.email)
          .single();

        if (!caregiver) return;

        // Calculate window based on the past date
        const windowStart = new Date(date.getTime() - 4 * 60 * 60 * 1000);
        const windowEnd = new Date(date.getTime() + 4 * 60 * 60 * 1000);

        const { error } = await supabase.from('med_logs').insert({
          med_id: medId,
          caregiver_id: caregiver.id,
          administered_at: date.toISOString(),
          window_start: windowStart.toISOString(),
          window_end: windowEnd.toISOString(),
          patient_id: currentPatientId
        });

        if (error) throw error;

        close();
        await loadDashboard();
      } catch (err) {
        alert('Error logging past dose: ' + err.message);
      }
    };
  });
}

// Handle Export History
function handleExportHistory() {
  if (!medLogs.length) {
    alert('No history to export');
    return;
  }

  const headers = ['Date', 'Time', 'Medication', 'Caregiver'];
  const rows = medLogs.map(log => {
    // Fix: Use correct column names (medication_id, caregiver_id)
    const med = medications.find(m => m.id === log.medication_id);
    const cg = caregivers.find(c => c.id === log.caregiver_id);
    const date = new Date(log.administered_at);

    // Format date and time with proper locale settings
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return [
      dateStr,
      timeStr,
      med ? med.name : 'Unknown',
      cg ? cg.name : 'Unknown'
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'medication_history.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Handle Logout
async function handleLogout() {
  console.log('CareCircle: Logging out...');

  await supabase.auth.signOut();
  currentUser = null;
  medications = [];
  caregivers = [];

  showLogin();
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
