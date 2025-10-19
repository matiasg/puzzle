#!/bin/bash

# Simple script to start a local HTTP server for the puzzle app

echo "Starting Puzzle App Server..."
echo "Open your browser and go to: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then Node.js http-server
if command -v python3 &> /dev/null; then
    echo "Using Python 3 server..."
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Using Python 2 server..."
    python -m SimpleHTTPServer 8000
elif command -v npx &> /dev/null; then
    echo "Using Node.js http-server..."
    npx http-server -p 8000
else
    echo "Error: No suitable HTTP server found."
    echo "Please install Python 3, Python 2, or Node.js"
    exit 1
fi