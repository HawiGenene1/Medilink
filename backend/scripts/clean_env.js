const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const content = fs.readFileSync(envPath, 'utf8');

// Split by any newline, trim each line, and join with standard \n
const lines = content.split(/\r?\n/);
const cleanedLines = lines.map(line => {
    // Only trim trailing spaces/tabs, keep the variable assignment intact
    // but REMOVE any internal \r that might have been pasted
    return line.replace(/\r/g, '').trim();
}).filter(line => line.length > 0 || line === '');

const cleanedContent = cleanedLines.join('\n');

fs.writeFileSync(envPath, cleanedContent);
console.log('.env file cleaned and rewritten.');
