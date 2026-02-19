package com.ratelimiter.in.controller;

import com.ratelimiter.in.dto.StatsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
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
                // Returns count of requests in the current sliding window
                Long count = redisTemplate.opsForZSet().zCard(key);
                stats.put(key.replace("rate_limit:", ""), String.valueOf(count));
            }
        }
        return new StatsResponse(stats, stats.size());
    }

    // This is the endpoint your "Reset Redis" button calls
    @DeleteMapping("/reset")
    public ResponseEntity<Map<String, String>> resetStats() {
        // Clears only the Redis database used by the app
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Rate limit data cleared successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/redis-health")
    public ResponseEntity<Map<String, String>> checkRedisHealth() {
        Map<String, String> status = new HashMap<>();
        try {
            // Ping Redis to check if it's alive
            redisTemplate.getConnectionFactory().getConnection().ping();
            status.put("status", "UP");
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            // Circuit Breaker logic: Report it's down but don't crash the API
            status.put("status", "DOWN");
            return ResponseEntity.status(503).body(status);
        }
    }
}