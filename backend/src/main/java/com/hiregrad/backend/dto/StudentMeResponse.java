package com.hiregrad.backend.dto;

import com.hiregrad.backend.user.entity.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentMeResponse {
    private String username;
    private String fullName;
    private Role role;
}