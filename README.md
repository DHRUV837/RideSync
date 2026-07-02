# AI-Powered Carpooling App 🚗

A premium final-year project demonstrating intelligent ride matching and route optimization using AI/ML algorithms.

## 🎯 Project Highlights

- **React Frontend**: Modern UI with real-time tracking
- **Spring Boot Backend**: RESTful APIs with JWT authentication
- **PostgreSQL Database**: Normalized schema for users, rides, bookings
- **Python ML Service**: K-Means clustering + Route optimization
- **Docker Deployment**: Complete containerized stack
- **Real-time Features**: Live tracking, notifications, ride matching

## 🏗️ Architecture

```
┌─────────────────┐
│   React UI      │
│   (Port 5173)   │
└────────┬────────┘
         │
┌────────▼────────┐      ┌──────────────────┐
│ Spring Boot API │──────│ PostgreSQL       │
│ (Port 8080)     │      │ (Port 5432)      │
└────────┬────────┘      └──────────────────┘
         │
┌────────▼────────────┐
│ Python ML Service   │
│ (Port 5000)         │
│ • K-Means Clustering│
│ • Route Optimization│
└─────────────────────┘
```

## 📋 Prerequisites

- **Docker** & **Docker Compose**
- **Java 17+** (for local backend development)
- **Node.js 18+** (for frontend)
- **Python 3.11+** (for ML service)
- **PostgreSQL 15** (optional, if not using Docker)

## 🚀 Quick Start with Docker

### 1. Start All Services

```bash
cd carpooling-app
docker-compose up --build
```

This will:
- Initialize PostgreSQL at `localhost:5432`
- Start ML Service at `http://localhost:5000`
- Start Spring Boot Backend at `http://localhost:8080/api`
- Start React Frontend at `http://localhost:5173`

### 2. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **ML Service**: http://localhost:5000

### 3. Stop Services

```bash
docker-compose down
```

## 🛠️ Local Development Setup

### Backend (Spring Boot)

```bash
cd backend

# Build
mvn clean install

# Run
mvn spring-boot:run
```

**Config**: Update `application.yml` for database and API keys.

### ML Service (Python Flask)

```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run
python app.py
```

### Frontend (React)

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## 📁 Project Structure

```
carpooling-app/
├── frontend/                  # React application
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── context/          # App state management
│   │   └── services/         # API services
│   └── package.json
├── backend/                   # Spring Boot application
│   ├── src/main/java/
│   │   └── com/carpooling/
│   │       ├── entity/       # JPA entities
│   │       ├── repository/   # Data access layer
│   │       ├── service/      # Business logic
│   │       ├── controller/   # REST endpoints
│   │       └── security/     # JWT authentication
│   ├── pom.xml
│   └── application.yml
├── ml-service/               # Python Flask service
│   ├── app.py               # Main Flask app
│   ├── requirements.txt
│   └── Dockerfile
├── database/                 # Database schema
│   └── schema.sql
├── docker-compose.yml
└── README.md
```

## 🔐 Authentication

### Register User

**POST** `/api/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phoneNumber": "+919876543210",
  "role": "RIDER"  // or "DRIVER"
}
```

### Login

**POST** `/api/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "userId": 1,
  "email": "user@example.com",
  "fullName": "John Doe",
  "role": "RIDER",
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

## 🚗 Core APIs

### Rides

#### Create Ride (Driver)

**POST** `/api/rides/create`

```json
{
  "startLatitude": 23.1815,
  "startLongitude": 79.9864,
  "startAddress": "Indore, MP",
  "endLatitude": 23.1925,
  "endLongitude": 79.9864,
  "endAddress": "Ahmedabad, GJ",
  "availableSeats": 3,
  "estimatedFare": 500.0,
  "departureTime": "2026-06-15T08:00:00"
}
```

#### Get Available Rides

**GET** `/api/rides/available`

#### Get Driver's Rides

**GET** `/api/rides/driver/{driverId}`

## 🤖 ML Service APIs

### K-Means Clustering

**POST** `/api/cluster`

```json
{
  "locations": [
    {"latitude": 23.1815, "longitude": 79.9864, "id": 1},
    {"latitude": 23.1925, "longitude": 79.9900, "id": 2}
  ],
  "n_clusters": 2
}
```

### Rider Matching

**POST** `/api/match-riders`

```json
{
  "driver": {
    "id": 1,
    "start": {"lat": 23.1815, "lon": 79.9864},
    "end": {"lat": 23.1925, "lon": 79.9900}
  },
  "riders": [
    {
      "id": 1,
      "pickup": {"lat": 23.1820, "lon": 79.9865},
      "dropoff": {"lat": 23.1920, "lon": 79.9900}
    }
  ]
}
```

### Route Optimization

**POST** `/api/optimize-route`

```json
{
  "locations": [
    {"id": "start", "lat": 23.1815, "lon": 79.9864},
    {"id": "stop1", "lat": 23.1820, "lon": 79.9865},
    {"id": "end", "lat": 23.1925, "lon": 79.9900}
  ]
}
```

## 📊 Database Schema

### Core Tables

- **users**: All users (riders, drivers, admins)
- **rider_profiles**: Rider-specific data
- **driver_profiles**: Driver-specific data
- **rides**: Ride information
- **ride_bookings**: Booking records
- **ratings**: User ratings/reviews
- **complaints**: Support tickets

See `database/schema.sql` for detailed structure.

## 🎓 Key Technologies & Concepts

| Component | Technology | Concept |
|-----------|-----------|---------|
| Frontend | React.js | Component-based UI |
| Backend | Spring Boot | MVC architecture |
| Database | PostgreSQL | RDBMS, normalization |
| Authentication | JWT | Stateless security |
| ML - Clustering | K-Means | Unsupervised learning |
| ML - Optimization | Nearest Neighbor | Route optimization |
| Maps | Google Maps API | Geolocation services |
| Deployment | Docker | Containerization |

## 🧪 Testing

### Backend Unit Tests

```bash
cd backend
mvn test
```

### ML Service Tests

```bash
cd ml-service
pytest tests/
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📈 Features Roadmap

- [x] User authentication (JWT)
- [x] Ride creation & booking
- [x] K-Means clustering
- [x] Route optimization (Nearest Neighbor)
- [ ] Real-time tracking (WebSocket)
- [ ] Firebase notifications
- [ ] Payment integration
- [ ] Analytics dashboard
- [ ] Admin panel
- [ ] Mobile app (React Native)

## 🔧 Configuration

### Backend (`application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/carpooling_db
    username: postgres
    password: postgres

jwt:
  secret: your-secret-key-32-chars-minimum
  expiration: 86400000  # 24 hours

ml-service:
  url: http://localhost:5000

google:
  maps:
    api-key: YOUR_GOOGLE_MAPS_API_KEY
```

### Frontend (`.env`)

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_GOOGLE_MAPS_KEY=YOUR_GOOGLE_MAPS_API_KEY
```

## 🚨 Troubleshooting

### Database connection error

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs carpooling-postgres
```

### ML Service not responding

```bash
# Verify Flask app
curl http://localhost:5000/health

# Check logs
docker logs carpooling-ml
```

### Frontend can't connect to backend

- Check CORS settings in Spring Boot
- Verify backend URL in frontend `.env`
- Check firewall settings

## 📚 API Documentation

Full Swagger docs available at: `http://localhost:8080/api/swagger-ui.html` (add Springdoc dependency if needed)

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🎤 Author

**Your Name** - Final Year Project for [Your College]

---

**Last Updated**: June 2026
**Version**: 1.0.0-alpha
