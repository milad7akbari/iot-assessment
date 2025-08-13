# IoT Assessment Project

## Overview
This project implements an IoT data management system with the following components:

- **API Service (NestJS)**
- **Databases & Broker**

---

## Current Setup
At this stage, the project runs locally without Docker.  
Dependencies are installed at the **root level** and used by the `apps/api` service for now... .

---

## Requirements
- Node.js >= 24
- npm >= 11
- MongoDB
- RabbitMQ
- Docker

---

## Environment Variables
Create a `.env` file in `/`


---

## Running Locally (API only)
```bash
# Pull rabbitmq & mongo from docker
docker-compose up -d

# Install dependencies at root
npm install

# Start API service (development mode)
run dev:api

npm run dev:producer
