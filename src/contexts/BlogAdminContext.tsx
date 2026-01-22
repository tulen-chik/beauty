import React, { createContext, useCallback,useContext, useMemo, useState } from 'react';


import type { BlogAuthor, BlogCategory, BlogPost } from '@/types/database';

interface BlogAdminContextType {
  authors: BlogAuthor[];
  categories: BlogCategory[];
  posts: BlogPost[];

  loadAll: () => Promise<void>;

  // Authors
  createAuthor: (authorId: string, data: Omit<BlogAuthor, 'id'>) => Promise<BlogAuthor>;
  updateAuthor: (authorId: string, data: Partial<BlogAuthor>) => Promise<BlogAuthor>;
  deleteAuthor: (authorId: string) => Promise<void>;

  // Categories
  createCategory: (categoryId: string, data: Omit<BlogCategory, 'id'>) => Promise<BlogCategory>;
  updateCategory: (categoryId: string, data: Partial<BlogCategory>) => Promise<BlogCategory>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Posts
  createPost: (postId: string, data: Omit<BlogPost, 'id'>) => Promise<BlogPost>;
  updatePost: (postId: string, data: Partial<BlogPost>) => Promise<BlogPost>;
  deletePost: (postId: string) => Promise<void>;

  // Blog Images
  uploadImage: (postId: string, file: File) => Promise<{
    id: string;
    postId: string;
    url: string;
    storagePath: string;
    uploadedAt: string;
}>;
  deleteImage: (storagePath: string) => Promise<void>;

  // UI state
  loading: boolean;
  error: string | null;
}

const BlogAdminContext = createContext<BlogAdminContextType | undefined>(undefined);

export const useBlogAdmin = () => {
  const ctx = useContext(BlogAdminContext);
  if (!ctx) throw new Error('useBlogAdmin must be used within BlogAdminProvider');
  return ctx;
};

export const BlogAdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [authorsResponse, categoriesResponse, postsResponse] = await Promise.all([
        fetch('/api/blog/authors'),
        fetch('/api/blog/categories'),
        fetch('/api/blog/posts'),
      ]);

      if (!authorsResponse.ok || !categoriesResponse.ok || !postsResponse.ok) {
        throw new Error('Failed to load blog data');
      }

      const [a, c, p] = await Promise.all([
        authorsResponse.json(),
        categoriesResponse.json(),
        postsResponse.json(),
      ]);
      setAuthors(a);
      setCategories(c);
      setPosts(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Authors
  const createAuthor = useCallback(async (authorId: string, data: Omit<BlogAuthor, 'id'>) => {
    const response = await fetch('/api/blog/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to create author');
    const newAuthor = await response.json();
    setAuthors(prev => [newAuthor, ...prev]);
    return newAuthor;
  }, []);

  const updateAuthor = useCallback(async (authorId: string, data: Partial<BlogAuthor>) => {
    const response = await fetch(`/api/blog/authors/${authorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update author');
    const updated = await response.json();
    setAuthors(prev => prev.map(a => (a.id === authorId ? updated : a)));
    return updated;
  }, []);

  const deleteAuthor = useCallback(async (authorId: string) => {
    const response = await fetch(`/api/blog/authors/${authorId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete author');
    setAuthors(prev => prev.filter(a => a.id !== authorId));
  }, []);

  // Categories
  const createCategory = useCallback(async (categoryId: string, data: Omit<BlogCategory, 'id'>) => {
    const response = await fetch('/api/blog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to create category');
    const newCategory = await response.json();
    setCategories(prev => [newCategory, ...prev]);
    return newCategory;
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<BlogCategory>) => {
    const response = await fetch(`/api/blog/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update category');
    const updated = await response.json();
    setCategories(prev => prev.map(c => (c.id === categoryId ? updated : c)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    const response = await fetch(`/api/blog/categories/${categoryId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete category');
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  // Posts
  const createPost = useCallback(async (postId: string, data: Omit<BlogPost, 'id'>) => {
    const response = await fetch('/api/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to create post');
    const newPost = await response.json();
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  }, []);

  const updatePost = useCallback(async (postId: string, data: Partial<BlogPost>) => {
    const response = await fetch(`/api/blog/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update post');
    const updated = await response.json();
    setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
    return updated;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    const response = await fetch(`/api/blog/posts/${postId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // Blog Images
  const uploadImage = useCallback(async (postId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('postId', postId);

      const response = await fetch('/api/blog/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      return await response.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImage = useCallback(async (storagePath: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/blog/images/${storagePath}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: BlogAdminContextType = useMemo(() => ({
    authors,
    categories,
    posts,
    loadAll,
    createAuthor,
    updateAuthor,
    deleteAuthor,
    createCategory,
    updateCategory,
    deleteCategory,
    createPost,
    updatePost,
    deletePost,
    uploadImage,
    deleteImage,
    loading,
    error,
  }), [
    authors,
    categories,
    posts,
    loadAll,
    createAuthor,
    updateAuthor,
    deleteAuthor,
    createCategory,
    updateCategory,
    deleteCategory,
    createPost,
    updatePost,
    deletePost,
    uploadImage,
    deleteImage,
    loading,
    error,
  ]);

  return (
    <BlogAdminContext.Provider value={value}>
      {children}
    </BlogAdminContext.Provider>
  );
};