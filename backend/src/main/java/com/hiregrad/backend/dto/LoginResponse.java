package com.hiregrad.backend.dto;

import com.hiregrad.backend.user.entity.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String username;
    private Role role;     // serializes to "STUDENT" / "ADMIN" — matches the frontend
    private String fullName;
    private String token;
    private boolean mustChangePassword; // student must set a new password before using the portal
}