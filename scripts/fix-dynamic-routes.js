const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '../app/api');

function traverseAndFix(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseAndFix(fullPath);
        } else if (file === 'route.ts') {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (!content.includes('export const dynamic')) {
                fs.writeFileSync(fullPath, "export const dynamic = 'force-dynamic';\n" + content);
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

traverseAndFix(apiDir);
