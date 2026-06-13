const fs = require('fs');
let content = fs.readFileSync('src/styles/bubbles.css', 'utf8');
const searchString = '/* hijab-knife */';
const index = content.indexOf(searchString);
if (index !== -1) {
  content = content.substring(0, index);
}
const newContent = fs.readFileSync('new_hijab_bubbles.css', 'utf8');
content += newContent + '\n.bubble-icon::before { display: none !important; }\n';
fs.writeFileSync('src/styles/bubbles.css', content);
