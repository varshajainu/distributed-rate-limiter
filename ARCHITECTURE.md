🏗️ System Architecture: Distributed Rate Limiter

1. Sliding Window Log Algorithm

To achieve high precision, this project avoids the "Fixed Window" trap (where traffic spikes at the edge of a minute can bypass limits).

Implementation: Uses Redis Sorted Sets (ZSET) where each request is a member with a timestamp score.

Logic: On every request, removeRangeByScore clears elements older than 60 seconds, and zCard counts the remaining valid requests.

2. Distributed Cooldown Gatekeeper

To protect the SMTP server from "Email Storms" during a DDoS attack, a cooldown layer was engineered.

Mechanism: Before sending an email, the system checks for an email_cooldown:{IP} key in Redis.

TTL (Time-to-Live): If no key exists, an email is sent and a new key is created with a 10-minute expiry.

Result: Ensures only one email is sent per 10-minute window per IP, preventing account lockout and authentication failures.

3. Resilience & Fault Tolerance

Circuit Breaker: The RateLimiterFilter is wrapped in a try-catch block that "fails-open." If Redis is unavailable, requests are allowed to pass to ensure application uptime.

Real-time Monitoring: The system exports custom metrics via Micrometer to Prometheus, allowing for external security auditing without impacting API performance.