-- Create database
--CREATE DATABASE carpooling_db;

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('RIDER', 'DRIVER', 'ADMIN');
CREATE TYPE ride_status AS ENUM ('PENDING', 'ONGOING', 'COMPLETED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'ACCEPTED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'REJECTED');
CREATE TYPE complaint_status AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    -- Use VARCHAR for role to avoid Postgres enum binding issues with Hibernate
    role VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    profile_photo_url TEXT,
    average_rating DECIMAL(3,2) DEFAULT 0.0,
    emergency_contact TEXT,
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rider Profiles Table
CREATE TABLE rider_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    home_latitude DECIMAL(10,6),
    home_longitude DECIMAL(10,6),
    home_address TEXT,
    work_latitude DECIMAL(10,6),
    work_longitude DECIMAL(10,6),
    work_address TEXT,
    total_rides_completed BIGINT DEFAULT 0,
    carbon_savings_kg DECIMAL(10,2) DEFAULT 0.0,
    fuel_savings_liters DECIMAL(10,2) DEFAULT 0.0,
    is_verified BOOLEAN DEFAULT false,
    identity_proof_url TEXT,
    preferences TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Driver Profiles Table
CREATE TABLE driver_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_model VARCHAR(100) NOT NULL,
    vehicle_capacity INT NOT NULL,
    vehicle_color VARCHAR(50),
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    license_photo_url TEXT,
    vehicle_photo_url TEXT,
    total_rides_completed BIGINT DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0.0,
    ongoing_commission DECIMAL(12,2) DEFAULT 0.0,
    is_online BOOLEAN DEFAULT false,
    current_latitude DECIMAL(10,6),
    current_longitude DECIMAL(10,6),
    total_completed_trips BIGINT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rides Table
CREATE TABLE rides (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL,
    start_latitude DECIMAL(10,6) NOT NULL,
    start_longitude DECIMAL(10,6) NOT NULL,
    start_address TEXT NOT NULL,
    end_latitude DECIMAL(10,6) NOT NULL,
    end_longitude DECIMAL(10,6) NOT NULL,
    end_address TEXT NOT NULL,
    available_seats INT NOT NULL,
    estimated_fare DECIMAL(10,2) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP,
    -- Use VARCHAR for status to match Hibernate string enum handling
    status VARCHAR(20) DEFAULT 'PENDING',
    optimized_route TEXT,
    route_geometry TEXT,
    total_distance DECIMAL(10,2),
    total_duration BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES driver_profiles(id) ON DELETE CASCADE
);

-- Ride Stops Table
CREATE TABLE ride_stops (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    stop_order INT NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,6) NOT NULL,
    longitude DECIMAL(10,6) NOT NULL,
    address TEXT NOT NULL,
    fare_from_origin DECIMAL(10,2) NOT NULL,
    stop_type VARCHAR(20),
    is_completed BOOLEAN DEFAULT false,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

-- Ride Bookings Table
CREATE TABLE ride_bookings (
    id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT NOT NULL,
    rider_id BIGINT NOT NULL,
    pickup_latitude DECIMAL(10,6) NOT NULL,
    pickup_longitude DECIMAL(10,6) NOT NULL,
    pickup_address TEXT NOT NULL,
    dropoff_latitude DECIMAL(10,6) NOT NULL,
    dropoff_longitude DECIMAL(10,6) NOT NULL,
    dropoff_address TEXT NOT NULL,
    seats_booked INT NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    pickup_stop_sequence INT DEFAULT 0 NOT NULL,
    dropoff_stop_sequence INT DEFAULT 0 NOT NULL,
    status booking_status DEFAULT 'PENDING',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
    FOREIGN KEY (rider_id) REFERENCES rider_profiles(id) ON DELETE CASCADE
);

-- Ratings Table
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    rater_id BIGINT NOT NULL,
    ratee_id BIGINT NOT NULL,
    ride_id BIGINT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE
);

-- Complaints Table
CREATE TABLE complaints (
    id BIGSERIAL PRIMARY KEY,
    complainant_id BIGINT NOT NULL,
    respondent_id BIGINT NOT NULL,
    ride_id BIGINT,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status complaint_status DEFAULT 'PENDING',
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    FOREIGN KEY (complainant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (respondent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_rides_driver ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_bookings_ride ON ride_bookings(ride_id);
CREATE INDEX idx_bookings_rider ON ride_bookings(rider_id);
CREATE INDEX idx_ride_stops_ride_order ON ride_stops(ride_id, stop_order);
CREATE INDEX idx_ratings_ratee ON ratings(ratee_id);
CREATE INDEX idx_complaints_status ON complaints(status);
