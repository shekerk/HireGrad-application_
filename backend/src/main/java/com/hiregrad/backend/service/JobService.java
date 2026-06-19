package com.hiregrad.backend.service;

import com.hiregrad.backend.dto.JobRequest;
import com.hiregrad.backend.dto.JobResponse;
import com.hiregrad.backend.job.entity.Job;
import com.hiregrad.backend.job.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    @Transactional
    public JobResponse create(JobRequest req, String username) {
        if (req.getMinCgpa() != null) {
            BigDecimal c = req.getMinCgpa();
            if (c.compareTo(BigDecimal.ZERO) < 0 || c.compareTo(new BigDecimal("10")) > 0) {
                throw new IllegalArgumentException("Minimum CGPA must be between 0 and 10.");
            }
        }
        Job job = Job.builder()
                .companyName(req.getCompanyName().trim())
                .jobTitle(req.getJobTitle().trim())
                .location(req.getLocation().trim())
                .ctcPerYear(req.getCtcPerYear())
                .employmentType(req.getEmploymentType())
                .workMode(req.getWorkMode())
                .minCgpa(req.getMinCgpa())
                .requiredSkills(new ArrayList<>(req.getRequiredSkills()))
                .description(req.getDescription())
                .applicationDeadline(req.getApplicationDeadline())
                .postedByUsername(username)
                .build();
        return toDto(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> listAll() {
        return jobRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    private JobResponse toDto(Job j) {
        return JobResponse.builder()
                .id(j.getId())
                .companyName(j.getCompanyName())
                .jobTitle(j.getJobTitle())
                .location(j.getLocation())
                .ctcPerYear(j.getCtcPerYear())
                .employmentType(j.getEmploymentType())
                .workMode(j.getWorkMode())
                .minCgpa(j.getMinCgpa())
                .requiredSkills(new ArrayList<>(j.getRequiredSkills()))
                .description(j.getDescription())
                .applicationDeadline(j.getApplicationDeadline())
                .postedAt(j.getCreatedAt())
                .build();
    }
}