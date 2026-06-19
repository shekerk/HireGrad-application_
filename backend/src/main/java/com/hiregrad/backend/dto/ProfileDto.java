package com.hiregrad.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileDto {
    private String photoUrl;

    @NotBlank(message = "First name is required")
    private String firstName;
    private String middleName;
    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Institute email is required")
    @Email(message = "Institute email is invalid")
    private String instituteEmail;
    @NotBlank(message = "Personal email is required")
    @Email(message = "Personal email is invalid")
    private String personalEmail;

    private String countryCode;
    @NotBlank(message = "Phone is required")
    private String phone;

    private String address;

    @Builder.Default
    private List<String> skills = new ArrayList<>();

    private String tenthSchool;
    private String tenthPercent;
    private String twelfthSchool;
    private String twelfthPercent;
    private String college;
    private String course;
    private String passOutYear;
    private String cgpa; // string from UI; service parses + validates 0–10

    private String resumeFileName;
    private String resumeLink;

    @Builder.Default
    private List<ProjectDto> projects = new ArrayList<>();

    @Builder.Default
    private List<LinkDto> links = new ArrayList<>();
}