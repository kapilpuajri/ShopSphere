# ShopSphere Quick Start Guide

Get ShopSphere up and running in minutes!

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ Java 17+ installed (`java -version`)
- ✅ Maven 3.9+ installed (`mvn --version`)
- ✅ Docker Desktop running (`docker --version`)

## Quick Start (3 Steps)

### Step 1: Start Infrastructure

```bash
docker-compose up -d mysql redis keycloak
```

This starts:
- MySQL database
- Redis cache
- Keycloak authentication server

### Step 2: Start Backend

```bash
cd shopsphere-backend
mvn spring-boot:run
```

Wait for: `Started ShopSphereApplication in X seconds`

### Step 3: Start Frontend (New Terminal)

```bash
cd shopsphere-frontend
npm start
```

The browser should automatically open to `http://localhost:3000`

## Using the Start Script

Alternatively, use the provided script:

```bash
./start.sh
```

This will start everything automatically.

## Verify Installation

1. **Frontend**: Open http://localhost:3000 - You should see the ShopSphere homepage
2. **Backend API**: Open http://localhost:8080/api/products - You should see JSON product data
3. **Database**: Products are automatically seeded on first startup

## Test the Recommendation System

1. Navigate to Products page
2. Click on a phone (e.g., iPhone 15 Pro)
3. Scroll down to see recommended products:
   - Phone cases
   - Data cables
   - Screen protectors
   - Wireless chargers

4. Add a phone to cart
5. Go to Cart page
6. See additional recommendations based on cart items

## Troubleshooting

**Port conflicts?**
- Frontend: Change port in `package.json` or use `PORT=3001 npm start`
- Backend: Change `server.port` in `application.yml`

**Backend won't start?**
- Check if MySQL is running: `docker ps`
- Check logs: `docker-compose logs mysql`

**Frontend won't start?**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [INSTALLATION.md](INSTALLATION.md) for dependency installation
- Explore the codebase to understand the architecture

Happy shopping! 🛒

