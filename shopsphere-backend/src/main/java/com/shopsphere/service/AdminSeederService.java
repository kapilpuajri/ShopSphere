package com.shopsphere.service;

import com.shopsphere.model.User;
import com.shopsphere.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(0) // Run first, before other seeders
public class AdminSeederService implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    public void run(String... args) {
        try {
            // Create Diksha admin
            createAdminIfNotExists("diksha@gmail.com", "Diksha", "diksha");
            
            // Create Kapil admin
            createAdminIfNotExists("kapil@gmail.com", "Kapil", "kapil");
            
            System.out.println("Admin users seeding completed!");
        } catch (Exception e) {
            System.err.println("Error during admin seeding: " + e.getMessage());
            e.printStackTrace();
            // Don't throw - allow app to continue starting
        }
    }
    
    private void createAdminIfNotExists(String email, String firstName, String password) {
        if (!userRepository.existsByEmail(email)) {
            User admin = new User();
            admin.setEmail(email);
            admin.setPassword(passwordEncoder.encode(password));
            admin.setFirstName(firstName);
            admin.setLastName("Admin");
            admin.setRole(User.Role.ADMIN);
            
            userRepository.save(admin);
            System.out.println("Created admin user: " + email);
        } else {
            // Update existing user to admin if not already admin
            userRepository.findByEmail(email).ifPresent(user -> {
                if (user.getRole() != User.Role.ADMIN) {
                    user.setRole(User.Role.ADMIN);
                    userRepository.save(user);
                    System.out.println("Updated user to admin: " + email);
                } else {
                    System.out.println("Admin user already exists: " + email);
                }
            });
        }
    }
}

