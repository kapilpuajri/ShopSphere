# ShopSphere Installation Guide

This guide will help you install and set up all required dependencies for the ShopSphere e-commerce application.

## Prerequisites

### Required Software

1. **Node.js and npm**
   - Download from: https://nodejs.org/
   - Recommended version: Node.js 18.x or higher
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Java Development Kit (JDK)**
   - Download from: https://adoptium.net/ or https://www.oracle.com/java/technologies/downloads/
   - Required version: JDK 17 or higher
   - Verify installation:
     ```bash
     java -version
     javac -version
     ```

3. **Apache Maven**
   - Download from: https://maven.apache.org/download.cgi
   - Recommended version: Maven 3.9.x or higher
   - Verify installation:
     ```bash
     mvn --version
     ```

4. **Docker and Docker Compose** (Recommended)
   - Docker Desktop: https://www.docker.com/products/docker-desktop
   - Verify installation:
     ```bash
     docker --version
     docker-compose --version
     ```

### Optional but Recommended

- **IDE**: IntelliJ IDEA, VS Code, or Eclipse for development
- **Git**: For version control
- **Postman**: For API testing

## Installation Steps

### Step 1: Install Node.js and npm

**macOS (using Homebrew):**
```bash
brew install node
```

**Windows:**
- Download the installer from https://nodejs.org/
- Run the installer and follow the setup wizard
- Restart your terminal/command prompt

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Install Java JDK 17

**macOS (using Homebrew):**
```bash
brew install openjdk@17
```

**Windows:**
- Download JDK 17 from https://adoptium.net/
- Run the installer
- Set JAVA_HOME environment variable:
  - Go to System Properties → Environment Variables
  - Add new variable: `JAVA_HOME` = `C:\Program Files\Java\jdk-17`
  - Add to PATH: `%JAVA_HOME%\bin`

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

### Step 3: Install Apache Maven

**macOS (using Homebrew):**
```bash
brew install maven
```

**Windows:**
1. Download Maven from https://maven.apache.org/download.cgi
2. Extract to `C:\Program Files\Apache\maven`
3. Add to PATH: `C:\Program Files\Apache\maven\bin`

**Linux (Ubuntu/Debian):**
```bash
sudo apt install maven
```

### Step 4: Install Docker Desktop

**macOS:**
- Download from https://www.docker.com/products/docker-desktop
- Install the .dmg file
- Launch Docker Desktop

**Windows:**
- Download from https://www.docker.com/products/docker-desktop
- Run the installer
- Restart your computer if prompted

**Linux:**
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Project Setup

### Step 1: Install Frontend Dependencies

```bash
cd shopsphere-frontend
npm install
```

This will install:
- React and React DOM
- Redux Toolkit and React Redux
- Tailwind CSS
- Swiper
- React Router DOM
- Axios
- And all other dependencies

### Step 2: Install Backend Dependencies

Maven will automatically download dependencies when you build the project:

```bash
cd shopsphere-backend
mvn clean install
```

This will download:
- Spring Boot dependencies
- Spring Data JPA
- Spring Security
- MySQL connector
- Redis dependencies
- JWT libraries
- Keycloak dependencies
- And all other Maven dependencies

### Step 3: Start Infrastructure Services

Using Docker Compose (Recommended):

```bash
# From project root
docker-compose up -d mysql redis keycloak
```

This starts:
- MySQL database on port 3306
- Redis cache on port 6379
- Keycloak on port 8081

### Step 4: Start the Application

**Backend:**
```bash
cd shopsphere-backend
mvn spring-boot:run
```

The backend will be available at: `http://localhost:8080`

**Frontend (in a new terminal):**
```bash
cd shopsphere-frontend
npm start
```

The frontend will be available at: `http://localhost:3000`

## Verification

### Check if everything is running:

1. **Backend Health Check:**
   ```bash
   curl http://localhost:8080/api/products
   ```

2. **Frontend:**
   - Open browser: http://localhost:3000
   - You should see the ShopSphere homepage

3. **Database:**
   ```bash
   docker exec -it shopsphere-mysql mysql -uroot -prootpassword -e "SHOW DATABASES;"
   ```

4. **Redis:**
   ```bash
   docker exec -it shopsphere-redis redis-cli ping
   # Should return: PONG
   ```

## Troubleshooting

### Port Already in Use

If you get port conflicts:

- **Port 3000 (Frontend):** Change in `package.json` scripts or use `PORT=3001 npm start`
- **Port 8080 (Backend):** Change in `application.yml` under `server.port`
- **Port 3306 (MySQL):** Change in `docker-compose.yml`
- **Port 6379 (Redis):** Change in `docker-compose.yml`

### Java Version Issues

Make sure you're using JDK 17:
```bash
java -version
# Should show: openjdk version "17.x.x"
```

### Maven Build Fails

Try cleaning and rebuilding:
```bash
cd shopsphere-backend
mvn clean
mvn install -U
```

### Docker Issues

If Docker containers fail to start:
```bash
# Check container logs
docker-compose logs mysql
docker-compose logs redis

# Restart containers
docker-compose restart
```

### Node Modules Issues

If frontend dependencies fail:
```bash
cd shopsphere-frontend
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

After successful installation:

1. The application will automatically seed sample products and associations
2. Visit http://localhost:3000 to see the application
3. Try viewing a product to see recommendations in action
4. Add items to cart to see cart-based recommendations

## Need Help?

- Check the main README.md for more information
- Review application logs for errors
- Ensure all services are running and accessible

Happy coding! 🚀

