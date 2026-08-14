import { apiClient } from './client';
import { ApiResponse } from '../types';

export interface SkillCategoryItem {
  name: string;
  category: string;
  priority: string;
  rationale: string;
}

export interface RoleInsight {
  roleCategory: string;
  suitabilityScore: number;
  officialJobMatchScore?: number | null;
  supportingSkills: string[];
  missingSkills: string[];
  relevantExperience: string;
  improvementAreas: string[];
}

export interface CareerGaps {
  technicalSkills?: string;
  experience?: string;
  projects?: string;
  resume?: string;
  interviewReadiness?: string;
  roleAlignment?: string;
}

export interface RecommendationItem {
  category: string;
  action: string;
  reasoning: string;
  priority: string;
}

export interface RoadmapStage {
  stage: number;
  title: string;
  actions: string[];
}

export interface CareerIntelligenceDTO {
  status: string;
  executedAgents: string[];
  answer: string;
  matchedSkills: string[];
  missingSkills: string[];
  priorityGaps: string[];
  careerPlan: {
    immediate_actions?: string[];
    short_term_actions?: string[];
    medium_term_actions?: string[];
    learning_priorities?: string[];
    project_recommendations?: string[];
    interview_focus?: string[];
  };
  sources: {
    documentTitle: string;
    sourceType: string;
  }[];

  // Extended Phase 10 Fields
  careerDirection?: {
    primary?: string;
    secondary?: string;
    reasoning?: string[];
    improvementAreas?: string[];
  };
  profileStrength?: {
    overallScore?: number;
    experienceLevel?: string;
    technicalStrengths?: string[];
    careerAreas?: string[];
    profileGaps?: string[];
  };
  strongSkills?: SkillCategoryItem[];
  developingSkills?: SkillCategoryItem[];
  missingSkillsList?: SkillCategoryItem[];
  prioritySkills?: SkillCategoryItem[];
  careerSpecificSkills?: SkillCategoryItem[];
  roleInsights?: RoleInsight[];
  careerGaps?: CareerGaps;
  recommendations?: RecommendationItem[];
  roadmap?: {
    immediate?: string[];
    shortTerm?: string[];
    mediumTerm?: string[];
    stages?: RoadmapStage[];
  };
  projectIntelligence?: {
    strongestProjects?: string[];
    techCoverage?: string[];
    missingTechExposure?: string[];
    improvementOpportunities?: string[];
  };
}

let careerIntelligenceCache: ApiResponse<CareerIntelligenceDTO> | null = null;
let lastCareerFetchTime = 0;
const CACHE_TTL_MS = 30000;

export const careerIntelligenceApi = {
  getCareerIntelligence: async (forceRefresh = false): Promise<ApiResponse<CareerIntelligenceDTO>> => {
    if (!forceRefresh && careerIntelligenceCache && (Date.now() - lastCareerFetchTime < CACHE_TTL_MS)) {
      return careerIntelligenceCache;
    }
    const response = await apiClient.get<ApiResponse<CareerIntelligenceDTO>>('/career-intelligence');
    careerIntelligenceCache = response.data;
    lastCareerFetchTime = Date.now();
    return response.data;
  },

  runCareerIntelligence: async (query?: string, targetJobId?: number): Promise<ApiResponse<CareerIntelligenceDTO>> => {
    const response = await apiClient.post<ApiResponse<CareerIntelligenceDTO>>('/career-intelligence', {
      query,
      targetJobId,
    });
    careerIntelligenceCache = response.data;
    lastCareerFetchTime = Date.now();
    return response.data;
  },
};
