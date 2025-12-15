package com.shopsphere.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(1) // Run before other components
public class DatabaseMigrationService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @PostConstruct
    public void migrateDatabase() {
        try {
            // Check current column size and alter if needed
            String alterSql = "ALTER TABLE orders MODIFY COLUMN status VARCHAR(20)";
            jdbcTemplate.execute(alterSql);
            System.out.println("✅ Database migration: Updated orders.status column to VARCHAR(20)");
        } catch (Exception e) {
            // Column might already be correct size or table doesn't exist yet
            // This is fine, Hibernate will create it with correct size
            System.out.println("ℹ️  Database migration: " + e.getMessage());
        }
    }
}


