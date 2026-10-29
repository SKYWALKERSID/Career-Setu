const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function findTestFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findTestFiles(fullPath));
    } else if (file.endsWith('.test.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const libDir = path.join(__dirname, '..', 'src', 'lib');
const testFiles = findTestFiles(libDir);

console.log(`Found ${testFiles.length} unit test files.\n`);

let hasFailure = false;
for (const file of testFiles) {
  const relPath = path.relative(path.join(__dirname, '..'), file);
  console.log(`\n▶ Running: ${relPath}`);
  const res = spawnSync(
    process.execPath,
    ['--env-file=.env.local', '-r', 'ts-node/register/transpile-only', file],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        TS_NODE_COMPILER_OPTIONS: JSON.stringify({ module: 'commonjs', moduleResolution: 'node' }),
      },
    }
  );
  if (res.status !== 0) {
    console.error(`✖ Test failed: ${relPath}`);
    hasFailure = true;
    break;
  }
}

if (hasFailure) {
  process.exit(1);
} else {
  console.log('\n✔ All unit test files passed successfully!');
}
