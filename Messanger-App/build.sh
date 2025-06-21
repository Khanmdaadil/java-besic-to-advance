#!/bin/bash

# Build script for the Secure Messenger Application

echo "Building Secure Messenger Application..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Java not found. Please install Java 17 or later."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "Maven not found. Please install Maven."
    exit 1
fi

# Check Java version
java_version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
echo "Using Java version: $java_version"

# Create directories for file uploads if they don't exist
mkdir -p uploads

# Build the application with Maven
echo "Compiling and packaging with Maven..."
mvn clean package

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "Run the application with: java -jar target/messanger-app-1.0.0.jar"
else
    echo "Build failed. Please check the logs for errors."
    exit 1
fi
