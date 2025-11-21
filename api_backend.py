#!/usr/bin/env python3
"""
FastAPI Backend for Smart Triage Engine
Replaces ML model with Vector Similarity Search
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
from smart_triage_engine import SmartTriageEngine

# ============================================================================
# Initialize FastAPI App
# ============================================================================

app = FastAPI(
    title="PawPal Smart Triage API",
    description="Vector Similarity Search for Pet Disease Diagnosis",
    version="2.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React/Vite dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize triage engine (singleton, loads once at startup)
triage_engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize the triage engine on startup"""
    global triage_engine
    try:
        triage_engine = SmartTriageEngine('overhaul_converted.csv')
        print("✓ Smart Triage Engine initialized successfully")
    except Exception as e:
        print(f"✗ Failed to initialize engine: {e}")
        raise

# ============================================================================
# Request/Response Models
# ============================================================================

class DiagnosisRequest(BaseModel):
    """Request model for diagnosis endpoint"""
    species: str = Field(..., description="Pet species (Dog, Cat, Rabbit, etc.)")
    symptoms: List[str] = Field(..., description="List of symptoms", min_items=1)
    top_n: Optional[int] = Field(5, description="Number of top matches to return", ge=1, le=10)
    
    class Config:
        schema_extra = {
            "example": {
                "species": "Dog",
                "symptoms": ["vomiting", "diarrhea", "lethargy"],
                "top_n": 5
            }
        }

class DiseaseMatch(BaseModel):
    """Model for individual disease match"""
    disease: str
    match_percentage: float
    jaccard_score: float
    matched_symptoms: List[str]
    missed_symptoms: List[str]
    user_coverage: float
    disease_coverage: float
    base_urgency: str
    contagious: bool
    total_disease_symptoms: int

class DiagnosisResponse(BaseModel):
    """Response model for diagnosis endpoint"""
    urgency: str
    urgency_reason: str
    red_flags: Optional[List[str]]
    action: Optional[str]
    top_matches: List[DiseaseMatch]
    species: str
    symptoms_analyzed: int
    recommendation: str
    disclaimer: str

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PawPal Smart Triage API",
        "version": "2.0.0",
        "engine": "Vector Similarity Search"
    }

@app.get("/api/species")
async def get_species():
    """Get list of supported species"""
    if not triage_engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    species_list = list(triage_engine.knowledge_base.diseases_by_species.keys())
    return {
        "species": species_list,
        "count": len(species_list)
    }

@app.get("/api/diseases/{species}")
async def get_diseases_for_species(species: str):
    """Get all diseases for a specific species"""
    if not triage_engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    diseases = triage_engine.knowledge_base.get_diseases_for_species(species)
    
    if not diseases:
        raise HTTPException(status_code=404, detail=f"No diseases found for species: {species}")
    
    return {
        "species": species,
        "diseases": [d['disease_name'] for d in diseases],
        "count": len(diseases)
    }

@app.post("/api/diagnose", response_model=DiagnosisResponse)
async def diagnose(request: DiagnosisRequest):
    """
    Main diagnosis endpoint
    
    Performs vector similarity search to match symptoms to diseases
    Returns urgency level and top disease matches with explanations
    """
    if not triage_engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    try:
        # Validate species
        valid_species = list(triage_engine.knowledge_base.diseases_by_species.keys())
        if request.species not in valid_species:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid species. Must be one of: {', '.join(valid_species)}"
            )
        
        # Perform diagnosis
        result = triage_engine.diagnose(
            species=request.species,
            symptoms=request.symptoms,
            top_n=request.top_n
        )
        
        # Check for errors in result
        if 'error' in result:
            raise HTTPException(status_code=400, detail=result['error'])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/urgency/critical-symptoms")
async def get_critical_symptoms():
    """Get list of critical/red flag symptoms"""
    from smart_triage_engine import CRITICAL_SYMPTOMS, HIGH_URGENCY_SYMPTOMS, MODERATE_URGENCY_SYMPTOMS
    
    return {
        "critical": list(CRITICAL_SYMPTOMS),
        "high": list(HIGH_URGENCY_SYMPTOMS),
        "moderate": list(MODERATE_URGENCY_SYMPTOMS)
    }

@app.get("/api/stats")
async def get_stats():
    """Get system statistics"""
    if not triage_engine:
        raise HTTPException(status_code=503, detail="Engine not initialized")
    
    total_diseases = len(triage_engine.knowledge_base.diseases)
    species_counts = {
        species: len(diseases)
        for species, diseases in triage_engine.knowledge_base.diseases_by_species.items()
    }
    
    return {
        "total_diseases": total_diseases,
        "species_counts": species_counts,
        "knowledge_base_file": "overhaul_converted.csv",
        "engine_type": "Vector Similarity Search (Jaccard)"
    }

# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "error": "Not found",
        "detail": str(exc.detail) if hasattr(exc, 'detail') else "Resource not found"
    }

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return {
        "error": "Internal server error",
        "detail": "An unexpected error occurred. Please try again."
    }

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    print("="*70)
    print("Starting PawPal Smart Triage API Server")
    print("="*70)
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/")
    print("="*70)
    
    uvicorn.run(
        "api_backend:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
