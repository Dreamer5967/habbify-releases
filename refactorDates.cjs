const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'renderer');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const ignoreFiles = ['timeUtils.ts', 'App.tsx'];

walk(srcDir, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  if (ignoreFiles.some(ignore => filePath.endsWith(ignore))) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace new Date().toISOString().split('T')[0] with getTrueTodayString()
  if (content.includes("new Date().toISOString().split('T')[0]")) {
    content = content.replace(/new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]/g, 'getTrueTodayString()');
  }

  // Replace new Date().toISOString() with getTrueDate().toISOString()
  if (content.includes("new Date().toISOString()")) {
    content = content.replace(/new Date\(\)\.toISOString\(\)/g, 'getTrueDate().toISOString()');
  }

  // Replace new Date() with getTrueDate()
  // Be careful: new Date(something) should NOT be replaced if it has arguments, 
  // but let's just replace exact `new Date()`
  if (content.includes("new Date()")) {
    content = content.replace(/new Date\(\)/g, 'getTrueDate()');
  }

  if (content !== originalContent) {
    // Determine relative path to utils/timeUtils
    const depth = filePath.replace(srcDir, '').split('/').length - 2;
    const relPrefix = depth > 0 ? '../'.repeat(depth) : './';
    const importStatement = `import { getTrueDate, getTrueTodayString } from '${relPrefix}utils/timeUtils'`;

    // Inject import after first import
    const lines = content.split('\n');
    const firstImportIndex = lines.findIndex(l => l.startsWith('import'));
    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
    } else {
      content = importStatement + '\n' + content;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});
