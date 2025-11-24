'use server';

import { Firestore, Settings } from '@google-cloud/firestore';

import { blogAuthorSchema, blogCategorySchema, blogPostSchema } from '@/lib/firebase/schemas';
import type { BlogAuthor, BlogCategory, BlogPost } from '@/types/database';

let firestoreInstance: Firestore | null = null;

function getDb(): Firestore {
  if (!firestoreInstance) {
    const firestoreSettings: Settings = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      databaseId: 'beautyfirestore',
      credentials: {
        client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        private_key: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      ignoreUndefinedProperties: true,
    };
    firestoreInstance = new Firestore(firestoreSettings);
  }
  return firestoreInstance;
}

const readDoc = async <T>(collection: string, id: string): Promise<T | null> => {
  const snap = await getDb().collection(collection).doc(id).get();
  return snap.exists ? (snap.data() as T) : null;
};

export const blogAuthorActions = {
  create: async (authorId: string, data: Omit<BlogAuthor, 'id'>) => {
    const validated = blogAuthorSchema.parse(data);
    await getDb().collection('blog_authors').doc(authorId).set(validated);
    return { ...validated, id: authorId } as BlogAuthor;
  },
  read: async (authorId: string) => {
    const data = await readDoc<BlogAuthor>('blog_authors', authorId);
    return data ? { ...data, id: authorId } : null;
  },
  update: async (authorId: string, data: Partial<BlogAuthor>) => {
    const current = await readDoc<BlogAuthor>('blog_authors', authorId);
    if (!current) throw new Error('Author not found');
    const validated = blogAuthorSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_authors').doc(authorId).set(updated, { merge: true });
    return { ...updated, id: authorId } as BlogAuthor;
  },
  delete: async (authorId: string) => {
    await getDb().collection('blog_authors').doc(authorId).delete();
  },
  list: async (): Promise<BlogAuthor[]> => {
    const snap = await getDb().collection('blog_authors').get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogAuthor, 'id'>) }));
  },
};

export const blogCategoryActions = {
  create: async (categoryId: string, data: Omit<BlogCategory, 'id'>) => {
    const validated = blogCategorySchema.parse(data);
    await getDb().collection('blog_categories').doc(categoryId).set(validated);
    return { ...validated, id: categoryId } as BlogCategory;
  },
  read: async (categoryId: string) => {
    const data = await readDoc<BlogCategory>('blog_categories', categoryId);
    return data ? { ...data, id: categoryId } : null;
  },
  update: async (categoryId: string, data: Partial<BlogCategory>) => {
    const current = await readDoc<BlogCategory>('blog_categories', categoryId);
    if (!current) throw new Error('Category not found');
    const validated = blogCategorySchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_categories').doc(categoryId).set(updated, { merge: true });
    return { ...updated, id: categoryId } as BlogCategory;
  },
  delete: async (categoryId: string) => {
    await getDb().collection('blog_categories').doc(categoryId).delete();
  },
  list: async (): Promise<BlogCategory[]> => {
    const snap = await getDb().collection('blog_categories').get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogCategory, 'id'>) }));
  },
};

export const blogPostActions = {
  create: async (postId: string, data: Omit<BlogPost, 'id'>) => {
    const validated = blogPostSchema.parse(data);
    await getDb().collection('blog_posts').doc(postId).set(validated);
    return { ...validated, id: postId } as BlogPost;
  },
  read: async (postId: string) => {
    const data = await readDoc<BlogPost>('blog_posts', postId);
    return data ? { ...data, id: postId } : null;
  },
  update: async (postId: string, data: Partial<BlogPost>) => {
    const current = await readDoc<BlogPost>('blog_posts', postId);
    if (!current) throw new Error('Post not found');
    const validated = blogPostSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_posts').doc(postId).set(updated, { merge: true });
    return { ...updated, id: postId } as BlogPost;
  },
  delete: async (postId: string) => {
    await getDb().collection('blog_posts').doc(postId).delete();
  },
  list: async (): Promise<BlogPost[]> => {
    const snap = await getDb().collection('blog_posts').get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
      .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  },
};

