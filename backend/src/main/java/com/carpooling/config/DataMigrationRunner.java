package com.carpooling.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationRunner.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Running data migration for M4...");
        try {
            int updated = jdbcTemplate.update("UPDATE ride_bookings SET status = 'ACCEPTED' WHERE status = 'CONFIRMED'");
            logger.info("Migrated {} bookings from CONFIRMED to ACCEPTED.", updated);
        } catch (Exception e) {
            logger.warn("Could not migrate booking statuses. This may be expected if the column type doesn't support the value yet or table is missing: {}", e.getMessage());
        }
    }
}
