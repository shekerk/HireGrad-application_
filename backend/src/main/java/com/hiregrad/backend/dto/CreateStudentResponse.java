package com.hiregrad.backend.dto;

import lombok.*;

/** Returned once on creation so the admin can hand the credentials to the student. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateStudentResponse {
    private Long id;
    private String username;
    private String fullName;
    private String rollNumber;
    private String instituteEmail;
    private String personalEmail;
    /** Plain-text temporary password — shown only in this response, stored hashed. */
    private String temporaryPassword;
}
