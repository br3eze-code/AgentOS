const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../smoke-sync.log');

function log(msg: any) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.writeSync(fs.openSync(logFile, 'a'), line);
}

log('--- SYNC SMOKE START ---');

try {
  log('Attempting to load kernel modules...');
  const { kernel } = require('./index');
  log('Kernel loaded.');
  
  log('Attempting to load agents...');
  const { HotspotAgent } = require('../../agents/src');
  log('Agents loaded.');
  
  log('SUCCESS: Core modules are resolvable.');
} catch (err: any) {
  log(`FAILURE: ${err.message}`);
  log(err.stack);
}


log('--- SYNC SMOKE END ---');
