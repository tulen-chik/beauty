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

export async function createBlogAuthorAction(authorId: string, data: Omit<BlogAuthor, 'id'>) {
    const validated = blogAuthorSchema.parse(data);
    await getDb().collection('blog_authors').doc(authorId).set(validated);
    return { ...validated, id: authorId } as BlogAuthor;
}
export async function getBlogAuthorAction(authorId: string) {
    const data = await readDoc<BlogAuthor>('blog_authors', authorId);
    return data ? { ...data, id: authorId } : null;
}
export async function updateBlogAuthorAction(authorId: string, data: Partial<BlogAuthor>) {
    const current = await readDoc<BlogAuthor>('blog_authors', authorId);
    if (!current) throw new Error('Author not found');
    const validated = blogAuthorSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_authors').doc(authorId).set(updated, { merge: true });
    return { ...updated, id: authorId } as BlogAuthor;
}
export async function deleteBlogAuthorAction(authorId: string) {
    await getDb().collection('blog_authors').doc(authorId).delete();
}
export async function listBlogAuthorsAction(): Promise<BlogAuthor[]> {
    const snap = await getDb().collection('blog_authors').get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogAuthor, 'id'>) }));
}

export async function createBlogCategoryAction(categoryId: string, data: Omit<BlogCategory, 'id'>) {
    const validated = blogCategorySchema.parse(data);
    await getDb().collection('blog_categories').doc(categoryId).set(validated);
    return { ...validated, id: categoryId } as BlogCategory;
}
export async function getBlogCategoryAction(categoryId: string) {
    const data = await readDoc<BlogCategory>('blog_categories', categoryId);
    return data ? { ...data, id: categoryId } : null;
}
export async function updateBlogCategoryAction(categoryId: string, data: Partial<BlogCategory>) {
    const current = await readDoc<BlogCategory>('blog_categories', categoryId);
    if (!current) throw new Error('Category not found');
    const validated = blogCategorySchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_categories').doc(categoryId).set(updated, { merge: true });
    return { ...updated, id: categoryId } as BlogCategory;
}
export async function deleteBlogCategoryAction(categoryId: string) {
    await getDb().collection('blog_categories').doc(categoryId).delete();
}
export async function listBlogCategoriesAction(): Promise<BlogCategory[]> {
    const snap = await getDb().collection('blog_categories').get();
    if (snap.empty) return [];
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BlogCategory, 'id'>) }));
}

export async function createBlogPostAction(postId: string, data: Omit<BlogPost, 'id'>) {
    const validated = blogPostSchema.parse(data);
    await getDb().collection('blog_posts').doc(postId).set(validated);
    return { ...validated, id: postId } as BlogPost;
}
export async function getBlogPostAction(postId: string) {
    const data = await readDoc<BlogPost>('blog_posts', postId);
    return data ? { ...data, id: postId } : null;
}
export async function updateBlogPostAction(postId: string, data: Partial<BlogPost>) {
    const current = await readDoc<BlogPost>('blog_posts', postId);
    if (!current) throw new Error('Post not found');
    const validated = blogPostSchema.partial().parse(data);
    const updated = { ...current, ...validated };
    await getDb().collection('blog_posts').doc(postId).set(updated, { merge: true });
    return { ...updated, id: postId } as BlogPost;
}
export async function deleteBlogPostAction(postId: string) {
    await getDb().collection('blog_posts').doc(postId).delete();
}
export async function listBlogPostsAction(): Promise<BlogPost[]> {
    const snap = await getDb().collection('blog_posts').get();
    if (snap.empty) return [];
    return snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<BlogPost, 'id'>) }))
      .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

