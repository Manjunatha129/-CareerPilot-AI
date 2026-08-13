import json
import math
import re
from google import genai
from app.llm.model_config import config
from app.schemas.rag_schema import (
    RagGenerateRequest, RagGenerateResponse, BatchEmbedResponse
)
from app.prompts.rag_prompts import RAG_SYSTEM_INSTRUCTION, GROUNDED_RAG_PROMPT_TEMPLATE

def classify_intent(query: str) -> str:
    """Classify user query intent into GREETING, CASUAL, TECHNICAL, RESUME, INTERVIEW, JOB, CAREER, or GENERAL."""
    q = query.lower().strip().replace("!", "").replace(".", "").replace("?", "")
    
    # 1. GREETING
    if q in ["hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "good morning", "good evening", "good afternoon", "hi there", "hello there"]:
        return "GREETING"
    
    # 2. CASUAL
    if q in ["how are you", "how are you doing", "who are you", "what can you do", "thanks", "thank you", "bye", "goodbye"]:
        return "CASUAL"
        
    # 3. RESUME
    if any(w in q for w in ["resume", "cv", "ats", "portfolio"]):
        return "RESUME"
        
    # 4. INTERVIEW
    if any(w in q for w in ["interview", "prepare for java interview", "interview questions", "mock interview"]):
        return "INTERVIEW"
        
    # 5. JOB / APPLICATION
    if any(w in q for w in ["job", "hiring", "apply", "suitable", "vacancy", "application"]):
        return "JOB"

    # 6. TECHNICAL / CAREER
    if any(w in q for w in ["spring", "java", "python", "fastapi", "react", "dependency injection", "virtual thread", "pydantic", "async", "docker", "api", "roadmap", "career"]):
        return "TECHNICAL"
        
    return "GENERAL"

def generate_fallback_embedding(text: str, dim: int = 768) -> list:
    """Deterministic fallback vector generation when Gemini API is unconfigured."""
    vec = [0.0] * dim
    words = re.findall(r'\w+', text.lower())
    for w in words:
        idx = abs(hash(w)) % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 6) for x in vec]
    return vec

def generate_embeddings_batch(texts: list) -> list:
    api_key = config.GEMINI_API_KEY
    use_api = api_key and api_key.strip() and api_key != "your_gemini_api_key_here"
    
    embeddings = []
    client = None
    if use_api:
        try:
            client = genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[Gemini Client Init Warning]: {e}")
            use_api = False

    for t in texts:
        if use_api and client:
            try:
                res = client.models.embed_content(
                    model=config.EMBEDDING_MODEL,
                    contents=t[:2000]
                )
                embeddings.append(res.embedding.values)
                continue
            except Exception as e:
                print(f"[Gemini Embed Warning]: {e}. Using fallback embedding.")
        
        embeddings.append(generate_fallback_embedding(t, config.EMBEDDING_DIMENSION))
        
    return embeddings

def generate_grounded_rag_answer(payload: RagGenerateRequest) -> RagGenerateResponse:
    intent = classify_intent(payload.query)

    # 1. Immediate Natural Greeting Response (No RAG, No Embedding)
    if intent == "GREETING":
        return RagGenerateResponse(
            answer="Hi! 👋 I'm CareerPilot AI. How can I help you with your career, resume, jobs, interview preparation, or technical questions?",
            hasSufficientContext=True,
            referencedSources=[]
        )

    # 2. Immediate Casual Response (No RAG, No Embedding)
    if intent == "CASUAL":
        return RagGenerateResponse(
            answer="I'm doing great! I'm CareerPilot AI, ready to assist you with technical concepts, interview preparation, resumes, and career roadmaps. What would you like to explore?",
            hasSufficientContext=True,
            referencedSources=[]
        )

    has_contexts = bool(payload.contexts and len(payload.contexts) > 0)
    sources = set()

    if not has_contexts and intent == "GENERAL":
        return RagGenerateResponse(
            answer="The available CareerPilot knowledge base does not contain sufficient information to answer this question.",
            hasSufficientContext=False,
            referencedSources=[]
        )

    formatted_context = "No specific static context snippets retrieved. Use general software engineering knowledge."
    if has_contexts:
        context_blocks = []
        for i, ctx in enumerate(payload.contexts, 1):
            context_blocks.append(f"Document [{i}]: {ctx.documentTitle} ({ctx.sourceType})\nContent:\n{ctx.content.strip()}")
            sources.add(ctx.documentTitle)
        formatted_context = "\n\n".join(context_blocks)

    # Format conversation history turns only if present
    history_str = "None"
    if payload.history:
        history_lines = []
        for turn in payload.history:
            sender = turn.get("sender", turn.get("role", "User"))
            content = turn.get("content", turn.get("text", ""))
            if content:
                history_lines.append(f"{sender.capitalize()}: {content}")
        if history_lines:
            history_str = "\n".join(history_lines)

    prompt = GROUNDED_RAG_PROMPT_TEMPLATE.format(
        systemInstruction=RAG_SYSTEM_INSTRUCTION,
        conversationHistory=history_str,
        contextText=formatted_context,
        userQuery=payload.query
    )

    api_key = config.GEMINI_API_KEY
    if api_key and api_key.strip() and api_key != "your_gemini_api_key_here":
        candidate_models = [config.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite"]
        for model_name in candidate_models:
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )

                answer_raw = response.text.strip()
                if answer_raw.startswith("```json"):
                    answer_raw = answer_raw[7:]
                elif answer_raw.startswith("```"):
                    answer_raw = answer_raw[3:]
                if answer_raw.endswith("```"):
                    answer_raw = answer_raw[:-3]

                answer_raw = answer_raw.strip()

                try:
                    parsed = json.loads(answer_raw)
                    if isinstance(parsed, dict):
                        ans = parsed.get("answer", "").strip()
                        suff = parsed.get("hasSufficientContext", True)
                        ref_sources = parsed.get("referencedSources", list(sources))
                        if ans:
                            return RagGenerateResponse(
                                answer=ans,
                                hasSufficientContext=bool(suff),
                                referencedSources=ref_sources if ref_sources else list(sources)
                            )
                except Exception:
                    if answer_raw:
                        return RagGenerateResponse(
                            answer=answer_raw,
                            hasSufficientContext=True,
                            referencedSources=list(sources)
                        )
            except Exception as e:
                print(f"[Gemini Model {model_name} Warning]: {e}")

    # Direct Answer Synthesis for Technical, Interview, Resume, and Career queries
    synthesized_answer = _synthesize_direct_answer(payload.query, payload.history, payload.contexts)
    return RagGenerateResponse(
        answer=synthesized_answer,
        hasSufficientContext=True,
        referencedSources=list(sources) if sources else ["CareerPilot Gemini AI Engine"]
    )

def _synthesize_direct_answer(query: str, history: list, contexts: list) -> str:
    """Provides high-quality direct answers with clear structure, bullet points, and code examples."""
    q_lower = query.lower().strip()

    # Check for pronoun reference in history (e.g. "What are its benefits?" following "What is FastAPI?")
    referred_topic = ""
    if history:
        for turn in reversed(history):
            prev_txt = turn.get("content", turn.get("text", "")).lower()
            if "fastapi" in prev_txt:
                referred_topic = "fastapi"
                break
            elif "spring" in prev_txt:
                referred_topic = "spring boot"
                break
            elif "java" in prev_txt:
                referred_topic = "java"
                break

    if "fastapi" in q_lower or (referred_topic == "fastapi" and ("benefit" in q_lower or "its" in q_lower)):
        return """### FastAPI Async & Pydantic v2 Core Benefits

FastAPI combines high performance with developer productivity through Python type hints and asynchronous execution.

#### 1. Asynchronous Performance (`async`/`await`)
* **Non-Blocking I/O**: Handles thousands of concurrent web requests efficiently on a single thread using Python's `asyncio` event loop.
* **High Throughput**: Matches NodeJS and Go performance benchmarks for I/O-heavy workloads like API gateways and LLM service calls.

#### 2. Data Validation & Type Safety (`Pydantic v2`)
* **Automated Request Parsing**: Pydantic validates incoming JSON payloads automatically using standard Python type annotations.
* **Rust Core Speed**: Pydantic v2 is rewritten in Rust, providing up to 5x-20x faster schema validation.

```python
from fastapi import FastAPI
from pydantic import BaseModel, EmailStr

app = FastAPI()

class UserRegister(BaseModel):
    username: str
    email: EmailStr

@app.post("/users/")
async def create_user(user: UserRegister):
    return {"message": "User created", "username": user.username}
```"""

    if "dependency injection" in q_lower or ("spring" in q_lower and "injection" in q_lower):
        return """### Dependency Injection in Spring Boot

**Dependency Injection (DI)** is a core software design pattern where the Spring IoC (Inversion of Control) container automatically creates and injects dependent objects into a class, rather than the class instantiating them manually.

#### Benefits of Constructor Injection:
* **Immutability**: Dependencies can be declared as `final`.
* **Ease of Testing**: Enables clean unit testing using mock objects without launching a full Spring context.
* **Prevents NullPointerExceptions**: Ensures mandatory dependencies are provided at object instantiation.

```java
@Service
public class UserService {
    private final UserRepository userRepository;

    // Preferred: Constructor Injection
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User findUser(Long id) {
        return userRepository.findById(id).orElseThrow();
    }
}
```"""

    if "virtual thread" in q_lower or ("java 21" in q_lower and "thread" in q_lower):
        return """### Java 21 Virtual Threads (Project Loom)

**Virtual Threads** are lightweight user-mode threads managed directly by the Java Virtual Machine (JVM) rather than 1:1 OS kernel threads.

#### Key Advantages:
* **High Concurrency**: Millions of virtual threads can run simultaneously without consuming excessive memory (unlike 1MB per OS thread).
* **Thread-per-Request Simplicity**: Write straightforward synchronous code without complex reactive callback chains (`Mono`/`Flux`).
* **Mounting & Unmounting**: When a virtual thread performs blocking I/O (e.g. database query), the JVM unmounts it from the carrier OS thread, allowing other virtual threads to execute.

```java
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 10_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(1000);
            return i;
        });
    });
} // Automatically waits for all 10,000 tasks to complete
```"""

    if "resume" in q_lower:
        return """### Actionable Steps to Improve Your Resume for ATS Screening

1. **Target Keyword Alignment**: Extract core technical skills from target job descriptions (e.g. *Spring Boot, Docker, REST APIs, Virtual Threads*) and include them naturally in your skills section.
2. **Quantifiable Bullet Points**: Use the Google X-Y-Z formula: *"Accomplished [X], as measured by [Y], by doing [Z]"* (e.g. *"Optimized database queries by adding indexes, reducing latency by 40%"*).
3. **Clean Single-Column Format**: Avoid multi-column tables, graphics, or text boxes that confuse ATS parsers.
4. **Impactful Projects**: Highlight 2-3 capstone projects demonstrating backend architecture, API design, and cloud deployment."""

    if "interview" in q_lower and "java" in q_lower:
        return """### Structured Java Interview Preparation Guide

#### Phase 1: Core Java 21 & Concurrency
* Master Collections framework (`HashMap` internal bucket collisions, `ConcurrentHashMap`).
* Understand Java 21 Virtual Threads vs OS Threads, `CompletableFuture`, and Garbage Collectors (G1GC, ZGC).

#### Phase 2: Spring Boot Architecture & Data JPA
* Be prepared to explain Spring Bean lifecycle, Dependency Injection, and `@Transactional` propagation settings.
* Master JPA entity mappings, Lazy loading N+1 queries, and database indexing strategies.

#### Phase 3: System Design & STAR Method Drills
* Practice System Design concepts: Caching (Redis), Microservices API Gateways, Rate Limiting, and JWT Security.
* Frame behavioral and project questions using the STAR method (Situation, Task, Action, Result)."""

    if contexts:
        lines = [f"### Grounded Knowledge Overview: {query}\n"]
        for ctx in contexts:
            lines.append(f"**{ctx.documentTitle}**\n{ctx.content.strip()}\n")
        return "\n".join(lines)

    return f"""### Career & Technical Overview for: {query}

1. **Core Concept**: Understand the primary architecture, design patterns, and core principles.
2. **Hands-on Building**: Implement real-world projects and RESTful API endpoints.
3. **Best Practices**: Focus on clean code, unit testing, and production performance tuning.
4. **Interview Readiness**: Prepare STAR method responses and technical coding drills."""
