package com.example.ecommerce.common.security;

import com.example.ecommerce.common.exception.BusinessRuleException;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class RecaptchaService {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);
    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    private final String siteKey;
    private final String secretKey;
    private final boolean enabled;
    private final RestTemplate restTemplate;

    public RecaptchaService(
            @Value("${google.recaptcha.site-key}") String siteKey,
            @Value("${google.recaptcha.secret}") String secretKey,
            @Value("${google.recaptcha.enabled}") boolean enabled,
            RestTemplateBuilder restTemplateBuilder) {
        this.siteKey = siteKey;
        this.secretKey = secretKey;
        this.enabled = enabled;
        this.restTemplate = restTemplateBuilder.build();
    }

    public String getSiteKey() {
        return siteKey;
    }

    public boolean isEnabled() {
        return enabled;
    }


    public void validateToken(String token) {
        if (!enabled) {
            log.info("reCAPTCHA validation is disabled. Bypassing check.");
            return;
        }

        if (token == null || token.trim().isEmpty()) {
            throw new BusinessRuleException("reCAPTCHA token is required");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
            map.add("secret", secretKey);
            map.add("response", token);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(map, headers);

            RecaptchaResponse response = restTemplate.postForObject(VERIFY_URL, request, RecaptchaResponse.class);

            if (response == null || !response.isSuccess()) {
                log.warn("reCAPTCHA validation failed. Response: {}", response);
                throw new BusinessRuleException("reCAPTCHA validation failed. Please try again.");
            }

            log.info("reCAPTCHA validation succeeded.");
        } catch (BusinessRuleException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error occurred while validating reCAPTCHA token: {}", ex.getMessage(), ex);
            throw new BusinessRuleException("Internal error during reCAPTCHA verification");
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RecaptchaResponse {
        private boolean success;

        @JsonProperty("challenge_ts")
        private String challengeTs;

        private String hostname;

        @JsonProperty("error-codes")
        private List<String> errorCodes;
    }
}
