package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.ApplyRequest;
import com.hiregrad.backend.dto.StudentApplicationResponse;
import com.hiregrad.backend.service.ApplicationService;
import com.hiregrad.backend.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/student/applications")
@RequiredArgsConstructor
public class StudentApplicationController {

    private final ApplicationService applicationService;

    @PostMapping
    public ResponseEntity<ApiResponse<StudentApplicationResponse>> apply(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody ApplyRequest req) {
        StudentApplicationResponse created = applicationService.apply(principal.getUsername(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StudentApplicationResponse>>> myApplications(
            @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.listForStudent(principal.getUsername())));
    }
}
