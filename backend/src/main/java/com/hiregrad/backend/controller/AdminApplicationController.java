package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.AdminApplicationResponse;
import com.hiregrad.backend.dto.StatusUpdateRequest;
import com.hiregrad.backend.service.ApplicationService;
import com.hiregrad.backend.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/applications")
@RequiredArgsConstructor
public class AdminApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminApplicationResponse>>> listForJob(@RequestParam Long jobId) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.listForJob(jobId)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminApplicationResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(applicationService.updateStatus(id, req.getStatus())));
    }
}
