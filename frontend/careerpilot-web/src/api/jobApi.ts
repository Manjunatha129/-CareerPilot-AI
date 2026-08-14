import { apiClient } from './client';
import { ApiResponse, JobDTO, PageResponse, JobSearchParams } from '../types';

let defaultJobsCache: ApiResponse<PageResponse<JobDTO>> | null = null;
let lastJobsFetchTime = 0;
const CACHE_TTL_MS = 30000;

export const jobApi = {
  searchJobs: async (params: JobSearchParams = {}, forceRefresh = false): Promise<ApiResponse<PageResponse<JobDTO>>> => {
    const isDefaultQuery = !params.search && !params.location && !params.workMode && !params.employmentType && (!params.page || params.page === 0);
    if (isDefaultQuery && !forceRefresh && defaultJobsCache && (Date.now() - lastJobsFetchTime < CACHE_TTL_MS)) {
      return defaultJobsCache;
    }

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
    if (isDefaultQuery) {
      defaultJobsCache = response.data;
      lastJobsFetchTime = Date.now();
    }
    return response.data;
  },

  getJobById: async (id: number): Promise<ApiResponse<JobDTO>> => {
    const response = await apiClient.get<ApiResponse<JobDTO>>(`/jobs/${id}`);
    return response.data;
  },

  ingestSeedJobs: async (): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/jobs/ingest/seed');
    defaultJobsCache = null;
    return response.data;
  },
};
