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

// DOM Elements
const root = document.getElementById('root');

// State
let currentUser = null;
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
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('CareCircle: Init error:', error);
    showLogin();
  }
}

// Show Login Screen
function showLogin() {
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
          
          <button id="auth-action-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-colors">
            ${isSignupMode ? 'Sign Up' : 'Sign In'}
          </button>
          
          <button id="toggle-auth-btn" class="w-full text-blue-500 font-semibold py-2">
            ${isSignupMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          
          <div class="mt-6 p-4 bg-slate-800 rounded-xl">
            <p class="text-slate-400 text-sm mb-2">Demo Supabase configured:</p>
            <p class="text-slate-500 text-xs font-mono break-all">${SUPABASE_URL}</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Attach event listeners
  document.getElementById('auth-action-btn').addEventListener('click', isSignupMode ? handleSignUp : handleLogin);
  document.getElementById('toggle-auth-btn').addEventListener('click', toggleAuthMode);
  
  // Password toggle
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');
  toggleBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // Update icon
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
  passwordInput.addEventListener('keydown', (e) => {
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
        // Continue anyway - user is created, profile can be created later
      }
      
      alert('Account created! Please check your email to verify your account. If you don\'t see the email, check your spam folder.');
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
    // Ensure caregiver profile exists
    const { data: profile } = await supabase.from('caregivers').select('*').eq('id', currentUser.id).single();
    
    if (!profile) {
      console.log('CareCircle: Creating missing caregiver profile...');
      
      // Check if any admin exists
      const { count } = await supabase.from('caregivers').select('*', { count: 'exact', head: true }).eq('is_admin', true);
      const shouldBeAdmin = count === 0;

      const { error: createError } = await supabase.from('caregivers').insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email.split('@')[0],
        is_admin: shouldBeAdmin,
        first_login: true,
        login_count: 1,
        hydration_goal: DEFAULT_HYDRATION_GOAL,
        juice_goal: 0
      });
      
      if (createError) {
        console.error('CareCircle: Failed to create profile:', createError);
      }
      
      isAdmin = shouldBeAdmin;
      isFirstLogin = true;
      showHowToUse = true;
      userHydrationGoal = DEFAULT_HYDRATION_GOAL;
      userJuiceGoal = 0;
    } else {
      // Check if user is administrator
      isAdmin = profile.is_admin || false;
      
      // Update login count
      loginCount = (profile.login_count || 0) + 1;
      await supabase.from('caregivers').update({ login_count: loginCount }).eq('id', currentUser.id);
      
      // Check if this is first login
      // Only show if it's literally the first login (count was 0 or 1 and first_login is true)
      isFirstLogin = profile.first_login;
      // Only show How to Use on first login (loginCount == 1)
      showHowToUse = loginCount === 1;
      
      // Immediately mark as not first login so it doesn't show again on refresh
      if (isFirstLogin) {
        await supabase.from('caregivers').update({ first_login: false }).eq('id', currentUser.id);
      }
      
      // Fallback: If no admin exists in the system, make this user admin
      if (!isAdmin) {
        const { count } = await supabase.from('caregivers').select('*', { count: 'exact', head: true }).eq('is_admin', true);
        if (count === 0) {
          console.log('CareCircle: No admin found, promoting current user...');
          await supabase.from('caregivers').update({ is_admin: true }).eq('id', currentUser.id);
          isAdmin = true;
        }
      }
    }

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
    
    await checkAndAnnounceUpdate();
    
    setupRealtimeSubscription();
    renderDashboard();
  } catch (error) {
    console.error('CareCircle: Dashboard load error:', error);
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
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
      loadMessages().then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:team_settings')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'team_settings' }, () => {
      loadTeamSettings().then(renderDashboard);
    })
    .subscribe();
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
    const { data, error } = await supabase.from('medications').select('*').order('position', { ascending: true, nullsFirst: false });
    
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
    const { data, error } = await supabase.from('caregivers').select('*');
    
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
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('hydration_logs')
      .select('*')
      .gte('logged_at', today)
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
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('juice_logs')
      .select('*')
      .gte('logged_at', today)
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
      caregiver_id: caregiverRecordId
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
      caregiver_id: caregiverRecordId
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
      notes: hadBM ? 'Regular BM' : 'No BM reported'
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
          notes: hadBM ? 'Regular BM (Past Log)' : 'No BM reported (Past Log)'
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
    const today = new Date().toISOString().split('T')[0];
    // Delete all logs for today
    const { error } = await supabase.from('hydration_logs')
      .delete()
      .gte('logged_at', today);
      
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
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('juice_logs')
      .delete()
      .gte('logged_at', today);
      
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
      const res = await supabase.from('team_settings').insert({ hydration_goal: goalNum, juice_goal: userJuiceGoal });
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
      const res = await supabase.from('team_settings').insert({ hydration_goal: userHydrationGoal, juice_goal: goalNum });
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
      notes: 'Skipped'
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
    const { error } = await supabase.from('caregivers').insert({
      email: email.trim(),
      name: email.split('@')[0]
    });

    if (error) throw error;
    // Realtime update will show the new member
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
            <h1 class="text-2xl font-black text-slate-100 flex items-center gap-2">
              Hello, ${currentUser?.email?.split('@')[0] || 'User'}
              ${isAdmin ? '<span class="bg-amber-500/20 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/50">ADMIN</span>' : ''}
            </h1>
            <p class="text-slate-400">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="export-btn" class="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg font-semibold hover:text-white transition-colors">
              Export History
            </button>
            <button id="how-to-use-btn" class="bg-blue-500/10 text-blue-500 px-4 py-2 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors">
              How to Use
            </button>
            <button id="logout-btn" class="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">
              Logout
            </button>
          </div>
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
            <button id="add-med-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl mb-6 transition-colors">
              + Add Medication
            </button>
            
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
                      <div class="flex gap-2 ml-4">
                        <button class="edit-med-btn bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold py-2 px-4 rounded-lg text-sm transition-colors" data-med-id="${med.id}">
                          Edit
                        </button>
                        <button class="delete-med-btn bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-2 px-4 rounded-lg text-sm transition-colors" data-med-id="${med.id}">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    ${isTaken ? `
                      <div class="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                        <p class="text-slate-400 text-sm">Last dose taken at</p>
                        <p class="text-slate-200 font-bold">${lastLog.administered_at ? new Date(lastLog.administered_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : 'N/A'}</p>
                        ${nextDue ? `<p class="text-slate-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} ${nextDue.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</p>` : ''}
                        
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
                        ${nextDue ? `<p class="text-red-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} ${nextDue.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</p>` : ''}
                      </div>
                    ` : timeRemaining && !isTaken ? `
                      <div class="mt-4 p-3 bg-blue-500/10 rounded-xl border border-blue-500/30 text-center">
                        <p class="text-blue-400 text-sm">Next dose due in</p>
                        <p class="text-blue-200 font-bold">${timeRemaining?.hours || 0}h ${timeRemaining?.minutes || 0}m</p>
                        ${nextDue ? `<p class="text-blue-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} ${nextDue.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</p>` : ''}
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
                                  <span class="text-slate-400 text-xs">${new Date(log.administered_at).toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                                  <span class="text-slate-300 text-sm font-semibold">${new Date(log.administered_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
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
                  
                  <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <button id="set-goal-btn" class="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 font-bold py-3 rounded-xl transition-colors">
                      Set Daily Goal
                    </button>
                    <button id="reset-water-btn" class="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-3 rounded-xl transition-colors">
                      Reset Today's Hydration
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Recent Logs -->
              <div class="mt-4 space-y-1 pt-4 border-t border-slate-700/50">
                ${hydrationLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-slate-400">
                    <span>${log.amount_oz} oz</span>
                    <div class="flex items-center gap-2">
                      <span>${new Date(log.logged_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                      <button class="delete-water-btn hover:text-white" data-id="${log.id}">×</button>
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
                  
                  <div class="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                    <button id="set-juice-goal-btn" class="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 font-bold py-3 rounded-xl transition-colors">
                      Set Juice Goal
                    </button>
                    <button id="reset-juice-btn" class="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 font-bold py-3 rounded-xl transition-colors">
                      Reset Today's Juice
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Recent Logs -->
              <div class="mt-4 space-y-1 pt-4 border-t border-slate-700/50">
                ${juiceLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-slate-400">
                    <span>${log.amount_oz} oz</span>
                    <div class="flex items-center gap-2">
                      <span>${new Date(log.logged_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                      <button class="delete-juice-btn hover:text-white" data-id="${log.id}">×</button>
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
            </div>

            <!-- Admin Controls -->
            ${isAdmin ? `
              <div class="bg-slate-800 p-6 rounded-2xl border border-amber-500/30 mt-8">
                <h2 class="text-xl font-bold text-amber-500 mb-4">Admin Controls</h2>
                
                <div class="space-y-4">
                  <div>
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
                        <p class="text-slate-200 text-sm font-medium">${new Date(log.logged_at).toLocaleDateString()} ${new Date(log.logged_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</p>
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
        
        <!-- Debug Info -->
        <details class="mt-8">
          <summary class="text-slate-500 text-sm cursor-pointer">Debug Info</summary>
          <pre class="mt-4 bg-slate-800 p-4 rounded-xl text-slate-300 text-xs overflow-auto">
User: ${currentUser?.email || 'Not logged in'}
Medications: ${medications.length}
Caregivers: ${caregivers.length}
Hydration Logs: ${hydrationLogs.length}
Juice Logs: ${juiceLogs.length}
BM Logs: ${bmLogs.length}
Supabase: ${SUPABASE_URL}
          </pre>
        </details>
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
  document.getElementById('add-med-btn').addEventListener('click', handleAddMedication);
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
  
  // Toggle message text expansion
  window.toggleMessageText = function(msgId) {
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
      position: newPosition
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
      window_end: windowEnd.toISOString()
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
        created_at: new Date().toISOString()
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
      created_at: new Date().toISOString()
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
          window_end: windowEnd.toISOString()
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
    const med = medications.find(m => m.id === log.med_id);
    const cg = caregivers.find(c => c.id === log.caregiver_id);
    const date = new Date(log.administered_at);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
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
