# PawPal Development Setup

## Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed  
- PostgreSQL installed and running
- Git installed

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PawPal
   ```

2. **Create and activate virtual environment**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate
   
   # Linux/Mac
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Run the setup script**
   ```bash
   # Windows (after activating venv)
   setup.bat
   
   # Linux/Mac (after activating venv)
   chmod +x setup.sh
   ./setup.sh
   
   # Cross-platform (Python)
   python setup.py
   ```

4. **Configure environment variables**
   ```bash
   # Copy and edit backend environment
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   
   # Copy and edit frontend environment  
   cp frontend/.env.example frontend/.env.local
   # Edit .env.local with your API settings
   ```

5. **Create database and superuser**
   ```bash
   # Make sure PostgreSQL is running
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Start development servers**
   ```bash
   # Terminal 1: Backend (with venv activated)
   python manage.py runserver
   
   # Terminal 2: Frontend
   cd frontend && npm start
   ```

## Manual Setup (if scripts fail)

```bash
# 1. Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Install Python packages
pip install -r requirements.txt

# 3. Install Node packages
cd frontend
npm install
cd ..

# 4. Setup database
python manage.py migrate
python manage.py createsuperuser

# 5. Test servers
python manage.py runserver  # Backend
cd frontend && npm start    # Frontend
```

## Daily Development Workflow

```bash
# 1. Always activate venv first!
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Pull latest changes
git pull

# 3. Update dependencies (if needed)
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 4. Run migrations (if needed)
python manage.py migrate

# 5. Start development servers
python manage.py runserver  # Backend on :8000
cd frontend && npm start    # Frontend on :3000
```

## Important Notes

⚠️ **Always remember to activate your virtual environment first!**
```bash
venv\Scripts\activate  # You should see (venv) in your prompt
```

⚠️ **Required Environment Variables (.env file):**
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://username:password@localhost:5432/pawpaldb
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=
# Kaggle (optional if using Kaggle datasets via API)
KAGGLE_USERNAME=your-kaggle-username
KAGGLE_KEY=your-kaggle-api-key
ML_DATA_DIR=ml/data
ML_MODELS_DIR=ml/models
```

## ML: Symptom Checker (Random Forest)

1. Place Kaggle API credentials:
   - Preferred: Put `kaggle.json` in `%USERPROFILE%/.kaggle/kaggle.json` (Windows) or `~/.kaggle/kaggle.json`.
   - Alternative: set `KAGGLE_USERNAME` and `KAGGLE_KEY` in `.env`.

2. Download dataset(s):
   ```bash
   venv\Scripts\activate
   python -m ml.download --dataset <owner/dataset-slug> --dest %ML_DATA_DIR%
   ```

3. Train model:
   ```bash
   python -m ml.train --species dog,cat --input %ML_DATA_DIR% --output %ML_MODELS_DIR% --model symptom_rf.joblib
   ```

4. Run server and use the endpoint:
   - POST `/chatbot/predict/` with `{ "symptoms": "vomiting, lethargy", "species": "dog" }`.
   - Requires auth token as with other `/chatbot/*` APIs.

Notes:
- Start with one curated dataset; you can merge multiple later.
- Custom list support lets you augment/override labels specific to your product.

⚠️ **Database Setup:**
- Make sure PostgreSQL is installed and running
- Create database: `createdb pawpaldb` (or use pgAdmin)
- Update DATABASE_URL in .env with your credentials

## Troubleshooting

**ModuleNotFoundError**: Make sure venv is activated
**Database connection error**: Check PostgreSQL is running and DATABASE_URL is correct
**Port already in use**: Kill existing Django/React processes