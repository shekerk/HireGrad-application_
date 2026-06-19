package com.hiregrad.backend.service;

import com.hiregrad.backend.common.exception.ResourceNotFoundException;
import com.hiregrad.backend.dto.StudentMeResponse;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final UserRepository userRepository;

    public StudentMeResponse getByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + username));

        return StudentMeResponse.builder()
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }
}