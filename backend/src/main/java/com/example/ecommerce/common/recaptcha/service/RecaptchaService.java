package com.example.ecommerce.common.recaptcha.service;

import com.example.ecommerce.common.exception.UnauthorizedException;
import com.example.ecommerce.common.recaptcha.dto.RecaptchaResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

@Service
public class RecaptchaService {

    private static final Logger log = LoggerFactory.getLogger(RecaptchaService.class);
    private static final String VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${recaptcha.secret:}")
    private String secretKey;

    @Value("${recaptcha.enabled:false}")
    private boolean enabled;

    private final RestTemplate restTemplate = new RestTemplate();

    // method untuk validasi recaptcha
    public void validateRecaptcha(String recaptchaToken) {
        if (!enabled) {
            log.debug("reCAPTCHA validation is disabled. Skipping check.");
            return;
        }

        if (recaptchaToken == null || recaptchaToken.trim().isEmpty()) {
            log.warn("reCAPTCHA token is missing while reCAPTCHA is enabled.");
            throw new UnauthorizedException("reCAPTCHA token is required");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("secret", secretKey);
            body.add("response", recaptchaToken);

            HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(body, headers);

            RecaptchaResponseDto response = restTemplate.postForObject(VERIFY_URL, requestEntity, RecaptchaResponseDto.class);

            if (response == null || !response.isSuccess()) {
                log.error("reCAPTCHA verification failed. Error codes: {}", 
                        response != null ? response.getErrorCodes() : "null response");
                throw new UnauthorizedException("reCAPTCHA verification failed");
            }

            log.info("reCAPTCHA verification succeeded.");
        } catch (UnauthorizedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify reCAPTCHA token: {}", e.getMessage(), e);
            throw new UnauthorizedException("Failed to verify reCAPTCHA: " + e.getMessage());
        }
    }
}
