@echo off
echo 🐾 Setting up PawPal development environment...
echo.

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ and try again
    pause
    exit /b 1
)

echo ✅ Python and Node.js detected

:: Backend setup
echo.
echo 📦 Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install Python dependencies
    pause
    exit /b 1
)

:: Frontend setup
echo.
echo 📦 Installing Node.js dependencies...
cd frontend
npm install
if errorlevel 1 (
    echo ❌ Failed to install Node.js dependencies
    pause
    exit /b 1
)
cd ..

:: Database setup
echo.
echo 🗄️ Setting up database...
python manage.py migrate
if errorlevel 1 (
    echo ❌ Database migration failed
    echo Please check your database configuration in .env
    pause
    exit /b 1
)

echo.
echo ✅ Setup complete! 
echo.
echo 📋 Next steps:
echo 1. Copy .env.example to .env and fill in your values
echo 2. Copy frontend\.env.example to frontend\.env.local and fill in your values
echo 3. Make sure PostgreSQL is running (if using PostgreSQL)
echo 4. Create a superuser: python manage.py createsuperuser
echo.
echo 🚀 To start development:
echo Backend:  python manage.py runserver
echo Frontend: cd frontend ^&^& npm start
echo.
pause