package com.example.ecommerce.common.recaptcha.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
// class untuk memberikan response dari DTO
public class RecaptchaResponseDto {

    private boolean success;

    @JsonProperty("challenge_ts")
    private String challengeTs;

    private String hostname;

    @JsonProperty("error-codes")
    private List<String> errorCodes;

    private Float score;

    private String action;
}
