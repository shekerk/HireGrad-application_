package com.hiregrad.backend.service;

import com.hiregrad.backend.dto.CreateStudentRequest;
import com.hiregrad.backend.dto.CreateStudentResponse;
import com.hiregrad.backend.common.exception.DuplicateResourceException;
import com.hiregrad.backend.common.exception.ResourceNotFoundException;
import com.hiregrad.backend.service.EmailService;
import com.hiregrad.backend.profile.entity.StudentProfile;
import com.hiregrad.backend.profile.repository.StudentProfileRepository;
import com.hiregrad.backend.user.entity.Role;
import com.hiregrad.backend.user.entity.User;
import com.hiregrad.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
public class StudentAccountService {

    private static final String PASSWORD_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // no ambiguous 0/O/1/l/I
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final StudentProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Admin provisions a student login. Stores the password as a BCrypt hash and flags the
     * account so the student is forced to set a new password on first login. The plain-text
     * temporary password is returned exactly once so the admin can hand it over.
     */
    @Transactional
    public CreateStudentResponse createStudent(CreateStudentRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            throw new DuplicateResourceException("Username '" + req.getUsername() + "' is already taken.");
        }

        if (profileRepository.existsByRollNumber(req.getRollNumber())) {
            throw new DuplicateResourceException("Roll number '" + req.getRollNumber() + "' is already assigned to another student.");
        }

        String tempPassword = (req.getTemporaryPassword() == null || req.getTemporaryPassword().isBlank())
                ? generateTemporaryPassword()
                : req.getTemporaryPassword();

        User user = userRepository.save(User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(tempPassword))
                .fullName(req.getUsername()) // student sets their real name later in My Profile
                .role(Role.STUDENT)
                .enabled(true)
                .mustChangePassword(true)
                .build());

        StudentProfile profile = profileRepository.save(StudentProfile.builder()
                .user(user)
                .instituteEmail(req.getInstituteEmail())
                .personalEmail(req.getPersonalEmail())
                .rollNumber(req.getRollNumber())
                .dateOfBirth(req.getDateOfBirth())
                .build());

        return CreateStudentResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .rollNumber(profile.getRollNumber())
                .instituteEmail(profile.getInstituteEmail())
                .personalEmail(profile.getPersonalEmail())
                .temporaryPassword(tempPassword)
                .build();
    }

    /** Student replaces the temporary password; clears the forced-change flag.
     *  On a first-login change, emails a welcome/confirmation to their personal email. */
    @Transactional
    public void changePassword(String username, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        boolean wasFirstLogin = user.isMustChangePassword();
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);

        if (wasFirstLogin) {
            String personalEmail = profileRepository.findByUser_Username(username)
                    .map(StudentProfile::getPersonalEmail)
                    .orElse(null);
            // async + failure-tolerant — never blocks or fails the password change
            emailService.sendPasswordChangedEmail(personalEmail, user.getFullName());
        }
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(PASSWORD_ALPHABET.charAt(RANDOM.nextInt(PASSWORD_ALPHABET.length())));
        }
        return sb.toString();
    }
}
