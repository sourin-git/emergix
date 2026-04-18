# Emergix 🚑

Emergix is a comprehensive, production-ready full-stack platform designed to handle emergency medical coordination, dispatch, tracking, and localized family notification systems in real-time.

## Key Architecture Design
- **Tier 1 (Presentation):** React Native (Expo) mobile tracking app + Next.js 14 Web Command Dashboard.
- **Tier 2 (Logic):** Multi-node Microservices (SOS endpoints, Tracker routes, Event-based Notification wrappers using Bull Queues) + Python FastAPI executing ChatGPT triage intelligence.
- **Tier 3 (Data):** Relational records via PostgreSQL (Prisma), internal fast unstructured logging via MongoDB (Mongoose), live location + geospatial ETAs caching internally utilizing Redis Pub/Sub adapters.

[Link to Base Architecture Diagram](https://emergix.in/architecture)

## Local Development Execution

We harness Turborepo to seamlessly orchestrate workspace workflows implicitly. Follow these initialization protocols:

1. **Hydrate Global Packages:**
   ```bash
   npm install
   ```

2. **Boot Tier-3 Core Data Base Containers (Optional if not using explicit cloud URIs):**
   Execute Docker internally to mock the 3 core database layers utilizing isolated `.env` instances linking natively out of `emergix-network`:
   ```bash
   docker-compose up -d postgres redis mongodb
   ```
   *(Or optionally bootstrap the entire architecture via `docker-compose up -d`)*

3. **Deploy Presentation Workspaces:**
   ```bash
   npm run dev
   ```

## Infrastructure Environment Tokens
Your application will intentionally fail compilation without securely hooking secrets explicitly out of version control arrays natively into a `.env` instance placed globally in your repository:

*   `DATABASE_URL` (PostgreSQL)
*   `MONGO_URI` (MongoDB)
*   `REDIS_URL` (Redis)
*   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`
*   `GOOGLE_MAPS_API_KEY`, `OPENWEATHER_API_KEY`, `OPENAI_API_KEY`
*   `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON configuration blob)
*   `JWT_SECRET`, `INTERNAL_SERVICE_KEY`

> Never commit your production `.env` securely protected natively by `.gitignore`.
