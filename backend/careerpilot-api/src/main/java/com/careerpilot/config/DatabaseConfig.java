package com.careerpilot.config;

import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Slf4j
@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url:}")
    private String rawUrl;

    @Value("${spring.datasource.username:sa}")
    private String username;

    @Value("${spring.datasource.password:}")
    private String password;

    @Value("${spring.datasource.driver-class-name:org.h2.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String finalUrl = rawUrl != null ? rawUrl.trim() : "";
        String finalUsername = username != null ? username.trim() : "sa";
        String finalPassword = password != null ? password : "";
        String finalDriver = driverClassName != null ? driverClassName.trim() : "org.h2.Driver";

        // Check if URL is cloud format (postgres:// or postgresql://)
        if (!finalUrl.isEmpty() && (finalUrl.startsWith("postgres://") || finalUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(finalUrl);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath();

                finalUrl = "jdbc:postgresql://" + host + ":" + port + path;
                finalDriver = "org.postgresql.Driver";

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    if (finalUsername.isEmpty() || "sa".equalsIgnoreCase(finalUsername)) {
                        finalUsername = userInfo[0];
                    }
                    if (userInfo.length > 1 && finalPassword.isEmpty()) {
                        finalPassword = userInfo[1];
                    }
                }
                log.info("Parsed cloud database URI into JDBC URL: {}", finalUrl);
            } catch (Exception e) {
                log.error("Failed to parse cloud database URI ({}): {}", finalUrl, e.getMessage());
            }
        } else if (finalUrl.startsWith("jdbc:postgresql:")) {
            finalDriver = "org.postgresql.Driver";
        } else if (finalUrl.isEmpty()) {
            finalUrl = "jdbc:h2:mem:careerpilot;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE";
            finalUsername = "sa";
            finalPassword = "";
            finalDriver = "org.h2.Driver";
        }

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(finalUrl);
        dataSource.setUsername(finalUsername);
        dataSource.setPassword(finalPassword);
        dataSource.setDriverClassName(finalDriver);
        dataSource.setMaximumPoolSize(10);
        dataSource.setMinimumIdle(2);
        dataSource.setConnectionTimeout(30000);
        dataSource.setIdleTimeout(600000);

        log.info("Initialized Primary HikariDataSource for Spring Boot: URL={}, Driver={}", finalUrl, finalDriver);
        return dataSource;
    }
}
