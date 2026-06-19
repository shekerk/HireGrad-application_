package com.hiregrad.backend.dto;

import com.hiregrad.backend.application.entity.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/** A row in the admin's Application Management table for a selected job. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminApplicationResponse {
    private Long id;
    private Long jobId;
    private String studentUsername; // roll number
    private String fullName;
    private String branch;          // derived from profile.course
    private BigDecimal cgpa;
    private ApplicationStatus status;
    private Instant appliedAt;
}
