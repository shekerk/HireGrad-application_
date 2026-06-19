package com.hiregrad.backend.service;

import com.hiregrad.backend.dto.AdminApplicationResponse;
import com.hiregrad.backend.dto.ApplyRequest;
import com.hiregrad.backend.dto.StudentApplicationResponse;
import com.hiregrad.backend.application.entity.Application;
import com.hiregrad.backend.application.entity.ApplicationStatus;
import com.hiregrad.backend.application.repository.ApplicationRepository;
import com.hiregrad.backend.common.exception.DuplicateResourceException;
import com.hiregrad.backend.common.exception.ResourceNotFoundException;
import com.hiregrad.backend.job.entity.Job;
import com.hiregrad.backend.job.repository.JobRepository;
import com.hiregrad.backend.profile.entity.StudentProfile;
import com.hiregrad.backend.profile.repository.StudentProfileRepository;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;

    /** Student applies to a job. Status defaults to APPLIED; one application per (job, student). */
    @Transactional
    public StudentApplicationResponse apply(String username, ApplyRequest req) {
        Job job = jobRepository.findById(req.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + req.getJobId()));

        if (applicationRepository.existsByJob_IdAndStudentUsername(job.getId(), username)) {
            throw new DuplicateResourceException("You have already applied to this job.");
        }

        Application application = Application.builder()
                .job(job)
                .studentUsername(username)
                .status(ApplicationStatus.APPLIED)
                .resumeFileName(req.getResumeFileName())
                .build();

        return toStudentDto(applicationRepository.save(application));
    }

    /** Rows for the student's own Application Tracker. */
    @Transactional(readOnly = true)
    public List<StudentApplicationResponse> listForStudent(String username) {
        return applicationRepository.findByStudentUsernameOrderByCreatedAtDesc(username)
                .stream().map(this::toStudentDto).toList();
    }

    /** Rows for the admin's Application Management table for one job posting. */
    @Transactional(readOnly = true)
    public List<AdminApplicationResponse> listForJob(Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Job not found: " + jobId);
        }
        return applicationRepository.findByJob_IdOrderByCreatedAtDesc(jobId)
                .stream().map(this::toAdminDto).toList();
    }

    /** Admin advances a student's status; reflected immediately in the student tracker. */
    @Transactional
    public AdminApplicationResponse updateStatus(Long applicationId, ApplicationStatus status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found: " + applicationId));
        application.setStatus(status);
        return toAdminDto(applicationRepository.save(application));
    }

    private StudentApplicationResponse toStudentDto(Application a) {
        Job job = a.getJob();
        return StudentApplicationResponse.builder()
                .id(a.getId())
                .jobId(job.getId())
                .companyName(job.getCompanyName())
                .jobTitle(job.getJobTitle())
                .status(a.getStatus())
                .appliedAt(a.getCreatedAt())
                .build();
    }

    private AdminApplicationResponse toAdminDto(Application a) {
        User user = userRepository.findByUsername(a.getStudentUsername()).orElse(null);
        StudentProfile profile = profileRepository.findByUser_Username(a.getStudentUsername()).orElse(null);

        String fullName = user != null ? user.getFullName() : a.getStudentUsername();
        String branch = profile != null ? profile.getCourse() : null;

        return AdminApplicationResponse.builder()
                .id(a.getId())
                .jobId(a.getJob().getId())
                .studentUsername(a.getStudentUsername())
                .fullName(fullName)
                .branch(branch)
                .cgpa(profile != null ? profile.getCgpa() : null)
                .status(a.getStatus())
                .appliedAt(a.getCreatedAt())
                .build();
    }
}
