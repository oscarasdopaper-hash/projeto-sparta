const fs = require('fs');
const path = require('path');

function walk(dir) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) walk(file);
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(file, 'utf8');
      if (content.match(/export const revalidate = \d+;/)) {
        content = content.replace(/export const revalidate = \d+;[^\n]*/g, "export const dynamic = 'force-dynamic';");
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
      }
    }
  });
}
walk('c:/Users/55119/Downloads/ANTI/HERCULES_PLUGIN/src/app');
