package com.hiregrad.backend.service;

import com.hiregrad.backend.application.entity.Application;
import com.hiregrad.backend.application.repository.ApplicationRepository;
import com.hiregrad.backend.profile.entity.StudentProfile;
import com.hiregrad.backend.profile.repository.StudentProfileRepository;
import com.hiregrad.backend.dto.PlacementReportResponse;
import com.hiregrad.backend.user.entity.Role;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final ApplicationRepository applicationRepository;

    @Transactional(readOnly = true)
    public PlacementReportResponse placementReport() {
        List<User> students = userRepository.findByRole(Role.STUDENT);

        Map<String, String> nameByUsername = new HashMap<>();
        List<PlacementReportResponse.StudentRow> studentRows = students.stream().map(u -> {
            nameByUsername.put(u.getUsername(), u.getFullName());
            StudentProfile p = profileRepository.findByUser_Username(u.getUsername()).orElse(null);
            return PlacementReportResponse.StudentRow.builder()
                    .username(u.getUsername())
                    .fullName(u.getFullName())
                    .rollNumber(p != null ? p.getRollNumber() : null)
                    .department(p != null ? p.getCourse() : null)
                    .college(p != null ? p.getCollege() : null)
                    .passOutYear(p != null ? p.getPassOutYear() : null)
                    .cgpa(p != null ? p.getCgpa() : null)
                    .build();
        }).toList();

        List<PlacementReportResponse.ApplicationRow> appRows = applicationRepository.findAll().stream()
                .map(this::toAppRow)
                .toList();
        // backfill any names from the user repo if a row's student wasn't in the STUDENT list
        appRows.forEach(r -> {
            if (r.getFullName() == null) {
                r.setFullName(nameByUsername.getOrDefault(r.getStudentUsername(), r.getStudentUsername()));
            }
        });

        return PlacementReportResponse.builder()
                .students(studentRows)
                .applications(appRows)
                .build();
    }

    private PlacementReportResponse.ApplicationRow toAppRow(Application a) {
        String fullName = userRepository.findByUsername(a.getStudentUsername())
                .map(User::getFullName).orElse(a.getStudentUsername());
        return PlacementReportResponse.ApplicationRow.builder()
                .studentUsername(a.getStudentUsername())
                .fullName(fullName)
                .company(a.getJob().getCompanyName())
                .jobTitle(a.getJob().getJobTitle())
                .status(a.getStatus())
                .build();
    }
}
