package com.careerpilot.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SkillNormalizationService {

    private final Map<String, String> aliasMap = new HashMap<>();

    public SkillNormalizationService() {
        // Initialize common canonical technical skill mappings
        aliasMap.put("java", "Java");
        aliasMap.put("spring boot", "Spring Boot");
        aliasMap.put("springboot", "Spring Boot");
        aliasMap.put("python", "Python");
        aliasMap.put("python3", "Python");
        aliasMap.put("react", "React");
        aliasMap.put("reactjs", "React");
        aliasMap.put("react.js", "React");
        aliasMap.put("fastapi", "FastAPI");
        aliasMap.put("postgres", "PostgreSQL");
        aliasMap.put("postgresql", "PostgreSQL");
        aliasMap.put("typescript", "TypeScript");
        aliasMap.put("ts", "TypeScript");
        aliasMap.put("javascript", "JavaScript");
        aliasMap.put("js", "JavaScript");
        aliasMap.put("docker", "Docker");
        aliasMap.put("aws", "AWS");
        aliasMap.put("amazon web services", "AWS");
        aliasMap.put("rest apis", "REST APIs");
        aliasMap.put("rest api", "REST APIs");
        aliasMap.put("restful apis", "REST APIs");
        aliasMap.put("git", "Git");
        aliasMap.put("maven", "Maven");
        aliasMap.put("sql", "SQL");
        aliasMap.put("html", "HTML5");
        aliasMap.put("html5", "HTML5");
        aliasMap.put("css", "CSS3");
        aliasMap.put("css3", "CSS3");
        aliasMap.put("tailwind css", "Tailwind CSS");
        aliasMap.put("tailwind", "Tailwind CSS");
    }

    public String normalizeSkill(String rawSkill) {
        if (rawSkill == null || rawSkill.trim().isEmpty()) {
            return null;
        }
        String clean = rawSkill.trim();
        String lower = clean.toLowerCase();
        return aliasMap.getOrDefault(lower, clean);
    }

    public Set<String> normalizeSkillSet(Collection<String> rawSkills) {
        if (rawSkills == null || rawSkills.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> result = new LinkedHashSet<>();
        for (String s : rawSkills) {
            String normalized = normalizeSkill(s);
            if (normalized != null) {
                result.add(normalized);
            }
        }
        return result;
    }
}
