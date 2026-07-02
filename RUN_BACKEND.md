# Running the real Spring Boot backend with PostgreSQL

This project already includes a Spring Boot backend and a `docker-compose.yml` that starts:
- `postgres` (initialized with `database/schema.sql`)
- `ml-service` (ML Flask service)
- `backend` (Spring Boot app)
- `frontend` (Vite dev server)

Quick steps (recommended):

1) Start all services with Docker Compose (build images):

```powershell
# from project root
docker-compose up --build --remove-orphans
```

To run in background (detached):

```powershell
docker-compose up --build --remove-orphans -d
```

2) Verify services are running and healthy:

```powershell
docker-compose ps
docker-compose logs -f backend
```

3) Frontend config to use real backend:
- `frontend` uses `VITE_API_BASE_URL` (default http://localhost:8080/api).
- To ensure the frontend does not fall back to the mock auth, set `VITE_USE_MOCK_AUTH=false` when starting the frontend.

Example (env inline):

```powershell
# start frontend dev server with real backend
cd frontend
$env:VITE_USE_MOCK_AUTH = 'false'
npm run dev
```

(Or create an `.env` file in `frontend` with `VITE_USE_MOCK_AUTH=false` and optional `VITE_API_BASE_URL`.)

4) Run backend locally without Docker (optional):

```powershell
cd backend
mvn clean spring-boot:run
```

Make sure you have Java 17 and Maven installed. If running locally, update `backend/application.yml` or set env vars:

- `SPRING_DATASOURCE_URL` (e.g. `jdbc:postgresql://localhost:5432/carpooling_db`)
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`

5) Basic API sanity checks (example CURLs):

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"pass123","fullName":"Test User","phoneNumber":"+111111","role":"RIDER"}'

# Login
curl -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"pass123"}'

# Get available rides
curl http://localhost:8080/api/rides/available
```

Notes and troubleshooting:
- The `database/schema.sql` will initialize the Postgres container on first start (it includes `CREATE DATABASE carpooling_db` and tables/enums). If the DB already exists, the init script will be skipped.
- If Docker is not available on your machine, run the backend locally with Maven and start a local Postgres instance (Docker or native). Ensure DB exists and credentials match `application.yml` or env vars.
- CORS: controllers allow `http://localhost:5173` by default; update `@CrossOrigin` if you host the frontend elsewhere.

If you want, I can:
- start the containers here (if Docker is available in this environment),
- run the example curl checks and report results, or
- remove/disable `mock-backend.js` and update docs accordingly.

Tell me which of the above you'd like me to do next.