package com.hiregrad.backend.profile.repository;

import com.hiregrad.backend.profile.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {
    Optional<StudentProfile> findByUser_Username(String username);

    boolean existsByRollNumber(String rollNumber);
}