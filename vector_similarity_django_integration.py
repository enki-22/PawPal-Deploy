"""
Drop-in replacement for LightGBM prediction in Django views
Integrates vector similarity search with existing symptom checker
"""

from smart_triage_engine import SmartTriageEngine
import logging
import json
import os
import re
import ast
from chatbot.utils import get_gemini_client
from modules.questionnaire.diagnosis_verifier import DiagnosisVerifier

logger = logging.getLogger(__name__)

# Initialize engine (singleton - loads once)
_triage_engine = None
_diagnosis_verifier = None

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


def get_diagnosis_verifier():
    """Get or initialize the diagnosis verifier"""
    global _diagnosis_verifier
    if _diagnosis_verifier is None:
        try:
            _diagnosis_verifier = DiagnosisVerifier('knowledge_base_enhanced.csv')
            logger.info("✓ Diagnosis Verifier initialized successfully")
        except Exception as e:
            logger.error(f"✗ Failed to initialize diagnosis verifier: {e}")
            # Don't raise - allow system to work without verifier
            logger.warning("⚠️ Continuing without diagnosis verification (OOD detection disabled)")
    return _diagnosis_verifier


# RED FLAG SYMPTOMS (trigger emergency classification)
RED_FLAG_SYMPTOMS = {
    'seizures', 'tremors', 'collapse', 'unconscious', 'respiratory_distress', 
    'difficulty_breathing', 'pale_gums', 'blue_gums', 'cyanosis',
    'bleeding', 'blood_in_urine', 'bloody_diarrhea', 'paralysis',
    'shock', 'severe_dehydration', 'unresponsive', 'convulsions'
}


def extract_symptoms_from_text(user_notes, existing_symptoms=None):
    """
    HYBRID EXTRACTION: Extract symptom keywords using Regex (Pass 1) + LLM-Assisted Vectors (Pass 2).
    
    Pass 1: Direct regex matching for exact English terms
    Pass 2: Gemini LLM translates/normalizes Tagalog/Taglish -> Vector search matches symptoms
    
    Args:
        user_notes: String of user-typed symptoms (e.g., "nosebleed, fainting" or "Nanginginig aso ko")
        existing_symptoms: List of already-selected symptoms (optional)
    
    Returns:
        dict: {
            'extracted_symptoms': list of symptom codes found in text,
            'combined_symptoms': merged list (existing + extracted, deduplicated),
            'red_flags_detected': list of red flag symptoms found,
            'raw_matches': dict mapping found phrases to symptom codes,
            'semantic_matches': dict of semantic matches with scores,
            'gemini_normalized': Gemini's normalized/translated output (for debugging)
        }
    """
    if not user_notes or not user_notes.strip():
        return {
            'extracted_symptoms': [],
            'combined_symptoms': existing_symptoms or [],
            'red_flags_detected': [],
            'raw_matches': {},
            'semantic_matches': {},
            'gemini_normalized': None
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
            'raw_matches': {},
            'semantic_matches': {},
            'gemini_normalized': None
        }
    
    # Normalize user input
    user_text = user_notes.lower().strip()
    
    # === NEGATION HANDLING (Safety): Filter out negated sentences ===
    # Split by sentence delimiters and check for negation keywords
    negation_keywords = {'no', 'not', 'wala', 'hindi', 'walang', "isn't", "hasn't", "doesn't", "won't"}
    
    sentences = re.split(r'[.!?;]', user_text)
    safe_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        
        # Check if sentence contains negation
        words = sentence.split()
        has_negation = any(word in negation_keywords for word in words)
        
        if has_negation:
            logger.info(f"⚠️  NEGATION DETECTED - Skipping sentence: '{sentence}'")
        else:
            safe_sentences.append(sentence)
    
    # Rejoin safe sentences
    filtered_text = ' '.join(safe_sentences)
    
    # If all text was negated, return empty
    if not filtered_text.strip():
        logger.info("All text was negated - no symptoms to extract")
        return {
            'extracted_symptoms': [],
            'combined_symptoms': existing_symptoms or [],
            'red_flags_detected': [],
            'raw_matches': {},
            'semantic_matches': {},
            'gemini_normalized': None
        }
    
    # ========================================================================
    # PASS 1: REGEX/KEYWORD EXTRACTION (High Precision)
    # ========================================================================
    regex_extracted = set()
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
        if re.search(pattern, filtered_text, re.IGNORECASE):
            symptom_code = search_dict[phrase]
            regex_extracted.add(symptom_code)
            raw_matches[phrase] = symptom_code
            logger.info(f"✅ PASS 1 (Regex): '{phrase}' -> {symptom_code}")
    
    # ========================================================================
    # PASS 2: LLM-ASSISTED EXTRACTION (Gemini + Vector Search)
    # ========================================================================
    semantic_extracted = set()
    semantic_matches = {}
    gemini_normalized_text = None
    
    try:
        # Step 1: Use Gemini to translate and normalize the text
        logger.info(f"🤖 PASS 2A: Sending to Gemini for translation/normalization...")
        logger.info(f"   Raw input: '{user_notes[:100]}...'")
        
        try:
            # Use centralized Gemini client (handles all model fallbacks)
            model = get_gemini_client()
            logger.info(f"   ✓ Successfully loaded Gemini model")
        except Exception as gemini_error:
            logger.warning(f"   ✗ Gemini client initialization failed: {gemini_error}")
            logger.warning("   Skipping LLM extraction, will use regex-only mode")
            model = None
        
        if model:
            # Create the prompt
            prompt = f"""Act as a veterinary terminologist. Analyze this user input: "{user_notes}"

1. Translate to English if in Tagalog/Taglish.
2. Identify specific veterinary symptoms.
3. Convert them to standard medical terms (e.g., "shaking" -> "tremors", "maputla labi" -> "pale gums").
4. Return ONLY a comma-separated list of these terms. If no symptoms, return "None".

Examples:
- "Nanginginig aso ko" -> "tremors"
- "maputla ang labi" -> "pale gums"
- "nagsusuka at matamlay" -> "vomiting, lethargy"

Your response (comma-separated list only):"""
            
            # Call Gemini API
            response = model.generate_content(prompt)
            
            # Safely extract text from response
            if hasattr(response, 'text') and response.text:
                gemini_output = response.text.strip()
                logger.info(f"   Gemini output: '{gemini_output}'")
                
                # Check if Gemini found symptoms (handle various "no symptom" responses)
                if gemini_output and gemini_output.lower() not in ['none', 'no symptoms', 'n/a', '']:
                    gemini_normalized_text = gemini_output
                    logger.info(f"   ✓ Valid symptoms detected")
                else:
                    logger.info("   Gemini found no symptoms")
            else:
                logger.warning("   ✗ Gemini response has no text content")
                logger.warning(f"   Response object: {response}")
        
        # Step 2: Use vector search on Gemini's cleaned output
        if gemini_normalized_text:
            engine = get_triage_engine()
            
            logger.info(f"🔍 PASS 2B: Processing Gemini output...")
            
            # Split by comma to handle multiple symptoms (avoids vector dilution)
            potential_symptoms = [s.strip() for s in gemini_normalized_text.split(',') if s.strip()]
            logger.info(f"   Found {len(potential_symptoms)} potential symptoms to process")
            
            for symptom_text in potential_symptoms:
                logger.info(f"   Processing: '{symptom_text}'")
                
                # OPTIMIZATION: Try direct lookup first (exact match)
                # Check if Gemini gave us an exact symptom code or alias
                direct_match = None
                symptom_lower = symptom_text.lower().strip()
                
                if symptom_lower in search_dict:
                    direct_match = search_dict[symptom_lower]
                    logger.info(f"   ✓ Direct match: '{symptom_text}' -> {direct_match}")
                
                if direct_match:
                    # Use direct match (perfect accuracy)
                    if direct_match not in regex_extracted:
                        semantic_extracted.add(direct_match)
                        semantic_matches[direct_match] = 1.0  # Perfect match score
                        logger.info(f"✅ PASS 2 (Direct): '{symptom_text}' -> {direct_match} (1.000)")
                    else:
                        logger.info(f"ℹ️  PASS 2: {direct_match} already found by regex, skipping")
                else:
                    # No direct match, use vector search on this specific symptom
                    # Use threshold=0.82 (safe for clean English terms from Gemini)
                    matches = engine.find_similar_symptoms(symptom_text, threshold=0.82)
                    
                    if matches:
                        for symptom_code, score in matches:
                            if symptom_code not in regex_extracted:
                                semantic_extracted.add(symptom_code)
                                semantic_matches[symptom_code] = score
                                logger.info(f"✅ PASS 2 (Vector): '{symptom_text}' -> {symptom_code} ({score:.3f})")
                            else:
                                logger.info(f"ℹ️  PASS 2: {symptom_code} already found by regex, skipping")
                    else:
                        logger.warning(f"   ⚠️  No matches for '{symptom_text}' (below 0.82 threshold)")
    
    except Exception as e:
        logger.warning(f"⚠️  LLM-assisted extraction failed: {e}. Using regex-only extraction.")
        logger.exception(e)  # Log full traceback for debugging
    
    # ========================================================================
    # MERGE RESULTS
    # ========================================================================
    extracted = regex_extracted | semantic_extracted
    
    logger.info(f"📊 HYBRID EXTRACTION SUMMARY:")
    logger.info(f"   Regex matches: {len(regex_extracted)}")
    logger.info(f"   Semantic matches: {len(semantic_extracted)}")
    logger.info(f"   Total unique: {len(extracted)}")
    
    # Detect red flags
    red_flags_detected = [s for s in extracted if s in RED_FLAG_SYMPTOMS]
    
    # Combine with existing symptoms (deduplicate)
    existing_set = set(existing_symptoms or [])
    combined = list(existing_set | extracted)
    
    return {
        'extracted_symptoms': list(extracted),
        'combined_symptoms': combined,
        'red_flags_detected': red_flags_detected,
        'raw_matches': raw_matches,
        'semantic_matches': semantic_matches,
        'gemini_normalized': gemini_normalized_text  # LLM-cleaned text for debugging
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
        
        # === SAFETY INTERCEPTOR: Check for red flags IMMEDIATELY ===
        # This takes ABSOLUTE PRECEDENCE over RAP system or any other urgency calculation
        safety_override_active = False
        safety_override_reason = []
        
        if extraction_result['extracted_symptoms']:
            logger.info(f"🔍 HYBRID TRIAGE: Extracted {len(extraction_result['extracted_symptoms'])} symptoms from user_notes")
            logger.info(f"   Original: {symptoms_list}")
            logger.info(f"   Extracted: {extraction_result['extracted_symptoms']}")
            logger.info(f"   Combined: {extraction_result['combined_symptoms']}")
        
        # === GEMINI TRANSLATION LOGGING: Show LLM normalization ===
        if extraction_result.get('gemini_normalized'):
            logger.info(f"🤖 GEMINI NORMALIZATION:")
            logger.info(f"   Raw input: '{user_notes[:100]}...'")
            logger.info(f"   Normalized: '{extraction_result['gemini_normalized']}'")
        
        # CRITICAL: Check if ANY extracted symptom is a red flag
        if extraction_result['red_flags_detected']:
            safety_override_active = True
            red_flag_names = [s.replace('_', ' ').title() for s in extraction_result['red_flags_detected']]
            safety_override_reason = red_flag_names
            
            logger.warning(f"{'='*70}")
            logger.warning(f"🚨 SAFETY INTERCEPTOR ACTIVATED 🚨")
            logger.warning(f"RED FLAGS detected in user-typed symptoms: {red_flag_names}")
            logger.warning(f"This OVERRIDES all other urgency calculations (including RAP)")
            logger.warning(f"Final urgency will be: CRITICAL")
            logger.warning(f"{'='*70}")
        
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
                'total_symptoms': match['total_disease_symptoms'],
                'is_external': False  # Default: all from database
            })
        
        # === MEMORY UPGRADE: Fetch Symptom Tracker History ===
        # This prevents the "Amnesia Problem" where AI forgets the pet has been sick for days
        context_data = {}
        pet_id = payload.get('pet_id')
        
        if pet_id:
            try:
                # Import here to avoid circular dependencies
                from chatbot.models import PetHealthTrend
                
                # Fetch the latest health trend for this pet
                latest_trend = PetHealthTrend.objects.filter(
                    pet_id=pet_id
                ).order_by('-analysis_date').first()
                
                if latest_trend:
                    # Build medical history context
                    medical_history = (
                        f"Recent Trend: {latest_trend.trend_analysis}. "
                        f"Prediction: {latest_trend.prediction}"
                    )
                    context_data['medical_history'] = medical_history
                    context_data['risk_score'] = latest_trend.risk_score
                    context_data['urgency_level'] = latest_trend.urgency_level
                    context_data['alert_needed'] = latest_trend.alert_needed
                    
                    logger.info(f"📋 Memory Upgrade: Loaded symptom tracker history for pet_id={pet_id}")
                    logger.info(f"   Risk Score: {latest_trend.risk_score}")
                    logger.info(f"   Urgency: {latest_trend.urgency_level}")
                    logger.info(f"   Trend: {latest_trend.trend_analysis[:100]}...")
                else:
                    logger.info(f"ℹ️  No symptom tracker history found for pet_id={pet_id}")
            except Exception as e:
                logger.warning(f"⚠️  Failed to fetch symptom tracker history: {e}")
                # Continue without history - don't fail the entire prediction
        
        # === DIAGNOSIS VERIFICATION LAYER: Gemini Safety Check for OOD Detection ===
        verification_result = None
        ood_detected = False
        verifier = get_diagnosis_verifier()
        
        if verifier:
            try:
                logger.info("🔍 Running Diagnosis Verification Layer (Gemini Safety Check)...")
                verification_result = verifier.verify_diagnosis(
                    user_symptoms=symptoms_list,
                    system_predictions=predictions,
                    species=species,
                    user_notes=user_notes,
                    context_data=context_data if context_data else None
                )
                
                logger.info(f"✓ Verification complete:")
                logger.info(f"   Agreement: {verification_result['agreement']}")
                logger.info(f"   Risk Assessment: {verification_result['risk_assessment']}")
                logger.info(f"   Alternative Diagnosis: {verification_result['alternative_diagnosis']}")
                
                # === TWO-STAGE RETRIEVAL & RERANKING: Safe Reranking Logic ===
                if not verification_result['agreement']:
                    alt_diag = verification_result['alternative_diagnosis']
                    found_match = False
                    
                    # Stage 1: Attempt Reranking (Context Fix)
                    # Check if the alternative_diagnosis suggested by Gemini is in the existing predictions list
                    if alt_diag and alt_diag.get('name'):
                        alt_disease_name = alt_diag['name']
                        
                        # Search for matching disease in predictions (case-insensitive, flexible matching)
                        for idx, pred in enumerate(predictions):
                            pred_disease = pred.get('disease', '').strip()
                            # Remove any prefixes like "⚠️ Potential Match: " or "⚠️ AI Corrected: " for comparison
                            pred_disease_clean = pred_disease.replace('⚠️ Potential Match: ', '').replace('⚠️ AI Corrected: ', '').replace('✅ Verified Match: ', '').replace('⚠️ AI Assessment: ', '').strip()
                            
                            # Check for exact match or close match (handles variations)
                            if (pred_disease_clean.lower() == alt_disease_name.lower() or
                                alt_disease_name.lower() in pred_disease_clean.lower() or
                                pred_disease_clean.lower() in alt_disease_name.lower()):
                                
                                found_match = True
                                original_probability = pred.get('probability', 0.0)
                                original_confidence = pred.get('confidence', 0.0)
                                original_pct = original_confidence if original_confidence > 0 else (original_probability * 100)
                                
                                # Check if this is a low-confidence match (Retrieval Miss) or good match (Rerank)
                                if original_probability < 0.50:
                                    # Low confidence: Treat as "Retrieval Miss" - Create new synthetic prediction
                                    logger.info(f"{'='*70}")
                                    logger.info(f"🔧 RETRIEVAL MISS (Low Confidence): Found in predictions but weak match")
                                    logger.info(f"   Disease: {alt_disease_name}")
                                    logger.info(f"   Original position: {idx + 1}")
                                    logger.info(f"   Original confidence: {original_pct:.1f}% (below 50% threshold)")
                                    logger.info(f"   Reasoning: {verification_result['reasoning']}")
                                    logger.info(f"{'='*70}")
                                    
                                    # Remove the original low-confidence object
                                    predictions.pop(idx)
                                    
                                    # Extract risk assessment and map to system urgency levels
                                    risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                                    retrieval_urgency = risk_assessment.upper()  # CRITICAL, HIGH, MODERATE, LOW
                                    
                                    # Normalize to system's urgency format (lowercase for consistency)
                                    urgency_map = {
                                        'CRITICAL': 'critical',
                                        'HIGH': 'high',
                                        'MODERATE': 'moderate',
                                        'LOW': 'low'
                                    }
                                    retrieval_urgency_normalized = urgency_map.get(retrieval_urgency, 'high')
                                    
                                    # Create new synthetic prediction object (AI Assessment)
                                    ai_assessment_prediction = {
                                        'disease': f"⚠️ AI Assessment: {alt_disease_name}",
                                        'probability': 0.95,
                                        'confidence': 95.0,
                                        'urgency': retrieval_urgency_normalized,
                                        'contagious': False,  # Will be populated from database if needed
                                        'matched_symptoms': pred.get('matched_symptoms', symptoms_list[:5] if symptoms_list else []),
                                        'match_explanation': f"Hybrid Analysis: While the database match was weak ({original_pct:.1f}%), the AI identified strong clinical indicators: {verification_result['reasoning']}",
                                        'total_symptoms': pred.get('total_symptoms', len(symptoms_list) if symptoms_list else 0),
                                        'is_external': False,  # This is a valid database entry
                                        'verification_reasoning': verification_result['reasoning'],
                                        'risk_assessment': risk_assessment,
                                        'injected': True,  # Flag for debugging
                                        'original_confidence': original_pct  # Preserve original for transparency
                                    }
                                    
                                    # Insert at index 0 (top of the list)
                                    predictions.insert(0, ai_assessment_prediction)
                                    logger.info(f"✅ Created AI Assessment prediction at position #1 (Confidence: 95%, Original: {original_pct:.1f}%)")
                                    
                                else:
                                    # Good confidence: Standard reranking (sorting a good list)
                                    logger.info(f"{'='*70}")
                                    logger.info(f"🔄 RERANKING: Found alternative diagnosis in predictions list")
                                    logger.info(f"   Disease: {alt_disease_name}")
                                    logger.info(f"   Original position: {idx + 1}")
                                    logger.info(f"   Original confidence: {original_pct:.1f}% (above 50% threshold)")
                                    logger.info(f"   Reasoning: {verification_result['reasoning']}")
                                    logger.info(f"{'='*70}")
                                    
                                    # Remove from current position
                                    reranked_pred = predictions.pop(idx)
                                    
                                    # Boost confidence slightly (to 0.90 or 0.95) and update explanation
                                    reranked_pred['confidence'] = 95.0
                                    reranked_pred['probability'] = 0.95
                                    reranked_pred['disease'] = f"✅ Verified Match: {pred_disease_clean}"  # Update label
                                    reranked_pred['match_explanation'] = f"AI-Verified Match: {verification_result['reasoning']}"
                                    reranked_pred['verification_reasoning'] = verification_result['reasoning']
                                    reranked_pred['reranked'] = True  # Flag for debugging
                                    
                                    # Move to index 0 (top of the list)
                                    predictions.insert(0, reranked_pred)
                                    
                                    logger.info(f"✅ Reranked disease to position #1 with 95% confidence")
                                    logger.info(f"   Updated explanation: {reranked_pred['match_explanation']}")
                                
                                break
                        
                        # Stage 2: Handle cases where disease was not found in top 5 predictions
                        if not found_match:
                            # Stage 2a: Safety Check (OOD) - Disease not in database
                            if not alt_diag.get('is_in_database', False):
                                ood_detected = True
                                
                                # Extract risk assessment and map to system urgency levels
                                risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                                ood_urgency = risk_assessment.upper()  # CRITICAL, HIGH, MODERATE, LOW
                                
                                # Normalize to system's urgency format (lowercase for consistency)
                                urgency_map = {
                                    'CRITICAL': 'critical',
                                    'HIGH': 'high',
                                    'MODERATE': 'moderate',
                                    'LOW': 'low'
                                }
                                ood_urgency_normalized = urgency_map.get(ood_urgency, 'high')
                                
                                logger.warning(f"{'='*70}")
                                logger.warning(f"🚨 OUT-OF-DOMAIN (OOD) DISEASE DETECTED 🚨")
                                logger.warning(f"Disease: {alt_diag['name']}")
                                logger.warning(f"Confidence: {alt_diag['confidence']:.2f}")
                                logger.warning(f"Risk Assessment: {risk_assessment} -> Urgency: {ood_urgency_normalized}")
                                logger.warning(f"Reasoning: {verification_result['reasoning']}")
                                logger.warning(f"{'='*70}")
                                
                                # Conditional warning message based on urgency
                                if ood_urgency in ['CRITICAL', 'HIGH']:
                                    match_explanation = (
                                        f"⚠️ AI Warning: This condition was flagged by our safety system "
                                        f"but is outside our standard verified database. {verification_result['reasoning']}"
                                    )
                                else:
                                    match_explanation = (
                                        f"AI Insight: This condition is not in our standard database but matches your symptoms. "
                                        f"Please consult a vet to confirm. {verification_result['reasoning']}"
                                    )
                                
                                # Create OOD prediction object with dynamic urgency
                                ood_prediction = {
                                    'disease': f"⚠️ Potential Match: {alt_diag['name']}",
                                    'probability': alt_diag['confidence'],
                                    'confidence': alt_diag['confidence'] * 100,  # Convert to percentage
                                    'urgency': ood_urgency_normalized,  # Dynamic based on risk assessment
                                    'contagious': False,  # Unknown for external diseases
                                    'matched_symptoms': symptoms_list[:5],  # Show some symptoms
                                    'match_explanation': match_explanation,
                                    'total_symptoms': len(symptoms_list),
                                    'is_external': True,  # Mark as external
                                    'verification_reasoning': verification_result['reasoning'],
                                    'risk_assessment': risk_assessment
                                }
                                
                                # Insert OOD prediction as #1 (highest priority)
                                predictions.insert(0, ood_prediction)
                                logger.warning(f"✅ Injected OOD disease as #1 prediction: {alt_diag['name']} (Urgency: {ood_urgency_normalized})")
                            
                            # Stage 2b: Retrieval Miss (Injection) - Disease is in database but Vector Search missed it
                            elif alt_diag.get('is_in_database', False):
                                # Extract risk assessment and map to system urgency levels
                                risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                                retrieval_urgency = risk_assessment.upper()  # CRITICAL, HIGH, MODERATE, LOW
                                
                                # Normalize to system's urgency format (lowercase for consistency)
                                urgency_map = {
                                    'CRITICAL': 'critical',
                                    'HIGH': 'high',
                                    'MODERATE': 'moderate',
                                    'LOW': 'low'
                                }
                                retrieval_urgency_normalized = urgency_map.get(retrieval_urgency, 'high')
                                
                                logger.info(f"{'='*70}")
                                logger.info(f"🔧 RETRIEVAL MISS DETECTED - Injecting Corrected Diagnosis")
                                logger.info(f"Disease: {alt_diag['name']}")
                                logger.info(f"Status: Valid database entry (Vector Search missed it)")
                                logger.info(f"Risk Assessment: {risk_assessment} -> Urgency: {retrieval_urgency_normalized}")
                                logger.info(f"Reasoning: {verification_result['reasoning']}")
                                logger.info(f"{'='*70}")
                                
                                # Create injection prediction object
                                injection_prediction = {
                                    'disease': f"⚠️ AI Corrected: {alt_diag['name']}",
                                    'probability': 0.95,
                                    'confidence': 95.0,
                                    'urgency': retrieval_urgency_normalized,
                                    'contagious': False,  # Will be populated from database if needed
                                    'matched_symptoms': symptoms_list[:5] if symptoms_list else [],
                                    'match_explanation': f"AI System detected a retrieval miss. Corrected based on clinical context: {verification_result['reasoning']}",
                                    'total_symptoms': len(symptoms_list) if symptoms_list else 0,
                                    'is_external': False,  # This is a valid database entry
                                    'verification_reasoning': verification_result['reasoning'],
                                    'risk_assessment': risk_assessment,
                                    'injected': True  # Flag for debugging
                                }
                                
                                # Insert injection prediction as #1 (highest priority)
                                predictions.insert(0, injection_prediction)
                                logger.info(f"✅ Injected corrected diagnosis as #1 prediction: {alt_diag['name']} (Urgency: {retrieval_urgency_normalized}, Confidence: 95%)")
                    
            except Exception as e:
                logger.error(f"✗ Diagnosis verification failed: {e}")
                logger.exception(e)
                # Continue with original predictions if verification fails
        
        # === OOD HANDLING: Update triage assessment if OOD detected ===
        if ood_detected and verification_result:
            # Use dynamic urgency from risk assessment
            risk_assessment = verification_result.get('risk_assessment', 'HIGH')
            ood_urgency = risk_assessment.upper()
            
            # Map to system urgency levels
            urgency_map = {
                'CRITICAL': 'CRITICAL',
                'HIGH': 'HIGH',
                'MODERATE': 'MODERATE',
                'LOW': 'LOW'
            }
            ood_urgency_system = urgency_map.get(ood_urgency, 'HIGH')
            
            # Update result urgency if OOD urgency is higher, or use OOD urgency if it's more specific
            # For OOD cases, prioritize the verifier's risk assessment
            current_urgency_level = result['urgency'].upper()
            urgency_hierarchy = {'LOW': 1, 'MODERATE': 2, 'HIGH': 3, 'CRITICAL': 4}
            
            ood_level = urgency_hierarchy.get(ood_urgency_system, 3)
            current_level = urgency_hierarchy.get(current_urgency_level, 2)
            
            if ood_level >= current_level:
                logger.info(f"📊 OOD urgency ({ood_urgency_system}) >= current urgency ({current_urgency_level}), using OOD urgency")
                result['urgency'] = ood_urgency_system
                result['urgency_reason'] = (
                    f"Out-of-domain condition detected with {risk_assessment} risk assessment. "
                    f"{verification_result['reasoning']}"
                )
            else:
                logger.info(f"📊 Current urgency ({current_urgency_level}) is higher than OOD urgency ({ood_urgency_system}), keeping current")
                # Still update reason to mention OOD detection
                result['urgency_reason'] = (
                    f"{result['urgency_reason']} "
                    f"[Note: OOD condition detected with {risk_assessment} risk: {verification_result['reasoning']}]"
                )
        
        # === SAFETY INTERCEPTOR: Build triage assessment with override logic ===
        # If safety override is active, FORCE critical urgency regardless of RAP/engine results
        if safety_override_active:
            # SAFETY OVERRIDE: User typed emergency symptom - this is CRITICAL
            logger.warning(f"🚨 SAFETY INTERCEPTOR: Forcing CRITICAL urgency (RAP result ignored)")
            
            # Build dynamic reason string with specific symptoms
            symptom_list = ', '.join(safety_override_reason)
            dynamic_critical_message = (
                f"🚨 CRITICAL ALERT: You reported '{symptom_list}'. "
                f"These are potential signs of a life-threatening emergency. "
                f"Immediate veterinary care is required regardless of the matched conditions below."
            )
            
            triage_assessment = {
                'overall_urgency': 'critical',
                'emergency_indicators': True,
                'requires_immediate_care': True,
                'requires_care_within': 'IMMEDIATELY - Emergency Care',
                'urgency_reasoning': [
                    dynamic_critical_message,  # Primary message with specific symptoms
                    "This overrides RAP screening results.",
                    result['urgency_reason']  # Include original reasoning for context
                ],
                'red_flags': [
                    f"🚨 SAFETY INTERCEPTOR: {symptom_list} mentioned in typed symptoms",
                ] + (result.get('red_flags') or []),
                'engine_type': 'Vector Similarity Search + Safety Interceptor',
                'explainable': True,
                'hybrid_triage_extraction': extraction_result,
                'safety_override_applied': True,  # Flag for frontend/debugging
                'original_urgency': result['urgency'].lower()  # Show what it would have been
            }
            
            logger.warning(f"   Original engine urgency: {result['urgency']}")
            logger.warning(f"   OVERRIDDEN to: CRITICAL")
            logger.warning(f"   Specific symptoms detected: {symptom_list}")
            logger.warning(f"   Dynamic message: '{dynamic_critical_message}'")
            logger.warning(f"   ℹ️  Note: Individual disease predictions retain their original urgency (e.g., Tapeworms = Moderate)")
            logger.warning(f"   ℹ️  Patient status = CRITICAL, Disease profiles = Accurate")
            
            # === HIJACK LEGACY FIELDS: Force overwrite result dict ===
            # This ensures that even if other code paths use result['recommendation'],
            # they will get our critical message instead of the original mild text
            result['recommendation'] = dynamic_critical_message
            result['urgency'] = 'CRITICAL'
            logger.warning(f"   ✅ Hijacked result['recommendation'] and result['urgency'] with critical values")
        
        else:
            # Normal flow: Use engine's urgency calculation
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
            
            # Build urgency reasoning - include verification insights if available
            urgency_reasoning = [result['urgency_reason']]
            if verification_result and not verification_result['agreement']:
                urgency_reasoning.append(
                    f"⚠️ Verification Note: {verification_result['reasoning']}"
                )
            
            # Ensure red_flags is always a list (handle None case)
            red_flags_list = result.get('red_flags') or []
            if not isinstance(red_flags_list, list):
                red_flags_list = []
            
            triage_assessment = {
                'overall_urgency': result['urgency'].lower(),
                'emergency_indicators': emergency_indicators,
                'requires_immediate_care': requires_immediate,
                'requires_care_within': care_within,
                'urgency_reasoning': urgency_reasoning,
                'red_flags': red_flags_list,
                'engine_type': 'Vector Similarity Search + Diagnosis Verification' if verification_result else 'Vector Similarity Search',
                'explainable': True,
                'hybrid_triage_extraction': extraction_result if extraction_result['extracted_symptoms'] else None,
                'safety_override_applied': False,
                'verification_result': verification_result if verification_result else None,
                'ood_detected': ood_detected
            }
            
            # Add missed red flags from verification if any
            if verification_result and verification_result.get('missed_red_flags'):
                # Safety check: ensure red_flags is a list before extending
                if triage_assessment.get('red_flags') is None:
                    triage_assessment['red_flags'] = []
                triage_assessment['red_flags'].extend(verification_result['missed_red_flags'])
                logger.warning(f"⚠️ Verification flagged missed red flags: {verification_result['missed_red_flags']}")
        
        # Add emergency override if detected
        if result.get('action'):
            triage_assessment['emergency_action'] = result['action']
        
        # === LEGACY FIELD COMPATIBILITY ===
        # Ensure legacy fields match the safety override when active
        if safety_override_active:
            overall_recommendation = triage_assessment['urgency_reasoning'][0]
            urgency_level = 'critical'
            logger.info(f"🔄 Legacy fields updated to match safety override:")
            logger.info(f"   overall_recommendation: '{overall_recommendation}'")
            logger.info(f"   urgency_level: '{urgency_level}'")
        else:
            overall_recommendation = result['recommendation']
            urgency_level = result['urgency'].lower()
        
        return {
            'success': True,
            'predictions': predictions,
            'triage_assessment': triage_assessment,
            'engine': 'vector_similarity',
            'symptoms_analyzed': result['symptoms_analyzed'],
            'recommendation': result['recommendation'],
            'disclaimer': result['disclaimer'],
            # Legacy fields for backward compatibility
            'overall_recommendation': overall_recommendation,
            'urgency_level': urgency_level,
            # Clinical summary from verification result (if available)
            'clinical_summary': verification_result.get('clinical_summary', '') if verification_result else ''
        }
        
    except Exception as e:
        logger.error(f"Vector similarity prediction failed: {e}")
        raise


def format_soap_report_with_vector_similarity(pet_name, raw_predictions, verification_result):
    import datetime

    # --- HELPER: Safe Extractor ---
    def get_val(data, keys, default=None):
        for k in keys:
            if isinstance(data, dict) and data.get(k): return data[k]
        return default

    # 1. EXTRACT DATA SOURCES
    # Try multiple keys for the list of predictions
    candidates = get_val(raw_predictions, ['confidences', 'predictions', 'ranking'], [])
    if not candidates and raw_predictions.get('top_prediction'):
        # Handle flat structure
        candidates = [{
            'name': raw_predictions['top_prediction'],
            'confidence': raw_predictions.get('confidence', 0),
            'details': raw_predictions.get('top_prediction_details', {})
        }]

    # 2. EXTRACT SYMPTOMS (Priority: AI Verified -> Raw Input)
    symptoms_list = verification_result.get("symptoms_consistent")
    
    # If AI didn't return symptoms, strictly look for them in raw input
    if not symptoms_list or symptoms_list == "N/A":
        symptoms_list = get_val(raw_predictions, ['symptoms', 'symptoms_list', 'input_symptoms'])
    
    # Clean the list (handle stringified lists)
    if isinstance(symptoms_list, str):
        import ast
        try:
            # Try to parse "['vomiting', 'diarrhea']"
            symptoms_list = ast.literal_eval(symptoms_list)
        except:
            # Fallback to comma split
            symptoms_list = [s.strip() for s in symptoms_list.split(',') if s.strip()]
            
    if not symptoms_list:
        symptoms_list = ["Symptoms noted in clinical text"]

    # 3. CLINICAL SUMMARY (Use AI generated text)
    summary_text = verification_result.get("clinical_summary")
    if not summary_text:
        # Fallback to reasoning if summary is missing
        summary_text = verification_result.get("reasoning")
    if not summary_text:
        # Final fallback generator
        cond = get_val(candidates[0], ['name', 'condition'], 'health concerns') if candidates else 'health concerns'
        summary_text = f"{pet_name} presents with symptoms consistent with {cond}. The owner reports {', '.join(symptoms_list[:3])}."

    # 4. BUILD DIAGNOSES LIST (Top 3)
    diagnoses_output = []
    for pred in candidates[:3]: 
        name = get_val(pred, ['name', 'condition', 'disease', 'condition_name', 'prediction'], "Unknown Condition")
        
        conf = pred.get('confidence', 0)
        if conf <= 1: conf *= 100
        
        details = pred.get('details', {})
        
        # Matched Symptoms: Try details first, then fall back to global list
        matched = get_val(details, ['matched_symptoms'], symptoms_list)
        
        diagnoses_output.append({
            "condition": name,
            "likelihood_percentage": float(conf),
            "description": details.get('description', f"A condition characterized by {', '.join(matched[:3])}."),
            "matched_symptoms": matched,
            "urgency": details.get('urgency', verification_result.get('urgency_level', 'Moderate')),
            "contagious": details.get('contagious', False)
        })

    # 5. PLAN & ADVICE (Use AI generated text)
    care_advice = verification_result.get("care_advice")
    if not care_advice or not isinstance(care_advice, list):
        # Fallback advice if AI fails
        care_advice = [
            "Monitor appetite, water intake, and activity levels.",
            "Keep the pet in a comfortable, quiet environment.",
            "Maintain a log of symptom progression."
        ]
        if "High" in verification_result.get("risk_assessment", ""):
            care_advice.insert(0, "Seek veterinary attention immediately.")
        else:
            care_advice.append("Schedule a follow-up if symptoms persist.")

    # 6. CONSTRUCT FINAL REPORT
    soap_report = {
        "case_id": raw_predictions.get("case_id", "N/A"),
        "date_generated": datetime.datetime.now().isoformat(),
        "clinical_summary": summary_text,
        "subjective": f"Owner reports {pet_name} is experiencing {', '.join(symptoms_list[:3])}.",
        "objective": {
            "symptoms": symptoms_list,
            "duration": raw_predictions.get("duration", "Unspecified"),
            "vitals": {"temperature": "Not Recorded"}
        },
        "assessment": {
            "diagnoses": diagnoses_output
        },
        "plan": {
            "severityLevel": verification_result.get("risk_assessment", "Moderate"),
            "aiExplanation": verification_result.get("severity_explanation", verification_result.get("reasoning", "")),
            "careAdvice": care_advice
        }
    }
    
    return soap_report
