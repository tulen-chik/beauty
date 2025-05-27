export interface CommentResponse {
  id: string;
  text: string;
  publication_id: string;
  comment_id: string | null;
  user_id: string;
  commented_at: string;
}

export interface PublicationWithCommentsResponse {
  id: string;
  user_id: string;
  description: string;
  image_url: string | null;
  views_count: number;
  published_at: string;
  updated_at: string;
  comments: CommentResponse[];
}

export interface CreatePublicationRequest {
  description: string;
  image_url?: string | null;
  user_id: string;
}

export interface PublicationError {
  message: string;
  code?: string;
  field?: string;
  validationErrors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PublicationContextType {
  publications: PublicationWithCommentsResponse[];
  currentPublication: PublicationWithCommentsResponse | null;
  isLoading: boolean;
  error: PublicationError | null;
  createPublication: (data: CreatePublicationRequest) => Promise<void>;
  getPublicationsByUser: (userId: string) => Promise<void>;
  getLatestPublications: () => Promise<void>;
  getPublicationById: (publicationId: string) => Promise<void>;
  deletePublication: (publicationId: string) => Promise<void>;
  clearError: () => void;
} 