/**
 * On Vercel the Next.js root is `web/`, so only `web/node_modules` exists.
 * Shared source in the parent folder still resolves packages from
 * `../node_modules`. Create a symlink when that folder is missing.
 * Local Expo installs already have a real root node_modules — leave it.
 */
const fs = require('fs');
const path = require('path');

const from = path.resolve(__dirname, '..', 'node_modules');
const to = path.resolve(__dirname, '..', '..', 'node_modules');

if (!fs.existsSync(from)) {
  process.exit(0);
}

if (fs.existsSync(to)) {
  const stat = fs.lstatSync(to);
  if (!stat.isSymbolicLink()) {
    process.exit(0);
  }
  fs.unlinkSync(to);
}

fs.symlinkSync(from, to, 'dir');
