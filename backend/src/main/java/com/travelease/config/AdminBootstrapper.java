package com.travelease.config;

import com.travelease.entity.Role;
import com.travelease.entity.User;
import com.travelease.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

@Component
public class AdminBootstrapper implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapper.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${travelease.admin.bootstrap-username:}")
    private String bootstrapUsername;

    @Value("${travelease.admin.bootstrap-email:}")
    private String bootstrapEmail;

    @Value("${travelease.admin.bootstrap-password:}")
    private String bootstrapPassword;

    @Value("${travelease.admin.reset-password:false}")
    private boolean resetPassword;

    @Value("${travelease.admin.force-password-change:false}")
    private boolean forcePasswordChange;

    public AdminBootstrapper(UserRepository userRepository, PasswordEncoder passwordEncoder, Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        boolean adminExists = userRepository.existsByRole(Role.ROLE_ADMIN);

        if (!adminExists) {
            if (bootstrapUsername != null && !bootstrapUsername.isBlank()
                    && bootstrapEmail != null && !bootstrapEmail.isBlank()
                    && bootstrapPassword != null && !bootstrapPassword.isBlank()) {

                boolean strongPassword = PasswordPolicyValidator.isCompliant(bootstrapPassword);
                if (isProd && !strongPassword) {
                    throw new IllegalStateException(
                            "In production profile, TRAVELEASE_ADMIN_PASSWORD must satisfy the strong password policy."
                    );
                }

                boolean mustChange = forcePasswordChange || !strongPassword;
                User admin = new User(
                        bootstrapUsername.trim(),
                        bootstrapEmail.trim().toLowerCase(),
                        passwordEncoder.encode(bootstrapPassword),
                        Role.ROLE_ADMIN
                );
                admin.setActive(true);
                admin.setMustChangePassword(mustChange);
                userRepository.save(admin);

                log.info("Administrator account bootstrapped successfully: username='{}', email='{}', mustChangePassword={}",
                        admin.getDisplayName(), admin.getEmail(), mustChange);
            } else {
                log.info("No administrator account found in database. Set TRAVELEASE_ADMIN_USERNAME, " +
                        "TRAVELEASE_ADMIN_EMAIL, and TRAVELEASE_ADMIN_PASSWORD environment variables to initialize an administrator.");
            }
        } else if (resetPassword) {
            if (bootstrapPassword != null && !bootstrapPassword.isBlank()) {
                boolean strongPassword = PasswordPolicyValidator.isCompliant(bootstrapPassword);
                if (isProd && !strongPassword) {
                    throw new IllegalStateException(
                            "In production profile, TRAVELEASE_ADMIN_PASSWORD reset must satisfy the strong password policy."
                    );
                }

                boolean mustChange = forcePasswordChange || !strongPassword;
                java.util.List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);
                for (User admin : admins) {
                    if (bootstrapEmail == null || bootstrapEmail.isBlank() || admin.getEmail().equalsIgnoreCase(bootstrapEmail.trim())) {
                        admin.setPassword(passwordEncoder.encode(bootstrapPassword));
                        admin.setMustChangePassword(mustChange);
                        admin.setPasswordChangedAt(java.time.LocalDateTime.now());
                        userRepository.save(admin);
                        log.info("Administrator password reset applied for email='{}', mustChangePassword={}. Existing sessions revoked.",
                                admin.getEmail(), mustChange);
                    }
                }
            } else {
                log.warn("TRAVELEASE_ADMIN_RESET_PASSWORD was set to true, but TRAVELEASE_ADMIN_PASSWORD is empty. Admin password was not modified.");
            }
        }
    }
}
