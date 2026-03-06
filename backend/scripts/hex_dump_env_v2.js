const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const content = fs.readFileSync(envPath);

console.log('Hex dump of .env (bytes 500-1000):');
for (let i = 500; i < Math.min(content.length, 1000); i += 16) {
    const chunk = content.slice(i, Math.min(i + 16, content.length));
    const hex = chunk.toString('hex').match(/.{1,2}/g).join(' ');
    const chars = chunk.toString('utf8').replace(/[\r\n\t]/g, '.');
    console.log(`${i.toString(16).padStart(4, '0')}: ${hex.padEnd(48)} | ${chars}`);
}
