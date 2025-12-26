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
let showMedHistory = {}; // Track which medication history is expanded
let isAdmin = false; // Track if current user is administrator
const DAILY_HYDRATION_GOAL = 64; // 64oz (approx 2 liters)
let lastHydrationProgress = 0; // Track last hydration progress for animation

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
        is_admin: shouldBeAdmin
      });
      
      if (createError) {
        console.error('CareCircle: Failed to create profile:', createError);
      }
      
      isAdmin = shouldBeAdmin;
    } else {
      // Check if user is administrator
      isAdmin = profile.is_admin || false;
      
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
            <h1 class="text-2xl font-black text-slate-100 flex items-center gap-2">
              Hello, ${currentUser?.email?.split('@')[0] || 'User'}
              ${isAdmin ? '<span class="bg-amber-500/20 text-amber-500 text-xs font-bold px-2 py-1 rounded border border-amber-500/50">ADMIN</span>' : ''}
            </h1>
            <p class="text-slate-400">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <button id="logout-btn" class="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg font-semibold hover:bg-red-500/20 transition-colors">
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
                  let isOverdue = false;
                  let timeRemaining = null;
                  
                  if (lastLog) {
                    const lastTaken = new Date(lastLog.administered_at);
                    const now = new Date();
                    const hoursSince = (now - lastTaken) / (1000 * 60 * 60);
                    
                    if (hoursSince < med.frequency_hours) {
                      isTaken = true;
                      nextDue = new Date(lastTaken.getTime() + med.frequency_hours * 60 * 60 * 1000);
                    } else {
                      // Medication is overdue
                      isOverdue = true;
                      nextDue = new Date(lastTaken.getTime() + med.frequency_hours * 60 * 60 * 1000);
                      const overdueMs = now - nextDue;
                      const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
                      const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
                      timeRemaining = { hours: overdueHours, minutes: overdueMins, overdue: true };
                    }
                  } else {
                    // No dose logged yet - calculate from start date or show as due now
                    if (med.start_date) {
                      const startDate = new Date(med.start_date);
                      const now = new Date();
                      const hoursSinceStart = (now - startDate) / (1000 * 60 * 60);
                      const cyclesSince = Math.floor(hoursSinceStart / med.frequency_hours);
                      nextDue = new Date(startDate.getTime() + (cyclesSince + 1) * med.frequency_hours * 60 * 60 * 1000);
                      
                      if (now > nextDue) {
                        isOverdue = true;
                        const overdueMs = now - nextDue;
                        const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
                        const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
                        timeRemaining = { hours: overdueHours, minutes: overdueMins, overdue: true };
                      } else {
                        const remainingMs = nextDue - now;
                        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
                        const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
                        timeRemaining = { hours: remainingHours, minutes: remainingMins, overdue: false };
                      }
                    }
                  }

                  // Get all logs for this medication
                  const medHistory = medLogs.filter(log => log.med_id === med.id);
                  const isExpanded = showMedHistory[med.id] || false;

                  return `
                  <div class="bg-slate-800 p-6 rounded-2xl mb-4 border ${isOverdue ? 'border-red-500' : 'border-slate-700'} ${isTaken ? 'opacity-75' : ''}">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="text-xl font-bold text-slate-100">${med.name}</h3>
                        <p class="text-slate-400 mt-1">${med.dosage || 'Dosage not specified'} • Every ${med.frequency_hours || '?'}h</p>
                        <p class="text-slate-500 text-sm mt-1">${med.instructions || 'No instructions'}</p>
                      </div>
                      <div class="flex gap-2">
                        ${isOverdue ? '<span class="bg-red-500/20 text-red-500 text-xs font-bold px-2 py-1 rounded-full">OVERDUE</span>' : ''}
                        ${isTaken ? '<span class="bg-green-500/20 text-green-500 text-xs font-bold px-2 py-1 rounded-full">TAKEN</span>' : ''}
                        <button class="edit-med-btn text-blue-400 hover:text-blue-300 text-xs font-semibold" data-med-id="${med.id}">
                          Edit
                        </button>
                        <button class="delete-med-btn text-red-400 hover:text-red-300 text-xs font-semibold" data-med-id="${med.id}">
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    ${isTaken ? `
                      <div class="mt-4 p-3 bg-slate-900/50 rounded-xl border border-slate-700/50 text-center">
                        <p class="text-slate-400 text-sm">Last dose taken at</p>
                        <p class="text-slate-200 font-bold">${lastLog.administered_at ? new Date(lastLog.administered_at).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'}) : 'N/A'}</p>
                        ${nextDue ? `<p class="text-slate-400 text-xs mt-2">Please take next dose at ${nextDue.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} ${nextDue.toLocaleDateString([], {month: 'short', day: 'numeric', year: 'numeric'})}</p>` : ''}
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
                    
                    ${!isTaken ? `
                      <button class="mark-taken-btn w-full mt-4 bg-green-500/10 text-green-500 hover:bg-green-500/20 font-bold py-3 rounded-xl transition-colors" data-med-id="${med.id}">
                        ✓ Mark as Taken
                      </button>
                    ` : ''}

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
                                <div class="text-right">
                                  <span class="text-slate-500 text-xs">by ${caregivers.find(cg => cg.id === log.caregiver_id)?.name || 'Unknown'}</span>
                                  ${log.notes ? `<span class="text-slate-400 text-xs ml-2">"${log.notes}"</span>` : ''}
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
            <!-- Hydration Tracker (New Design) -->
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
                      <span class="text-slate-400 font-bold text-lg">oz</span>
                    </div>
                    <p class="text-blue-500 text-xs font-bold mt-1">GOAL: ${DAILY_HYDRATION_GOAL}OZ</p>
                  </div>

                  <div class="flex gap-2 mt-2">
                    <button class="add-water-btn flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20" data-amount="8">
                      + 8oz
                    </button>
                    <button class="add-water-btn flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-sm transition-colors border border-slate-600" data-amount="16">
                      + 16oz
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Recent Logs -->
              <div class="mt-4 space-y-1 pt-4 border-t border-slate-700/50">
                ${hydrationLogs.slice(0, 3).map(log => `
                  <div class="flex justify-between items-center text-xs text-slate-400">
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
                        <p class="text-slate-500 text-xs">${cg.email}</p>
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
  
  // Animate hydration liquid
  setTimeout(() => {
    const liquid = document.getElementById('hydration-liquid');
    if (liquid) {
      liquid.style.height = `${hydrationProgress}%`;
    }
  }, 50);
  lastHydrationProgress = hydrationProgress;

  // Attach event listeners
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('add-med-btn').addEventListener('click', handleAddMedication);
  document.getElementById('invite-btn').addEventListener('click', handleInviteCaregiver);
  
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

  // Add Water buttons
  document.querySelectorAll('.add-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAddWater(parseInt(btn.dataset.amount)));
  });

  // Reset Water button
  const resetBtn = document.getElementById('reset-water-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleResetHydration);
  }

  // Delete Water buttons
  document.querySelectorAll('.delete-water-btn').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteHydration(btn.dataset.id));
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
  
  const frequency = prompt('Frequency in hours (e.g., 8 for every 8 hours):', med.frequency_hours);
  if (!frequency) return;
  
  const instructions = prompt('Instructions (optional):', med.instructions) || '';
  
  console.log('CareCircle: Editing medication:', { medId, name, dosage, frequency, instructions });
  
  try {
    const { error } = await supabase.from('medications').update({
      name,
      dosage,
      frequency_hours: parseInt(frequency),
      instructions
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
