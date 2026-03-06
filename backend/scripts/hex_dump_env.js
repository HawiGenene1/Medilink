const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const content = fs.readFileSync(envPath);

console.log('Hex dump of .env (first 500 bytes):');
for (let i = 0; i < Math.min(content.length, 500); i += 16) {
    const chunk = content.slice(i, i + 16);
    const hex = chunk.toString('hex').match(/.{1,2}/g).join(' ');
    const chars = chunk.toString('utf8').replace(/[\r\n\t]/g, '.');
    console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} | ${chars}`);
}
