package com.careerpilot.security;

import com.careerpilot.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

public class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    public void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", 86400000L);
    }

    @Test
    @DisplayName("Should generate valid JWT token and extract email")
    public void shouldGenerateAndValidateToken() {
        User user = User.builder()
                .id(1L)
                .email("candidate@careerpilot.ai")
                .role("ROLE_CANDIDATE")
                .build();

        String token = jwtService.generateToken(user);
        assertThat(token).isNotEmpty();
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.extractEmail(token)).isEqualTo("candidate@careerpilot.ai");
    }

    @Test
    @DisplayName("Should reject invalid or malformed JWT token")
    public void shouldRejectInvalidToken() {
        assertThat(jwtService.validateToken("invalid.jwt.token")).isFalse();
    }
}
