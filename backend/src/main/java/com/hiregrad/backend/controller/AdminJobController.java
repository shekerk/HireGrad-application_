package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.ApiResponse;
import com.hiregrad.backend.dto.JobRequest;
import com.hiregrad.backend.dto.JobResponse;
import com.hiregrad.backend.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
public class AdminJobController {

    private final JobService jobService;

    @PostMapping
    public ResponseEntity<ApiResponse<JobResponse>> create(@AuthenticationPrincipal UserDetails principal,
                                                           @Valid @RequestBody JobRequest req) {
        JobResponse created = jobService.create(req, principal.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(jobService.listAll()));
    }
}