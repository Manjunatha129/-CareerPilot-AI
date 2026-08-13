export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface ProfileRequest {
  headline?: string;
  summary?: string;
  totalExperienceYears?: number;
  currentLocation?: string;
  targetJobTitle?: string;
  preferredWorkMode?: string;
  minExpectedSalary?: number;
  educationLevel?: string;
  primarySkills?: string[];
  secondarySkills?: string[];
}

export interface ProfileResponse {
  id: number;
  userId: number;
  headline?: string;
  summary?: string;
  totalExperienceYears?: number;
  currentLocation?: string;
  targetJobTitle?: string;
  preferredWorkMode?: string;
  minExpectedSalary?: number;
  educationLevel?: string;
  primarySkills: string[];
  secondarySkills: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
}

export interface EducationItem {
  degree?: string;
  institution?: string;
  field?: string;
  graduationYear?: string;
}

export interface SkillsBreakdown {
  programmingLanguages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cloudTechnologies: string[];
  otherSkills: string[];
}

export interface ExperienceItem {
  company?: string;
  role?: string;
  duration?: string;
  responsibilities: string[];
}

export interface ProjectItem {
  projectName?: string;
  description?: string;
  technologies: string[];
}

export interface CertificationItem {
  name?: string;
  issuingOrganization?: string;
  year?: string;
}

export interface AchievementItem {
  achievement?: string;
  organization?: string;
}

export interface ParsedResumeAnalysis {
  candidateInformation?: ContactInfo;
  professionalSummary?: string;
  education?: EducationItem[];
  skills?: SkillsBreakdown;
  experience?: ExperienceItem[];
  projects?: ProjectItem[];
  certifications?: CertificationItem[];
  achievements?: AchievementItem[];
  completenessScore?: number;
  parsedSuccessfully?: boolean;
}

export interface ResumeDTO {
  id: number;
  userId: number;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  status: 'UPLOADED' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  contentType?: string;
  rawText?: string;
  parsedJson?: string;
  completenessScore?: number;
  isPrimary?: boolean;
  errorMessage?: string;
  processedAt?: string;
  createdAt?: string;
}

export interface JobDTO {
  id: number;
  companyId?: number;
  companyName: string;
  companyIndustry?: string;
  companyWebsite?: string;
  title: string;
  sourceName: string;
  sourceLabel: string;
  applyUrl?: string;
  externalJobId?: string;
  location: string;
  workMode: 'REMOTE' | 'HYBRID' | 'ON_SITE';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experienceLevel: 'ENTRY' | 'MID' | 'SENIOR';
  minSalary?: number;
  maxSalary?: number;
  description: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface JobSearchParams {
  search?: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  experienceLevel?: string;
  company?: string;
  source?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface MatchBreakdownDTO {
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  locationScore: number;
  semanticScore: number;
  preferenceScore: number;
}

export interface MatchResponseDTO {
  jobId: number;
  jobTitle: string;
  companyName: string;
  overallScore: number;
  matchCategory: 'STRONG_MATCH' | 'GOOD_MATCH' | 'PARTIAL_MATCH' | 'LOW_MATCH';
  breakdown: MatchBreakdownDTO;
  matchedSkills: string[];
  missingSkills: string[];
  niceToHaveMatchedSkills: string[];
  strengths: string[];
  gaps: string[];
  aiExplanation: string;
  aiAvailable: boolean;
}

export interface RagSourceDTO {
  documentTitle: string;
  sourceType: string;
  chunkIndex: number;
  similarityScore: number;
  contentSnippet: string;
}

export interface RagResponseDTO {
  query: string;
  answer: string;
  hasSufficientContext: boolean;
  retrievedChunksCount: number;
  sources: RagSourceDTO[];
  aiAvailable: boolean;
}




