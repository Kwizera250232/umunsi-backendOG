#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findAvailablePort(startPort = 5000) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function startServer() {
  log('🚀 Starting Umunsi Server...', 'blue');
  
  // Check if .env exists
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    log('Please run: node setup-database.js', 'yellow');
    process.exit(1);
  }
  
  // Find available port
  const availablePort = await findAvailablePort(5000);
  log(`🔍 Found available port: ${availablePort}`, 'green');
  
  // Update .env with available port
  const envContent = fs.readFileSync(envPath, 'utf8');
  const updatedEnv = envContent.replace(/PORT=\d+/, `PORT=${availablePort}`);
  fs.writeFileSync(envPath, updatedEnv);
  
  // Start the server
  const server = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  server.on('error', (error) => {
    log(`❌ Failed to start server: ${error.message}`, 'red');
    process.exit(1);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      log(`❌ Server exited with code ${code}`, 'red');
    } else {
      log('✅ Server stopped gracefully', 'green');
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    log('\n🛑 Stopping server...', 'yellow');
    server.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    log('\n🛑 Stopping server...', 'yellow');
    server.kill('SIGTERM');
  });
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  log('Umunsi Server Management Script\n', 'blue');
  log('Usage:', 'yellow');
  log('  node start-server.js          # Start server with auto port detection');
  log('  node start-server.js --help   # Show this help message');
  log('\nFeatures:', 'yellow');
  log('  • Automatic port detection');
  log('  • Graceful shutdown handling');
  log('  • Environment validation');
  process.exit(0);
}

startServer();
