package com.example.ecommerce.common.config;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {
        Map<String, String> config = new HashMap<>();
        if (cloudName != null && !cloudName.trim().isEmpty()) {
            config.put("cloud_name", cloudName.trim());
        }
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            config.put("api_key", apiKey.trim());
        }
        if (apiSecret != null && !apiSecret.trim().isEmpty()) {
            config.put("api_secret", apiSecret.trim());
        }
        return new Cloudinary(config);
    }
}
