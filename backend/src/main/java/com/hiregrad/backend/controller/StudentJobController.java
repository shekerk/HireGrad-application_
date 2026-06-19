package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.ApiResponse;
import com.hiregrad.backend.dto.JobResponse;
import com.hiregrad.backend.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/student/jobs")
@RequiredArgsConstructor
public class StudentJobController {

    private final JobService jobService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(jobService.listAll()));
    }
}