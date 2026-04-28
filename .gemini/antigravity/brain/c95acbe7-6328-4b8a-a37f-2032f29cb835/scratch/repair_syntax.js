const fs = require('fs');

const filePath = 'views/default.handlebars';
let content = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;

content = content.replace(scriptRegex, (match, script, offset) => {
    const lines = script.split('\n');
    const resultLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // If this line has an unclosed string, try to join it with the next line
        while (i < lines.length - 1 && isStringUnclosed(line)) {
            console.log(`Joining line ${i} with ${i+1}`);
            line = line + ' ' + lines[++i].trim();
        }
        resultLines.push(line);
    }
    
    return match.replace(script, resultLines.join('\n'));
});

function isStringUnclosed(line) {
    // Very simple check: count quotes, but ignore escaped ones
    // This is not perfect but should catch most cases of split strings
    let singleQuotes = 0;
    let doubleQuotes = 0;
    let inSingle = false;
    let inDouble = false;
    
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = line[j+1];
        
        if (char === '\\') { j++; continue; } // Skip escaped char
        
        if (char === "'" && !inDouble) {
            inSingle = !inSingle;
        } else if (char === '"' && !inSingle) {
            inDouble = !inDouble;
        }
    }
    
    return inSingle || inDouble;
}

fs.writeFileSync(filePath, content);
console.log('Repair complete.');
