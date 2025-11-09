# Java 17 Configuration Complete ✅

## What Was Done

1. ✅ **Installed OpenJDK 17** via Homebrew
2. ✅ **Updated ~/.zshrc** to use Java 17
3. ✅ **Configured JAVA_HOME** to point to Java 17

## Current Configuration

- **Java Version**: 17.0.17 (OpenJDK)
- **Java Home**: `/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home`
- **Maven**: 3.9.11 (now using Java 17)

## Configuration in ~/.zshrc

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH
```

## How to Use

### Reload Your Shell
```bash
source ~/.zshrc
```

Or simply open a **new terminal window** - Java 17 will be used automatically.

### Verify Java 17 is Active
```bash
java -version
```

Should show: `openjdk version "17.0.17"`

### Verify Maven Uses Java 17
```bash
mvn -version
```

Should show: `Java version: 17.0.17`

## Start the Backend

Now you can start the Spring Boot application with Java 17:

```bash
cd shopsphere-backend
mvn spring-boot:run
```

## Optional: Create System Symlink (Requires Password)

If you want Java 17 to be recognized by `/usr/libexec/java_home`, you can create a symlink (requires your Mac password):

```bash
sudo ln -sfn /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk-17.jdk
```

After this, you can use:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

But the current configuration works without this step!

## Switch Between Java Versions

If you need to switch back to Java 25 temporarily:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 25)
export PATH=$JAVA_HOME/bin:$PATH
```

To switch back to Java 17:

```bash
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export PATH=$JAVA_HOME/bin:$PATH
```

---

✅ **Java 17 is now configured and ready for Spring Boot 3.2.0!**

