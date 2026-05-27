// The two users — just you and your wife
export const ME = {
  id: "me",
  username: "okaymako",
  name: "Mako",
  avatar: "https://picsum.photos/seed/okaymako/150/150",
  bio: "Just us two ♥",
  followers: 1,
  following: 1,
};

export const WIFE = {
  id: "wife",
  username: "lunavault",
  name: "Luna",
  avatar: "https://picsum.photos/seed/lunavault/150/150",
  bio: "My person ♥",
  followers: 1,
  following: 1,
};

export const BOTH_USERS = [ME, WIFE];

export const MOCK_STORIES = [
  { id: "story-me", user: ME, viewed: false },
  { id: "story-wife", user: WIFE, viewed: false },
];

export const MOCK_POSTS = [
  {
    id: "post-1",
    user: WIFE,
    image: "https://picsum.photos/seed/couple1/800/900",
    likes: 1,
    caption: "Morning coffee and you. Best combination. ☕",
    timeAgo: "2 hours ago",
    isLiked: true,
    isSaved: false,
    comments: [
      { id: "c1", user: ME, text: "My favorite mornings." },
    ],
  },
  {
    id: "post-2",
    user: ME,
    image: "https://picsum.photos/seed/couple2/800/1000",
    likes: 1,
    caption: "Sunset walk. Wouldn't trade these moments for anything.",
    timeAgo: "Yesterday",
    isLiked: false,
    isSaved: true,
    comments: [
      { id: "c2", user: WIFE, text: "I love this one so much 🌅" },
    ],
  },
  {
    id: "post-3",
    user: WIFE,
    image: "https://picsum.photos/seed/couple3/800/800",
    likes: 1,
    caption: "Found this little café. We're coming back here.",
    timeAgo: "2 days ago",
    isLiked: true,
    isSaved: true,
    comments: [],
  },
  {
    id: "post-4",
    user: ME,
    image: "https://picsum.photos/seed/couple4/800/1000",
    likes: 1,
    caption: "Saturday afternoon light. You were reading and I couldn't stop looking.",
    timeAgo: "3 days ago",
    isLiked: false,
    isSaved: false,
    comments: [
      { id: "c3", user: WIFE, text: "Stop 😭 this is so sweet" },
    ],
  },
  {
    id: "post-5",
    user: WIFE,
    image: "https://picsum.photos/seed/couple5/800/900",
    likes: 1,
    caption: "Our little corner of the world.",
    timeAgo: "5 days ago",
    isLiked: true,
    isSaved: false,
    comments: [],
  },
  {
    id: "post-6",
    user: ME,
    image: "https://picsum.photos/seed/couple6/800/800",
    likes: 1,
    caption: "One year of adventures with my person. Here's to forever.",
    timeAgo: "1 week ago",
    isLiked: true,
    isSaved: true,
    comments: [
      { id: "c4", user: WIFE, text: "Forever and always ♥" },
    ],
  },
];

export const MY_PROFILE_POSTS = MOCK_POSTS.filter((p) => p.user.id === "me");
export const WIFE_PROFILE_POSTS = MOCK_POSTS.filter((p) => p.user.id === "wife");

export const SAVED_POSTS = MOCK_POSTS.filter((p) => p.isSaved);
