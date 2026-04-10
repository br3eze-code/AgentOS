import { kernel } from './packages/kernel/src/Kernel';
import { logger } from './packages/kernel/src/Logger';

async function verify() {
  console.log('--- Boot Verification Start ---');
  try {
    console.log('Attempting to boot kernel...');
    await kernel.boot();
    console.log('--- Boot Verification Success ---');
    process.exit(0);
  } catch (err: any) {
    console.error('--- Boot Verification Failure ---');
    console.error(err);
    process.exit(1);
  }
}

verify();
