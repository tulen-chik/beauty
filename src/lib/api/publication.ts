import { axiosInstance } from './axios';
import { 
  CreatePublicationRequest, 
  PublicationWithCommentsResponse 
} from '@/types/publication';

export const publicationApi = {
  async createPublication(data: CreatePublicationRequest): Promise<PublicationWithCommentsResponse> {
    const { data: response } = await axiosInstance.post<PublicationWithCommentsResponse>(
      '/api/v1/publication/',
      data
    );
    return response;
  },

  async getPublicationsByUser(userId: string): Promise<PublicationWithCommentsResponse[]> {
    const { data } = await axiosInstance.get<PublicationWithCommentsResponse[]>(
      `/api/v1/publication/user/${userId}`
    );
    return data;
  },

  async getLatestPublications(): Promise<PublicationWithCommentsResponse[]> {
    const { data } = await axiosInstance.get<PublicationWithCommentsResponse[]>(
      '/api/v1/publication/latest'
    );
    return data;
  },

  async getPublicationById(publicationId: string): Promise<PublicationWithCommentsResponse> {
    const { data } = await axiosInstance.get<PublicationWithCommentsResponse>(
      `/api/v1/publication/${publicationId}`
    );
    return data;
  },

  async deletePublication(publicationId: string): Promise<void> {
    await axiosInstance.delete(`/api/v1/publication/${publicationId}`);
  }
}; 