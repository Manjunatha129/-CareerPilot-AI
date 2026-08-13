# Software Architecture & System Design Guide

## 1. System Design Fundamentals
System design is the process of defining architecture, modules, interfaces, and data for a system to satisfy specified requirements.

### Core Concepts:
* **Microservices vs Monoliths**: Microservices decouple domain responsibilities into independently deployable services communicating over REST or gRPC.
* **Load Balancing**: Distributes incoming network traffic across multiple servers (Round Robin, Least Connections, IP Hash) to ensure high availability.
* **Database Sharding & Partitioning**: Horizontal partitioning splits large database tables across multiple database instances to scale read/write operations.
* **Caching Strategies**: Cache-aside, Read-through, Write-through, and Write-back patterns using Redis or Memcached to reduce database load.

## 2. API Gateway & Security Standards
* **Authentication**: Stateless JSON Web Tokens (JWT) with RSA or HMAC signatures.
* **Rate Limiting**: Token bucket or sliding window algorithm to protect backend APIs from abuse.
