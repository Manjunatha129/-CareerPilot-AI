# Use Case Diagram - CareerPilot AI

```mermaid
usecaseDiagram
    actor Candidate as "Job Seeker / Candidate"
    actor Admin as "System Administrator"
    actor GeminiAPI as "Google Gemini API"

    package "CareerPilot AI System" {
        usecase UC1 as "Register / Authenticate Account"
        usecase UC2 as "Manage Career Profile"
        usecase UC3 as "Upload & Parse Resume"
        usecase UC4 as "Search & Filter Jobs"
        usecase UC5 as "View Explainable Job Match Score"
        usecase UC6 as "Analyze Skill Gaps & View Learning Resources"
        usecase UC7 as "Generate Job-Specific Interview Questions"
        usecase UC8 as "Optimize Resume Bullet Points"
        usecase UC9 as "Track Applications in ATS Kanban"
        usecase UC10 as "Chat with RAG AI Career Assistant"
        usecase UC11 as "Ingest & Normalize Job Postings"
    }

    Candidate --> UC1
    Candidate --> UC2
    Candidate --> UC3
    Candidate --> UC4
    Candidate --> UC5
    Candidate --> UC6
    Candidate --> UC7
    Candidate --> UC8
    Candidate --> UC9
    Candidate --> UC10

    Admin --> UC11

    UC3 ..> GeminiAPI : "uses"
    UC5 ..> GeminiAPI : "uses"
    UC7 ..> GeminiAPI : "uses"
    UC8 ..> GeminiAPI : "uses"
    UC10 ..> GeminiAPI : "uses"
```
