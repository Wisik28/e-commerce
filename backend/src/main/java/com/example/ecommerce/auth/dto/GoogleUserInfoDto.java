package com.example.ecommerce.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
// DTO untuk menampung informasi user yang didapat dari Google OAuth
public class GoogleUserInfoDto {

    private String iss;
    private String sub;
    private String aud;
    private String email;

    // mapping field email_verified dari JSON ke variabel emailVerified
    @JsonProperty("email_verified")
    private String emailVerified;

    private String name;
    
    // mapping field picture dari JSON ke variabel picture
    private String picture;
}
