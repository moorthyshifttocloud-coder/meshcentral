const fs = require('fs');

const filePath = 'views/default.handlebars';
let content = fs.readFileSync(filePath, 'utf8');

// Fix split comments that now have active code on the next line
// Example: // Console\nMessage Display Timers
content = content.replace(/(\/\/.*)\n\s*([a-zA-Z][a-zA-Z0-9 ]* var )/g, (match, comment, code) => {
    console.log(`Fixing split comment: ${comment}`);
    return comment + ' ' + code;
});

// Fix malformed image paths in JS strings
// Find: src='images/something' + variable + '.png'
// Where the ' after images/ is actually closing the JS string incorrectly.
// Actually, it's more likely: src="images/something' + variable + '.png"
// But the outer JS string uses ".

// Let's just look for common patterns in the errors
content = content.replace(/src=['"]images\/([^'"]+)['"]\s+\+\s+([^ ]+)\s+\+\s+['"]([^'"]+)['"]/g, (match, path, varName, ext) => {
    // If it's already correctly formatted as a JS concatenation, leave it?
    // Wait, the error implies it's NOT correctly concatenated.
    return match; // Placeholder
});

// Fix specific cases from errors
content = content.replace(/src=images\/user-32' \+ xx \+ '\.png/g, "src='images/user-32' + xx + '.png'");
content = content.replace(/srcset="images\/user-64' \+ xx \+ '\.png 2x"/g, "srcset='images/user-64' + xx + '.png 2x'");
content = content.replace(/src="images\/hardware-key-' \+ type \+ '-24\.png"/g, "src='images/hardware-key-' + type + '-24.png'");

// Fix the ones with leading/trailing quotes in the URL
content = content.replace(/src=['"]?images\/details\/['"]?/g, "src='images/details/'"); // Wait, details/ is a directory?
content = content.replace(/src=['"]?\/images\/icon-monitor['"]?/g, "src='images/icon-monitor.png'");

// Fix the ones that look like 'images/icon.png/'
content = content.replace(/['"]images\/([^'"]+)\.png\/['"]/g, "'images/$1.png'");

fs.writeFileSync(filePath, content);
console.log('Second repair complete.');
