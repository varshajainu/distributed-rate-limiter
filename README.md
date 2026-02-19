🚀 Overview

A production-grade security middleware engineered to protect APIs from automated threats, brute-force attacks, and traffic surges. This project implements a Distributed Rate Limiter using the Sliding Window Log algorithm. By utilizing Redis Sorted Sets, it ensures precise request tracking and state consistency across horizontally scaled server instances. The system features a unique Redis-based Cooldown Gatekeeper to protect external SMTP services from alert saturation during high-velocity security incidents.

📖 Documentation

* [System Architecture](ARCHITECTURE.md) - Deep dive into the Sliding Window logic and Cooldown Gatekeeper.
* [Docker & Troubleshooting](DOCKER_GUIDE.md) - Comprehensive guide for environment setup and resolving SMTP/Network issues.

🛠️ Tech Stack

    •	Backend: Java 17, Spring Boot 3.4.2, Spring Data Redis.
    •	Frontend: Angular 19 (Control Flow syntax), Chart.js for real-time visualization.
    •	Infrastructure: Redis, Docker, Docker Compose, Prometheus, Grafana.

✨ Key Features

    •	Sliding Window Rate Limiting: Implements a high-precision rolling 60-second window to prevent boundary-case traffic spikes.
    •	Redis-Based Cooldown Gatekeeper: An automated incident response system that throttles SMTP security alerts (JavaMailSender) to one every 10 minutes, preventing email "storms" and authentication failures.
    •	Fault Tolerance (Circuit Breaker): Engineered to "fail-open" during Redis outages, maintaining application uptime while signaling a "Redis Offline" status on the dashboard.
    •	Observability Stack: Integrated Micrometer to export metrics to Prometheus with a custom Grafana dashboard for live threat monitoring.
    •	Admin Controls: Real-time blocklist management, Redis cache reset capabilities, and PDF security audit reporting.

📦 How to Run

    1.	Clone the repository.
    2.	Build the Backend: cd backend && mvn clean package.
    3.	Build the Frontend: cd frontend && ng build.
    4.	Launch via Docker: docker compose up --build.

