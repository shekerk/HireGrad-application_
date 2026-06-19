package com.hiregrad.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.*;

import java.time.LocalDate;

/** Admin-supplied details to provision a new student login account. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStudentRequest {

    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Personal email is required")
    @Email(message = "Enter a valid personal email")
    private String personalEmail;

    @NotBlank(message = "Institute email is required")
    @Email(message = "Enter a valid institute email")
    private String instituteEmail;

    @NotBlank(message = "Roll number is required")
    private String rollNumber;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    /** Optional — the temporary password generated on the form. If blank, the server generates one. */
    private String temporaryPassword;
}
