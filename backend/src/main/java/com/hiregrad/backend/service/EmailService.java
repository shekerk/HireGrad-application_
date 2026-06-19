package com.hiregrad.backend.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails. Runs asynchronously and is fully failure-tolerant:
 * if SMTP isn't configured (MAIL_USERNAME blank) or sending fails, it logs and
 * returns without affecting the caller (e.g. a password change still succeeds).
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${app.mail.from:HireGrad <no-reply@hiregrad.local>}")
    private String from;

    /** Welcome + confirmation email after a student sets their own password on first login. */
    @Async
    public void sendPasswordChangedEmail(String toEmail, String fullName) {
        if (mailUsername == null || mailUsername.isBlank()) {
            log.info("Mail not configured (MAIL_USERNAME blank) — skipping welcome email to {}", toEmail);
            return;
        }
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("No personal email on file — skipping welcome email.");
            return;
        }
        try {
            String name = (fullName == null || fullName.isBlank()) ? "there" : fullName;
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(toEmail);
            message.setSubject("Welcome to HireGrad 🎓 — your password is set");
            message.setText("""
                    Hi %s,

                    Welcome to HireGrad!

                    Your password has been changed successfully and your account is now fully active.
                    You can sign in any time with your username and your new password.

                    What's next:
                      - Complete your profile to unlock more eligible roles
                      - Browse the job dashboard and apply to openings
                      - Track your applications in real time

                    If you did not make this change, please contact your placement cell immediately.

                    - Team HireGrad
                    """.formatted(name));
            mailSender.send(message);
            log.info("Welcome / password-changed email sent to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", toEmail, e.getMessage());
        }
    }
}
