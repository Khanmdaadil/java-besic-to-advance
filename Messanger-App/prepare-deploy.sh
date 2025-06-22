#!/bin/bash

# Script to build and prepare the application for deployment

set -e

echo "=== Building Secure Messenger Application for Deployment ==="

# 1. Build the backend
echo "Building backend..."
./build.sh

# 2. Create JAR file
echo "Creating executable JAR file..."
mvn package -DskipTests

# 3. Build the frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Copy frontend build to static resources
echo "Copying frontend files to backend resources..."
mkdir -p src/main/resources/static
cp -r frontend/build/* src/main/resources/static/

# 5. Rebuild the JAR with frontend included
echo "Rebuilding JAR with frontend included..."
mvn package -DskipTests

# 6. Create Docker compose file for production
cat > docker-compose-prod.yml << 'EOF'
version: '3'

services:
  postgres:
    image: postgres:13
    container_name: messenger-postgres
    environment:
      POSTGRES_DB: messenger
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

  messenger-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: messenger-app
    depends_on:
      - postgres
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/messenger
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
      - SPRING_JPA_HIBERNATE_DDL_AUTO=update
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
EOF

# 7. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM openjdk:11-jre-slim

WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
EOF

echo "=== Deployment files created successfully! ==="
echo "The application can be deployed using:"
echo "  docker-compose -f docker-compose-prod.yml up -d"
echo ""
echo "The following files were created:"
echo "- docker-compose-prod.yml"
echo "- Dockerfile"
echo "- target/messenger-app.jar (combined backend + frontend)"
