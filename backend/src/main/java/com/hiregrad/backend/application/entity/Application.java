package com.hiregrad.backend.application.entity;

import com.hiregrad.backend.common.entity.BaseEntity;
import com.hiregrad.backend.job.entity.Job;
import jakarta.persistence.*;
import lombok.*;

/**
 * A student's application to a single job posting. A student may apply to a job
 * only once, enforced by the unique constraint on (job_id, student_username).
 */
@Entity
@Table(
        name = "`applications`",
        uniqueConstraints = @UniqueConstraint(
                name = "`uk_application_job_student`",
                columnNames = {"`job_id`", "`student_username`"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "`job_id`", nullable = false)
    private Job job;

    /** The applicant's login username (also used as roll number). */
    @Column(name = "`student_username`", nullable = false)
    private String studentUsername;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    /** Filename of the resume submitted with this application. */
    private String resumeFileName;
}
