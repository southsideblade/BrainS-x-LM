#!/bin/bash

# Stop BrainS(x)LM Services

echo "Stopping BrainS(x)LM services..."

# Stop backend
if [ -f .backend.pid ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "✓ Backend stopped"
    fi
    rm .backend.pid
fi

# Stop frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "✓ Frontend stopped"
    fi
    rm .frontend.pid
fi

# Optional: Stop Docker containers
read -p "Stop Docker containers? (y/n): " stop_docker
if [ "$stop_docker" = "y" ]; then
    docker stop brainsxlm-postgres 2>/dev/null
    docker stop brainsxlm-weaviate 2>/dev/null
    echo "✓ Docker containers stopped"
fi

echo "All services stopped."
