const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(path.join(process.cwd(), 'app'));
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    // Regex: match fetch('/api/something') or fetch(`/api/something/${variable}`)
    content = content.replace(/fetch\(\s*(['"`]\/api\/.*?['"`])\s*\)/g, "fetch($1, { cache: 'no-store' })");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log('Fixed', file);
    }
});
console.log('Fixed', changedFiles, 'files.');
