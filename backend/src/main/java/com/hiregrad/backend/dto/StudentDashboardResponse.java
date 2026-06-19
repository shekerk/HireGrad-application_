package com.hiregrad.backend.dto;

import com.hiregrad.backend.application.entity.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

/** Everything the student home page needs, aggregated server-side in one call. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDashboardResponse {

    private String fullName;

    // profile completion
    private int profileCompletion;          // 0–100
    private List<String> missingSections;   // labels of unfilled profile sections

    // application stats
    private int totalApplications;
    private int inReview;                   // APPLIED
    private int selected;                   // SELECTED
    private int rejected;                   // REJECTED

    private int eligibleRoles;              // open jobs the student qualifies for

    private List<RecentApplication> recentApplications;
    private List<RecommendedJob> recommendedJobs;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecentApplication {
        private String companyName;
        private String jobTitle;
        private ApplicationStatus status;
        private Instant appliedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecommendedJob {
        private Long id;
        private String jobTitle;
        private String companyName;
        private String location;
        private BigDecimal minCgpa;
        private Long ctcPerYear;
        private LocalDateTime applicationDeadline;
    }
}
