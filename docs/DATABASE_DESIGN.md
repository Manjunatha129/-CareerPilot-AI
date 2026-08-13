# Relational & Vector Database Design - CareerPilot AI

## 1. Relational Entity Relationship Summary

The database uses PostgreSQL 16 with `pgvector` enabled. It stores relational transaction records, normalization entities, and 768-dimensional document chunk vector embeddings.

---

## 2. Comprehensive Data Dictionary

### Entity 1: `users`
Stores core user authentication credentials and account metadata.
* `id`: BIGSERIAL PRIMARY KEY
* `email`: VARCHAR(255) UNIQUE NOT NULL
* `password_hash`: VARCHAR(255) NOT NULL
* `full_name`: VARCHAR(255) NOT NULL
* `role`: VARCHAR(50) NOT NULL DEFAULT 'ROLE_CANDIDATE'
* `is_active`: BOOLEAN DEFAULT TRUE
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
* `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Entity 2: `profiles`
Stores candidate career background and preferences.
* `id`: BIGSERIAL PRIMARY KEY
* `user_id`: BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
* `headline`: VARCHAR(255)
* `summary`: TEXT
* `total_experience_years`: DOUBLE PRECISION DEFAULT 0.0
* `current_location`: VARCHAR(100)
* `target_job_title`: VARCHAR(100)
* `preferred_work_mode`: VARCHAR(50) DEFAULT 'HYBRID' -- REMOTE, HYBRID, ON_SITE
* `min_expected_salary`: NUMERIC(12, 2)
* `education_level`: VARCHAR(100) -- BACHELORS, MASTERS, PHD
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
* `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Entity 3: `resumes`
Stores candidate uploaded resume files and parsed metadata.
* `id`: BIGSERIAL PRIMARY KEY
* `user_id`: BIGINT REFERENCES users(id) ON DELETE CASCADE
* `file_name`: VARCHAR(255) NOT NULL
* `file_path`: VARCHAR(512) NOT NULL
* `file_type`: VARCHAR(50) NOT NULL -- PDF, DOCX
* `file_size_bytes`: BIGINT NOT NULL
* `raw_text`: TEXT
* `parsed_json`: JSONB -- Structured output from Resume Agent
* `completeness_score`: INT DEFAULT 0
* `is_primary`: BOOLEAN DEFAULT TRUE
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Entity 4: `candidate_skills`
Stores verified and extracted skills associated with candidate profiles.
* `id`: BIGSERIAL PRIMARY KEY
* `profile_id`: BIGINT REFERENCES profiles(id) ON DELETE CASCADE
* `skill_name`: VARCHAR(100) NOT NULL
* `proficiency_level`: VARCHAR(50) DEFAULT 'INTERMEDIATE' -- BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
* `years_experience`: DOUBLE PRECISION
* `is_verified`: BOOLEAN DEFAULT FALSE

### Entity 5: `companies`
Stores company information for jobs and RAG knowledge.
* `id`: BIGSERIAL PRIMARY KEY
* `name`: VARCHAR(255) UNIQUE NOT NULL
* `website`: VARCHAR(255)
* `industry`: VARCHAR(100)
* `description`: TEXT
* `location`: VARCHAR(100)

### Entity 6: `jobs`
Stores normalized job postings ingested from job sources.
* `id`: BIGSERIAL PRIMARY KEY
* `company_id`: BIGINT REFERENCES companies(id) ON DELETE CASCADE
* `title`: VARCHAR(255) NOT NULL
* `source_name`: VARCHAR(100) NOT NULL DEFAULT 'SEED_DATA'
* `external_job_id`: VARCHAR(255)
* `location`: VARCHAR(100)
* `work_mode`: VARCHAR(50) DEFAULT 'HYBRID' -- REMOTE, HYBRID, ON_SITE
* `employment_type`: VARCHAR(50) DEFAULT 'FULL_TIME' -- FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP
* `experience_level`: VARCHAR(50) -- ENTRY, MID, SENIOR
* `min_salary`: NUMERIC(12, 2)
* `max_salary`: NUMERIC(12, 2)
* `description_raw`: TEXT NOT NULL
* `description_cleaned`: TEXT
* `parsed_requirements`: JSONB -- Structured requirements from JD Agent
* `is_active`: BOOLEAN DEFAULT TRUE
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Entity 7: `job_skills`
Stores normalized required skills for each job posting.
* `id`: BIGSERIAL PRIMARY KEY
* `job_id`: BIGINT REFERENCES jobs(id) ON DELETE CASCADE
* `skill_name`: VARCHAR(100) NOT NULL
* `is_required`: BOOLEAN DEFAULT TRUE -- TRUE for mandatory, FALSE for nice-to-have
* `weight`: DOUBLE PRECISION DEFAULT 1.0

### Entity 8: `applications`
Tracks candidate job application pipeline stages (ATS).
* `id`: BIGSERIAL PRIMARY KEY
* `user_id`: BIGINT REFERENCES users(id) ON DELETE CASCADE
* `job_id`: BIGINT REFERENCES jobs(id) ON DELETE CASCADE
* `resume_id`: BIGINT REFERENCES resumes(id) ON DELETE SET NULL
* `status`: VARCHAR(50) NOT NULL DEFAULT 'SAVED' -- SAVED, APPLIED, SCREENING, INTERVIEW, TECHNICAL_INTERVIEW, HR_INTERVIEW, OFFER, REJECTED, WITHDRAWN, ACCEPTED
* `applied_date`: TIMESTAMP WITH TIME ZONE
* `notes`: TEXT
* `source`: VARCHAR(100) -- e.g. LinkedIn, Company Portal
* `job_url`: VARCHAR(500)
* `recruiter_name`: VARCHAR(150)
* `recruiter_email`: VARCHAR(150)
* `current_stage`: VARCHAR(100)
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
* `updated_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
* UNIQUE(user_id, job_id)

### Entity 8b: `application_status_history`
Stores atomic status transition logs and timeline notes for ATS auditing.
* `id`: BIGSERIAL PRIMARY KEY
* `application_id`: BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE
* `previous_status`: VARCHAR(50)
* `new_status`: VARCHAR(50) NOT NULL
* `changed_at`: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
* `note`: TEXT

### Entity 9: `document_chunks` (pgvector Table for RAG)
Stores indexed text chunks and 768-dimensional vector embeddings generated via gemini-embedding-2.
* `id`: BIGSERIAL PRIMARY KEY
* `document_name`: VARCHAR(255) NOT NULL
* `source_type`: VARCHAR(100) NOT NULL -- INTERVIEW_GUIDE, COMPANY_KNOWLEDGE, LEARNING_DOC, RESUME_GUIDE
* `chunk_index`: INT NOT NULL
* `content`: TEXT NOT NULL
* `embedding`: vector(768) -- pgvector 768-dim float column matching gemini-embedding-2 configuration
* `metadata`: JSONB
* `created_at`: TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP

### Entity 10: `learning_resources`
Stores curated course and learning material recommendations.
* `id`: BIGSERIAL PRIMARY KEY
* `target_skill`: VARCHAR(100) NOT NULL
* `title`: VARCHAR(255) NOT NULL
* `provider`: VARCHAR(100) NOT NULL -- Coursera, Udemy, YouTube, Official Docs
* `url`: VARCHAR(512) NOT NULL
* `resource_type`: VARCHAR(50) -- COURSE, DOCUMENTATION, VIDEO, PROJECT
* `difficulty_level`: VARCHAR(50) -- BEGINNER, INTERMEDIATE, ADVANCED
* `is_free`: BOOLEAN DEFAULT TRUE

---

## 3. Database Indexes Strategy

```sql
-- Performance Indexes for Relational Queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_candidate_skills_profile_id ON candidate_skills(profile_id);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_location_workmode ON jobs(location, work_mode);
CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX idx_job_skills_name ON job_skills(skill_name);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);

-- Vector Similarity Index (HNSW for high throughput vector search)
CREATE INDEX idx_document_chunks_embedding 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```
