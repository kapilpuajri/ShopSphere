#!/bin/bash

# Set JAVA_HOME explicitly
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Check if port 8080 is in use
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "⚠️  Port 8080 is already in use. Stopping existing process..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    sleep 2
    echo "✅ Port 8080 cleared"
fi

# Verify Java
echo ""
echo "Java version:"
java -version

echo ""
echo "JAVA_HOME: $JAVA_HOME"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/shopsphere-backend" || exit

# Start Spring Boot
echo "Starting Spring Boot application..."
echo "Backend will be available at: http://localhost:8080/api"
echo ""
mvn spring-boot:run

