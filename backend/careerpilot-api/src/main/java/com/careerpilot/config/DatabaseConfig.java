package com.careerpilot.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.net.URI;

@Slf4j
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSourceProperties dataSourceProperties(DataSourceProperties properties) {
        String rawUrl = properties.getUrl();
        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();
                
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                log.info("Converted cloud database connection URI to JDBC URL: {}", jdbcUrl);
                properties.setUrl(jdbcUrl);

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    if (properties.getUsername() == null || properties.getUsername().isBlank() || "sa".equals(properties.getUsername())) {
                        properties.setUsername(userInfo[0]);
                    }
                    if (userInfo.length > 1 && (properties.getPassword() == null || properties.getPassword().isBlank())) {
                        properties.setPassword(userInfo[1]);
                    }
                }
                properties.setDriverClassName("org.postgresql.Driver");
            } catch (Exception e) {
                log.error("Error parsing cloud database connection string: {}", e.getMessage());
            }
        }
        return properties;
    }
}
