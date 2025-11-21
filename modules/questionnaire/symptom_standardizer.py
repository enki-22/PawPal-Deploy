#!/usr/bin/env python3
"""
Symptom Standardizer - Loads from symptom_aliases_final.json
Maps user input to standardized symptom keys used in the CSV
"""

import json
import difflib
import os
from pathlib import Path

# Global cache for loaded aliases
_SYMPTOM_ALIASES = None

def load_symptom_aliases():
    """
    Load symptom aliases from JSON file (with caching)
    """
    global _SYMPTOM_ALIASES
    
    if _SYMPTOM_ALIASES is not None:
        return _SYMPTOM_ALIASES
    
    # Get the project root (PawPal directory)
    current_file = Path(__file__)
    project_root = current_file.parent.parent.parent  # modules/questionnaire/symptom_standardizer.py -> PawPal
    alias_file = project_root / 'symptom_aliases_final.json'
    
    # Fallback to current directory if not found
    if not alias_file.exists():
        alias_file = Path('symptom_aliases_final.json')
    
    try:
        with open(alias_file, 'r', encoding='utf-8') as f:
            _SYMPTOM_ALIASES = json.load(f)
        print(f"✓ Loaded {len(_SYMPTOM_ALIASES)} symptom aliases from {alias_file}")
    except FileNotFoundError:
        print(f"⚠ Warning: {alias_file} not found, using empty aliases")
        _SYMPTOM_ALIASES = {}
    except json.JSONDecodeError as e:
        print(f"❌ Error loading {alias_file}: {e}")
        _SYMPTOM_ALIASES = {}
    
    # Add common colloquial mappings for better UX
    _SYMPTOM_ALIASES.update({
        "throwing up": "vomiting",
        "puking": "vomiting",
        "upset stomach": "vomiting",
        "loose stool": "diarrhea",
        "runny poop": "diarrhea",
        "not eating": "loss_of_appetite",
        "won't eat": "loss_of_appetite",
        "breathing weird": "difficulty_breathing",
        "can't breathe": "difficulty_breathing",
        "stuffy nose": "nasal_discharge",
        "acting weird": "confusion",
        "seems sad": "lethargy",
        "not playing": "lethargy",
        "won't walk": "lethargy",
        "yelping": "pain",
    })
    
    return _SYMPTOM_ALIASES

def standardize_symptom(user_text):
    """
    Standardize user input to a canonical symptom key
    
    Args:
        user_text: Raw symptom text from user
    
    Returns:
        Standardized symptom key (from CSV/symptom_map)
    """
    # Normalize input
    user_text = user_text.lower().strip()
    
    # Load aliases (cached after first call)
    aliases = load_symptom_aliases()
    
    # 1. Check for exact match in aliases
    if user_text in aliases:
        return aliases[user_text]
    
    # 2. Try fuzzy matching against alias keys
    close_matches = difflib.get_close_matches(
        user_text, 
        aliases.keys(), 
        n=1, 
        cutoff=0.85  # High threshold for accuracy
    )
    
    if close_matches:
        matched_key = close_matches[0]
        return aliases[matched_key]
    
    # 3. Return original if no match found (preserve unknown symptoms)
    return user_text

def get_all_standard_symptoms():
    """
    Get all standard symptom keys (targets of aliases)
    """
    aliases = load_symptom_aliases()
    return set(aliases.values())

def reload_aliases():
    """
    Force reload of aliases from disk (for testing/updates)
    """
    global _SYMPTOM_ALIASES
    _SYMPTOM_ALIASES = None
    return load_symptom_aliases()
