package com.hiregrad.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplyRequest {

    @NotNull(message = "jobId is required")
    private Long jobId;

    /** Optional — resume filename submitted with the application. */
    private String resumeFileName;
}
