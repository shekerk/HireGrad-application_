package com.hiregrad.backend.job.entity;

import com.hiregrad.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "`jobs`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Job extends BaseEntity {

    private String companyName;
    private String jobTitle;
    private String location;
    private Long ctcPerYear;

    @Enumerated(EnumType.STRING)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    private WorkMode workMode;

    @Column(precision = 4, scale = 2)
    private BigDecimal minCgpa;

    @ElementCollection
    @CollectionTable(name = "`job_skills`", joinColumns = @JoinColumn(name = "`job_id`"))
    @Column(name = "`skill`")
    @Builder.Default
    private List<String> requiredSkills = new ArrayList<>();

    @Lob
    private String description;

    private LocalDateTime applicationDeadline;

    private String postedByUsername;
}