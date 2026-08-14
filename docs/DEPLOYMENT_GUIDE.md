# Production Deployment Guide - CareerPilot AI

This guide provides step-by-step instructions for deploying CareerPilot AI to public cloud infrastructure for project presentation and production demonstration.

---

## Target Deployment Architecture

```
Browser (End-User)
       │
       ▼
Vercel React Frontend (careerpilot-web)
       │
       ▼ [HTTPS REST / CORS]
Render Spring Boot Core Backend (careerpilot-api)
       │                             │
       │ [Spring Data JPA / JDBC]   │ [HTTPS REST]
       ▼                             ▼
Supabase PostgreSQL 16 + pgvector    Render FastAPI AI Service (careerpilot-ai)
                                     │
                                     ▼ [Google GenAI SDK]
                                  Gemini API
```

---

## Step 1: Create Supabase Project
1. Log into [Supabase Dashboard](https://database.new) and click **New Project**.
2. Set Project Name: `careerpilot-db`.
3. Choose Region: Select the region closest to your Render service (e.g. `ap-southeast-1` Singapore or `us-east-1` N. Virginia).
4. Set strong database password and copy down the database connection parameters (Host, Port `5432`, Database Name `postgres`, User `postgres`, Password).

---

## Step 2: Enable `pgvector` Extension
1. In your Supabase Dashboard, navigate to **SQL Editor**.
2. Execute the following extension creation SQL query:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

3. Confirm success message: `CREATE EXTENSION`.

---

## Step 3: Initialize Database Schema & Seed Data
1. In the Supabase **SQL Editor**, open and execute the schema initialization script located at [backend/careerpilot-api/src/main/resources/schema.sql](file:///c:/Users/manju/Downloads/AI%20Intelligence%20Platform/backend/careerpilot-api/src/main/resources/schema.sql):

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_CANDIDATE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline VARCHAR(255),
    summary TEXT,
    total_experience_years DOUBLE PRECISION DEFAULT 0.0,
    current_location VARCHAR(100),
    target_job_title VARCHAR(100),
    preferred_work_mode VARCHAR(50) DEFAULT 'HYBRID',
    min_expected_salary NUMERIC(12, 2),
    education_level VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(512) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    raw_text TEXT,
    parsed_json TEXT,
    completeness_score INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Candidate Skills Table
CREATE TABLE IF NOT EXISTS candidate_skills (
    id BIGSERIAL PRIMARY KEY,
    profile_id BIGINT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level VARCHAR(50) DEFAULT 'INTERMEDIATE',
    years_experience DOUBLE PRECISION,
    is_verified BOOLEAN DEFAULT FALSE
);

-- 5. Companies Table
CREATE TABLE IF NOT EXISTS companies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    website VARCHAR(255),
    industry VARCHAR(100),
    description TEXT,
    location VARCHAR(100)
);

-- 6. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    source_name VARCHAR(100) DEFAULT 'SEED_DATA',
    external_job_id VARCHAR(255),
    location VARCHAR(100),
    work_mode VARCHAR(50) DEFAULT 'HYBRID',
    employment_type VARCHAR(50) DEFAULT 'FULL_TIME',
    experience_level VARCHAR(50),
    min_salary NUMERIC(12, 2),
    max_salary NUMERIC(12, 2),
    description_raw TEXT NOT NULL,
    parsed_requirements TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Job Skills Table
CREATE TABLE IF NOT EXISTS job_skills (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    weight DOUBLE PRECISION DEFAULT 1.0
);

-- 8. Applications Table (ATS Kanban)
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'SAVED',
    applied_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_job UNIQUE(user_id, job_id)
);

-- 9. Document Chunks Table (pgvector 768-dim)
CREATE TABLE IF NOT EXISTS document_chunks (
    id BIGSERIAL PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_profile_id ON candidate_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location_workmode ON jobs(location, work_mode);
CREATE INDEX IF NOT EXISTS idx_job_skills_job_id ON job_skills(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);

-- HNSW Vector Cosine Index for Document Chunks
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Step 4: Configure Environment Variables

Prepare your environment secrets for each layer before creating services.

### Python FastAPI Service (`careerpilot-ai`)
- `GEMINI_API_KEY`: Google Gemini API Key
- `GEMINI_MODEL`: `gemini-3.5-flash`
- `EMBEDDING_MODEL`: `gemini-embedding-2`
- `EMBEDDING_DIMENSION`: `768`
- `CORS_ALLOWED_ORIGINS`: `https://your-frontend-app.vercel.app,https://your-backend-app.onrender.com`

### Java Spring Boot Core Backend (`careerpilot-api`)
- `DATABASE_URL`: `jdbc:postgresql://aws-0-region.pooler.supabase.com:5432/postgres?sslmode=require`
- `DATABASE_USERNAME`: `postgres.your_supabase_project_ref`
- `DATABASE_PASSWORD`: `your_supabase_password`
- `AI_SERVICE_URL`: `https://careerpilot-ai.onrender.com`
- `CORS_ALLOWED_ORIGINS`: `https://careerpilot-web.vercel.app`
- `JWT_SECRET`: `404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970`
- `UPLOAD_DIR`: `/tmp/uploads`

### React Vite Frontend (`careerpilot-web`)
- `VITE_API_BASE_URL`: `https://careerpilot-api.onrender.com/api`

---

## Step 5: Deploy FastAPI AI Service to Render
1. Log into [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `CareerPilot-AI`.
4. Configure service parameters:
   - **Name**: `careerpilot-ai`
   - **Root Directory**: `ai-service/careerpilot-ai`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables from Step 4.
6. Click **Create Web Service**.
7. Note down the resulting service URL (e.g. `https://careerpilot-ai.onrender.com`).
8. Verify health endpoint: `GET https://careerpilot-ai.onrender.com/health` should return `{"status": "UP", ...}`.

---

## Step 6: Deploy Spring Boot Backend to Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your GitHub repository: `CareerPilot-AI`.
3. Configure service parameters:
   - **Name**: `careerpilot-api`
   - **Root Directory**: `backend/careerpilot-api`
   - **Environment**: `Java`
   - **Build Command**: `./mvnw clean package -DskipTests` (or `mvn clean package -DskipTests`)
   - **Start Command**: `java -jar target/careerpilot-api-1.0.0.jar`
4. Add Environment Variables from Step 4.
5. Click **Create Web Service**.

---

## Step 7: Configure Spring Boot -> FastAPI Inter-Service Communication
1. Update `AI_SERVICE_URL` in `careerpilot-api` Environment Variables with the actual deployed FastAPI Render URL (`https://careerpilot-ai.onrender.com`).
2. Save changes to trigger a redeploy of `careerpilot-api`.
3. Verify backend health endpoint: `GET https://careerpilot-api.onrender.com/api/health` should return `{"status": "UP"}`.

---

## Step 8: Deploy React Frontend to Vercel
1. Log into [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** -> **Project**.
2. Import repository `CareerPilot-AI`.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend/careerpilot-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://careerpilot-api.onrender.com/api`
5. Click **Deploy**.
6. Note down the public Vercel URL (e.g. `https://careerpilot-web.vercel.app`).

---

## Step 9: Configure Production CORS & Final Links
1. Update `CORS_ALLOWED_ORIGINS` in both Render services (`careerpilot-api` and `careerpilot-ai`) with your public Vercel frontend URL (`https://careerpilot-web.vercel.app`).
2. Trigger redeployment of both backend services to apply the strict CORS rules.

---

## Step 10: End-to-End Verification Checklist

| Layer | Check | Verification Method | Expected Result |
| :--- | :--- | :--- | :--- |
| **Frontend -> Backend** | Authentication | Register & Login on Vercel app | JWT stored in `localStorage`, redirected to `/dashboard` |
| **Direct SPA Navigation** | React Router | Open `/jobs`, `/resume`, `/knowledge` directly | Loads view directly without Vercel 404 |
| **Backend -> Supabase** | Relational Ingestion | View candidate profile / jobs list | Records fetched from Supabase PostgreSQL |
| **Backend -> FastAPI** | AI Resume Parsing | Upload a sample PDF resume | Extracted skills & completeness score populated |
| **FastAPI -> Supabase** | pgvector RAG Search | Ask question in Knowledge Assistant | Vector similarity search returns grounded citations |
| **FastAPI -> Gemini** | LLM Synthesis | Execute Career Intelligence readiness check | Structured AI feedback generated via `GEMINI_API_KEY` |

---

## Summary of Production Endpoints

| Tier | Service | Provider | Public URL Format |
| :--- | :--- | :--- | :--- |
| **Frontend** | CareerPilot Web | Vercel | `https://careerpilot-web.vercel.app` |
| **Backend** | CareerPilot API | Render | `https://careerpilot-api.onrender.com` |
| **AI Service** | CareerPilot AI | Render | `https://careerpilot-ai.onrender.com` |
| **Database** | Supabase Postgres | Supabase | `aws-0-region.pooler.supabase.com:5432` |
