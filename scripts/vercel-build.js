const fs = require('fs');
const { execSync } = require('child_process');

console.log('Cleaning .next cache for fresh build...');
try { execSync('rm -rf .next', { stdio: 'inherit' }); } catch { try { execSync('rmdir /s /q .next', { stdio: 'inherit' }); } catch {} }

console.log('Copying prisma/schema.postgres.prisma to prisma/schema.prisma...');
fs.copyFileSync('prisma/schema.postgres.prisma', 'prisma/schema.prisma');
console.log('Done.');

console.log('Running prisma generate...');
execSync('npx prisma generate', { stdio: 'inherit' });
console.log('Done.');

console.log('Running next build...');
execSync('npx next build', { stdio: 'inherit' });
console.log('Build complete.');
