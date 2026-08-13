import { apiClient } from './client';
import { ApiResponse, MatchResponseDTO } from '../types';

export interface CustomMatchPayload {
  jobTitle?: string;
  companyName?: string;
  jobDescription: string;
  location?: string;
  workMode?: String;
  experienceLevel?: string;
}

export const matchingApi = {
  calculateJobMatch: async (jobId: number): Promise<ApiResponse<MatchResponseDTO>> => {
    const response = await apiClient.get<ApiResponse<MatchResponseDTO>>(`/jobs/${jobId}/match`);
    return response.data;
  },

  calculateCustomMatch: async (payload: CustomMatchPayload): Promise<ApiResponse<MatchResponseDTO>> => {
    const response = await apiClient.post<ApiResponse<MatchResponseDTO>>('/jobs/match/custom', payload);
    return response.data;
  },
};
