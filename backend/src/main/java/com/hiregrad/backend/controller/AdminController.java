package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.AdminMeResponse;
import com.hiregrad.backend.dto.AdminProfileDto;
import com.hiregrad.backend.service.AdminProfileService;
import com.hiregrad.backend.service.AdminService;
import com.hiregrad.backend.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AdminProfileService adminProfileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AdminMeResponse>> me(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(adminService.getByUsername(principal.getUsername())));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<AdminProfileDto>> getProfile(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(adminProfileService.getProfile(principal.getUsername())));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<AdminProfileDto>> saveProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody AdminProfileDto dto) {
        return ResponseEntity.ok(ApiResponse.ok(adminProfileService.saveProfile(principal.getUsername(), dto)));
    }
}