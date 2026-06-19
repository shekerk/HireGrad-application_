package com.hiregrad.backend.profile.service;

import com.hiregrad.backend.common.exception.ResourceNotFoundException;
import com.hiregrad.backend.profile.dto.LinkDto;
import com.hiregrad.backend.profile.dto.ProfileDto;
import com.hiregrad.backend.profile.dto.ProjectDto;
import com.hiregrad.backend.profile.entity.LinkItem;
import com.hiregrad.backend.profile.entity.ProjectItem;
import com.hiregrad.backend.profile.entity.StudentProfile;
import com.hiregrad.backend.profile.repository.StudentProfileRepository;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class StudentProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;

    public StudentProfileService(StudentProfileRepository profileRepository, UserRepository userRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileDto getProfile(String username) {
        return profileRepository.findByUser_Username(username)
                .map(this::toDto)
                .orElseGet(ProfileDto::new); // empty profile for a brand-new student
    }

    @Transactional
    public ProfileDto saveProfile(String username, ProfileDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        StudentProfile profile = profileRepository.findByUser_Username(username)
                .orElseGet(() -> StudentProfile.builder().user(user).build());

        apply(dto, profile);
        return toDto(profileRepository.save(profile));
    }

    private void apply(ProfileDto d, StudentProfile p) {
        p.setPhotoUrl(d.getPhotoUrl());
        p.setFirstName(d.getFirstName());
        p.setMiddleName(d.getMiddleName());
        p.setLastName(d.getLastName());
        p.setInstituteEmail(d.getInstituteEmail());
        p.setPersonalEmail(d.getPersonalEmail());
        p.setCountryCode(d.getCountryCode());
        p.setPhone(d.getPhone());
        p.setAddress(d.getAddress());
        p.setTenthSchool(d.getTenthSchool());
        p.setTenthPercent(d.getTenthPercent());
        p.setTwelfthSchool(d.getTwelfthSchool());
        p.setTwelfthPercent(d.getTwelfthPercent());
        p.setCollege(d.getCollege());
        p.setCourse(d.getCourse());
        p.setPassOutYear(d.getPassOutYear());
        p.setCgpa(parseCgpa(d.getCgpa()));
        p.setResumeFileName(d.getResumeFileName());
        p.setResumeLink(d.getResumeLink());

        p.getSkills().clear();
        if (d.getSkills() != null) p.getSkills().addAll(d.getSkills());

        p.getProjects().clear();
        if (d.getProjects() != null) {
            for (ProjectDto pr : d.getProjects()) {
                p.getProjects().add(new ProjectItem(pr.getTitle(), pr.getDescription(), pr.getLink()));
            }
        }

        p.getLinks().clear();
        if (d.getLinks() != null) {
            for (LinkDto l : d.getLinks()) {
                p.getLinks().add(new LinkItem(l.getType(), l.getLabel(), l.getUrl()));
            }
        }
    }

    private BigDecimal parseCgpa(String raw) {
        if (raw == null || raw.isBlank()) return null;
        BigDecimal v;
        try {
            v = new BigDecimal(raw.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("CGPA must be a number.");
        }
        if (v.scale() > 2) throw new IllegalArgumentException("CGPA can have at most 2 decimals.");
        if (v.compareTo(BigDecimal.ZERO) < 0 || v.compareTo(new BigDecimal("10")) > 0)
            throw new IllegalArgumentException("CGPA must be between 0 and 10.");
        return v;
    }

    private ProfileDto toDto(StudentProfile p) {
        List<ProjectDto> projects = new ArrayList<>();
        for (ProjectItem pi : p.getProjects()) {
            projects.add(ProjectDto.builder().title(pi.getTitle()).description(pi.getDescription()).link(pi.getLink()).build());
        }
        List<LinkDto> links = new ArrayList<>();
        for (LinkItem li : p.getLinks()) {
            links.add(LinkDto.builder().type(li.getType()).label(li.getLabel()).url(li.getUrl()).build());
        }
        return ProfileDto.builder()
                .photoUrl(p.getPhotoUrl())
                .firstName(p.getFirstName())
                .middleName(p.getMiddleName())
                .lastName(p.getLastName())
                .instituteEmail(p.getInstituteEmail())
                .personalEmail(p.getPersonalEmail())
                .countryCode(p.getCountryCode())
                .phone(p.getPhone())
                .address(p.getAddress())
                .skills(new ArrayList<>(p.getSkills()))
                .tenthSchool(p.getTenthSchool())
                .tenthPercent(p.getTenthPercent())
                .twelfthSchool(p.getTwelfthSchool())
                .twelfthPercent(p.getTwelfthPercent())
                .college(p.getCollege())
                .course(p.getCourse())
                .passOutYear(p.getPassOutYear())
                .cgpa(p.getCgpa() != null ? p.getCgpa().toPlainString() : null)
                .resumeFileName(p.getResumeFileName())
                .resumeLink(p.getResumeLink())
                .projects(projects)
                .links(links)
                .build();
    }
}