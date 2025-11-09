# Backend Startup Guide

## ✅ Fixed Issues

1. **Port 8080 Conflict**: The startup script now automatically checks and clears port 8080 if it's in use
2. **JAVA_HOME**: Properly configured in the script
3. **Build Verification**: Backend compiles successfully

## 🚀 Starting the Backend

### Option 1: Use the Startup Script (Recommended)

```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
./start-backend.sh
```

The script will:
- ✅ Check and clear port 8080 if needed
- ✅ Set JAVA_HOME automatically
- ✅ Verify Java version
- ✅ Start the Spring Boot application

### Option 2: Manual Start

```bash
cd shopsphere-backend

# Set JAVA_HOME
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Check port 8080
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "Stopping process on port 8080..."
    lsof -ti:8080 | xargs kill -9
    sleep 2
fi

# Start backend
mvn spring-boot:run
```

## 🔍 Troubleshooting

### Port 8080 Already in Use

If you see: `Port 8080 was already in use`

**Solution 1**: Use the updated script (it handles this automatically)

**Solution 2**: Manually kill the process:
```bash
lsof -ti:8080 | xargs kill -9
```

**Solution 3**: Change the port in `application.yml`:
```yaml
server:
  port: 8081  # Change to different port
```

### JAVA_HOME Not Set

If you see: `JAVA_HOME environment variable is not defined`

**Solution**: The startup script sets this automatically. If running manually:
```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### Build Failures

If you see compilation errors:

1. **Clean and rebuild**:
   ```bash
   cd shopsphere-backend
   mvn clean install
   ```

2. **Check Java version**:
   ```bash
   java -version  # Should show 17.0.17
   mvn -version   # Should show Java 17.0.17
   ```

3. **Verify dependencies**:
   ```bash
   mvn dependency:resolve
   ```

## ✅ Success Indicators

When the backend starts successfully, you'll see:

```
Started ShopSphereApplication in X.XXX seconds
```

And the backend will be available at:
- **API Base URL**: http://localhost:8080/api
- **Products**: http://localhost:8080/api/products
- **Auth**: http://localhost:8080/api/auth/login

## 📝 Notes

- The backend will automatically:
  - Create the database if it doesn't exist
  - Create all tables via JPA
  - Seed sample products and associations
- First startup may take longer (database initialization)
- Check logs for any errors or warnings

---

**The startup script is now fixed and ready to use!** 🚀

