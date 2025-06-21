# Secure Messenger Application

A secure one-to-one messaging application with end-to-end encryption, secure voice/video calling, and encrypted file sharing capabilities.

## Features

### One-to-One Encrypted Chat
- End-to-end encryption using AES-256 for message security
- Perfect forward secrecy with Double Ratchet algorithm
- Real-time message delivery with read receipts
- Message history storage with optional self-destruct timer

### Secure Calling
- Voice and video call functionality using WebRTC
- SRTP for call encryption
- NAT traversal support with STUN/TURN servers
- Connection quality monitoring and adaptive streaming
- Automatic recovery from network issues

### File Handling
- Secure file transfer with encryption
- File size limitations and type restrictions
- Progress indicators for upload/download

### User Management
- Secure authentication with JWT
- Contact list management
- Online status indicators

## Architecture

- **Backend**: Java with Spring Boot
- **Database**: PostgreSQL with encryption
- **Messaging Protocol**: WebSocket with STOMP
- **Encryption**: AES-256 for symmetric encryption, RSA-2048 for asymmetric encryption

## Getting Started

### Prerequisites

- Java 17 or later
- Maven
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/messanger-app.git
cd messanger-app
```

2. Configure PostgreSQL:
```bash
# Create database
createdb messenger
```

3. Update application.properties with your database credentials:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/messenger
spring.datasource.username=your_username
spring.datasource.password=your_password
```

4. Build and run the application:
```bash
mvn clean install
java -jar target/messanger-app-1.0.0.jar
```

### Running the Application
1. Use the `start-app.sh` script to build and run both the backend and frontend:
   ```bash
   ./start-app.sh
   ```

   This script will:
   - Start PostgreSQL in a Docker container
   - Build and run the Spring Boot backend
   - Install dependencies and start the React frontend

2. Access the application at http://localhost:3000

### Manual Setup

#### Backend
1. Start the PostgreSQL database:
   ```bash
   ./start-postgres.sh
   ```

2. Build the backend:
   ```bash
   ./build.sh
   ```

3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```

#### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## API Documentation

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Authenticate and receive JWT token
- `POST /api/auth/logout`: Logout and update online status

### Messages

- `GET /api/messages/between/{user1Id}/{user2Id}`: Get messages between two users
- `GET /api/messages/unread/{userId}`: Get unread messages for a user
- `PUT /api/messages/{messageId}/read`: Mark a message as read
- `PUT /api/messages/{messageId}/self-destruct`: Set self-destruct timer for a message

### Files

- `POST /api/files/upload`: Upload a file
- `GET /api/files/download/{fileId}`: Download a file
- `GET /api/files/between/{senderId}/{recipientId}`: Get files shared between users
- `GET /api/files/sent/{userId}`: Get files sent by a user
- `GET /api/files/received/{userId}`: Get files received by a user

### Calls

- `POST /api/calls/initiate`: Initiate a call
- `PUT /api/calls/{callId}/answer`: Answer a call
- `PUT /api/calls/{callId}/end`: End a call
- `PUT /api/calls/{callId}/reject`: Reject a call
- `GET /api/calls/{callId}`: Get call details
- `GET /api/calls/between/{user1Id}/{user2Id}`: Get calls between two users
- `GET /api/calls/ongoing/{userId}`: Get ongoing calls for a user
- `GET /api/webrtc/ice-servers`: Get ICE server configuration

### Encryption and Key Exchange Endpoints

- `POST /api/encryption/key-exchange/init`: Initialize a new key exchange session
- `POST /api/encryption/key-exchange/complete`: Complete key exchange with another user
- `POST /api/encryption/message-key`: Get a message key for encryption/decryption
- `GET /api/encryption/public-key/{sessionId}`: Get the public key for a session

## WebSocket Endpoints

### Chat

- `/app/chat.send`: Send a private message
- `/app/chat.read`: Mark a message as read
- `/user/queue/messages`: Receive private messages
- `/user/queue/receipts`: Receive read receipts

### WebRTC Signaling

- `/app/call.offer`: Send WebRTC offer
- `/app/call.answer`: Send WebRTC answer
- `/app/call.ice`: Exchange ICE candidates
- `/app/call.hangup`: Signal call hang up
- `/user/queue/webrtc`: Receive WebRTC signals
- `/user/queue/calls`: Receive call status updates

## Security

- Perfect forward secrecy with key rotation
- TLS 1.2+ for all communications
- Double Ratchet protocol for secure key exchange
- Secure local data storage

## License

This project is licensed under the MIT License - see the LICENSE file for details.
