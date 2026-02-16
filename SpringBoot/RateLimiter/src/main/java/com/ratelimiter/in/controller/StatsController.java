package com.ratelimiter.in.controller;

import com.ratelimiter.in.dto.StatsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.*;


import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private StringRedisTemplate redisTemplate;

    @GetMapping
    public StatsResponse getStats() {
        Set<String> keys = redisTemplate.keys("rate_limit:*");
        Map<String, String> stats = new HashMap<>();

        if (keys != null) {
            for (String key : keys) {
                // Updated: Use zCard to get the count of timestamps in the sliding window
                Long count = redisTemplate.opsForZSet().zCard(key);
                stats.put(key.replace("rate_limit:", ""), String.valueOf(count));
            }
        }

        // For now, we return active counts. You can add more complex logic later!
        return new StatsResponse(stats, stats.size());
    }

    @DeleteMapping("/reset")
    public void resetStats() {
        Set<String> keys = redisTemplate.keys("rate_limit:*");
        if (keys != null) {
            redisTemplate.delete(keys);
        }
    }
}