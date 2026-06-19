package com.hiregrad.backend.service;

import com.hiregrad.backend.dto.AdminProfileDto;
import com.hiregrad.backend.admin.entity.AdminProfile;
import com.hiregrad.backend.admin.repository.AdminProfileRepository;
import com.hiregrad.backend.common.exception.ResourceNotFoundException;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminProfileService {

    private final AdminProfileRepository profileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AdminProfileDto getProfile(String username) {
        return profileRepository.findByUser_Username(username)
                .map(this::toDto)
                .orElseGet(() -> seedFromUser(username));
    }

    @Transactional
    public AdminProfileDto saveProfile(String username, AdminProfileDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + username));

        AdminProfile profile = profileRepository.findByUser_Username(username)
                .orElseGet(() -> AdminProfile.builder().user(user).build());

        apply(dto, profile);

        // keep the account's display name in sync (drives the sidebar / greeting)
        String fullName = (safe(dto.getFirstName()) + " " + safe(dto.getLastName())).trim();
        if (!fullName.isBlank()) {
            user.setFullName(fullName);
            userRepository.save(user);
        }
        return toDto(profileRepository.save(profile));
    }

    /** Brand-new admin: prefill name from the account so the form isn't empty. */
    private AdminProfileDto seedFromUser(String username) {
        AdminProfileDto d = new AdminProfileDto();
        d.setCountryCode("+91");
        userRepository.findByUsername(username).ifPresent(u -> {
            String[] parts = safe(u.getFullName()).trim().split("\\s+", 2);
            d.setFirstName(parts.length > 0 ? parts[0] : "");
            d.setLastName(parts.length > 1 ? parts[1] : "");
        });
        return d;
    }

    private void apply(AdminProfileDto d, AdminProfile p) {
        p.setPhotoUrl(d.getPhotoUrl());
        p.setFirstName(d.getFirstName());
        p.setLastName(d.getLastName());
        p.setDesignation(d.getDesignation());
        p.setInstituteEmail(d.getInstituteEmail());
        p.setCountryCode(d.getCountryCode());
        p.setPhone(d.getPhone());
        p.setOfficeLocation(d.getOfficeLocation());
        p.setCollege(d.getCollege());
        p.setDepartment(d.getDepartment());
        p.setStaffId(d.getStaffId());
    }

    private AdminProfileDto toDto(AdminProfile p) {
        return AdminProfileDto.builder()
                .photoUrl(p.getPhotoUrl())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .designation(p.getDesignation())
                .instituteEmail(p.getInstituteEmail())
                .countryCode(p.getCountryCode())
                .phone(p.getPhone())
                .officeLocation(p.getOfficeLocation())
                .college(p.getCollege())
                .department(p.getDepartment())
                .staffId(p.getStaffId())
                .build();
    }

    private static String safe(String s) { return s == null ? "" : s; }
}
