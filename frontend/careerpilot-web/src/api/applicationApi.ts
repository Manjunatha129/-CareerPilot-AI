import { apiClient } from './client';
import { ApiResponse, PageResponse } from '../types';

export interface StatusHistoryItem {
  id: number;
  applicationId: number;
  previousStatus?: string;
  newStatus: string;
  changedAt: string;
  note?: string;
}

export interface ApplicationDTO {
  id: number;
  userId: number;
  jobId: number;
  jobTitle: string;
  companyName: string;
  location: string;
  workMode: string;
  officialMatchScore?: number | null;
  resumeId?: number | null;
  resumeFileName?: string | null;
  status: string;
  appliedDate?: string | null;
  notes?: string | null;
  source?: string | null;
  jobUrl?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  currentStage?: string | null;
  createdAt: string;
  updatedAt: string;
  history?: StatusHistoryItem[];
}

export interface ApplicationMetricsDTO {
  totalApplications: number;
  savedCount: number;
  appliedCount: number;
  screeningCount: number;
  interviewCount: number;
  offerCount: number;
  rejectedCount: number;
  acceptedCount: number;
  interviewConversionRate: number;
  offerConversionRate: number;
  averageMatchScore: number;
}

export interface ApplicationCreateRequest {
  jobId: number;
  resumeId?: number;
  status?: string;
  source?: string;
  jobUrl?: string;
  notes?: string;
  recruiterName?: string;
  recruiterEmail?: string;
}

export interface ApplicationUpdateRequest {
  status?: string;
  resumeId?: number;
  notes?: string;
  source?: string;
  jobUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  currentStage?: string;
}

export interface StatusUpdateRequest {
  newStatus: string;
  note?: string;
}

export interface JobStateCheck {
  tracked: boolean;
  applicationId?: number;
  status?: string;
  isSaved: boolean;
  isApplied: boolean;
}

export const applicationApi = {
  getApplications: async (
    status?: string,
    page: number = 0,
    size: number = 20,
    search?: string,
    sortBy: string = 'updatedAt'
  ): Promise<ApiResponse<PageResponse<ApplicationDTO>>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (search) params.append('search', search);
    params.append('sortBy', sortBy);

    const response = await apiClient.get<ApiResponse<PageResponse<ApplicationDTO>>>(
      `/applications?${params.toString()}`
    );
    return response.data;
  },

  getApplicationById: async (id: number): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await apiClient.get<ApiResponse<ApplicationDTO>>(`/applications/${id}`);
    return response.data;
  },

  createApplication: async (payload: ApplicationCreateRequest): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await apiClient.post<ApiResponse<ApplicationDTO>>('/applications', payload);
    return response.data;
  },

  updateApplication: async (id: number, payload: ApplicationUpdateRequest): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await apiClient.put<ApiResponse<ApplicationDTO>>(`/applications/${id}`, payload);
    return response.data;
  },

  updateStatus: async (id: number, payload: StatusUpdateRequest): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await apiClient.patch<ApiResponse<ApplicationDTO>>(`/applications/${id}/status`, payload);
    return response.data;
  },

  deleteApplication: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/applications/${id}`);
    return response.data;
  },

  getMetrics: async (): Promise<ApiResponse<ApplicationMetricsDTO>> => {
    const response = await apiClient.get<ApiResponse<ApplicationMetricsDTO>>('/applications/metrics');
    return response.data;
  },

  saveJob: async (jobId: number): Promise<ApiResponse<ApplicationDTO>> => {
    const response = await apiClient.post<ApiResponse<ApplicationDTO>>(`/applications/jobs/${jobId}/save`);
    return response.data;
  },

  unsaveJob: async (jobId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/applications/jobs/${jobId}/save`);
    return response.data;
  },

  checkJobState: async (jobId: number): Promise<ApiResponse<JobStateCheck>> => {
    const response = await apiClient.get<ApiResponse<JobStateCheck>>(`/applications/jobs/${jobId}/check`);
    return response.data;
  },
};
