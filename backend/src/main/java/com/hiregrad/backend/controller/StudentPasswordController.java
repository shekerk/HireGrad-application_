package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.ChangePasswordRequest;
import com.hiregrad.backend.service.StudentAccountService;
import com.hiregrad.backend.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/change-password")
@RequiredArgsConstructor
public class StudentPasswordController {

    private final StudentAccountService studentAccountService;

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ChangePasswordRequest req) {
        studentAccountService.changePassword(principal.getUsername(), req.getNewPassword());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
