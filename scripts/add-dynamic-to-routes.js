const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '../app/api');

function addDynamicExport(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already has dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`✓ Skip (already has dynamic): ${filePath}`);
    return false;
  }

  // Find the first import or the start of the file
  const lines = content.split('\n');
  let insertIndex = 0;

  // Find last import statement
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() && !lines[i].startsWith('import ')) {
      break;
    }
  }

  // Insert the dynamic export after imports
  lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'");

  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ Added dynamic export: ${filePath}`);
  return true;
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'route.js' || file === 'route.ts') {
      addDynamicExport(fullPath);
    }
  }
}

console.log('Adding "export const dynamic = force-dynamic" to all API routes...\n');
processDirectory(apiDir);
console.log('\n✓ Done!');
