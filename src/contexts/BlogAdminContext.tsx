import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { 
  blogAuthorOperations,
  blogCategoryOperations,
  blogPostOperations
} from '@/lib/firebase/database';
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
      const [a, c, p] = await Promise.all([
        blogAuthorOperations.list(),
        blogCategoryOperations.list(),
        blogPostOperations.list(),
      ]);
      setAuthors(a);
      setCategories(c);
      setPosts(p);
      setLoading(false);
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  // Authors
  const createAuthor = useCallback(async (authorId: string, data: Omit<BlogAuthor, 'id'>) => {
    const created = await blogAuthorOperations.create(authorId, data);
    setAuthors(prev => [{ ...created, id: authorId }, ...prev]);
    return { ...created, id: authorId } as BlogAuthor;
  }, []);

  const updateAuthor = useCallback(async (authorId: string, data: Partial<BlogAuthor>) => {
    const updated = await blogAuthorOperations.update(authorId, data);
    setAuthors(prev => prev.map(a => (a.id === authorId ? { ...a, ...data } : a)));
    return { ...updated, id: authorId } as BlogAuthor;
  }, []);

  const deleteAuthor = useCallback(async (authorId: string) => {
    await blogAuthorOperations.delete(authorId);
    setAuthors(prev => prev.filter(a => a.id !== authorId));
  }, []);

  // Categories
  const createCategory = useCallback(async (categoryId: string, data: Omit<BlogCategory, 'id'>) => {
    const created = await blogCategoryOperations.create(categoryId, data);
    setCategories(prev => [{ ...created, id: categoryId }, ...prev]);
    return { ...created, id: categoryId } as BlogCategory;
  }, []);

  const updateCategory = useCallback(async (categoryId: string, data: Partial<BlogCategory>) => {
    const updated = await blogCategoryOperations.update(categoryId, data);
    setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, ...data } : c)));
    return { ...updated, id: categoryId } as BlogCategory;
  }, []);

  const deleteCategory = useCallback(async (categoryId: string) => {
    await blogCategoryOperations.delete(categoryId);
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  // Posts
  const createPost = useCallback(async (postId: string, data: Omit<BlogPost, 'id'>) => {
    const created = await blogPostOperations.create(postId, data);
    setPosts(prev => [{ ...created, id: postId }, ...prev]);
    return { ...created, id: postId } as BlogPost;
  }, []);

  const updatePost = useCallback(async (postId: string, data: Partial<BlogPost>) => {
    const updated = await blogPostOperations.update(postId, data);
    setPosts(prev => prev.map(p => (p.id === postId ? { ...p, ...data } : p)));
    return { ...updated, id: postId } as BlogPost;
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    await blogPostOperations.delete(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
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
    loading,
    error,
  ]);

  return (
    <BlogAdminContext.Provider value={value}>
      {children}
    </BlogAdminContext.Provider>
  );
};
