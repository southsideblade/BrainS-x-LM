#!/bin/bash

# BrainS(x)LM Production Deployment Script

echo "🧠 BrainS(x)LM Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists git; then
    print_error "Git is not installed"
    exit 1
fi
print_status "Git found"

if ! command_exists node; then
    print_error "Node.js is not installed"
    exit 1
fi
print_status "Node.js found: $(node -v)"

if ! command_exists python3; then
    print_error "Python 3 is not installed"
    exit 1
fi
print_status "Python found: $(python3 --version)"

if ! command_exists docker; then
    print_warning "Docker is not installed (optional for local testing)"
fi

# Setup environment
echo ""
echo "Setting up environment..."

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_warning "backend/.env not found. Creating from template..."
    cp .env.example backend/.env
    print_warning "Please update backend/.env with your actual values"
fi

if [ ! -f "frontend/.env.local" ]; then
    print_warning "frontend/.env.local not found. Creating from template..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > frontend/.env.local
fi

# Install dependencies
echo ""
echo "Installing dependencies..."

# Backend dependencies
echo "Installing backend dependencies..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
print_status "Backend dependencies installed"
cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
print_status "Frontend dependencies installed"
cd ..

# Database setup
echo ""
echo "Database setup..."
read -p "Do you want to use local PostgreSQL? (y/n): " use_local_db

if [ "$use_local_db" = "y" ]; then
    if command_exists docker; then
        echo "Starting PostgreSQL with Docker..."
        docker run -d \
            --name brainsxlm-postgres \
            -e POSTGRES_USER=brainsxlm \
            -e POSTGRES_PASSWORD=brainsxlm \
            -e POSTGRES_DB=brainsxlm \
            -p 5432:5432 \
            postgres:16-alpine
        print_status "PostgreSQL started"
        
        # Update backend .env
        sed -i '' 's|DATABASE_URL=.*|DATABASE_URL=postgresql://brainsxlm:brainsxlm@localhost:5432/brainsxlm|' backend/.env
    else
        print_error "Docker not found. Please install Docker or use a cloud database."
    fi
else
    print_warning "Please update DATABASE_URL in backend/.env with your database connection string"
fi

# Weaviate setup
echo ""
echo "Vector Database setup..."
read -p "Do you want to use Weaviate Cloud (recommended)? (y/n): " use_weaviate_cloud

if [ "$use_weaviate_cloud" = "y" ]; then
    echo "Please sign up at https://console.weaviate.cloud and create a cluster"
    read -p "Enter your Weaviate URL: " weaviate_url
    read -p "Enter your Weaviate API Key: " weaviate_key
    
    # Update backend .env
    sed -i '' "s|WEAVIATE_URL=.*|WEAVIATE_URL=$weaviate_url|" backend/.env
    sed -i '' "s|WEAVIATE_API_KEY=.*|WEAVIATE_API_KEY=$weaviate_key|" backend/.env
else
    if command_exists docker; then
        echo "Starting local Weaviate with Docker..."
        docker run -d \
            --name brainsxlm-weaviate \
            -p 8080:8080 \
            -p 50051:50051 \
            -e QUERY_DEFAULTS_LIMIT=25 \
            -e AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED=true \
            -e PERSISTENCE_DATA_PATH=/var/lib/weaviate \
            -e DEFAULT_VECTORIZER_MODULE=none \
            -e CLUSTER_HOSTNAME=node1 \
            semitechnologies/weaviate:1.26.3
        print_status "Weaviate started locally"
        
        # Update backend .env
        sed -i '' 's|WEAVIATE_URL=.*|WEAVIATE_URL=http://localhost:8080|' backend/.env
    else
        print_error "Docker not found. Please use Weaviate Cloud or install Docker."
    fi
fi

# OpenAI API Key
echo ""
read -p "Enter your OpenAI API Key (sk-...): " openai_key
sed -i '' "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$openai_key|" backend/.env

# Start services
echo ""
echo "Starting services..."

# Start backend
echo "Starting backend..."
cd backend
source venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
print_status "Backend started (PID: $BACKEND_PID)"
cd ..

# Start frontend
echo "Starting frontend..."
cd frontend
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
print_status "Frontend started (PID: $FRONTEND_PID)"
cd ..

# Save PIDs for shutdown
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Final instructions
echo ""
echo "================================"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo ""
echo "Services running:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:8000"
echo "  • API Docs: http://localhost:8000/docs"
echo ""
echo "To stop services, run: ./stop.sh"
echo ""
echo "For production deployment:"
echo "  1. Frontend: Deploy to Vercel"
echo "  2. Backend: Deploy to Railway or Render"
echo "  3. See README.md for detailed instructions"
echo ""
echo "Happy building! 🚀"
