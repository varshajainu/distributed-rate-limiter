package com.ratelimiter.in.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.Map;

@Data
@AllArgsConstructor
public class StatsResponse {
    private Map<String, String> activeRequests;
    private long totalBlockedRequests;
}