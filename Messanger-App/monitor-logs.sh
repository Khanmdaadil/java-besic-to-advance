#!/bin/bash

# Script to monitor logs from both backend and frontend

# Create a function to display colored logs
function print_log() {
  local timestamp=$(date '+%H:%M:%S')
  local source=$1
  local message=$2
  
  if [[ $source == "BACKEND" ]]; then
    # Blue for backend logs
    echo -e "\e[34m[$timestamp] [$source]\e[0m $message"
  elif [[ $source == "FRONTEND" ]]; then
    # Green for frontend logs
    echo -e "\e[32m[$timestamp] [$source]\e[0m $message"
  elif [[ $source == "DATABASE" ]]; then
    # Magenta for database logs
    echo -e "\e[35m[$timestamp] [$source]\e[0m $message"
  else
    # Default color
    echo -e "[$timestamp] [$source] $message"
  fi
}

# Function to tail logs in the background
function tail_log() {
  local file=$1
  local source=$2
  
  # Use tail -f to continuously monitor the log
  tail -f "$file" | while read -r line; do
    print_log "$source" "$line"
  done
}

echo "=== Starting Log Monitor ==="
echo "Press Ctrl+C to stop monitoring"
echo ""

# Check if the log files exist, create them if not
touch backend.log
mkdir -p frontend/logs
touch frontend/logs/dev-server.log

# Start tailing logs in the background
tail_log "backend.log" "BACKEND" &
backend_pid=$!

tail_log "frontend/logs/dev-server.log" "FRONTEND" &
frontend_pid=$!

# If Docker is running, also monitor PostgreSQL logs
docker_container_id=$(docker ps -qf "name=postgres")
if [ -n "$docker_container_id" ]; then
  docker logs -f "$docker_container_id" 2>&1 | while read -r line; do
    print_log "DATABASE" "$line"
  done &
  db_pid=$!
fi

# Handle clean exit with Ctrl+C
trap "kill $backend_pid $frontend_pid $db_pid 2>/dev/null; echo -e '\nLog monitoring stopped'; exit 0" SIGINT SIGTERM

# Keep script running
wait
