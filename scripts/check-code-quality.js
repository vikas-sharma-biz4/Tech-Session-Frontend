#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const allowedPatterns = [
  /node_modules/,
  /build/,
  /dist/,
  /\.prettierrc/,
  /\.git/,
  /package-lock\.json/,
  /\.log$/,
  /\.min\.js$/,
  /check-code-quality\.js$/,
  /check-any\.js$/,
];

const issues = [];

function shouldCheckFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  for (const pattern of allowedPatterns) {
    if (pattern.test(relativePath)) {
      return false;
    }
  }

  return /\.(ts|tsx|js|jsx)$/.test(filePath);
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmedLine = line.trim();

    // Skip comments
    if (
      trimmedLine.startsWith('//') ||
      trimmedLine.startsWith('*') ||
      trimmedLine.startsWith('/*')
    ) {
      return;
    }

    // Check for console.log (allow console.warn and console.error)
    if (/console\.log\(/.test(line) && !/\/\/.*console\.log/.test(line)) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNum,
        content: trimmedLine,
        type: 'console.log',
      });
    }

    // Check for debugger statements
    if (/debugger/.test(line) && !/\/\/.*debugger/.test(line)) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNum,
        content: trimmedLine,
        type: 'debugger',
      });
    }

    // Check for alert statements
    if (/alert\(/.test(line) && !/\/\/.*alert/.test(line)) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNum,
        content: trimmedLine,
        type: 'alert',
      });
    }

    // Check for TODO/FIXME comments without issue tracking
    if (/(TODO|FIXME|XXX|HACK):\s*[^#]/.test(line)) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNum,
        content: trimmedLine,
        type: 'todo',
      });
    }

    // Check for empty catch blocks
    if (/catch\s*\([^)]*\)\s*\{[\s\n]*\}/.test(line)) {
      issues.push({
        file: path.relative(process.cwd(), filePath),
        line: lineNum,
        content: trimmedLine,
        type: 'empty-catch',
      });
    }
  });
}

function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findTypeScriptFiles(filePath, fileList);
    } else if (shouldCheckFile(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  const srcDir = path.join(process.cwd(), 'src');

  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found');
    process.exit(1);
  }

  const files = findTypeScriptFiles(srcDir);

  files.forEach((file) => {
    checkFile(file);
  });

  if (issues.length > 0) {
    console.error('\n❌ Code quality issues found:\n');

    const grouped = issues.reduce((acc, issue) => {
      if (!acc[issue.type]) {
        acc[issue.type] = [];
      }
      acc[issue.type].push(issue);
      return acc;
    }, {});

    Object.entries(grouped).forEach(([type, typeIssues]) => {
      console.error(`\n📋 ${type.toUpperCase()} (${typeIssues.length}):`);
      typeIssues.forEach((issue) => {
        console.error(`   ${issue.file}:${issue.line} - ${issue.content.substring(0, 60)}`);
      });
    });

    console.error('\n⚠️  Please fix these issues before committing.\n');
    process.exit(1);
  }

  console.log('✅ No code quality issues found!');
  process.exit(0);
}

main();
