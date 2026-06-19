package com.hiregrad.backend.user.entity;

import com.hiregrad.backend.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "`users`")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password; // BCrypt hash — never plain text

    @Column(name = "`full_name`", nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private boolean enabled = true;

    /** True until the student changes the admin-issued temporary password on first login. */
    @Column(nullable = false)
    @Builder.Default
    private boolean mustChangePassword = false;
}