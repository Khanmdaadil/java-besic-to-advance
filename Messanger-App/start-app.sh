#!/bin/bash

# Exit on any error
set -e

echo "=== Starting Secure Messenger Application ==="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running. Please start Docker and try again."
  exit 1
fi

# 1. Start PostgreSQL database
echo "Starting PostgreSQL database..."
./start-postgres.sh

# 2. Build the backend
echo "Building backend..."
./build.sh

# 3. Start the backend in the background
echo "Starting Spring Boot backend..."
nohup mvn spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to initialize..."
while ! curl -s http://localhost:8080/actuator/health > /dev/null; do
  sleep 2
  echo "Waiting for backend..."
done
echo "Backend started successfully!"

# 4. Build and start the frontend
echo "Starting React frontend..."
cd frontend
npm install
npm start &
FRONTEND_PID=$!

echo ""
echo "=== Application started successfully! ==="
echo "Backend running on: http://localhost:8080"
echo "Frontend running on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to shut down all components"

# Handle shutting down both processes on exit
trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose -f ./docker-compose.yml down; echo 'All services stopped.'" SIGINT SIGTERM EXIT

# Keep script running
wait
