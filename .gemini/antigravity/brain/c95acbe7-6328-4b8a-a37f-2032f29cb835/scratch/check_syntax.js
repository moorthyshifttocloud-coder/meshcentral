const fs = require('fs');
const path = require('path');

const filePath = 'views/default.handlebars';
const content = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let errors = [];

while ((match = scriptRegex.exec(content)) !== null) {
    const script = match[1];
    const startIndex = match.index + match[0].indexOf(script);
    const startLine = content.substring(0, startIndex).split('\n').length;
    
    try {
        // Use Function constructor to check syntax
        new Function(script);
    } catch (e) {
        errors.push({
            line: startLine + (e.lineNumber || 0) - 1,
            message: e.message,
            // snippet: script.split('\n').slice(Math.max(0, (e.lineNumber || 0) - 2), (e.lineNumber || 0) + 1).join('\n')
        });
        
        // If it failed, let's try to find exactly where by checking line by line?
        // No, that doesn't work for multi-line.
        
        // Let's just log the error and the first few lines of the script.
        console.log(`Syntax Error in script block starting at line ${startLine}: ${e.message}`);
        
        // Search for potential split strings
        const lines = script.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            const nextLine = lines[i+1].trim();
            
            // Check for unclosed single quote
            const singleQuotes = (line.match(/'/g) || []).length;
            if (singleQuotes % 2 !== 0 && !line.includes('\\\'')) {
                console.log(`  Potential split single-quote string at line ${startLine + i}: ${line}`);
            }
            
            // Check for unclosed double quote
            const doubleQuotes = (line.match(/"/g) || []).length;
            if (doubleQuotes % 2 !== 0 && !line.includes('\\"')) {
                console.log(`  Potential split double-quote string at line ${startLine + i}: ${line}`);
            }
        }
    }
}
