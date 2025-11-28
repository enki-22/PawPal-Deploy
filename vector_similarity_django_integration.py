"""
Drop-in replacement for LightGBM prediction in Django views
Integrates vector similarity search with existing symptom checker
"""

from smart_triage_engine import SmartTriageEngine
import logging
import json
import os
import re

logger = logging.getLogger(__name__)

# Initialize engine (singleton - loads once)
_triage_engine = None

def get_triage_engine():
    """Get or initialize the triage engine"""
    global _triage_engine
    if _triage_engine is None:
        try:
            _triage_engine = SmartTriageEngine('knowledge_base_enhanced.csv')
            logger.info("✓ Vector Similarity Engine initialized successfully")
        except Exception as e:
            logger.error(f"✗ Failed to initialize engine: {e}")
            raise
    return _triage_engine


# RED FLAG SYMPTOMS (trigger emergency classification)
RED_FLAG_SYMPTOMS = {
    'seizures', 'collapse', 'unconscious', 'respiratory_distress', 
    'difficulty_breathing', 'pale_gums', 'blue_gums', 'cyanosis',
    'bleeding', 'blood_in_urine', 'bloody_diarrhea', 'paralysis',
    'shock', 'severe_dehydration', 'unresponsive', 'convulsions'
}


def extract_symptoms_from_text(user_notes, existing_symptoms=None):
    """
    Extract symptom keywords from free-text user_notes using symptom aliases.
    
    Args:
        user_notes: String of user-typed symptoms (e.g., "nosebleed, fainting")
        existing_symptoms: List of already-selected symptoms (optional)
    
    Returns:
        dict: {
            'extracted_symptoms': list of symptom codes found in text,
            'combined_symptoms': merged list (existing + extracted, deduplicated),
            'red_flags_detected': list of red flag symptoms found,
            'raw_matches': dict mapping found phrases to symptom codes
        }
    """
    if not user_notes or not user_notes.strip():
        return {
            'extracted_symptoms': [],
            'combined_symptoms': existing_symptoms or [],
            'red_flags_detected': [],
            'raw_matches': {}
        }
    
    # Load symptom aliases and all symptoms
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        with open(os.path.join(base_dir, 'symptom_aliases.json'), 'r', encoding='utf-8') as f:
            symptom_aliases = json.load(f)
        
        with open(os.path.join(base_dir, 'all_symptoms.json'), 'r', encoding='utf-8') as f:
            all_symptoms = json.load(f)
    except Exception as e:
        logger.error(f"Failed to load symptom data: {e}")
        return {
            'extracted_symptoms': [],
            'combined_symptoms': existing_symptoms or [],
            'red_flags_detected': [],
            'raw_matches': {}
        }
    
    # Normalize user input
    user_text = user_notes.lower().strip()
    extracted = set()
    raw_matches = {}
    
    # Build comprehensive search dictionary (aliases + direct symptoms)
    search_dict = dict(symptom_aliases)
    for symptom in all_symptoms:
        search_dict[symptom] = symptom
        # Also match symptom with underscores replaced by spaces
        search_dict[symptom.replace('_', ' ')] = symptom
    
    # Sort by length (longest first) to match multi-word phrases first
    sorted_phrases = sorted(search_dict.keys(), key=len, reverse=True)
    
    # Extract symptoms by matching phrases
    for phrase in sorted_phrases:
        # Use word boundaries to avoid partial matches
        pattern = r'\b' + re.escape(phrase) + r'\b'
        if re.search(pattern, user_text, re.IGNORECASE):
            symptom_code = search_dict[phrase]
            extracted.add(symptom_code)
            raw_matches[phrase] = symptom_code
            logger.info(f"Extracted symptom: '{phrase}' -> {symptom_code}")
    
    # Detect red flags
    red_flags_detected = [s for s in extracted if s in RED_FLAG_SYMPTOMS]
    
    # Combine with existing symptoms (deduplicate)
    existing_set = set(existing_symptoms or [])
    combined = list(existing_set | extracted)
    
    return {
        'extracted_symptoms': list(extracted),
        'combined_symptoms': combined,
        'red_flags_detected': red_flags_detected,
        'raw_matches': raw_matches
    }


def predict_with_vector_similarity(payload):
    """
    Replace LightGBM prediction with vector similarity search
    
    Args:
        payload: Same payload from symptom_checker_predict view
        {
          "species": "Dog",
          "symptoms_list": ["vomiting", "lethargy", "loss_of_appetite"],
          "severity": "moderate",
          "progression": "getting_worse",
          "emergency_data": {...},
          "user_notes": "nosebleed, fainting"  # HYBRID TRIAGE: User-typed symptoms
        }
    
    Returns:
        predictions: List of disease matches in same format as ML model
        triage_assessment: Urgency and reasoning
    """
    try:
        engine = get_triage_engine()
        
        # Extract required fields
        species = payload.get('species', 'Dog')
        symptoms_list = payload.get('symptoms_list', [])
        severity = payload.get('severity', 'moderate')
        progression = payload.get('progression', 'stable')
        emergency_data = payload.get('emergency_data', {})
        user_notes = payload.get('user_notes', '')
        
        # === HYBRID TRIAGE: Extract symptoms from user_notes ===
        extraction_result = extract_symptoms_from_text(user_notes, symptoms_list)
        
        if extraction_result['extracted_symptoms']:
            logger.info(f"🔍 HYBRID TRIAGE: Extracted {len(extraction_result['extracted_symptoms'])} symptoms from user_notes")
            logger.info(f"   Original: {symptoms_list}")
            logger.info(f"   Extracted: {extraction_result['extracted_symptoms']}")
            logger.info(f"   Combined: {extraction_result['combined_symptoms']}")
            
            if extraction_result['red_flags_detected']:
                logger.warning(f"🚨 RED FLAGS detected in user_notes: {extraction_result['red_flags_detected']}")
        
        # Use combined symptoms (checkbox + typed)
        symptoms_list = extraction_result['combined_symptoms']
        
        # Run vector similarity diagnosis
        result = engine.diagnose(
            species=species,
            symptoms=symptoms_list,
            top_n=5  # Return top 5 matches
        )
        
        # Convert to format expected by frontend
        predictions = []
        for match in result['top_matches']:
            predictions.append({
                'disease': match['disease'],
                'probability': match['match_percentage'] / 100,  # Convert % to 0-1
                'confidence': match['match_percentage'],
                'urgency': match['base_urgency'],
                'contagious': match['contagious'],
                'matched_symptoms': match['matched_symptoms'],
                'match_explanation': f"Matched {len(match['matched_symptoms'])} symptoms ({match['user_coverage']:.0f}% of your symptoms)",
                'total_symptoms': match['total_disease_symptoms']
            })
        
        # Build triage assessment (compatible with existing format)
        emergency_indicators = result['urgency'] in ['CRITICAL', 'HIGH']
        requires_immediate = result['urgency'] == 'CRITICAL'
        
        # Determine care timeline
        if result['urgency'] == 'CRITICAL':
            care_within = "IMMEDIATELY - Emergency Care"
        elif result['urgency'] == 'HIGH':
            care_within = "Within 2-4 hours"
        elif result['urgency'] == 'MODERATE':
            care_within = "24-48 hours"
        else:
            care_within = "2-7 days or monitor"
        
        triage_assessment = {
            'overall_urgency': result['urgency'].lower(),
            'emergency_indicators': emergency_indicators,
            'requires_immediate_care': requires_immediate,
            'requires_care_within': care_within,
            'urgency_reasoning': [result['urgency_reason']],
            'red_flags': result.get('red_flags', []),
            'engine_type': 'Vector Similarity Search',
            'explainable': True,
            'hybrid_triage_extraction': extraction_result if extraction_result['extracted_symptoms'] else None
        }
        
        # === EMERGENCY OVERRIDE: If red flags detected in typed symptoms ===
        if extraction_result['red_flags_detected']:
            triage_assessment['overall_urgency'] = 'critical'
            triage_assessment['emergency_indicators'] = True
            triage_assessment['requires_immediate_care'] = True
            triage_assessment['requires_care_within'] = 'IMMEDIATELY - Emergency Care'
            
            red_flag_text = ', '.join([s.replace('_', ' ').title() for s in extraction_result['red_flags_detected']])
            triage_assessment['red_flags'].insert(0, f"🚨 CRITICAL: {red_flag_text} mentioned in symptoms")
            triage_assessment['urgency_reasoning'].insert(0, f"Emergency condition detected: {red_flag_text}")
            
            logger.warning(f"🚨 EMERGENCY OVERRIDE: Red flags in user_notes upgraded urgency to CRITICAL")
        
        # Add emergency override if detected
        if result.get('action'):
            triage_assessment['emergency_action'] = result['action']
        
        return {
            'success': True,
            'predictions': predictions,
            'triage_assessment': triage_assessment,
            'engine': 'vector_similarity',
            'symptoms_analyzed': result['symptoms_analyzed'],
            'recommendation': result['recommendation'],
            'disclaimer': result['disclaimer']
        }
        
    except Exception as e:
        logger.error(f"Vector similarity prediction failed: {e}")
        raise


def format_soap_report_with_vector_similarity(result, cleaned_payload):
    """
    Format SOAP report using vector similarity results
    Compatible with existing SOAP report structure
    """
    predictions = result['predictions']
    triage = result['triage_assessment']
    
    # Subjective
    subjective_parts = []
    subjective_parts.append(f"Owner reports: {cleaned_payload.get('main_concern', 'General symptoms')}")
    subjective_parts.append(f"Symptoms: {', '.join(cleaned_payload.get('symptoms_list', []))}")
    subjective_parts.append(f"Duration: {cleaned_payload.get('duration_days', 'Unknown')} days")
    subjective_parts.append(f"Progression: {cleaned_payload.get('progression', 'Unknown')}")
    
    # Objective
    objective_parts = []
    objective_parts.append(f"Species: {cleaned_payload.get('species', 'Unknown')}")
    objective_parts.append(f"Symptom count: {len(cleaned_payload.get('symptoms_list', []))}")
    
    emergency_screen = cleaned_payload.get('emergency_data', {}).get('emergencyScreen', {})
    if emergency_screen:
        objective_parts.append("Emergency screening:")
        objective_parts.append(f"  - Respiration: {emergency_screen.get('respiration', 'Unknown')}")
        objective_parts.append(f"  - Alertness: {emergency_screen.get('alertness', 'Unknown')}")
        objective_parts.append(f"  - Perfusion: {emergency_screen.get('perfusion', 'Unknown')}")
        if emergency_screen.get('criticalSymptoms'):
            objective_parts.append(f"  - Critical symptoms: {', '.join(emergency_screen.get('criticalSymptoms', []))}")
    
    # Assessment
    assessment_parts = []
    assessment_parts.append(f"Urgency Level: {triage['overall_urgency'].upper()}")
    assessment_parts.append(f"Reasoning: {triage['urgency_reasoning'][0]}")
    
    if triage.get('red_flags'):
        assessment_parts.append(f"⚠️ Red Flags Detected: {', '.join(triage['red_flags'])}")
    
    assessment_parts.append("\nDifferential Diagnosis (by match confidence):")
    for i, pred in enumerate(predictions[:5], 1):
        assessment_parts.append(
            f"{i}. {pred['disease']} ({pred['confidence']:.1f}% match)"
        )
        assessment_parts.append(f"   - {pred['match_explanation']}")
        assessment_parts.append(f"   - Base urgency: {pred['urgency']}")
    
    # Plan
    plan_parts = []
    plan_parts.append(f"Recommended Action: {result['recommendation']}")
    plan_parts.append(f"Timeline: {triage['requires_care_within']}")
    
    if triage.get('emergency_action'):
        plan_parts.append(f"🚨 {triage['emergency_action']}")
    
    plan_parts.append("\nNext Steps:")
    if triage['requires_immediate_care']:
        plan_parts.append("1. Seek emergency veterinary care immediately")
        plan_parts.append("2. Call ahead to emergency clinic")
        plan_parts.append("3. Prepare pet for transport")
    elif triage['overall_urgency'] == 'high':
        plan_parts.append("1. Contact veterinarian for same-day appointment")
        plan_parts.append("2. Monitor symptoms closely")
        plan_parts.append("3. Prepare symptom timeline for vet")
    else:
        plan_parts.append("1. Schedule veterinary appointment")
        plan_parts.append("2. Monitor symptoms for changes")
        plan_parts.append("3. Document any progression")
    
    return {
        'subjective': '\n'.join(subjective_parts),
        'objective': '\n'.join(objective_parts),
        'assessment': '\n'.join(assessment_parts),
        'plan': '\n'.join(plan_parts),
        'generated_at': cleaned_payload.get('timestamp', 'Unknown')
    }
