# Fix JAVA_HOME Error - Step by Step Guide

## Problem
Maven is not detecting JAVA_HOME even though Java 17 is installed.

## Solution 1: Set JAVA_HOME in Current Terminal (Immediate Fix)

Run these commands **in your current terminal**:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

Then verify:
```bash
echo $JAVA_HOME
java -version
mvn -version
```

## Solution 2: Use the Startup Script (Easiest)

I've created a script that sets JAVA_HOME automatically:

```bash
cd /Users/dikshachaudhri/Desktop/Ecommerce_project
./start-backend.sh
```

This script will:
1. Set JAVA_HOME automatically
2. Update PATH
3. Start the Spring Boot backend

## Solution 3: Fix .zshrc Configuration

If the .zshrc isn't working, let's verify and fix it:

### Check current .zshrc:
```bash
cat ~/.zshrc | grep JAVA_HOME
```

### If it's missing or incorrect, add these lines:
```bash
echo '' >> ~/.zshrc
echo '# Java 17 Configuration' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"' >> ~/.zshrc
echo 'export PATH="$JAVA_HOME/bin:$PATH"' >> ~/.zshrc
```

### Then reload:
```bash
source ~/.zshrc
```

## Solution 4: Verify Java Installation Path

Check if Java 17 is actually installed at the expected location:

```bash
ls -la /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
```

If this path doesn't exist, find the correct path:

```bash
find /opt/homebrew -name "java" -type f 2>/dev/null | grep openjdk@17 | head -1
```

## Solution 5: Set JAVA_HOME Directly in Maven Command

You can also set JAVA_HOME inline with the Maven command:

```bash
cd shopsphere-backend
JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home" mvn spring-boot:run
```

## Quick Test

Run this to verify everything works:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
cd /Users/dikshachaudhri/Desktop/Ecommerce_project/shopsphere-backend
mvn -version
```

You should see: `Java version: 17.0.17`

## Troubleshooting

### If JAVA_HOME is still not recognized:

1. **Check if the path exists:**
   ```bash
   ls -la "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
   ```

2. **Try alternative path:**
   ```bash
   export JAVA_HOME="/opt/homebrew/Cellar/openjdk@17/17.0.17/libexec/openjdk.jdk/Contents/Home"
   export PATH="$JAVA_HOME/bin:$PATH"
   ```

3. **Use java_home utility:**
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 17 2>/dev/null || echo "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home")
   export PATH="$JAVA_HOME/bin:$PATH"
   ```

## Recommended: Use the Startup Script

The easiest way is to use the provided script:

```bash
./start-backend.sh
```

This ensures JAVA_HOME is always set correctly before starting Maven.

