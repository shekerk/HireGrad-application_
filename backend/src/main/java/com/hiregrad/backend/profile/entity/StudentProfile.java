package com.hiregrad.backend.profile.entity;

import com.hiregrad.backend.common.entity.BaseEntity;
import com.hiregrad.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "`student_profiles`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`user_id`", unique = true, nullable = false)
    private User user;

    @Lob
    private String photoUrl; // base64 data URL or external URL

    private String firstName;
    private String middleName;
    private String lastName;

    private String instituteEmail;
    private String personalEmail;

    /** Admin-provisioned identity fields captured at account creation. */
    private String rollNumber;
    private LocalDate dateOfBirth;

    private String countryCode;
    private String phone;

    @Column(length = 500)
    private String address;

    @ElementCollection
    @CollectionTable(name = "`profile_skills`", joinColumns = @JoinColumn(name = "`profile_id`"))
    @Column(name = "`skill`")
    @Builder.Default
    private List<String> skills = new ArrayList<>();

    private String tenthSchool;
    private String tenthPercent;
    private String twelfthSchool;
    private String twelfthPercent;
    private String college;
    private String course;
    private String passOutYear;

    @Column(precision = 4, scale = 2)
    private BigDecimal cgpa;

    private String resumeFileName;
    @Column(length = 1000)
    private String resumeLink;

    @ElementCollection
    @CollectionTable(name = "`profile_projects`", joinColumns = @JoinColumn(name = "`profile_id`"))
    @Builder.Default
    private List<ProjectItem> projects = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "`profile_links`", joinColumns = @JoinColumn(name = "`profile_id`"))
    @Builder.Default
    private List<LinkItem> links = new ArrayList<>();
}