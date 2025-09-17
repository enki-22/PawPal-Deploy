# PawPal Development Setup

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PawPal
   ```

2. **Run the setup script**
   ```bash
   # Windows
   setup.bat
   
   # Linux/Mac
   ./setup.sh
   
   # Cross-platform (Python)
   python setup.py
   ```

3. **Configure environment variables**
   ```bash
   # Copy and edit backend environment
   cp .env.example .env
   
   # Copy and edit frontend environment
   cp frontend/.env.example frontend/.env.local
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   python manage.py runserver
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

## Manual Setup (if scripts fail)

```bash
# Backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# Frontend
cd frontend
npm install
cd ..
```



## Daily Development Workflow
```bash
# Always pull and update dependencies first
git pull
pip install -r requirements.txt
cd frontend && npm install && cd ..
python manage.py migrate

# Start development servers
python manage.py runserver  # Backend on :8000
cd frontend && npm start    # Frontend on :3000
```

## Before Pushing Code
```bash
# Test that everything works from scratch
git pull
pip install -r requirements.txt
cd frontend && npm install && cd ..
python manage.py migrate
python manage.py runserver  # Test backend
cd frontend && npm start    # Test frontend
```