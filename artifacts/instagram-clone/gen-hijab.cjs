const fs = require('fs');

const BUBBLES = [
  {
    id: "hijab-knife",
    name: "Hijab Knife",
    img: "/images/bubbles/hijab-1.png",
    bg: "#FEE2E2",
    border: "#EF4444",
    color: "#7F1D1D"
  },
  {
    id: "hijab-skull",
    name: "Hijab Skull",
    img: "/images/bubbles/hijab-2.png",
    bg: "#FEF2F2",
    border: "#B91C1C",
    color: "#450A0A"
  },
  {
    id: "hijab-haram",
    name: "Haram Bro",
    img: "/images/bubbles/hijab-3.png",
    bg: "#FFFBEB",
    border: "#F59E0B",
    color: "#78350F"
  },
  {
    id: "hijab-sparkle",
    name: "Hijab Sparkle",
    img: "/images/bubbles/hijab-4.png",
    bg: "#FEFCE8",
    border: "#EAB308",
    color: "#713F12"
  },
  {
    id: "little-my",
    name: "Little My",
    img: "/images/bubbles/little-my.png",
    bg: "#FFF1F2",
    border: "#E11D48",
    color: "#881337"
  }
];

let css = '';
for (const b of BUBBLES) {
  css += `\n/* ${b.id} */\n`;
  
  // Icon in selector
  css += `.bubble-icon.bubble-${b.id} { background-image: url("${b.img}"); background-size: contain; background-repeat: no-repeat; background-position: center; }\n`;
  
  // Base bubble style
  css += `.bubble-${b.id} {
  background: ${b.bg} !important;
  color: ${b.color} !important;
  border: 1.5px solid ${b.border} !important;
  border-radius: 16px 16px 16px 4px !important;
  border-image-source: none !important;
  border-image-slice: 100% !important;
  padding: 10px 16px !important;
}\n`;

  // Pseudo element for the character
  css += `.bubble-${b.id}::before {
  content: "";
  position: absolute;
  left: -28px;
  bottom: -10px;
  width: 48px;
  height: 48px;
  background-image: url("${b.img}");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: bottom left;
  z-index: 10;
}\n`;

  // Adjust padding to make room for character
  css += `.bubble-${b.id} { padding-left: 28px !important; }\n`;

  // Sent by me (right side)
  css += `.flex-row-reverse .bubble-${b.id} {
  border-radius: 16px 16px 4px 16px !important;
  padding-left: 16px !important;
  padding-right: 28px !important;
}\n`;

  // Flip the character and move to right
  css += `.flex-row-reverse .bubble-${b.id}::before {
  left: auto;
  right: -28px;
  background-position: bottom right;
  transform: scaleX(-1);
}\n`;
}

fs.writeFileSync('new_hijab_bubbles.css', css);
console.log('done');
