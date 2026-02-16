package com.ratelimiter.in.filter;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimiterFilter extends OncePerRequestFilter {

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final int REQUEST_LIMIT = 10; // Max 10 requests
    private static final int TIME_WINDOW_MINUTES = 5;

//    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
//            throws ServletException, IOException {
//
//        // 1. Identify the user by IP Address
//        String clientIp = request.getRemoteAddr();
//        String key = "rate_limit:" + clientIp;
//
//        // 2. Increment the count in Redis
//        Long currentCount = redisTemplate.opsForValue().increment(key);
//
//        if (currentCount != null && currentCount == 1) {
//            // Set expiration for the first request in the window
//            redisTemplate.expire(key, TIME_WINDOW_MINUTES, TimeUnit.MINUTES);
//        }
//
//        // 3. Check if limit exceeded
//        if (currentCount != null && currentCount > REQUEST_LIMIT) {
//            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
//            response.getWriter().write("Too many requests. Please try again in a minute.");
//            return; // Block the request
//        }
//
//        // 4. If under limit, continue to the next filter/controller
//        filterChain.doFilter(request, response);
//    }
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {

    // 1. Identification: Check for API Key first, then fallback to IP
    String apiKey = request.getHeader("X-API-KEY");
    String identifier = (apiKey != null) ? apiKey : request.getRemoteAddr();
    String key = "rate_limit:" + identifier;

    long currentTimeMillis = System.currentTimeMillis();
    long windowMillis = 60 * 1000; // 1 minute sliding window

    // 2. Cleanup: Remove old timestamps outside the 1-minute window
    redisTemplate.opsForZSet().removeRangeByScore(key, 0, currentTimeMillis - windowMillis);

    // 3. Count: Retrieve the number of requests in the current window
    Long currentCount = redisTemplate.opsForZSet().zCard(key);

    // 4. Threshold Check: Block if 10 or more requests exist
    if (currentCount != null && currentCount >= 10) {
        response.setStatus(429);
        response.setHeader("Content-Type", "text/plain");
        response.getWriter().write("Sliding Window Limit Exceeded for identifier: " + identifier);
        return;
    }

    // 5. Update: Add current request timestamp to the Sorted Set
    redisTemplate.opsForZSet().add(key, String.valueOf(currentTimeMillis), currentTimeMillis);

    // 6. Maintenance: Set key expiry so Redis cleans up automatically
    redisTemplate.expire(key, 10, TimeUnit.MINUTES);

    filterChain.doFilter(request, response);
}
}