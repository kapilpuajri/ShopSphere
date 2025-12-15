# ShopSphere Project Restart Guide

## Step-by-Step Instructions to Restart the Project

### Step 1: Stop All Running Services

#### Stop Frontend (React)
```bash
# Find and kill the React process
pkill -f "react-scripts start"
# Or find the process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### Stop Backend (Spring Boot)
```bash
# Find and kill the Spring Boot process
pkill -f "spring-boot:run"
# Or find the process on port 8080
lsof -ti:8080 | xargs kill -9
```

#### Stop Docker Services (Optional - only if you want to restart them)
```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
docker-compose down
```

---

### Step 2: Start Infrastructure Services (Docker)

```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project

# Start MySQL, Redis, and Keycloak
docker-compose up -d mysql redis keycloak

# Wait for services to be ready (about 10-15 seconds)
sleep 10

# Verify services are running
docker-compose ps
```

**Expected Output:**
- MySQL should be running on port 3307
- Redis should be running on port 6379
- Keycloak should be running on port 8081

---

### Step 3: Start Backend (Spring Boot)

#### Option A: Using the start script
```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
./start-backend.sh
```

#### Option B: Manual start
```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project/shopsphere-backend

# Set JAVA_HOME (if needed)
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Start Spring Boot
mvn spring-boot:run
```

**Wait for:** Backend to start (you'll see "Started ShopSphereApplication" in the console)
**Backend URL:** http://localhost:8080/api

---

### Step 4: Start Frontend (React)

Open a **NEW terminal window** (keep backend running in the first terminal):

```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project/shopsphere-frontend

# Install dependencies (only if needed)
npm install

# Start React development server
npm start
```

**Wait for:** Browser to automatically open at http://localhost:3000
**Frontend URL:** http://localhost:3000

---

### Step 5: Verify Everything is Working

#### Check Backend
```bash
# Test backend health
curl http://localhost:8080/api/products

# Should return a JSON array of products
```

#### Check Frontend
- Open browser: http://localhost:3000
- You should see the ShopSphere homepage
- Click on "Products" to see the product list
- Click on any product to see the product detail page

#### Check Docker Services
```bash
docker-compose ps
# All services should show "Up" status
```

---

## Quick Restart Script

You can also use the provided script to start everything:

```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
chmod +x start.sh
./start.sh
```

This will:
1. Start Docker services (MySQL, Redis, Keycloak)
2. Start Backend
3. Start Frontend

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 8080
lsof -i:8080

# Check what's using port 3000
lsof -i:3000

# Kill the process if needed
kill -9 <PID>
```

### Backend Won't Start
- Check if MySQL is running: `docker-compose ps`
- Check Java version: `java -version` (should be 17+)
- Check Maven: `mvn -version`

### Frontend Won't Start
- Check Node version: `node -v` (should be 18+)
- Clear node_modules and reinstall:
  ```bash
  cd shopsphere-frontend
  rm -rf node_modules package-lock.json
  npm install
  ```

### Database Connection Issues
- Verify MySQL is running: `docker-compose ps mysql`
- Check MySQL logs: `docker-compose logs mysql`
- Restart MySQL: `docker-compose restart mysql`

---

## Service URLs

Once everything is running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api
- **Keycloak:** http://localhost:8081
- **MySQL:** localhost:3307 (port 3307 externally, 3306 internally)
- **Redis:** localhost:6379

---

## Stopping Everything

To stop all services:

```bash
# Stop frontend (Ctrl+C in the terminal running npm start)
# Stop backend (Ctrl+C in the terminal running mvn spring-boot:run)

# Stop Docker services
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
docker-compose down
```

