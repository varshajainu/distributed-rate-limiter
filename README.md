Distributed Rate Limiter & Security Dashboard
🚀 Overview
A high-performance security tool built to protect APIs from brute-force attacks and traffic spikes. This project implements a Distributed Rate Limiter using the Fixed Window algorithm, backed by Redis for state consistency across multiple server instances.

🛠️ Tech Stack
Backend: Java 17, Spring Boot 3, Spring Data Redis.

Frontend: Angular 12+, Chart.js for real-time visualization.

Infrastructure: Redis (NoSQL), Docker, Docker Compose.

✨ Key Features
Distributed Rate Limiting: Identifies users by IP and restricts requests to 10 per minute.

Security Dashboard: Visualizes live traffic and identifies "High Risk" IPs via a dynamic blocklist.

Admin Controls: Features to reset the Redis cache and export security reports as PDFs.

📦 How to Run
Clone the repository.

Build the Backend: cd backend && mvn clean package.

Build the Frontend: cd frontend && ng build.

Launch via Docker: docker-compose up --build.