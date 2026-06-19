package com.hiregrad.backend.dto;

import com.hiregrad.backend.application.entity.ApplicationStatus;
import lombok.*;

import java.time.Instant;
import java.util.List;

/** Everything the admin home page needs, aggregated server-side in one call. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {

    private String fullName;

    private int activePostings;
    private int totalApplicants;
    private int selected;
    private int pendingReviews;   // APPLIED — awaiting a decision
    private int rejected;
    private int placementRate;    // selected / totalApplicants, 0–100

    private List<PostingStat> postings;
    private List<RecentActivity> recentActivity;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class PostingStat {
        private Long jobId;
        private String jobTitle;
        private String companyName;
        private String location;
        private String employmentType;
        private int applicantCount;
        private int selectedCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RecentActivity {
        private String fullName;
        private String studentUsername;
        private String jobTitle;
        private String companyName;
        private ApplicationStatus status;
        private Instant appliedAt;
    }
}
