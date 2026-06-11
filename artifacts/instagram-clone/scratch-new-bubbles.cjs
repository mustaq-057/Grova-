const fs = require('fs');

const BUBBLES = [
  {
    id: "library",
    name: "Library",
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50' preserveAspectRatio='none'>
      <rect x='25' y='10' width='65' height='30' rx='8' fill='#F3F4F6' stroke='#D1D5DB' stroke-width='2'/>
      <rect x='5' y='10' width='25' height='30' rx='3' fill='#9CA3AF' stroke='#4B5563' stroke-width='1.5'/>
      <line x1='12' y1='15' x2='12' y2='35' stroke='#D1D5DB' stroke-width='2'/>
      <line x1='18' y1='15' x2='18' y2='35' stroke='#D1D5DB' stroke-width='2'/>
      <rect x='8' y='20' width='14' height='10' rx='2' fill='#D1D5DB'/>
      <path d='M8 25 L22 25' stroke='#9CA3AF' stroke-width='1.5'/>
    </svg>`,
    slice: "15 20 15 35",
    width: "15px 20px 15px 35px",
    outset: "5px 5px 5px 15px",
    padding: "12px 16px 12px 30px",
    color: "#374151"
  },
  {
    id: "angry-model",
    name: "Angry Model",
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50' preserveAspectRatio='none'>
      <rect x='25' y='10' width='65' height='30' rx='12' fill='#FEE2E2' stroke='#F87171' stroke-width='2'/>
      <circle cx='15' cy='25' r='12' fill='#FECACA' stroke='#EF4444' stroke-width='1.5'/>
      <path d='M8 20 L13 23 M22 20 L17 23' stroke='#991B1B' stroke-width='2' stroke-linecap='round'/>
      <circle cx='12' cy='26' r='1.5' fill='#000'/>
      <circle cx='18' cy='26' r='1.5' fill='#000'/>
      <path d='M12 32 Q15 28 18 32' fill='none' stroke='#991B1B' stroke-width='1.5' stroke-linecap='round'/>
      <path d='M22 15 Q25 10 28 15' fill='none' stroke='#EF4444' stroke-width='1.5'/>
    </svg>`,
    slice: "15 20 15 35",
    width: "15px 20px 15px 35px",
    outset: "5px 5px 5px 15px",
    padding: "12px 16px 12px 30px",
    color: "#7F1D1D"
  },
  {
    id: "islamic-serenity",
    name: "Islamic Serenity",
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 50' preserveAspectRatio='none'>
      <defs>
        <linearGradient id='is-bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#064E3B'/>
          <stop offset='100%' stop-color='#065F46'/>
        </linearGradient>
      </defs>
      <rect x='25' y='5' width='70' height='40' rx='20' fill='url(#is-bg)' stroke='#10B981' stroke-width='1.5'/>
      <path d='M15 10 A 12 12 0 1 0 25 30 A 15 15 0 0 1 15 10 Z' fill='#FBBF24' stroke='#F59E0B' stroke-width='1'/>
      <circle cx='28' cy='15' r='2' fill='#FBBF24'/>
      <path d='M25 15 L28 12 L31 15 L28 18 Z' fill='#FBBF24'/>
    </svg>`,
    slice: "20 20 20 40",
    width: "20px 20px 20px 40px",
    outset: "10px 5px 10px 20px",
    padding: "16px 16px 16px 36px",
    color: "#ECFDF5"
  }
];

let css = '';
for (const b of BUBBLES) {
  const b64 = Buffer.from(b.svg).toString('base64');
  css += '\n/* ' + b.id + ' */\n';
  css += '.bubble-' + b.id + ' {\n';
  css += '  border-image-source: url("data:image/svg+xml;base64,' + b64 + '");\n';
  css += '  border-image-slice: ' + b.slice + ' fill;\n';
  css += '  border-image-width: ' + b.width + ';\n';
  css += '  border-image-outset: ' + b.outset + ';\n';
  css += '  border-style: solid;\n';
  css += '  border-width: ' + b.width + ';\n';
  css += '  padding: ' + b.padding + ' !important;\n';
  css += '  color: ' + b.color + ' !important;\n';
  css += '  border-radius: 0 !important;\n';
  css += '  background: transparent !important;\n';
  css += '}\n';
  
  css += '.bubble-icon.bubble-' + b.id + ' { background-image: url("data:image/svg+xml;base64,' + b64 + '"); }\n';
}

fs.writeFileSync('new_bubbles.css', css);
console.log('done');
