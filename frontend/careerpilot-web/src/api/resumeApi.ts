import { apiClient } from './client';
import { ApiResponse, ResumeDTO } from '../types';

export const resumeApi = {
  uploadResume: async (file: File): Promise<ApiResponse<ResumeDTO>> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<ResumeDTO>>('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUserResumes: async (): Promise<ApiResponse<ResumeDTO[]>> => {
    const response = await apiClient.get<ApiResponse<ResumeDTO[]>>('/resumes');
    return response.data;
  },

  getResumeById: async (id: number): Promise<ApiResponse<ResumeDTO>> => {
    const response = await apiClient.get<ApiResponse<ResumeDTO>>(`/resumes/${id}`);
    return response.data;
  },

  deleteResume: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/resumes/${id}`);
    return response.data;
  },
};
