/**
 * CareCircle Database Admin Script
 * 
 * This script allows you to run database commands directly from your computer.
 * 
 * SETUP:
 * 1. Install Node.js if not installed: https://nodejs.org/
 * 2. Open terminal in this folder
 * 3. Run: npm install @supabase/supabase-js
 * 4. Edit the SUPABASE_URL and SUPABASE_SERVICE_KEY below
 * 
 * USAGE:
 * node db-admin.js reset       # Reset all data
 * node db-admin.js backup      # Show all data (backup)
 * node db-admin.js fix-rls     # Fix RLS policies
 * node db-admin.js users       # List all caregivers
 * node db-admin.js patients    # List all patients
 */

const { createClient } = require('@supabase/supabase-js');

// ============================================================
// CONFIGURATION - Get these from your Supabase Dashboard
// Settings > API > Project URL and service_role key
// ============================================================
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_ROLE_KEY'; // NOT the anon key!

// Create admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================
// COMMANDS
// ============================================================

async function resetAllData() {
    console.log('⚠️  WARNING: This will delete ALL data!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
    await new Promise(r => setTimeout(r, 5000));

    console.log('\n🗑️  Deleting all data...');

    await supabase.from('med_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('hydration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('juice_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('bm_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('medications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('team_settings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('caregiver_patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('caregivers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('✅ All data deleted!');
    console.log('\n⚠️  Remember to also delete users in Supabase Dashboard > Authentication > Users');
}

async function showBackup() {
    console.log('\n📦 BACKUP DATA\n');

    const tables = ['patients', 'caregivers', 'caregiver_patients', 'medications', 'med_logs',
        'hydration_logs', 'juice_logs', 'bm_logs', 'messages', 'team_settings'];

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        console.log(`\n--- ${table.toUpperCase()} (${data?.length || 0} rows) ---`);
        if (data && data.length > 0) {
            console.log(JSON.stringify(data, null, 2));
        }
    }
}

async function listUsers() {
    console.log('\n👥 CAREGIVERS\n');
    const { data } = await supabase.from('caregivers').select('*');
    console.table(data);
}

async function listPatients() {
    console.log('\n🏥 PATIENTS\n');
    const { data } = await supabase.from('patients').select('*');
    console.table(data);
}

async function fixRLS() {
    console.log('\n🔧 To fix RLS policies, run this SQL in Supabase Dashboard:\n');
    console.log(`
DROP POLICY IF EXISTS "caregivers_select_all" ON caregivers;
CREATE POLICY "caregivers_select_all" ON caregivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "caregivers_insert_all" ON caregivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cp_select_all" ON caregiver_patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "cp_insert_all" ON caregiver_patients FOR INSERT TO authenticated WITH CHECK (true);
NOTIFY pgrst, 'reload config';
  `);
}

// ============================================================
// MAIN
// ============================================================

const command = process.argv[2];

if (!command) {
    console.log('Usage: node db-admin.js <command>');
    console.log('Commands: reset, backup, users, patients, fix-rls');
    process.exit(1);
}

if (SUPABASE_URL.includes('YOUR_PROJECT')) {
    console.log('❌ Error: Please edit db-admin.js and add your Supabase credentials!');
    process.exit(1);
}

(async () => {
    switch (command) {
        case 'reset': await resetAllData(); break;
        case 'backup': await showBackup(); break;
        case 'users': await listUsers(); break;
        case 'patients': await listPatients(); break;
        case 'fix-rls': await fixRLS(); break;
        default: console.log('Unknown command:', command);
    }
})();
