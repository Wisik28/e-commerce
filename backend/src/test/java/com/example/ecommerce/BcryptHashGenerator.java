package com.example.ecommerce;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BcryptHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String rawPassword = args.length > 0 ? args[0] : "admin123";
        String hash = encoder.encode(rawPassword);
        System.out.println("BCrypt hash for '" + rawPassword + "':");
        System.out.println(hash);
    }
}
