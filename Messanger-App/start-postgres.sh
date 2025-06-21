#!/bin/bash

echo "Starting PostgreSQL Docker container..."
docker-compose up -d

echo "Waiting for PostgreSQL to start..."
sleep 5

echo "PostgreSQL is now running at localhost:5432"
echo "Database: messenger"
echo "Username: postgres"
echo "Password: password"
