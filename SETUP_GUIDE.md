# Setup & Run Guide

## Prerequisites
- Docker & Docker Compose installed
- Port 5173, 5432, 5000, 8080 available

## Quick Start (Docker - Recommended)

### Step 1: Clone and Navigate
```bash
cd carpooling-app
```

### Step 2: Start All Services
```bash
docker-compose up --build
```

**Wait for all services to start** (~2-3 minutes on first run)

Expected output:
```
✓ carpooling-postgres listening on 5432
✓ carpooling-ml listening on 5000
✓ carpooling-backend listening on 8080
✓ carpooling-frontend listening on 5173
```

### Step 3: Access the App
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **ML Service**: http://localhost:5000/health
- **Database**: localhost:5432 (user: postgres, pass: postgres)

### Step 4: Test Registration
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rider@test.com",
    "password": "password123",
    "fullName": "Test Rider",
    "phoneNumber": "+919876543210",
    "role": "RIDER"
  }'
```

## Local Development Setup

### Backend Only
```bash
cd backend

# Install dependencies
mvn clean install

# Run without Docker
mvn spring-boot:run
```

### ML Service Only
```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Flask app
python app.py
```

### Frontend Only
```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Testing APIs

### 1. Register as Rider
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rider1@test.com",
    "password": "password123",
    "fullName": "John Rider",
    "phoneNumber": "+919876543210",
    "role": "RIDER"
  }'
```

### 2. Register as Driver
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@test.com",
    "password": "password123",
    "fullName": "Mike Driver",
    "phoneNumber": "+919876543211",
    "role": "DRIVER"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver1@test.com",
    "password": "password123"
  }'
```

Save the token from response for next calls.

### 4. Create Ride (Driver)
```bash
curl -X POST http://localhost:8080/api/rides/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "startLatitude": 23.1815,
    "startLongitude": 79.9864,
    "startAddress": "Indore, MP",
    "endLatitude": 23.1925,
    "endLongitude": 79.9900,
    "endAddress": "Ahmedabad, GJ",
    "availableSeats": 3,
    "estimatedFare": 500.0,
    "departureTime": "2026-06-15T08:00:00"
  }'
```

### 5. Get Available Rides
```bash
curl -X GET http://localhost:8080/api/rides/available
```

### 6. Test ML Clustering
```bash
curl -X POST http://localhost:5000/api/cluster \
  -H "Content-Type: application/json" \
  -d '{
    "locations": [
      {"latitude": 23.1815, "longitude": 79.9864, "id": 1},
      {"latitude": 23.1925, "longitude": 79.9900, "id": 2},
      {"latitude": 23.1750, "longitude": 79.9800, "id": 3}
    ],
    "n_clusters": 2
  }'
```

## Docker Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f ml-service
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes
```bash
docker-compose down -v
```

### Rebuild Specific Service
```bash
docker-compose up --build backend
```

### Enter Database Container
```bash
docker exec -it carpooling-postgres psql -U postgres -d carpooling_db
```

### View Database
```
SELECT * FROM users;
SELECT * FROM rides;
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify postgres container
docker ps | grep postgres

# Check IP
docker inspect carpooling-postgres | grep IPAddress
```

### ML Service Not Responding
```bash
# Test health endpoint
curl http://localhost:5000/health

# Check logs
docker logs carpooling-ml
```

### Frontend Can't Connect
- Clear browser cache (Ctrl+Shift+Del)
- Check CORS in backend (application.yml)
- Verify API_BASE_URL in .env

## Environment Variables

### Backend (application.yml)
```yaml
spring.datasource.url=jdbc:postgresql://localhost:5432/carpooling_db
spring.datasource.username=postgres
spring.datasource.password=postgres
jwt.secret=your-32-char-secret-key
ml-service.url=http://localhost:5000
google.maps.api-key=YOUR_KEY
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_MAPS_KEY=YOUR_KEY
```

## Next Development Tasks

1. **Google Maps Integration**
   - Add Maps API key to .env
   - Display live tracking on map
   - Show pickup/dropoff markers

2. **Real-time Updates**
   - Implement WebSocket with Spring
   - Show live tracking updates
   - Driver location broadcast

3. **Admin Dashboard**
   - User management table
   - Ride monitoring
   - Analytics & charts
   - Complaint resolution

4. **Payment Integration**
   - Razorpay/Stripe API
   - Payment page
   - Transaction history

5. **Firebase Notifications**
   - Ride confirmation alerts
   - Driver arrival notifications
   - Complaint updates

## Performance Tips

- Use database indexes for frequently queried columns
- Implement pagination for large datasets
- Cache cluster results from ML service
- Use CDN for frontend static files
- Implement connection pooling in backend

## Security Checklist

- [ ] Change JWT secret in production
- [ ] Use HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Sanitize database queries
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for trusted domains

---

**Happy Coding!** 🚀
