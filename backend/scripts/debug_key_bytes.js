require('dotenv').config();
const key = process.env.CHAPA_SECRET_KEY;
if (!key) {
    console.log('KEY NOT FOUND');
    process.exit(1);
}

console.log('Key length:', key.length);
console.log('Key hex dump:');
const buffer = Buffer.from(key);
let hex = '';
for (let b of buffer) {
    hex += b.toString(16).padStart(2, '0') + ' ';
}
console.log(hex);

console.log('Key with markers:');
console.log('|' + key.replace(/\r/g, '[R]').replace(/\n/g, '[N]') + '|');
