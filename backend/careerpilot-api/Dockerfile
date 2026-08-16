# ==========================================
# CAREERPILOT AI - SPRING BOOT DOCKERFILE
# Java 21 Multi-Stage Production Build
# ==========================================

# Stage 1: Build Java 21 Application using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy POM and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production JAR package
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Minimal Java 21 Runtime Container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user and application upload directory
RUN addgroup -S spring && adduser -S spring -G spring
RUN mkdir -p /app/uploads && chown -R spring:spring /app

USER spring:spring

# Copy compiled JAR artifact from build stage
COPY --from=builder /app/target/careerpilot-api-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
