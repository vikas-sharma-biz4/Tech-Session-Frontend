#!/usr/bin/env node

/**
 * Script to normalize line endings to LF
 * This ensures consistent line endings across all platforms
 */

const fs = require('fs');
const path = require('path');

const allowedPatterns = [
  /node_modules/,
  /build/,
  /dist/,
  /\.git/,
  /package-lock\.json/,
  /\.log$/,
  /\.min\.js$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.gif$/,
  /\.ico$/,
  /\.svg$/,
  /\.woff$/,
  /\.woff2$/,
  /\.ttf$/,
  /\.eot$/,
];

function shouldProcessFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath);

  for (const pattern of allowedPatterns) {
    if (pattern.test(relativePath)) {
      return false;
    }
  }

  // Process text files
  return /\.(ts|tsx|js|jsx|json|md|yml|yaml|css|scss|html|sh|txt|config\.js|prettierrc|eslintrc|editorconfig|gitattributes|gitignore)$/.test(
    filePath
  );
}

function normalizeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Normalize line endings to LF
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Only write if content changed
    if (content !== normalized) {
      fs.writeFileSync(filePath, normalized, 'utf-8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (shouldProcessFile(filePath)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function main() {
  const args = process.argv.slice(2);
  const isStaged = args.includes('--staged');

  let files = [];

  if (isStaged) {
    // When run from lint-staged, files are passed as arguments (after --staged flag)
    // lint-staged passes files as: node script.js --staged file1 file2 file3
    files = args.filter(
      (arg) =>
        arg !== '--staged' && arg.startsWith && !arg.startsWith('--') && shouldProcessFile(arg)
    );
    // If no files found, try getting from stdin (lint-staged can pass files via stdin)
    if (files.length === 0) {
      // Try to read from process.stdin if available
      try {
        const stdin = process.stdin;
        if (!stdin.isTTY) {
          let input = '';
          stdin.setEncoding('utf8');
          stdin.on('data', (chunk) => {
            input += chunk;
          });
          stdin.on('end', () => {
            if (input.trim()) {
              files = input
                .trim()
                .split('\n')
                .filter((f) => shouldProcessFile(f));
            }
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  } else {
    // Normal mode - process all files
    const srcDir = path.join(process.cwd(), 'src');
    const scriptsDir = path.join(process.cwd(), 'scripts');
    const publicDir = path.join(process.cwd(), 'public');

    if (fs.existsSync(srcDir)) {
      findFiles(srcDir, files);
    }

    if (fs.existsSync(scriptsDir)) {
      findFiles(scriptsDir, files);
    }

    if (fs.existsSync(publicDir)) {
      findFiles(publicDir, files);
    }

    // Also process config files in root
    const configFiles = [
      '.prettierrc.json',
      '.eslintrc.json',
      '.editorconfig',
      '.gitattributes',
      'tsconfig.json',
      'package.json',
    ];

    configFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath) && shouldProcessFile(filePath)) {
        files.push(filePath);
      }
    });
  }

  let changedCount = 0;

  files.forEach((file) => {
    const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
    if (normalizeFile(filePath)) {
      changedCount++;
      if (!isStaged) {
        console.log(`✓ Normalized: ${path.relative(process.cwd(), filePath)}`);
      }
    }
  });

  if (!isStaged) {
    if (changedCount > 0) {
      console.log(`\n✅ Normalized line endings in ${changedCount} file(s)`);
    } else {
      console.log('✅ All files already have LF line endings');
    }
  }
}

main();
