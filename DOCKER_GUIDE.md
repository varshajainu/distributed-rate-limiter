🐳 Docker Management & Troubleshooting

🛠️ Common Commands

    •	Start Background Services: docker compose up -d (Detached mode).
    •	Force Rebuild & Restart: docker compose up -d --build.
    •	Stop & Wipe Volumes: docker compose down -v.

🌐 Network Troubleshooting

If the Angular dashboard shows "Redis Offline" but the container is running:

    1.	Check Service Connectivity: Ensure the backend can reach the redis hostname.

                    docker exec -it rate-limiter-api ping redis

    2.	Verify Port Binding: Ensure port 6379 is not being blocked by a local Windows process.

    3.	Synchronize Build: If the "Cooldown" logic isn't reflecting, force a fresh build to clear the Docker cache.

📧 SMTP & Email Alert Issues

If you see "Authentication Failed" in the logs:

    •	The "Email Storm" Block: High-frequency alerts from automated runners (like Postman) can cause Gmail to temporarily block the App Password.
    
    •	Resolution:

        1.	Stop all active runners.
        2.	Wait 15 minutes for the Gmail session to reset.
        3.	The Redis Cooldown logic will automatically throttle alerts to one every 10 minutes once restarted.

