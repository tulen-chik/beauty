import { get, ref } from 'firebase/database';

import { createOperation, deleteOperation,readOperation, updateOperation } from './crud';
import { db } from './init';
import { blogAuthorSchema, blogCategorySchema, blogPostSchema } from './schemas';

import type { BlogAuthor, BlogCategory, BlogPost } from '@/types/database';

export const blogAuthorOperations = {
  create: (authorId: string, data: Omit<BlogAuthor, 'id'>) =>
    createOperation(`blog/authors/${authorId}`, data, blogAuthorSchema),
  read: (authorId: string) => readOperation<BlogAuthor>(`blog/authors/${authorId}`),
  update: (authorId: string, data: Partial<BlogAuthor>) =>
    updateOperation(`blog/authors/${authorId}`, data, blogAuthorSchema),
  delete: (authorId: string) => deleteOperation(`blog/authors/${authorId}`),
  list: async (): Promise<BlogAuthor[]> => {
    const snapshot = await get(ref(db, 'blog/authors'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogAuthor, 'id'>>;
    return Object.entries(raw).map(([id, a]) => ({ id, ...(a as any) }));
  }
};

export const blogCategoryOperations = {
  create: (categoryId: string, data: Omit<BlogCategory, 'id'>) =>
    createOperation(`blog/categories/${categoryId}`, data, blogCategorySchema),
  read: (categoryId: string) => readOperation<BlogCategory>(`blog/categories/${categoryId}`),
  update: (categoryId: string, data: Partial<BlogCategory>) =>
    updateOperation(`blog/categories/${categoryId}`, data, blogCategorySchema),
  delete: (categoryId: string) => deleteOperation(`blog/categories/${categoryId}`),
  list: async (): Promise<BlogCategory[]> => {
    const snapshot = await get(ref(db, 'blog/categories'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogCategory, 'id'>>;
    return Object.entries(raw).map(([id, c]) => ({ id, ...(c as any) }));
  }
};

export const blogPostOperations = {
  create: (postId: string, data: Omit<BlogPost, 'id'>) =>
    createOperation(`blog/posts/${postId}`, data, blogPostSchema),
  read: (postId: string) => readOperation<BlogPost>(`blog/posts/${postId}`),
  update: (postId: string, data: Partial<BlogPost>) =>
    updateOperation(`blog/posts/${postId}`, data, blogPostSchema),
  delete: (postId: string) => deleteOperation(`blog/posts/${postId}`),
  list: async (): Promise<BlogPost[]> => {
    const snapshot = await get(ref(db, 'blog/posts'));
    if (!snapshot.exists()) return [];
    const raw = snapshot.val() as Record<string, Omit<BlogPost, 'id'>>;
    return Object.entries(raw)
      .map(([id, p]) => ({ id, ...(p as any) }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }
};
