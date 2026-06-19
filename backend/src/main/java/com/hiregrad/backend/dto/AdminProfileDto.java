package com.hiregrad.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileDto {

    private String photoUrl;

    @NotBlank(message = "First name is required")
    private String firstName;
    @NotBlank(message = "Last name is required")
    private String lastName;

    private String designation;

    @NotBlank(message = "Institute email is required")
    @Email(message = "Institute email is invalid")
    private String instituteEmail;

    private String countryCode;
    private String phone;
    private String officeLocation;

    private String college;
    private String department;
    private String staffId;
}
