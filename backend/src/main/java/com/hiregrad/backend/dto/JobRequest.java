package com.hiregrad.backend.dto;

import com.hiregrad.backend.job.entity.EmploymentType;
import com.hiregrad.backend.job.entity.WorkMode;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class JobRequest {

    @NotBlank(message = "Company name is required")
    private String companyName;
    @NotBlank(message = "Job title is required")
    private String jobTitle;
    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "CTC is required")
    @Positive(message = "CTC must be greater than 0")
    private Long ctcPerYear;

    @NotNull(message = "Employment type is required")
    private EmploymentType employmentType;
    @NotNull(message = "Work mode is required")
    private WorkMode workMode;

    private BigDecimal minCgpa; // optional; range checked in service

    @NotEmpty(message = "Add at least one required skill")
    private List<String> requiredSkills;

    @NotBlank(message = "Job description is required")
    private String description;

    @NotNull(message = "Application deadline is required")
    @Future(message = "Deadline must be in the future")
    private LocalDateTime applicationDeadline;
}