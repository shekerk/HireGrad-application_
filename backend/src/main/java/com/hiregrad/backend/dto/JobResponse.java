package com.hiregrad.backend.dto;

import com.hiregrad.backend.job.entity.EmploymentType;
import com.hiregrad.backend.job.entity.WorkMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResponse {
    private Long id;
    private String companyName;
    private String jobTitle;
    private String location;
    private Long ctcPerYear;
    private EmploymentType employmentType;
    private WorkMode workMode;
    private BigDecimal minCgpa;
    private List<String> requiredSkills;
    private String description;
    private LocalDateTime applicationDeadline;
    private Instant postedAt;
}