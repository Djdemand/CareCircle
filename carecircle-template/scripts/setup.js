const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, type = 'reset') {
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function askQuestion(query) {
  return new Promise(resolve => rl.question(`${colors.cyan}${query}${colors.reset}`, resolve));
}

async function main() {
  log('\n🚀 CareCircle Setup Wizard\n', 'bright');
  log('This script will help you set up the CareCircle application.\n');

  // 1. Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, 'green');
  if (parseInt(nodeVersion.slice(1).split('.')[0]) < 18) {
    log('Error: Node.js v18 or higher is required.', 'red');
    process.exit(1);
  }

  // 2. Install Dependencies
  log('\n📦 Installing dependencies...', 'yellow');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log('Dependencies installed successfully.', 'green');
  } catch (error) {
    log('Error installing dependencies.', 'red');
    process.exit(1);
  }

  // 3. Get Supabase Credentials
  log('\n🔐 Supabase Configuration', 'yellow');
  log('Please enter your Supabase project credentials.');
  log('You can find these in your Supabase Dashboard > Project Settings > API\n');

  const supabaseUrl = await askQuestion('Enter Supabase URL: ');
  const supabaseKey = await askQuestion('Enter Supabase Anon Key: ');

  if (!supabaseUrl || !supabaseKey) {
    log('Error: Both URL and Key are required.', 'red');
    process.exit(1);
  }

  // 4. Update Configuration Files
  log('\n📝 Updating configuration files...', 'yellow');

  // Update .env
  const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}

EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}
`;
  fs.writeFileSync(path.join(__dirname, '../.env'), envContent);
  log('Created .env file', 'green');

  // Update web/src/config.js
  const configContent = `// Supabase Configuration
window.SUPABASE_CONFIG = {
  URL: '${supabaseUrl}',
  ANON_KEY: '${supabaseKey}'
};

console.log('CareCircle: Supabase config loaded');
`;
  fs.writeFileSync(path.join(__dirname, '../web/src/config.js'), configContent);
  log('Updated web/src/config.js', 'green');

  // 5. Build Web Application
  log('\n🏗️  Building web application...', 'yellow');
  try {
    execSync('npm run build:web', { stdio: 'inherit' });
    log('Build completed successfully!', 'green');
  } catch (error) {
    log('Error building application.', 'red');
    process.exit(1);
  }

  log('\n✅ Setup Complete!', 'bright');
  log('\nNext Steps:');
  log('1. Run the database setup script in Supabase SQL Editor');
  log('   (Located in database/setup_database.sql)');
  log('2. Deploy the "dist" folder to Netlify');
  log('3. For mobile, run "npx expo start"\n');

  rl.close();
}

main();
