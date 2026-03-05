const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("const API_BASE = import.meta.env.VITE_API_URL || 'https://api.uomcc.org';")) {
                content = content.replace(/const API_BASE = import\.meta\.env\.VITE_API_URL \|\| 'https:\/\/api\.uomcc\.org';/g, "const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';");
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed ' + fullPath);
            }
        }
    }
}

processDir('/Users/vikrammacpro/codespace/coursework/CS422/frontend/src');
