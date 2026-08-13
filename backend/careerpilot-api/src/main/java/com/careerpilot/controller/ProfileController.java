package com.careerpilot.controller;

import com.careerpilot.dto.ApiResponse;
import com.careerpilot.dto.ProfileRequest;
import com.careerpilot.dto.ProfileResponse;
import com.careerpilot.entity.User;
import com.careerpilot.service.AuthService;
import com.careerpilot.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        ProfileResponse profile = profileService.getProfileByUserId(user.getId());
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ProfileRequest request
    ) {
        User user = authService.getUserByEmail(userDetails.getUsername());
        ProfileResponse profile = profileService.updateProfile(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(profile, "Career profile updated successfully"));
    }
}
