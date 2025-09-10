export interface BlogAuthor {
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
}

export interface BlogCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export type BlogPostStatus = 'published' | 'draft';

export interface BlogPostSEO {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any[];
  authorId: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  categoryId: string;
  tags: string[];
  image: string;
  featured: boolean;
  status: BlogPostStatus;
  seo?: BlogPostSEO;
}

export type BlockColor = 
  | 'gray' 
  | 'rose' 
  | 'pink' 
  | 'purple' 
  | 'indigo' 
  | 'blue' 
  | 'green' 
  | 'yellow';

export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
}

export interface HeadingBlock {
  type: 'heading';
  level: 2 | 3 | 4;
  content: string;
}

export interface ListBlock {
  type: 'list';
  items: string[];
}

export interface StepsBlock {
  type: 'steps';
  steps: string[];
}

export interface TipBlock {
  type: 'tip';
  title: string;
  content: string;
  color: BlockColor;
}

export interface InfoBoxBlock {
  type: 'infoBox';
  title: string;
  items: string[];
  color: BlockColor;
}

export interface ProductRatingBlock {
  type: 'productRating';
  name: string;
  rating: string; // Например, "9/10"
  description: string;
  color: BlockColor;
}

export type BlogContent =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | StepsBlock
  | TipBlock
  | InfoBoxBlock
  | ProductRatingBlock;
