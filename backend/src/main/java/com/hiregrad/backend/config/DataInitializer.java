package com.hiregrad.backend.config;

import com.hiregrad.backend.user.entity.Role;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.username}")  private String adminUsername;
    @Value("${app.seed.admin.password}")  private String adminPassword;
    @Value("${app.seed.admin.full-name}") private String adminFullName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername(adminUsername)) {
            userRepository.save(User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .role(Role.ADMIN)
                    .enabled(true)
                    .build());
        }
    }
}