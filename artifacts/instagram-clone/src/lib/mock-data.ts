// The two users — just you and your partner
export const ME = {
  id: "me",
  username: "mustaq",
  name: "Mustaq",
  avatar: "https://picsum.photos/seed/mustaq/150/150",
  bio: "Just us two ♥",
  followers: 1,
  following: 1,
};

export const WIFE = {
  id: "wife",
  username: "sara",
  name: "Sara",
  avatar: "https://picsum.photos/seed/sara/150/150",
  bio: "My person ♥",
  followers: 1,
  following: 1,
};

export const BOTH_USERS = [ME, WIFE];

export const MOCK_STORIES = [
  { id: "story-me", user: ME, viewed: false },
  { id: "story-wife", user: WIFE, viewed: false },
];

// Start with empty posts — add your own memories
export const MOCK_POSTS: {
  id: string;
  user: typeof ME;
  image: string;
  likes: number;
  caption: string;
  timeAgo: string;
  isLiked: boolean;
  isSaved: boolean;
  comments: { id: string; user: typeof ME; text: string }[];
}[] = [];

export const MY_PROFILE_POSTS = MOCK_POSTS.filter((p) => p.user.id === "me");
export const WIFE_PROFILE_POSTS = MOCK_POSTS.filter((p) => p.user.id === "wife");
export const SAVED_POSTS = MOCK_POSTS.filter((p) => p.isSaved);
