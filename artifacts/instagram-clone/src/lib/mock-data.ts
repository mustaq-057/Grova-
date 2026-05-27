export const MOCK_USERS = [
  { id: "1", username: "okaymako", name: "Mako", avatar: "https://picsum.photos/seed/okaymako/150/150", bio: "Photographer based in Tokyo", followers: 12400, following: 342 },
  { id: "2", username: "lunavault", name: "Luna Vault", avatar: "https://picsum.photos/seed/lunavault/150/150", bio: "Capturing light and shadows", followers: 8920, following: 210 },
  { id: "3", username: "driftwood.co", name: "Driftwood", avatar: "https://picsum.photos/seed/driftwood/150/150", bio: "Film photography & aesthetics", followers: 31200, following: 88 },
  { id: "4", username: "thepinkhour", name: "Sarah Pink", avatar: "https://picsum.photos/seed/thepinkhour/150/150", bio: "Golden hour enthusiast", followers: 5610, following: 490 },
  { id: "5", username: "solsticefilm", name: "Solstice Film", avatar: "https://picsum.photos/seed/solsticefilm/150/150", bio: "35mm and medium format", followers: 19800, following: 120 },
  { id: "6", username: "voidframe", name: "Void Frame", avatar: "https://picsum.photos/seed/voidframe/150/150", bio: "Minimalism & architecture", followers: 44300, following: 56 },
  { id: "7", username: "echodrift", name: "Echo Drift", avatar: "https://picsum.photos/seed/echodrift/150/150", bio: "Travel & street photography", followers: 7200, following: 310 },
  { id: "8", username: "rawlens", name: "Raw Lens", avatar: "https://picsum.photos/seed/rawlens/150/150", bio: "Unfiltered moments", followers: 2900, following: 180 },
];

export const MOCK_STORIES = MOCK_USERS.map((user, i) => ({
  id: `story-${i}`,
  user,
  viewed: i > 4,
}));

export const MOCK_POSTS = [
  {
    id: "post-1",
    user: MOCK_USERS[0],
    image: "https://picsum.photos/seed/post1/800/1000",
    likes: 1240,
    caption: "Midnight strolls through Shibuya. The neon lights hit differently after the rain. #tokyo #streetphotography #nightfilm",
    timeAgo: "2 hours ago",
    isLiked: false,
    isSaved: false,
    comments: [
      { id: "c1", user: MOCK_USERS[1], text: "The tones here are incredible." },
      { id: "c2", user: MOCK_USERS[2], text: "Love the atmosphere!" },
    ],
  },
  {
    id: "post-2",
    user: MOCK_USERS[3],
    image: "https://picsum.photos/seed/coast800/800/800",
    likes: 342,
    caption: "Golden hour at the coast. Some light is impossible to recreate. #goldenhour #coast #analog",
    timeAgo: "5 hours ago",
    isLiked: true,
    isSaved: true,
    comments: [
      { id: "c3", user: MOCK_USERS[4], text: "Perfect light." },
      { id: "c4", user: MOCK_USERS[6], text: "Where is this?" },
    ],
  },
  {
    id: "post-3",
    user: MOCK_USERS[5],
    image: "https://picsum.photos/seed/arch900/800/1000",
    likes: 8902,
    caption: "Concrete and glass. The city breathes in geometry. #architecture #minimal #brutalism",
    timeAgo: "1 day ago",
    isLiked: false,
    isSaved: false,
    comments: [],
  },
  {
    id: "post-4",
    user: MOCK_USERS[1],
    image: "https://picsum.photos/seed/forest44/800/900",
    likes: 4580,
    caption: "Lost in the fog. Sometimes disappearing is the point. #fog #landscape #35mm",
    timeAgo: "1 day ago",
    isLiked: true,
    isSaved: false,
    comments: [
      { id: "c5", user: MOCK_USERS[0], text: "This feels like a dream sequence." },
    ],
  },
  {
    id: "post-5",
    user: MOCK_USERS[4],
    image: "https://picsum.photos/seed/film55/800/800",
    likes: 2190,
    caption: "Kodak Portra 400. Still the best way to render skin. #film #portrait #kodak",
    timeAgo: "2 days ago",
    isLiked: false,
    isSaved: true,
    comments: [
      { id: "c6", user: MOCK_USERS[3], text: "Portra forever." },
      { id: "c7", user: MOCK_USERS[7], text: "The grain is perfect." },
    ],
  },
  {
    id: "post-6",
    user: MOCK_USERS[6],
    image: "https://picsum.photos/seed/street66/800/1000",
    likes: 987,
    caption: "Every city has a corner that time forgot. I keep finding them. #street #documentary #urban",
    timeAgo: "3 days ago",
    isLiked: false,
    isSaved: false,
    comments: [],
  },
];

export const MOCK_EXPLORE_GRID = Array.from({ length: 30 }).map((_, i) => ({
  id: `explore-${i}`,
  image: `https://picsum.photos/seed/ex${i + 10}/600/${i % 3 === 0 ? 900 : 600}`,
  likes: Math.floor(Math.random() * 12000) + 100,
  comments: Math.floor(Math.random() * 500) + 5,
  user: MOCK_USERS[i % MOCK_USERS.length],
  isVideo: i % 7 === 0,
}));

export const MOCK_HASHTAGS = [
  "#analog", "#35mm", "#filmisnotdead", "#architecture", "#street", "#portrait", "#landscape", "#golden", "#tokyo", "#minimal",
];

export const MOCK_REELS = Array.from({ length: 8 }).map((_, i) => ({
  id: `reel-${i}`,
  user: MOCK_USERS[i % MOCK_USERS.length],
  thumbnail: `https://picsum.photos/seed/reel${i + 20}/400/700`,
  likes: Math.floor(Math.random() * 50000) + 1000,
  comments: Math.floor(Math.random() * 2000) + 50,
  caption: [
    "Follow the light wherever it goes",
    "3am energy, no filter needed",
    "The city never really sleeps",
    "Found this light on accident and stayed for an hour",
    "One roll left. Making it count.",
    "Architecture is frozen music",
    "Chasing the gradient",
    "Film never lies",
  ][i],
  audio: [
    "Nils Frahm — Says",
    "Brian Eno — An Ending",
    "Bon Iver — Holocene",
    "Floating Points — LesAlpx",
    "Mount Kimbie — Made to Stray",
    "Grouper — Heavy Water",
    "James Blake — Limit to Your Love",
    "Max Richter — On the Nature of Daylight",
  ][i],
  gradient: [
    "from-slate-900 via-purple-950 to-slate-900",
    "from-amber-950 via-orange-900 to-stone-900",
    "from-zinc-900 via-blue-950 to-zinc-900",
    "from-stone-900 via-rose-950 to-stone-900",
    "from-gray-900 via-teal-950 to-gray-900",
    "from-neutral-900 via-indigo-950 to-neutral-900",
    "from-zinc-900 via-amber-950 to-zinc-900",
    "from-slate-900 via-emerald-950 to-slate-900",
  ][i],
}));

export const MOCK_PROFILE_POSTS = Array.from({ length: 18 }).map((_, i) => ({
  id: `profile-post-${i}`,
  image: `https://picsum.photos/seed/pp${i + 40}/400/400`,
  likes: Math.floor(Math.random() * 5000) + 100,
  comments: Math.floor(Math.random() * 200) + 5,
  isVideo: i % 5 === 0,
}));
