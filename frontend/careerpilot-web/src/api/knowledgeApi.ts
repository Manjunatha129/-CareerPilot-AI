import { apiClient } from './client';
import { ApiResponse, RagResponseDTO } from '../types';

export interface KnowledgeDocumentDTO {
  id: number;
  title: string;
  sourceType: string;
  filePath: string;
  status: string;
  chunkCount: number;
  createdAt: string;
}

export interface ChatMessageTurn {
  role: 'user' | 'assistant';
  content: string;
}

export const knowledgeApi = {
  queryKnowledge: async (query: string, topK: number = 4, history?: ChatMessageTurn[]): Promise<ApiResponse<RagResponseDTO>> => {
    const response = await apiClient.post<ApiResponse<RagResponseDTO>>('/knowledge/query', {
      query,
      topK,
      history,
    });
    return response.data;
  },

  ingestSeedKnowledge: async (): Promise<ApiResponse<KnowledgeDocumentDTO[]>> => {
    const response = await apiClient.post<ApiResponse<KnowledgeDocumentDTO[]>>('/knowledge/ingest/seed');
    return response.data;
  },

  getKnowledgeDocuments: async (): Promise<ApiResponse<KnowledgeDocumentDTO[]>> => {
    const response = await apiClient.get<ApiResponse<KnowledgeDocumentDTO[]>>('/knowledge/documents');
    return response.data;
  },
};
