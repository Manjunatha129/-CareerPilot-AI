package com.careerpilot.service;

import com.careerpilot.dto.LoginRequest;
import com.careerpilot.dto.LoginResponse;
import com.careerpilot.dto.RegisterRequest;
import com.careerpilot.dto.UserResponse;
import com.careerpilot.entity.Profile;
import com.careerpilot.entity.User;
import com.careerpilot.exception.BadRequestException;
import com.careerpilot.exception.DuplicateResourceException;
import com.careerpilot.repository.ProfileRepository;
import com.careerpilot.repository.UserRepository;
import com.careerpilot.security.JwtService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Should successfully register candidate user")
    public void shouldRegisterCandidateUser() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("Password123")
                .build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password123")).thenReturn("$2a$10$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });

        UserResponse response = authService.register(request);

        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getEmail()).isEqualTo("john@example.com");
        verify(profileRepository, times(1)).save(any(Profile.class));
    }

    @Test
    @DisplayName("Should throw DuplicateResourceException on duplicate email registration")
    public void shouldThrowOnDuplicateEmail() {
        RegisterRequest request = RegisterRequest.builder()
                .fullName("John Doe")
                .email("john@example.com")
                .password("Password123")
                .build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email address is already registered");
    }

    @Test
    @DisplayName("Should successfully login and return JWT token")
    public void shouldLoginSuccessfully() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("Password123")
                .build();

        User user = User.builder()
                .id(10L)
                .email("john@example.com")
                .passwordHash("$2a$10$hashed")
                .role("ROLE_CANDIDATE")
                .isActive(true)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123", "$2a$10$hashed")).thenReturn(true);
        when(jwtService.generateToken(user)).thenReturn("mock.jwt.token");

        LoginResponse response = authService.login(request);

        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
    }

    @Test
    @DisplayName("Should throw BadRequestException on wrong password")
    public void shouldThrowOnWrongPassword() {
        LoginRequest request = LoginRequest.builder()
                .email("john@example.com")
                .password("WrongPassword")
                .build();

        User user = User.builder()
                .id(10L)
                .email("john@example.com")
                .passwordHash("$2a$10$hashed")
                .isActive(true)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid email or password");
    }
}
