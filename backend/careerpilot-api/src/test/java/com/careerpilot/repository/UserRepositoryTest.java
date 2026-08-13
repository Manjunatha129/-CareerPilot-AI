package com.careerpilot.repository;

import com.careerpilot.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
public class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("Should save user and find by email")
    public void shouldSaveAndFindByEmail() {
        User user = User.builder()
                .email("test@careerpilot.ai")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Test User")
                .role("ROLE_CANDIDATE")
                .isActive(true)
                .build();

        entityManager.persistAndFlush(user);

        Optional<User> found = userRepository.findByEmail("test@careerpilot.ai");
        assertThat(found).isPresent();
        assertThat(found.get().getFullName()).isEqualTo("Test User");
        assertThat(userRepository.existsByEmail("test@careerpilot.ai")).isTrue();
    }
}
