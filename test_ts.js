const { execSync } = require('child_process');

function check(name, path) {
  try {
    execSync(`npx tsc --noEmit -p ${path}`, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`[${name}] OK`);
  } catch (e) {
    console.log(`[${name}] ERRORS:\n${e.stdout}\n${e.stderr || ''}`);
  }
}

console.log("Starting TS checks...");
check("kernel", "packages/kernel/tsconfig.json");
check("agents", "packages/agents/tsconfig.json");
check("cli", "packages/cli/tsconfig.json");
check("api", "packages/api/tsconfig.json");
console.log("All TS checks finished.");
