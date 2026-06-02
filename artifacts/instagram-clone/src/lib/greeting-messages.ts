export type GreetingTemplate = {
  id: string;
  text: string;
  companionSticker: string;
};

const mornings = [
  "Good morning",
  "Morning — hope you slept well",
  "Good morning ☀️",
  "Rise and shine",
  "Morning, how are you?",
  "Hope you have a great morning",
];

const hellos = [
  "Hey",
  "Hi",
  "Hello",
  "Hey, you there?",
  "Hi — what's up?",
  "Hey, quick question",
  "Hi, got a sec?",
];

const checkIns = [
  "How are you?",
  "How's your day going?",
  "Everything okay?",
  "You good?",
  "How was work today?",
  "Busy day?",
  "Still up?",
  "You free to talk?",
];

const affection = [
  "Thinking of you",
  "Miss you",
  "Love you",
  "Love you lots",
  "Can't wait to see you",
  "Proud of you",
  "Hope you're having a good day",
  "Sending hugs",
];

const nights = [
  "Good night",
  "Sweet dreams",
  "Sleep well",
  "Night — talk tomorrow",
  "Goodnight, rest up",
  "Heading to bed — night",
];

const practical = [
  "On my way",
  "Running a bit late",
  "Be there soon",
  "Call me when you're free",
  "Can we talk later?",
  "Got it, thanks",
  "Sounds good",
  "Okay 👍",
  "Let me check and get back to you",
  "Talk soon",
  "BRB",
  "One minute",
];

const support = [
  "You've got this",
  "Let me know if you need anything",
  "Here if you want to vent",
  "Hope it gets easier",
  "Well done today",
  "Thank you",
  "That means a lot",
  "Sorry you're having a rough day",
];

const stickers = ["✨", "👋", "💬", "🙂", "❤️", "🫶", "☀️", "🌙", "👍", "🤲", "📍", "📞"];

function build(list: string[], prefix: string): GreetingTemplate[] {
  return list.map((text, i) => ({
    id: `${prefix}-${i}`,
    text,
    companionSticker: stickers[i % stickers.length]!,
  }));
}

/** Quick reply templates for chat — everyday messages, not generic “couple” filler. */
export const GREETING_TEMPLATES: GreetingTemplate[] = [
  ...build(mornings, "am"),
  ...build(hellos, "hi"),
  ...build(checkIns, "check"),
  ...build(affection, "heart"),
  ...build(nights, "night"),
  ...build(practical, "go"),
  ...build(support, "support"),
];
