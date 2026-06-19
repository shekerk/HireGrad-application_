package com.hiregrad.backend.service;

import com.hiregrad.backend.dto.LoginRequest;
import com.hiregrad.backend.dto.LoginResponse;
import com.hiregrad.backend.common.exception.InvalidCredentialsException;
import com.hiregrad.backend.security.JwtService;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        // 1. Verify username + password (BCrypt comparison happens here)
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (DisabledException e) {
            throw new InvalidCredentialsException("This account is disabled. Please contact the placement cell.");
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("Invalid username or password.");
        }

        // 2. Load the user and enforce the selected role (student tab vs placement-cell tab)
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password."));

        if (user.getRole() != request.getRole()) {
            throw new InvalidCredentialsException(
                    "This account is not registered as a " + request.getRole() + ".");
        }

        // 3. Issue the JWT
        String token = jwtService.generateToken(user);

        return LoginResponse.builder()
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .token(token)
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }
}