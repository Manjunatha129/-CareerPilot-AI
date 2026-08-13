package com.careerpilot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomMatchRequestDTO {
    private String jobTitle;
    private String companyName;
    private String jobDescription;
    private String location;
    private String workMode;
    private String experienceLevel;
}
