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
import datetime
from chatbot.utils import get_gemini_client
from modules.questionnaire.diagnosis_verifier import DiagnosisVerifier

logger = logging.getLogger(__name__)

# Initialize engine (singleton - loads once)
_triage_engine = None
_diagnosis_verifier = None


def clean_name_for_matching(name):
    """
    Normalizes condition names for comparison.
    Removes prefixes like '⚠️ AI Assessment:' and special characters.
    """
    if not name:
        return ""
    # Remove AI prefixes
    n = re.sub(r'⚠️\s*(AI Assessment|AI Corrected|Potential Match|AI Suggested):\s*', '', str(name), flags=re.IGNORECASE)
    # Remove everything except alphanumeric and lowercase
    return re.sub(r'[^a-zA-Z0-9]', '', n).lower().strip()

def get_triage_engine():
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
    global _diagnosis_verifier
    if _diagnosis_verifier is None:
        try:
            _diagnosis_verifier = DiagnosisVerifier('knowledge_base_enhanced.csv')
            logger.info("✓ Diagnosis Verifier initialized successfully")
        except Exception as e:
            logger.error(f"✗ Failed to initialize diagnosis verifier: {e}")
            logger.warning("⚠️ Continuing without diagnosis verification (OOD detection disabled)")
    return _diagnosis_verifier

RED_FLAG_SYMPTOMS = {
    'seizures', 'tremors', 'collapse', 'unconscious', 'respiratory_distress', 
    'difficulty_breathing', 'pale_gums', 'blue_gums', 'cyanosis',
    'bleeding', 'blood_in_urine', 'bloody_diarrhea', 'paralysis',
    'shock', 'severe_dehydration', 'unresponsive', 'convulsions'
}

def extract_symptoms_from_text(user_notes, existing_symptoms=None, species='Dog'):
    # (Keep existing implementation - no changes needed here)
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
    
    user_text = user_notes.lower().strip()
    negation_keywords = {'no', 'not', 'wala', 'hindi', 'walang', "isn't", "hasn't", "doesn't", "won't"}
    sentences = re.split(r'[.!?;]', user_text)
    safe_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence: continue
        words = sentence.split()
        if any(word in negation_keywords for word in words):
            logger.info(f"⚠️  NEGATION DETECTED - Skipping sentence: '{sentence}'")
        else:
            safe_sentences.append(sentence)
    
    filtered_text = ' '.join(safe_sentences)
    if not filtered_text.strip():
        return {
            'extracted_symptoms': [],
            'combined_symptoms': existing_symptoms or [],
            'red_flags_detected': [],
            'raw_matches': {},
            'semantic_matches': {},
            'gemini_normalized': None
        }
    
    regex_extracted = set()
    raw_matches = {}
    search_dict = dict(symptom_aliases)
    for symptom in all_symptoms:
        search_dict[symptom] = symptom
        search_dict[symptom.replace('_', ' ')] = symptom
    
    sorted_phrases = sorted(search_dict.keys(), key=len, reverse=True)
    for phrase in sorted_phrases:
        pattern = r'\b' + re.escape(phrase) + r'\b'
        if re.search(pattern, filtered_text, re.IGNORECASE):
            symptom_code = search_dict[phrase]
            regex_extracted.add(symptom_code)
            raw_matches[phrase] = symptom_code

    semantic_extracted = set()
    semantic_matches = {}
    gemini_normalized_text = None
    
    try:
        model = get_gemini_client()
        if model:
            prompt = f'''Act as a senior veterinary terminologist with expertise in {species} medicine. 

Analyze this input: "{user_notes}"

1. Translate to English if in Tagalog/Taglish.

2. Identify specific symptoms for a {species}. (Example for exotics: "floating sideways" -> "swimming_sideways", "heavy breathing" -> "tail_bobbing").

3. Convert them to standard medical terms.

4. Return ONLY a comma-separated list of these terms. If none, return "None".

Your response (comma-separated list only):'''
            response = model.generate_content(prompt)
            if hasattr(response, 'text') and response.text:
                gemini_output = response.text.strip()
                if gemini_output and gemini_output.lower() not in ['none', 'no symptoms', 'n/a', '']:
                    gemini_normalized_text = gemini_output
                    potential_symptoms = [s.strip() for s in gemini_normalized_text.split(',') if s.strip()]
                    engine = get_triage_engine()
                    for symptom_text in potential_symptoms:
                        symptom_lower = symptom_text.lower().strip()
                        if symptom_lower in search_dict:
                            direct_match = search_dict[symptom_lower]
                            if direct_match not in regex_extracted:
                                semantic_extracted.add(direct_match)
                                semantic_matches[direct_match] = 1.0
                        else:
                            matches = engine.find_similar_symptoms(symptom_text, threshold=0.82)
                            if matches:
                                for symptom_code, score in matches:
                                    if symptom_code not in regex_extracted:
                                        semantic_extracted.add(symptom_code)
                                        semantic_matches[symptom_code] = score
                            else:
                                # If no match in DB, keep the raw symptom so the verifier can see it
                                semantic_extracted.add(symptom_lower)
    except Exception as e:
        logger.warning(f"⚠️  LLM-assisted extraction failed: {e}")

    extracted = regex_extracted | semantic_extracted
    red_flags_detected = [s for s in extracted if s in RED_FLAG_SYMPTOMS]
    existing_set = set(existing_symptoms or [])
    combined = list(existing_set | extracted)
    
    return {
        'extracted_symptoms': list(extracted),
        'combined_symptoms': combined,
        'red_flags_detected': red_flags_detected,
        'raw_matches': raw_matches,
        'semantic_matches': semantic_matches,
        'gemini_normalized': gemini_normalized_text
    }

def predict_with_vector_similarity(payload):
    """
    Replace LightGBM prediction with vector similarity search
    """
    try:
        engine = get_triage_engine()
        species = payload.get('species', 'Dog')
        symptoms_list = payload.get('symptoms_list', [])
        user_notes = payload.get('user_notes', '')
        
        # === HYBRID TRIAGE ===
        extraction_result = extract_symptoms_from_text(user_notes, symptoms_list, species)
        
        # === SAFETY INTERCEPTOR ===
        safety_override_active = False
        safety_override_reason = []
        if extraction_result['red_flags_detected']:
            safety_override_active = True
            safety_override_reason = [s.replace('_', ' ').title() for s in extraction_result['red_flags_detected']]
            logger.warning(f"🚨 SAFETY INTERCEPTOR ACTIVATED: {safety_override_reason}")
        
        symptoms_list = extraction_result['combined_symptoms']
        result = engine.diagnose(species=species, symptoms=symptoms_list, top_n=5)

        if not result.get('top_matches'):
            logger.info(f"No specific matches found for {species}. Falling back to general matching.")
            all_diseases = engine.knowledge_base.diseases 
            result['top_matches'] = engine.disease_matcher.match_diseases(symptoms_list, all_diseases)
        
        predictions = []
        for match in result['top_matches']:
            if match['match_percentage'] < 50:
                continue
            score = match['match_percentage']
            if score >= 90:
                match_label = "Strong triage alignment"
            elif score >= 70:
                match_label = "Consistent with presentation"
            else:
                match_label = "Possible consideration"
            predictions.append({
                'disease': match['disease'],
                'match_level': match_label,
                'urgency': match['base_urgency'],
                'contagious': match['contagious'],
                'matched_symptoms': match['matched_symptoms'],
                'match_explanation': f"Matched {len(match['matched_symptoms'])} symptoms",
                
                

                # Keep these for INTERNAL backend logic only (like sorting or flag triggers)
                'internal_probability': match['match_percentage'] / 100, 
                'total_symptoms': match['total_disease_symptoms'],
                'is_external': False
            })
        
        # === MEMORY UPGRADE ===
        context_data = {
            'age': payload.get('age', 'Unknown'),    
            'breed': payload.get('breed', 'Unknown'), 
            'sex': payload.get('sex', 'Unknown'),

        }
        pet_id = payload.get('pet_id')
        if pet_id:
            try:
                from chatbot.models import PetHealthTrend
                latest_trend = PetHealthTrend.objects.filter(pet_id=pet_id).order_by('-analysis_date').first()
                if latest_trend:
                    context_data['medical_history'] = f"Recent Trend: {latest_trend.trend_analysis}."
                    context_data['risk_score'] = latest_trend.risk_score
                    context_data['urgency_level'] = latest_trend.urgency_level
            except Exception:
                pass
        
        # === DIAGNOSIS VERIFICATION ===
        verification_result = None
        ood_detected = False
        verifier = get_diagnosis_verifier()
        
        if verifier:
            try:
                verification_result = verifier.verify_diagnosis(
                    user_symptoms=symptoms_list,
                    system_predictions=predictions,
                    species=species,
                    user_notes=user_notes,
                    context_data=context_data if context_data else None
                )
                
                # === SHARED HELPER: ENRICH SECONDARY ADVICE ===
                # We define this helper locally to reuse it in both branches (Agreement AND Disagreement)
                def enrich_secondary_predictions(preds, ai_result):
                    secondary_list = ai_result.get('secondary_advice', [])

                    def clean_name(name): 
                        return clean_name_for_matching(name)
                    # Start from index 1 (since index 0 is the primary diagnosis)
                    for i in range(1, len(preds)):
                        curr = preds[i]
                        p_name_clean = clean_name(curr.get('disease', ''))
                        
                        matched_advice = None
                        # Fuzzy match advice to disease name
                        for item in secondary_list:
                            adv_name_clean = clean_name(item.get('disease', ''))
                            if adv_name_clean and (adv_name_clean in p_name_clean or p_name_clean in adv_name_clean):
                                matched_advice = item
                                break
                        
                        if matched_advice:
                            curr['care_guidelines'] = matched_advice.get('what_to_do', "Monitor specific symptoms.")
                            curr['when_to_see_vet'] = matched_advice.get('see_vet_if', "If symptoms persist.")
                        else:
                            curr['care_guidelines'] = "Monitor specific symptoms and keep pet comfortable."
                            curr['when_to_see_vet'] = "If condition does not improve within 24 hours."
                        
                        preds[i] = curr
                # ===============================================

                
                # Reranking Logic
                alt_diag = verification_result.get('alternative_diagnosis')
                
                # Force "Disagreement" logic if database is empty but AI found a specific disease
                is_db_empty = not predictions
                ai_found_something = alt_diag and alt_diag.get('name')
                
                if not verification_result.get('agreement') or (is_db_empty and ai_found_something):
    
                    # 1. Handle Empty DB Case: Inject AI diagnosis into predictions
                    if is_db_empty and ai_found_something:  
                        predictions.append({
                            'disease': f"⚠️ AI Suggested: {alt_diag.get('name')}",
                            'confidence': 0.5, # Default confidence for AI-only leads
                            'care_guidelines': alt_diag.get('what_to_do'),
                            'when_to_see_vet': alt_diag.get('see_vet_if')
                        })
                    
                    # 2. Handle Disagreement Case (DB had results, but AI thinks they are wrong)
                    elif not is_db_empty:
                        # Now it's safe to access predictions[0]
                        new_top_name = clean_name_for_matching(predictions[0]['disease'])
                        
                        # Try to find the specific advice for the top disease from the secondary_advice
                        for advice_item in verification_result.get('secondary_advice', []):
                            if clean_name_for_matching(advice_item.get('disease')) in new_top_name:
                                predictions[0]['care_guidelines'] = advice_item.get('what_to_do')
                                predictions[0]['when_to_see_vet'] = advice_item.get('see_vet_if')
                                break
                    
                    # 3. Enrich other predictions (Change B standard)
                    enrich_secondary_predictions(predictions, verification_result)
                    
                    if alt_diag and alt_diag.get('name'):
                        alt_disease_name = alt_diag['name']

                        found_match = False
                        for idx, pred in enumerate(predictions):
                            pred_disease_clean = pred.get('disease', '').replace('⚠️ Potential Match: ', '').replace('⚠️ AI Corrected: ', '').strip()
                            
                            if (pred_disease_clean.lower() == alt_disease_name.lower() or 
                                alt_disease_name.lower() in pred_disease_clean.lower() or 
                                pred_disease_clean.lower() in alt_disease_name.lower()):
                                
                                found_match = True
                                original_probability = pred.get('probability', 0.0)
                                if original_probability < 0.50:
                                    # Retrieval Miss - Create new synthetic prediction
                                    predictions.pop(idx)
                                    risk_assessment = verification_result.get('risk') or verification_result.get('risk_assessment') or 'HIGH'
                                    matched_symptoms = alt_diag.get('matched_symptoms') or []
                                    
                                    ai_assessment_prediction = {
                                        'disease': f"⚠️ AI Assessment: {alt_disease_name}",
                                        'probability': 0.95, 'confidence': 95.0,
                                        'urgency': risk_assessment.lower(), 'contagious': False,
                                        'matched_symptoms': matched_symptoms,
                                        # FIX: Use specific advice, not generic reasoning
                                        'care_guidelines': verification_result.get('what_to_do_specific') or "Schedule a veterinary exam.",
                                        'when_to_see_vet': verification_result.get('see_vet_if_specific') or "If symptoms worsen.",
                                        'match_explanation': f"Hybrid Analysis: {verification_result['reasoning']}",
                                        'total_symptoms': 0, 'is_external': False,
                                        'verification_reasoning': verification_result['reasoning'],
                                        'risk_assessment': risk_assessment, 'injected': True
                                    }
                                    predictions.insert(0, ai_assessment_prediction)
                                else:
                                    # Rerank existing
                                    reranked_pred = predictions.pop(idx)
                                    reranked_pred['confidence'] = 95.0
                                    reranked_pred['probability'] = 0.95
                                    reranked_pred['disease'] = pred_disease_clean
                                    reranked_pred['match_explanation'] = f"AI Analysis: {verification_result['reasoning']}"
                                    reranked_pred['verification_reasoning'] = verification_result['reasoning']
                                    # FIX: Use specific advice
                                    reranked_pred['care_guidelines'] = verification_result.get('what_to_do_specific') or "Monitor closely."
                                    reranked_pred['when_to_see_vet'] = verification_result.get('see_vet_if_specific') or "If symptoms persist."
                                    predictions.insert(0, reranked_pred)
                                break
                        
                        if not found_match:
                            matched_symptoms = alt_diag.get('matched_symptoms') or symptoms_list[:5]
                            risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                            
                            if not alt_diag.get('is_in_database', False):
                                ood_detected = True
                                # Calculate value OUTSIDE the dictionary
                                conf_val = alt_diag.get('confidence', alt_diag.get('conffidence', 0.5))
                                
                                ood_prediction = {
                                    'disease':  alt_diag['name'],
                                    'probability': float(conf_val),
                                    'confidence': float(conf_val) * 100,
                                    'urgency': risk_assessment.lower(), 
                                    'contagious': False,
                                    'matched_symptoms': matched_symptoms,
                                    'match_explanation': f"AI Warning: {verification_result['reasoning']}",
                                    'total_symptoms': len(symptoms_list), 
                                    'is_external': True,
                                    'verification_reasoning': verification_result['reasoning'], 
                                    'risk_assessment': risk_assessment,
                                    'care_guidelines': verification_result.get('what_to_do_specific') or "Seek veterinary attention.",
                                    'when_to_see_vet': verification_result.get('see_vet_if_specific') or "If condition deteriorates."
                                }
                                predictions.insert(0, ood_prediction)
                            elif alt_diag.get('is_in_database', False):
                                injection_prediction = {
                                    'disease': f"⚠️ AI Corrected: {alt_diag['name']}",
                                    'probability': 0.95, 'confidence': 95.0,
                                    'urgency': risk_assessment.lower(), 'contagious': False,
                                    'matched_symptoms': matched_symptoms,
                                    'care_guidelines': verification_result.get('what_to_do_specific', verification_result.get('care_advice', [])[0]),
                                    'when_to_see_vet': verification_result.get('see_vet_if_specific', "If condition worsens."),
                                    'match_explanation': f"AI System Correction: {verification_result['reasoning']}",
                                    'total_symptoms': len(symptoms_list), 'is_external': False,
                                    'verification_reasoning': verification_result['reasoning'],
                                    'risk_assessment': risk_assessment, 'injected': True
                                }
                                predictions.insert(0, injection_prediction)
                    
                    # === FIX: Run Secondary Enrichment Loop Here Too ===
                    enrich_secondary_predictions(predictions, verification_result)
                    # ===================================================

                else:
                    # === AGREEMENT BRANCH ===
                    if predictions:
                        # 1. Enrich the Top Result (Index 0)
                        top_pred = predictions[0]
                        top_pred['care_guidelines'] = verification_result.get('what_to_do_specific') or verification_result.get('care_advice', [])[0]
                        top_pred['when_to_see_vet'] = verification_result.get('see_vet_if_specific') or "If symptoms persist or worsen."
                        
                        top_pred['match_explanation'] = f"AI Analysis: {verification_result['reasoning']}"
                        predictions[0] = top_pred

                        # 2. Enrich Secondary Results (Indices 1, 2, etc.)
                        enrich_secondary_predictions(predictions, verification_result)

            except Exception as e:
                logger.error(f"✗ Diagnosis verification failed: {e}")

        # === OOD HANDLING ===
        if ood_detected and verification_result:
            result['urgency'] = verification_result.get('risk_assessment', 'HIGH').upper()
            result['urgency_reason'] = f"OOD condition detected. {verification_result['reasoning']}"
        
        # === SAFETY INTERCEPTOR ASSESSMENT ===
        if safety_override_active:
            symptom_list_str = ', '.join(safety_override_reason)
            dynamic_critical_message = f"🚨 CRITICAL ALERT: You reported '{symptom_list_str}'. Immediate veterinary care required."
            
            
            result['recommendation'] = dynamic_critical_message
            result['urgency'] = 'CRITICAL'
        else:
            emergency_indicators = result['urgency'] in ['CRITICAL', 'HIGH']
            care_within = "IMMEDIATELY" if result['urgency'] == 'CRITICAL' else "24-48 hours"
            
            
        
        # === VET-SAFE SYNC: Force overall result to match the #1 prediction ===
        if predictions:
            top_pred = predictions[0]
            # Force top-level urgency to match the #1 disease
            result['urgency'] = top_pred['urgency'].upper()
            
            # Re-map the recommendation based on the top disease
            rec_map = {
                'CRITICAL': "Seek immediate emergency veterinary care",
                'HIGH': "Contact your veterinarian urgently - same day appointment recommended",
                'MODERATE': "Schedule veterinary appointment within 1-2 days",
                'LOW': "Monitor symptoms and consult vet if condition worsens"
            }
            result['recommendation'] = rec_map.get(result['urgency'], result['recommendation'])
        
        triage_assessment = {
            'overall_urgency': result['urgency'].lower(),
            'requires_immediate_care': result['urgency'] == 'CRITICAL',
            'requires_care_within': "IMMEDIATELY" if result['urgency'] == 'CRITICAL' else "24-48 hours",
            'urgency_reasoning': [result.get('urgency_reason', ''), result['recommendation']],
            'red_flags': result.get('red_flags') or [],
            'safety_override_applied': (result['urgency'] == 'CRITICAL')
        }
        return {
            'success': True,
            'predictions': predictions,
            'triage_assessment': triage_assessment,
            'engine': 'vector_similarity',
            'symptoms_analyzed': result['symptoms_analyzed'],
            'recommendation': result['recommendation'],
            'disclaimer': result['disclaimer'],
            'overall_recommendation': result['recommendation'],
            'urgency_level': result['urgency'].lower(),
            'clinical_summary': verification_result.get('clinical_summary', '') if verification_result else ''
        }
        
    except Exception as e:
        logger.error(f"Vector similarity prediction failed: {e}")
        raise

def _format_symptom(symptom):
    """Helper to format snake_case symptoms to Title Case."""
    if not isinstance(symptom, str): return str(symptom)
    # Remove underscores and title case
    return symptom.replace('_', ' ').title()

# --- FINAL FIXED FORMATTER ---
def format_soap_report_with_vector_similarity(pet_name, raw_predictions, verification_result, override_severity=None):
    
    def get_val(data, keys, default=None):
        for k in keys:
            if isinstance(data, dict) and data.get(k): return data[k]
        return default

    # 1. PREPARE SYMPTOMS LIST (Aggressive Extraction)
    # Priority: AI extracted -> Input List -> Input Text Split -> Default
    ai_extracted_symptoms = verification_result.get("symptoms_consistent", [])
    if isinstance(ai_extracted_symptoms, str):
        try: 
            import ast
            ai_extracted_symptoms = ast.literal_eval(ai_extracted_symptoms)
        except: 
            ai_extracted_symptoms = [s.strip() for s in ai_extracted_symptoms.split(',') if s.strip()]
            
    if not ai_extracted_symptoms:
        # Try getting from raw predictions list
        ai_extracted_symptoms = get_val(raw_predictions, ['symptoms', 'symptoms_list', 'input_symptoms'])
    
    if not ai_extracted_symptoms:
        # Try splitting the text if list is missing
        s_text = get_val(raw_predictions, ['symptoms_text', 'user_notes'], "")
        if s_text:
            ai_extracted_symptoms = [s.strip() for s in s_text.split(',') if s.strip()]

    # Final fallback
    if not ai_extracted_symptoms:
        ai_extracted_symptoms = ["Observed clinical signs"]

    # --- FIX 3: FORMAT SYMPTOMS ---
    # Clean up matched symptoms (snake_case -> Title Case)
    formatted_symptoms = [_format_symptom(s) for s in ai_extracted_symptoms]

    # 2. EXTRACT PREDICTIONS
    candidates = get_val(raw_predictions, ['confidences', 'predictions', 'ranking'], [])
    if not candidates and raw_predictions.get('top_prediction'):
        candidates = [{
            'name': raw_predictions['top_prediction'],
            'confidence': raw_predictions.get('confidence', 0),
            'details': raw_predictions.get('top_prediction_details', {})
        }]

    # 3. BUILD DIAGNOSES
    diagnoses_output = []
    top_disease_name = "Undiagnosed Condition"
    
    for i, pred in enumerate(candidates[:3]): 
        name = get_val(pred, ['name', 'condition', 'disease', 'condition_name', 'prediction'], "Unknown Condition")
        if i == 0: top_disease_name = name 
        
        conf = pred.get('confidence', 0)
        if conf <= 1: conf *= 100
        details = pred.get('details', {})
        
        # Merge Specific & Global Symptoms
        matched = pred.get('matched_symptoms')
        
        # Logic to decide which symptoms to show for this specific disease
        final_matched = []
        
        if matched and isinstance(matched, list) and len(matched) > 0 and matched != ["Symptoms noted in clinical text"]:
             final_matched = [_format_symptom(s) for s in matched]
        else:
             # Only show symptoms if they actually match this disease code
             final_matched = []

        diag_urgency = (
            pred.get('urgency') or 
            details.get('urgency') or 
            verification_result.get('risk_assessment') or 
            verification_result.get('risk') or 
            'Moderate'
        )
        clinical_description = details.get('description')
        if not clinical_description or "consistent with" in clinical_description.lower():
            # Dynamically use the first symptom or a generic fallback
            primary_sign = formatted_symptoms[0] if formatted_symptoms else 'the reported signs'
            clinical_description = f"This condition may cause {primary_sign}, but cannot be confirmed without veterinary evaluation."

        diagnoses_output.append({
            "condition": name,
            "match_level": pred.get('match_level', "Potential Consideration"),
            "description": clinical_description,
            "matched_symptoms": final_matched, # FIX 3: Pass the formatted list
            "urgency": diag_urgency,
            "contagious": details.get('contagious', False)
        })

    # 4. DETERMINE SEVERITY (Strict Anchor to Top Match)
    if diagnoses_output:
        # ALWAYS follow the #1 disease's urgency for the report header
        final_severity = diagnoses_output[0]['urgency'].upper()
    else:
        # Fallback if list is empty
        final_severity = (verification_result.get('risk') or verification_result.get('risk_assessment') or "MODERATE").upper()
    


    has_boring_cause = any(word in str(diagnoses_output).lower() for word in ['dietary', 'upset', 'stress', 'irritation'])
    
    if not has_boring_cause and len(diagnoses_output) < 4:
        diagnoses_output.append({
            "condition": "Non-Specific Gastrointestinal Upset",
            "match_level": "Possible Consideration",
            "description": "Commonly caused by dietary indiscretion (eating something unusual), minor stress, or sudden food changes. Often self-limiting.",
            "matched_symptoms": formatted_symptoms[:2],
            "urgency": "Low",
            "contagious": False
        })

    # Define the Timeline map
    # RULE #5: Define strict Doctrine Timelines
    DOCTRINE_MAP = {
        "CRITICAL": "IMMEDIATE - Seek emergency care now.",
        "HIGH": "URGENT - Veterinary evaluation within 12-24 hours.",
        "MODERATE": "STABLE - Schedule vet appointment within 24-48 hours.",
        "LOW": "MONITOR - Routine check-up if signs persist."
    }
    final_timeline = DOCTRINE_MAP.get(final_severity, "24-48 hours")

    # 5. CONSTRUCT CONTENT (Rule-Based Filtering)
    
    # FETCH FIRST: Get the text before trying to replace words
    clinical_summary_text = verification_result.get("clinical_summary") or verification_result.get("clinicalSummary") or ""
    
    # RULE #1: Terminology Scrub (The Purge)
    if clinical_summary_text:
        clinical_summary_text = clinical_summary_text.replace("Primary preliminary assessment", "primary triage concern")
        clinical_summary_text = clinical_summary_text.replace("preliminary assessment", "triage concern")
        clinical_summary_text = clinical_summary_text.replace("diagnosis", "clinical differential")
        clinical_summary_text = clinical_summary_text.replace("Diagnosis", "Clinical Differential")
    else:
        # Fallback if AI fails
        clinical_summary_text = f"Triage assessment for {pet_name}. Current signs are being monitored as a {final_severity.lower()} priority concern."

    # RULE #5: FIX STUBBORN CARE ADVICE
    # We force the advice to match the actual severity timeline
    care_advice = verification_result.get("care_advice") or verification_result.get("careAdvice")
    if not care_advice or not isinstance(care_advice, list) or len(care_advice) == 0:
        care_advice = [
            f"Monitor {pet_name} for any changes in appetite or behavior.",
            f"Keep a daily log of symptom frequency to help your veterinarian.",
            f"Recommended Action: Seek professional evaluation {final_timeline.lower()}"
        ]

    # FIX: Define final_subjective clearly to prevent NameError
    user_notes_raw = get_val(raw_predictions, ['symptoms_text', 'user_notes'], "")
    symptoms_str = ', '.join(formatted_symptoms)
    if user_notes_raw:
        final_subjective = f"Chief Complaint: {user_notes_raw}\n\nSymptoms noted: {symptoms_str}."
    else:
        final_subjective = f"Owner reports symptoms including: {symptoms_str}."

    # 6. ASSEMBLE FINAL OBJECT
    soap_report = {
        "case_id": raw_predictions.get("case_id", "N/A"),
        "date_generated": datetime.datetime.now().isoformat(),
        "subjective": final_subjective,
        "clinical_summary": clinical_summary_text,
        "objective": {
            "symptoms": formatted_symptoms,
            "duration": raw_predictions.get("duration", "Unspecified"),
            "vitals": {"temperature": "Not Recorded"}
        },
        "assessment": {
            "diagnoses": diagnoses_output
        },
        "plan": {
            "severityLevel": final_severity,
            "aiExplanation": verification_result.get("severity_explanation") or verification_result.get("reasoning") or f"Classified as {final_severity}",
            "careAdvice": care_advice,
            "action_timeline": final_timeline
        }
    }
    return soap_report