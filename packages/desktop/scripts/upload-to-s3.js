/**
 * Optional: Upload the built Windows installer to S3.
 * Run from packages/desktop after: npm run build:win
 *
 * Requires AWS CLI configured, or env vars:
 *   S3_BUCKET (required)
 *   S3_REGION (optional, e.g. ap-south-1)
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (optional if using default profile)
 *
 * Usage: node scripts/upload-to-s3.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || 'ap-south-1';
const LOCAL_EXE = path.join(__dirname, '..', 'release', 'PlaySense Companion Setup 1.0.0.exe');
const S3_KEY = 'PlaySense-Setup-1.0.0.exe';

if (!BUCKET) {
  console.error('Set S3_BUCKET env var. Example: S3_BUCKET=playsense-downloads node scripts/upload-to-s3.js');
  process.exit(1);
}

if (!fs.existsSync(LOCAL_EXE)) {
  console.error('Installer not found. Run: npm run build:win');
  process.exit(1);
}

const cmd = `aws s3 cp "${LOCAL_EXE}" s3://${BUCKET}/${S3_KEY} --acl public-read${REGION ? ` --region ${REGION}` : ''}`;
console.log('Uploading to S3...', cmd);
execSync(cmd, { stdio: 'inherit' });
console.log('Done. URL:', `https://${BUCKET}.s3.${REGION}.amazonaws.com/${S3_KEY}`);
