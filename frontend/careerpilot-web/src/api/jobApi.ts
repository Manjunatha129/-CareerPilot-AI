import { apiClient } from './client';
import { ApiResponse, JobDTO, PageResponse, JobSearchParams } from '../types';

export const jobApi = {
  searchJobs: async (params: JobSearchParams = {}): Promise<ApiResponse<PageResponse<JobDTO>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<JobDTO>>>('/jobs', {
      params: {
        search: params.search || undefined,
        location: params.location || undefined,
        workMode: params.workMode || undefined,
        employmentType: params.employmentType || undefined,
        experienceLevel: params.experienceLevel || undefined,
        company: params.company || undefined,
        source: params.source || undefined,
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.sortBy || 'createdAt',
        sortDirection: params.sortDirection || 'DESC',
      },
    });
    return response.data;
  },

  getJobById: async (id: number): Promise<ApiResponse<JobDTO>> => {
    const response = await apiClient.get<ApiResponse<JobDTO>>(`/jobs/${id}`);
    return response.data;
  },

  ingestSeedJobs: async (): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/jobs/ingest/seed');
    return response.data;
  },
};
