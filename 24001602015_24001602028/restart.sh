#!/bin/bash

echo "🔄 Restarting ShopSphere Project..."
echo ""

# Step 1: Stop all running services
echo "⏹️  Step 1: Stopping all services..."

# Stop Frontend
echo "   Stopping Frontend..."
pkill -f "react-scripts start" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Stop Backend
echo "   Stopping Backend..."
pkill -f "spring-boot:run" 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

sleep 2
echo "   ✅ All services stopped"
echo ""

# Step 2: Start Docker services
echo "🐳 Step 2: Starting Docker services (MySQL, Redis, Keycloak)..."
cd "$(dirname "$0")" || exit
docker-compose up -d mysql redis keycloak

echo "   ⏳ Waiting for Docker services to be ready..."
sleep 10

# Verify Docker services
if docker-compose ps | grep -q "Up"; then
    echo "   ✅ Docker services are running"
else
    echo "   ⚠️  Warning: Some Docker services may not be running"
fi
echo ""

# Step 3: Start Backend
echo "🔧 Step 3: Starting Backend..."
cd shopsphere-backend
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Start backend in background
mvn spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "   Backend starting (PID: $BACKEND_PID)"
echo "   ⏳ Waiting for backend to initialize..."
sleep 15

# Check if backend is running
if lsof -i:8080 > /dev/null 2>&1; then
    echo "   ✅ Backend is running on http://localhost:8080/api"
else
    echo "   ⚠️  Backend may not have started. Check backend.log for errors"
fi
echo ""

# Step 4: Start Frontend
echo "⚛️  Step 4: Starting Frontend..."
cd shopsphere-frontend

# Start frontend in background
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo "   Frontend starting (PID: $FRONTEND_PID)"
echo "   ⏳ Waiting for frontend to initialize..."
sleep 10

# Check if frontend is running
if lsof -i:3000 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on http://localhost:3000"
else
    echo "   ⚠️  Frontend may not have started. Check frontend.log for errors"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ShopSphere Project Restarted!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Service URLs:"
echo "   • Frontend:  http://localhost:3000"
echo "   • Backend:   http://localhost:8080/api"
echo "   • Keycloak:  http://localhost:8081"
echo ""
echo "📋 Process IDs:"
echo "   • Backend PID:  $BACKEND_PID"
echo "   • Frontend PID: $FRONTEND_PID"
echo ""
echo "💡 To stop all services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   docker-compose down"
echo ""
echo "📝 Logs:"
echo "   • Backend:  tail -f backend.log"
echo "   • Frontend: tail -f frontend.log"
echo ""

