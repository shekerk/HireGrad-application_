package com.hiregrad.backend.dto;

import com.hiregrad.backend.application.entity.ApplicationStatus;
import lombok.*;

import java.time.Instant;

/** A row in the student's own Application Tracker. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentApplicationResponse {
    private Long id;
    private Long jobId;
    private String companyName;
    private String jobTitle;
    private ApplicationStatus status;
    private Instant appliedAt;
}
