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
let isSignupMode = false;
const DAILY_HYDRATION_GOAL = 64; // 64oz (approx 2 liters)

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
    const { data: profile } = await supabase.from('caregivers').select('id').eq('id', currentUser.id).single();
    
    if (!profile) {
      console.log('CareCircle: Creating missing caregiver profile...');
      const { error: createError } = await supabase.from('caregivers').insert({
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.email.split('@')[0]
      });
      
      if (createError) {
        console.error('CareCircle: Failed to create profile:', createError);
      }
    }

    await Promise.all([
      loadMedications(),
      loadMedLogs(),
      loadCaregivers(),
      loadHydrationLogs()
    ]);
    
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
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'med_logs' }, payload => {
      console.log('New dose logged!', payload);
      Promise.all([loadMedications(), loadMedLogs()]).then(renderDashboard);
    })
    .subscribe();

  supabase
    .channel('public:hydration_logs')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'hydration_logs' }, () => {
      loadHydrationLogs().then(renderDashboard);
    })
    .subscribe();
    
  supabase
    .channel('public:caregivers')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'caregivers' }, () => {
      loadCaregivers().then(renderDashboard);
    })
    .subscribe();
}

// Load Medications
async function loadMedications() {
  console.log('CareCircle: Loading medications...');
  
  try {
    const { data, error } = await supabase.from('medications').select('*');
    
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
    // Get logs from the last 24 hours to check status
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('med_logs')
      .select('*')
      .gte('administered_at', yesterday)
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

// Handle Add Water
async function handleAddWater(amount) {
  try {
    const { error } = await supabase.from('hydration_logs').insert({
      amount_oz: amount,
      logged_at: new Date().toISOString(),
      caregiver_id: currentUser.id
    });

    if (error) throw error;
    // Realtime subscription will handle reload
  } catch (err) {
    alert('Error adding water: ' + err.message);
  }
}

// Handle Delete Hydration
async function handleDeleteHydration(id) {
  if (!confirm('Delete this entry?')) return;
  
  try {
    const { error } = await supabase.from('hydration_logs').delete().eq('id', id);
    if (error) throw error;
  } catch (err) {
    alert('Error deleting entry: ' + err.message);
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
  const hydrationProgress = Math.min((hydrationTotal / DAILY_HYDRATION_GOAL) * 100, 100);

  root.innerHTML = `
    <div class="min-h-screen bg-slate-900 p-6">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-2xl font-black text-slate-100">Hello, ${currentUser?.email?.split('@')[0] || 'User'}</h1>
            <p class="text-slate-400">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button id="logout-btn" class="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-semibold">
            Logout
          </button>
        </div>
        
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div class="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-500">
            <div class="text-blue-500 text-2xl mb-2">💊</div>
            <div class="text-3xl font-black text-slate-100">${medications.length}</div>
            <div class="text-slate-400 text-sm">Active Meds</div>
          </div>
          <div class="bg-slate-800 p-6 rounded-2xl border-l-4 border-amber-500">
            <div class="text-amber-500 text-2xl mb-2">👥</div>
            <div class="text-3xl font-black text-slate-100">${caregivers.length}</div>
            <div class="text-slate-400 text-sm">Team Members</div>
          </div>
          <div class="bg-slate-800 p-6 rounded-2xl border-l-4 border-blue-600">
            <div class="text-blue-500 text-2xl mb-2">💧</div>
            <div class="text-3xl font-black text-slate-100">${hydrationTotal}oz</div>
            <div class="text-slate-400 text-sm">Water Today</div>
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
                  
                  if (lastLog) {
                    const lastTaken = new Date(lastLog.administered_at);
                    const now = new Date();
                    const hoursSince = (now - lastTaken) / (1000 * 60 * 60);
                    
                    if (hoursSince < med.frequency_hours) {
                      isTaken = true;
                      nextDue = new Date(lastTaken.getTime() + med.frequency_hours * 60 * 60 * 1000);
                    }
                  }

                  return `
                  <div class="bg-slate-800 p-6 rounded-2xl mb-4 border border-slate-700 ${isTaken ? 'opacity-75' : ''}">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="text-xl font-bold text-slate-100">${med.name}</h3>
                        <p class="text-slate-400 mt-1">${med.dosage || 'Dosage not specified'} • Every ${med.frequency_hours || '?'}h</p>
                        <p class="text-slate-500 text-sm mt-1">${med.instructions || 'No instructions'}</p>
                      </div>
                      ${isTaken ? '<span class="bg-green-500/20 text-green-500 text-xs font-bold px-2 py-1 rounded-full">TAKEN</span>' : ''}
                    </div>
                    
                    ${isTaken ? `
                      <div class="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                        <p class="text-slate-400 text-sm">Next dose due at</p>
                        <p class="text-slate-200 font-bold">${nextDue.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</p>
                      </div>
                    ` : `
                      <button class="mark-taken-btn w-full mt-4 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold py-3 rounded-xl transition-colors" data-med-id="${med.id}">
                        ✓ Mark as Taken
                      </button>
                    `}
                  </div>
                `}).join('')
              }
            </div>
          </div>

          <!-- Right Column: Hydration & Team -->
          <div class="space-y-8">
            <!-- Hydration Tracker (Mockup Style) -->
            <div class="bg-blue-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
              <div class="relative z-10 flex justify-between items-center">
                <div>
                  <h2 class="text-lg font-semibold">Daily Hydration</h2>
                  <p class="text-blue-100 text-sm">Goal: ${DAILY_HYDRATION_GOAL}oz</p>
                  <div class="mt-4 flex items-baseline">
                    <span class="text-3xl font-bold">${hydrationTotal}</span>
                    <span class="text-sm ml-1 text-blue-100">oz</span>
                  </div>
                </div>
                <!-- Progress Circle with Liquid Effect -->
                <div class="w-20 h-20 rounded-full border-4 border-blue-400 flex items-center justify-center relative bg-blue-800/30 overflow-hidden">
                  <div class="absolute bottom-0 left-0 right-0 bg-blue-300 transition-all duration-500" style="height: ${hydrationProgress}%"></div>
                  <div class="relative z-10 text-xl">💧</div>
                </div>
              </div>
              
              <!-- Quick Add Buttons -->
              <div class="grid grid-cols-2 gap-2 mt-4">
                <button class="add-water-btn bg-white text-blue-600 font-bold py-2 rounded-xl text-sm shadow-sm hover:bg-blue-50 transition-colors" data-amount="8">
                  + 8oz
                </button>
                <button class="add-water-btn bg-white/20 text-white font-bold py-2 rounded-xl text-sm hover:bg-white/30 transition-colors" data-amount="16">
                  + 16oz
                </button>
              </div>

              <!-- Recent Logs -->
              <div class="mt-4 space-y-1">
                ${hydrationLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-blue-100">
                    <span>${log.amount_oz}oz</span>
                    <div class="flex items-center gap-2">
                      <span>${new Date(log.logged_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                      <button class="delete-water-btn hover:text-white" data-id="${log.id}">×</button>
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
              
              <div class="space-y-3">
                ${caregivers.map(cg => `
                  <div class="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span class="text-blue-500 font-bold text-sm">${cg.name?.charAt(0).toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p class="text-slate-200 text-sm font-semibold">${cg.name || 'Unnamed'}</p>
                        <p class="text-slate-500 text-xs">${cg.email}</p>
                      </div>
                    </div>
                    ${cg.id !== currentUser.id ? `
                      <button class="remove-member-btn text-red-400 hover:text-red-300 p-1" data-id="${cg.id}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    ` : '<span class="text-xs text-amber-500 font-bold px-2 py-1 bg-amber-500/10 rounded">YOU</span>'}
                  </div>
                `).join('')}
              </div>
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
Supabase: ${SUPABASE_URL}
          </pre>
        </details>
      </div>
    </div>
  `;
  
  // Attach event listeners
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('add-med-btn').addEventListener('click', handleAddMedication);
  document.getElementById('invite-btn').addEventListener('click', handleInviteCaregiver);
  
  // Mark as Taken buttons
  document.querySelectorAll('.mark-taken-btn').forEach(btn => {
    btn.addEventListener('click', () => handleMarkTaken(btn.dataset.medId));
  });

  // Add Water buttons
  document.querySelectorAll('.add-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAddWater(parseInt(btn.dataset.amount)));
  });

  // Delete Water buttons
  document.querySelectorAll('.delete-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHydration(btn.dataset.id));
  });

  // Remove Member buttons
  document.querySelectorAll('.remove-member-btn').forEach(btn => {
    btn.addEventListener('click', () => handleRemoveCaregiver(btn.dataset.id));
  });
}

// Handle Add Medication
async function handleAddMedication() {
  const name = prompt('Medication name:');
  if (!name) return;
  
  const dosage = prompt('Dosage (e.g., 500mg):');
  if (!dosage) return;
  
  const frequency = prompt('Frequency in hours (e.g., 8 for every 8 hours):');
  if (!frequency) return;
  
  const instructions = prompt('Instructions (optional):') || '';
  
  console.log('CareCircle: Adding medication:', { name, dosage, frequency, instructions });
  
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

    // Now insert the medication using the correct caregivers table ID
    const { error } = await supabase.from('medications').insert({
      name,
      dosage,
      frequency_hours: parseInt(frequency),
      instructions,
      created_by: caregiverRecordId,
      start_date: new Date().toISOString(),
      duration_days: 30
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

// Handle Mark as Taken
async function handleMarkTaken(medId) {
  console.log('CareCircle: Marking medication as taken:', medId);
  
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 4 * 60 * 60 * 1000); // 4 hours before
    const windowEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours after
    
    const { error } = await supabase.from('med_logs').insert({
      med_id: medId,
      caregiver_id: currentUser?.id,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString()
    });
    
    if (error) {
      alert('Failed to log dose: ' + error.message);
      return;
    }
    
    // Success - UI will update via realtime or reload
    await loadDashboard();
  } catch (err) {
    alert('Error logging dose: ' + err.message);
  }
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
