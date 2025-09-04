// Minimal admin blog store using localStorage with merge from static BlogData
export type AdminAuthor = {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  bio?: string;
  social?: {
    instagram?: string;
    telegram?: string;
    website?: string;
  };
};

export type AdminCategory = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type AdminPostStatus = 'published' | 'draft';

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any[]; // keep flexible to match BlogContent blocks
  authorId: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  categoryId: string;
  tags: string[];
  image: string;
  featured: boolean;
  status: AdminPostStatus;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
};

const LS_KEYS = {
  posts: 'admin_blog_posts',
  authors: 'admin_blog_authors',
  categories: 'admin_blog_categories',
};

// Safe JSON helpers
function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.log("something went wrong")
  }
}

// Import defaults lazily to avoid server import issues
async function loadDefaults() {
  const blogData = await import('@/app/[locale]/blog/BlogData');
  return {
    defaultAuthors: blogData.authors as unknown as AdminAuthor[],
    defaultCategories: blogData.categories as unknown as AdminCategory[],
    defaultPosts: blogData.blogPosts as unknown as AdminPost[],
  };
}

export type BlogAdminSnapshot = {
  posts: AdminPost[];
  authors: AdminAuthor[];
  categories: AdminCategory[];
};

export async function getSnapshot(): Promise<BlogAdminSnapshot> {
  const { defaultAuthors, defaultCategories, defaultPosts } = await loadDefaults();
  const posts = readLS<AdminPost[]>(LS_KEYS.posts, defaultPosts);
  const authors = readLS<AdminAuthor[]>(LS_KEYS.authors, defaultAuthors);
  const categories = readLS<AdminCategory[]>(LS_KEYS.categories, defaultCategories);
  return { posts, authors, categories };
}

// Posts CRUD
export async function listPosts() {
  const snap = await getSnapshot();
  return snap.posts;
}

export async function upsertPost(post: AdminPost) {
  const snap = await getSnapshot();
  const exists = snap.posts.some(p => p.id === post.id);
  const updated = exists
    ? snap.posts.map(p => (p.id === post.id ? { ...post, updatedAt: new Date().toISOString() } : p))
    : [{ ...post, updatedAt: new Date().toISOString() }, ...snap.posts];
  writeLS(LS_KEYS.posts, updated);
  return post;
}

export async function deletePost(id: string) {
  const snap = await getSnapshot();
  writeLS(LS_KEYS.posts, snap.posts.filter(p => p.id !== id));
}

// Authors CRUD
export async function listAuthors() {
  const snap = await getSnapshot();
  return snap.authors;
}

export async function upsertAuthor(author: AdminAuthor) {
  const snap = await getSnapshot();
  const exists = snap.authors.some(a => a.id === author.id);
  const updated = exists
    ? snap.authors.map(a => (a.id === author.id ? author : a))
    : [author, ...snap.authors];
  writeLS(LS_KEYS.authors, updated);
  return author;
}

export async function deleteAuthor(id: string) {
  const snap = await getSnapshot();
  writeLS(LS_KEYS.authors, snap.authors.filter(a => a.id !== id));
}

// Categories CRUD
export async function listCategories() {
  const snap = await getSnapshot();
  return snap.categories;
}

export async function upsertCategory(category: AdminCategory) {
  const snap = await getSnapshot();
  const exists = snap.categories.some(c => c.id === category.id);
  const updated = exists
    ? snap.categories.map(c => (c.id === category.id ? category : c))
    : [category, ...snap.categories];
  writeLS(LS_KEYS.categories, updated);
  return category;
}

export async function deleteCategory(id: string) {
  const snap = await getSnapshot();
  writeLS(LS_KEYS.categories, snap.categories.filter(c => c.id !== id));
}

// Utilities
export function generateId(prefix: string) {
  return `${prefix}_${Date.now()}`;
}
