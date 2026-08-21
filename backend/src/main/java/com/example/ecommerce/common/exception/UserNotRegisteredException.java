package com.example.ecommerce.common.exception;

import com.example.ecommerce.auth.dto.GoogleUserInfoDto;
import lombok.Getter;

@Getter
public class UserNotRegisteredException extends RuntimeException {
    private final GoogleUserInfoDto userInfo;

    // method exception ketika user masuk tetapi tidak melakukan registrasi
    public UserNotRegisteredException(GoogleUserInfoDto userInfo) {
        super("User is not registered");
        this.userInfo = userInfo;
    }
}
