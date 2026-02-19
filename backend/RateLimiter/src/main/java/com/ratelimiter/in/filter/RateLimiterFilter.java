package com.ratelimiter.in.filter;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.mail.internet.MimeMessage;
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

    @Autowired
    private MeterRegistry meterRegistry;

    @Autowired
    private JavaMailSender mailSender;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String identifier = request.getRemoteAddr();
        String key = "rate_limit:" + identifier;

        try {
            long currentTimeMillis = System.currentTimeMillis();
            long windowMillis = 60 * 1000;

            // 1. Sliding Window Logic
            redisTemplate.opsForZSet().removeRangeByScore(key, 0, currentTimeMillis - windowMillis);
            Long currentCount = redisTemplate.opsForZSet().zCard(key);

            // 2. Threshold Check (Blocked after 10)
            if (currentCount != null && currentCount >= 10) {
                meterRegistry.counter("rate_limit_blocked_requests_total", "client_ip", identifier).increment();

                // --- UPDATED COOLDOWN LOGIC ---
                String cooldownKey = "email_cooldown:" + identifier;
                // Using .get() is more reliable than .hasKey() for this logic
                String cooldownStatus = redisTemplate.opsForValue().get(cooldownKey);

                if (cooldownStatus == null) {
                    System.out.println("CRITICAL: Threshold hit for " + identifier + ". Sending Email...");
                    sendEmailAlert(identifier);

                    // Set cooldown for 10 minutes so Gmail doesn't block you
                    redisTemplate.opsForValue().set(cooldownKey, "active", 10, TimeUnit.MINUTES);
                    System.out.println("COOLDOWN STARTED: Next email for " + identifier + " allowed in 10 mins.");
                } else {
                    // This will show in your docker logs -f rate-limiter-api
                    System.out.println("SILENT BLOCK: IP " + identifier + " is blocked, but Email is on cooldown.");
                }

                response.setStatus(429);
                response.getWriter().write("Sliding Window Limit Exceeded for identifier: " + identifier);
                return;
            }

            // 3. Track successful (not blocked) requests
            redisTemplate.opsForZSet().add(key, String.valueOf(currentTimeMillis), currentTimeMillis);
            redisTemplate.expire(key, 10, TimeUnit.MINUTES);

        } catch (Exception e) {
            // --- CIRCUIT BREAKER ---
            System.err.println("CIRCUIT BREAKER: Redis is unavailable. Allowing request. Error: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private void sendEmailAlert(String ip) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo("varshafame336@gmail.com");
            helper.setSubject("⚠️ SECURITY ALERT: Rate Limit Exceeded");
            helper.setText("<h1>High Risk Activity</h1><p>Blocked IP: " + ip + "</p>", true);

            mailSender.send(message);
            System.out.println("SUCCESS: Email sent to Gmail servers.");
        } catch (Exception e) {
            // This is where your "Authentication failed" error used to show up
            System.err.println("EMAIL ERROR: Could not send alert. Details: " + e.getMessage());
        }
    }
}