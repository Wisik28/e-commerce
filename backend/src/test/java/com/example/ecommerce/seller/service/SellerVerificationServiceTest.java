package com.example.ecommerce.seller.service;

import com.example.ecommerce.user.entity.User;
import com.example.ecommerce.user.repository.UserRepository;
import com.example.ecommerce.seller.entity.SellerProfile;
import com.example.ecommerce.seller.repository.SellerProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

@SpringBootTest
@ActiveProfiles("dev")
public class SellerVerificationServiceTest {

    @Autowired
    private SellerVerificationService sellerVerificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SellerProfileRepository sellerProfileRepository;

    @Test
    public void testApproveSeller() {
        System.out.println("--- STARTING TEST ---");
        try {
            User admin = userRepository.findByEmail("admin@ecommerce.com")
                    .orElseThrow(() -> new RuntimeException("Admin not found"));

            List<SellerProfile> profiles = sellerProfileRepository.findAll();
            SellerProfile pendingSeller = profiles.stream()
                    .filter(p -> p.getVerificationStatus().name().equals("PENDING"))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("No pending seller found"));

            System.out.println("Found pending seller store: " + pendingSeller.getStoreName() + " with ID: " + pendingSeller.getUserId());
            System.out.println("Admin ID: " + admin.getId());

            sellerVerificationService.approveSeller(pendingSeller.getUserId(), admin.getId());
            System.out.println("--- APPROVED SUCCESSFULLY ---");
        } catch (Exception e) {
            System.out.println("--- EXCEPTION CAUGHT ---");
            e.printStackTrace();
        }
    }
}
