package com.hiregrad.backend.controller;

import com.hiregrad.backend.dto.ApiResponse;
import com.hiregrad.backend.dto.PlacementReportResponse;
import com.hiregrad.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportService reportService;

    @GetMapping("/placement")
    public ResponseEntity<ApiResponse<PlacementReportResponse>> placement() {
        return ResponseEntity.ok(ApiResponse.ok(reportService.placementReport()));
    }
}
