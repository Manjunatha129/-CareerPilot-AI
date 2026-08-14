import { apiClient } from './client';
import { ApiResponse, ResumeDTO } from '../types';

let userResumesCache: ApiResponse<ResumeDTO[]> | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 30000;

export const resumeApi = {
  uploadResume: async (file: File): Promise<ApiResponse<ResumeDTO>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<ResumeDTO>>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    userResumesCache = null; // Invalidate cache on upload
    return response.data;
  },

  getUserResumes: async (forceRefresh = false): Promise<ApiResponse<ResumeDTO[]>> => {
    if (!forceRefresh && userResumesCache && (Date.now() - lastFetchTime < CACHE_TTL_MS)) {
      return userResumesCache;
    }
    const response = await apiClient.get<ApiResponse<ResumeDTO[]>>('/resumes');
    userResumesCache = response.data;
    lastFetchTime = Date.now();
    return response.data;
  },

  getResumeById: async (id: number): Promise<ApiResponse<ResumeDTO>> => {
    const response = await apiClient.get<ApiResponse<ResumeDTO>>(`/resumes/${id}`);
    return response.data;
  },

  deleteResume: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/resumes/${id}`);
    userResumesCache = null; // Invalidate cache on delete
    return response.data;
  },
};
