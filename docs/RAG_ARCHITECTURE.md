# Retrieval-Augmented Generation (RAG) Architecture - CareerPilot AI

## 1. Pipeline Architectural Overview

CareerPilot AI implements an evidence-grounded Retrieval-Augmented Generation (RAG) pipeline powered by PostgreSQL `pgvector` and Google Gemini.

```
+----------------------------------------------------------------------------------+
|                            INGESTION & INDEXING                                  |
|                                                                                  |
| Career Knowledge Docs  ---> Cleaning & Text ---> Recursive Chunking ---> Vector  |
| (Interview Guides, JDs,     Normalization       (500 chars, 50 overlap)  Embeddings|
| Resume Guides, Courses)                                               (768-dim)  |
|                                                                          |       |
|                                                                          v       |
|                                                                   PostgreSQL     |
|                                                                   pgvector       |
+----------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
|                            RETRIEVAL & ANSWER GENERATION                         |
|                                                                                  |
| User Query (e.g. "How to    ---> Generate Vector ---> Cosine Similarity Retr.    |
| prepare for Java concurrency?")  Embedding           Top-K (K=4) Chunks          |
|                                                          |                       |
|                                                          v                       |
| Grounded Response <--- Gemini API LLM <--- Prompt + Candidate Profile            |
| with Citations          (`gemini-2.5-flash`)    + Retrieved Top-K Contexts       |
+----------------------------------------------------------------------------------+
```

---

## 2. Ingestion & Vector Indexing Configuration

1. **Document Storage Format**: Documents are stored in `sample-data/knowledge-base/` as structured Markdown files categorized into:
   * `interview-guides/`
   * `company-profiles/`
   * `resume-writing-standards/`
   * `skill-roadmap-guides/`
2. **Chunking Strategy**:
   * Strategy: `RecursiveCharacterTextSplitter`
   * Chunk Size: 500 characters
   * Chunk Overlap: 50 characters
3. **Embedding Model**:
   * Provider: Google GenAI `gemini-embedding-2` (configurable via `EMBEDDING_MODEL` in `.env`).
   * Dimension: 768 dimensions.
   * Target Database Table: `document_chunks` (Column: `embedding vector(768)`).
4. **pgvector Indexing**:
   * Index Type: `HNSW` (Hierarchical Navigable Small World) with `vector_cosine_ops`.
   * Distance Metric: Cosine Distance ($1 - \text{Cosine Similarity}$).

---

## 3. Retrieval & Prompt Construction

When a candidate queries the AI Career Assistant or requests interview prep hints:

1. The AI microservice converts the user query string into a 768-dimensional float embedding using `gemini-embedding-2`.
2. Vector Retrieval Query executed against PostgreSQL:
   ```sql
   SELECT content, document_name, source_type, 
          1 - (embedding <=> :queryVector) AS similarity
   FROM document_chunks
   WHERE 1 - (embedding <=> :queryVector) > 0.70
   ORDER BY embedding <=> :queryVector
   LIMIT 4;
   ```
3. Context assembly: Top-4 text snippets are concatenated and appended to the Gemini prompt context along with the candidate's active profile summary.
4. Response Generation: Gemini generates a concise response citing the source documents (e.g. `[Source: interview-guides/java-concurrency.md]`).

---

## 4. Anti-Hallucination & Fallback Policy
* If no document chunk achieves a cosine similarity score $> 0.70$, the system switches to general Gemini assistance with an explicit notice: *"Note: No direct internal knowledge base entry matched this query; providing general AI career guidance."*
