package com.example.journeyGenie.initializer;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class OneTimeInitializer implements CommandLineRunner {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        // This method is called once when the application starts

//         Set default token value for users with null token
//         em.createQuery("UPDATE User u SET u.token = 0 WHERE u.token IS NULL")
//                .executeUpdate();
    }
}
