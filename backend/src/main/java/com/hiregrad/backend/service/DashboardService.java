package com.hiregrad.backend.service;

import com.hiregrad.backend.application.entity.Application;
import com.hiregrad.backend.application.entity.ApplicationStatus;
import com.hiregrad.backend.application.repository.ApplicationRepository;
import com.hiregrad.backend.dto.AdminDashboardResponse;
import com.hiregrad.backend.dto.StudentDashboardResponse;
import com.hiregrad.backend.job.entity.Job;
import com.hiregrad.backend.job.repository.JobRepository;
import com.hiregrad.backend.profile.entity.StudentProfile;
import com.hiregrad.backend.profile.repository.StudentProfileRepository;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;

    // ===================== STUDENT =====================

    @Transactional(readOnly = true)
    public StudentDashboardResponse studentDashboard(String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        StudentProfile profile = profileRepository.findByUser_Username(username).orElse(null);
        List<Application> apps = applicationRepository.findByStudentUsernameOrderByCreatedAtDesc(username);

        int inReview = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count();
        int selected = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
        int rejected = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        Set<Long> appliedJobIds = apps.stream().map(a -> a.getJob().getId()).collect(Collectors.toSet());
        List<Job> openJobs = jobRepository.findAllByOrderByCreatedAtDesc();

        List<Job> eligible = openJobs.stream().filter(j -> isEligible(profile, j)).toList();

        List<StudentDashboardResponse.RecommendedJob> recommended = eligible.stream()
                .filter(j -> !appliedJobIds.contains(j.getId()))
                .sorted(Comparator.comparing(Job::getApplicationDeadline,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(4)
                .map(j -> StudentDashboardResponse.RecommendedJob.builder()
                        .id(j.getId())
                        .jobTitle(j.getJobTitle())
                        .companyName(j.getCompanyName())
                        .location(j.getLocation())
                        .minCgpa(j.getMinCgpa())
                        .ctcPerYear(j.getCtcPerYear())
                        .applicationDeadline(j.getApplicationDeadline())
                        .build())
                .toList();

        List<StudentDashboardResponse.RecentApplication> recent = apps.stream()
                .limit(4)
                .map(a -> StudentDashboardResponse.RecentApplication.builder()
                        .companyName(a.getJob().getCompanyName())
                        .jobTitle(a.getJob().getJobTitle())
                        .status(a.getStatus())
                        .appliedAt(a.getCreatedAt())
                        .build())
                .toList();

        List<String> missing = new ArrayList<>();
        int filled = profileCompletion(profile, missing);
        int percent = (int) Math.round((filled / 9.0) * 100);

        return StudentDashboardResponse.builder()
                .fullName(user != null ? user.getFullName() : username)
                .profileCompletion(percent)
                .missingSections(missing)
                .totalApplications(apps.size())
                .inReview(inReview)
                .selected(selected)
                .rejected(rejected)
                .eligibleRoles(eligible.size())
                .recentApplications(recent)
                .recommendedJobs(recommended)
                .build();
    }

    /** Returns the number of filled sections (out of 9) and fills {@code missing} with unfilled labels. */
    private int profileCompletion(StudentProfile p, List<String> missing) {
        int filled = 0;
        if (p != null && notBlank(p.getPhotoUrl())) filled++; else missing.add("Photo");
        if (p != null && notBlank(p.getFirstName()) && notBlank(p.getLastName())) filled++; else missing.add("Name");
        if (p != null && notBlank(p.getInstituteEmail()) && notBlank(p.getPersonalEmail())) filled++; else missing.add("Emails");
        if (p != null && notBlank(p.getPhone())) filled++; else missing.add("Phone");
        if (p != null && notBlank(p.getAddress())) filled++; else missing.add("Address");
        if (p != null && p.getSkills() != null && !p.getSkills().isEmpty()) filled++; else missing.add("Skills");
        if (p != null && notBlank(p.getCourse()) && p.getCgpa() != null && notBlank(p.getPassOutYear())) filled++; else missing.add("Academic details");
        if (p != null && (notBlank(p.getResumeFileName()) || notBlank(p.getResumeLink()))) filled++; else missing.add("Resume");
        if (p != null && p.getProjects() != null && !p.getProjects().isEmpty()) filled++; else missing.add("Projects");
        return filled;
    }

    private boolean isEligible(StudentProfile p, Job job) {
        if (p == null) return false;
        if (job.getMinCgpa() != null) {
            if (p.getCgpa() == null || p.getCgpa().compareTo(job.getMinCgpa()) < 0) return false;
        }
        List<String> have = (p.getSkills() == null ? List.<String>of() : p.getSkills()).stream()
                .map(s -> s.toLowerCase().trim()).toList();
        for (String req : job.getRequiredSkills()) {
            if (!have.contains(req.toLowerCase().trim())) return false;
        }
        return true;
    }

    // ===================== ADMIN =====================

    @Transactional(readOnly = true)
    public AdminDashboardResponse adminDashboard(String username) {
        User admin = userRepository.findByUsername(username).orElse(null);
        List<Job> jobs = jobRepository.findAllByOrderByCreatedAtDesc();
        List<Application> apps = applicationRepository.findAll();

        int total = apps.size();
        int selected = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
        int pending = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count();
        int rejected = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();
        int placementRate = total > 0 ? (int) Math.round((selected / (double) total) * 100) : 0;

        // group applications by job once (avoids N+1)
        Map<Long, List<Application>> byJob = apps.stream()
                .collect(Collectors.groupingBy(a -> a.getJob().getId()));

        List<AdminDashboardResponse.PostingStat> postings = jobs.stream()
                .map(j -> {
                    List<Application> jobApps = byJob.getOrDefault(j.getId(), List.of());
                    int sel = (int) jobApps.stream().filter(a -> a.getStatus() == ApplicationStatus.SELECTED).count();
                    return AdminDashboardResponse.PostingStat.builder()
                            .jobId(j.getId())
                            .jobTitle(j.getJobTitle())
                            .companyName(j.getCompanyName())
                            .location(j.getLocation())
                            .employmentType(j.getEmploymentType() != null ? j.getEmploymentType().name() : null)
                            .applicantCount(jobApps.size())
                            .selectedCount(sel)
                            .build();
                })
                .toList();

        // resolve full names once for the recent feed
        Map<String, String> nameCache = new HashMap<>();
        List<AdminDashboardResponse.RecentActivity> recent = apps.stream()
                .sorted(Comparator.comparing(Application::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(6)
                .map(a -> AdminDashboardResponse.RecentActivity.builder()
                        .fullName(nameCache.computeIfAbsent(a.getStudentUsername(), u ->
                                userRepository.findByUsername(u).map(User::getFullName).orElse(u)))
                        .studentUsername(a.getStudentUsername())
                        .jobTitle(a.getJob().getJobTitle())
                        .companyName(a.getJob().getCompanyName())
                        .status(a.getStatus())
                        .appliedAt(a.getCreatedAt())
                        .build())
                .toList();

        return AdminDashboardResponse.builder()
                .fullName(admin != null ? admin.getFullName() : username)
                .activePostings(jobs.size())
                .totalApplicants(total)
                .selected(selected)
                .pendingReviews(pending)
                .rejected(rejected)
                .placementRate(placementRate)
                .postings(postings)
                .recentActivity(recent)
                .build();
    }

    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
}
