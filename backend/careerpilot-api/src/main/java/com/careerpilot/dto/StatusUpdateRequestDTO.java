package com.careerpilot.dto;

import lombok.Data;

@Data
public class StatusUpdateRequestDTO {
    private String newStatus;
    private String note;
}
