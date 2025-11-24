#!/bin/bash

echo "🚀 Starting ShopSphere E-commerce Application..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start infrastructure services
echo "📦 Starting infrastructure services (MySQL, Redis, Keycloak)..."
docker-compose up -d mysql redis keycloak

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Start backend
echo "🔧 Starting Spring Boot backend..."
cd shopsphere-backend
mvn spring-boot:run &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 15

# Start frontend
echo "⚛️  Starting React frontend..."
cd shopsphere-frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ ShopSphere is starting up!"
echo ""
echo "📍 Services:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:8080"
echo "   - Keycloak: http://localhost:8081"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait













