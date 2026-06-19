package com.hiregrad.backend.admin.entity;

import com.hiregrad.backend.common.entity.BaseEntity;
import com.hiregrad.backend.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

/** Profile details for a placement-cell admin (parallel to StudentProfile, but admin-focused). */
@Entity
@Table(name = "`admin_profiles`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfile extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "`user_id`", unique = true, nullable = false)
    private User user;

    @Lob
    private String photoUrl; // base64 data URL or external URL

    private String firstName;
    private String lastName;
    private String designation;     // e.g. Placement Officer, T&P Coordinator

    private String instituteEmail;
    private String countryCode;
    private String phone;
    private String officeLocation;  // optional — room / office

    private String college;         // institution name
    private String department;      // cell / department name
    private String staffId;         // optional
}
