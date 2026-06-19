package com.hiregrad.backend.dto;

import com.hiregrad.backend.application.entity.ApplicationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Raw placement dataset for the admin Report Analysis page. The frontend aggregates
 * and filters this in real time (by company, college, department, year, student).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacementReportResponse {

    private List<StudentRow> students;
    private List<ApplicationRow> applications;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class StudentRow {
        private String username;
        private String fullName;
        private String rollNumber;
        private String department;   // profile.course
        private String college;      // profile.college (also used as campus)
        private String passOutYear;  // academic year
        private BigDecimal cgpa;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApplicationRow {
        private String studentUsername;
        private String fullName;
        private String company;
        private String jobTitle;
        private ApplicationStatus status; // SELECTED = offer/placed, REJECTED = rejection
    }
}
