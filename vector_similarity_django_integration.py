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

def extract_symptoms_from_text(user_notes, existing_symptoms=None):
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
            prompt = f"""Act as a veterinary terminologist. Analyze this user input: "{user_notes}"
1. Translate to English if in Tagalog/Taglish.
2. Identify specific veterinary symptoms.
3. Convert them to standard medical terms.
4. Return ONLY a comma-separated list of these terms. If no symptoms, return "None".
Your response (comma-separated list only):"""
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
        extraction_result = extract_symptoms_from_text(user_notes, symptoms_list)
        
        # === SAFETY INTERCEPTOR ===
        safety_override_active = False
        safety_override_reason = []
        if extraction_result['red_flags_detected']:
            safety_override_active = True
            safety_override_reason = [s.replace('_', ' ').title() for s in extraction_result['red_flags_detected']]
            logger.warning(f"🚨 SAFETY INTERCEPTOR ACTIVATED: {safety_override_reason}")
        
        symptoms_list = extraction_result['combined_symptoms']
        result = engine.diagnose(species=species, symptoms=symptoms_list, top_n=5)
        
        predictions = []
        for match in result['top_matches']:
            predictions.append({
                'disease': match['disease'],
                'probability': match['match_percentage'] / 100,
                'confidence': match['match_percentage'],
                'urgency': match['base_urgency'],
                'contagious': match['contagious'],
                'matched_symptoms': match['matched_symptoms'],
                'match_explanation': f"Matched {len(match['matched_symptoms'])} symptoms",
                'total_symptoms': match['total_disease_symptoms'],
                'is_external': False
            })
        
        # === MEMORY UPGRADE ===
        context_data = {}
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
                
                # Reranking Logic
                if not verification_result['agreement']:
                    alt_diag = verification_result['alternative_diagnosis']
                    found_match = False
                    
                    if alt_diag and alt_diag.get('name'):
                        alt_disease_name = alt_diag['name']
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
                                    risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                                    matched_symptoms = alt_diag.get('matched_symptoms') or symptoms_list[:5]
                                    
                                    ai_assessment_prediction = {
                                        'disease': f"⚠️ AI Assessment: {alt_disease_name}",
                                        'probability': 0.95, 'confidence': 95.0,
                                        'urgency': risk_assessment.lower(), 'contagious': False,
                                        'matched_symptoms': matched_symptoms,
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
                                    reranked_pred['disease'] = f"✅ Verified Match: {pred_disease_clean}"
                                    reranked_pred['match_explanation'] = f"AI-Verified Match: {verification_result['reasoning']}"
                                    reranked_pred['verification_reasoning'] = verification_result['reasoning']
                                    predictions.insert(0, reranked_pred)
                                break
                        
                        if not found_match:
                            matched_symptoms = alt_diag.get('matched_symptoms') or symptoms_list[:5]
                            risk_assessment = verification_result.get('risk_assessment', 'HIGH')
                            
                            if not alt_diag.get('is_in_database', False):
                                ood_detected = True
                                ood_prediction = {
                                    'disease': f"⚠️ Potential Match: {alt_diag['name']}",
                                    'probability': alt_diag['confidence'], 'confidence': alt_diag['confidence'] * 100,
                                    'urgency': risk_assessment.lower(), 'contagious': False,
                                    'matched_symptoms': matched_symptoms,
                                    'match_explanation': f"AI Warning: {verification_result['reasoning']}",
                                    'total_symptoms': len(symptoms_list), 'is_external': True,
                                    'verification_reasoning': verification_result['reasoning'], 'risk_assessment': risk_assessment
                                }
                                predictions.insert(0, ood_prediction)
                            elif alt_diag.get('is_in_database', False):
                                injection_prediction = {
                                    'disease': f"⚠️ AI Corrected: {alt_diag['name']}",
                                    'probability': 0.95, 'confidence': 95.0,
                                    'urgency': risk_assessment.lower(), 'contagious': False,
                                    'matched_symptoms': matched_symptoms,
                                    'match_explanation': f"AI System Correction: {verification_result['reasoning']}",
                                    'total_symptoms': len(symptoms_list), 'is_external': False,
                                    'verification_reasoning': verification_result['reasoning'],
                                    'risk_assessment': risk_assessment, 'injected': True
                                }
                                predictions.insert(0, injection_prediction)

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
            
            triage_assessment = {
                'overall_urgency': 'critical',
                'emergency_indicators': True,
                'requires_immediate_care': True,
                'requires_care_within': 'IMMEDIATELY - Emergency Care',
                'urgency_reasoning': [dynamic_critical_message, result['urgency_reason']],
                'red_flags': [f"🚨 SAFETY INTERCEPTOR: {symptom_list_str}"] + (result.get('red_flags') or []),
                'engine_type': 'Vector Similarity Search + Safety Interceptor',
                'safety_override_applied': True,
                'original_urgency': result['urgency'].lower()
            }
            result['recommendation'] = dynamic_critical_message
            result['urgency'] = 'CRITICAL'
        else:
            emergency_indicators = result['urgency'] in ['CRITICAL', 'HIGH']
            care_within = "IMMEDIATELY" if result['urgency'] == 'CRITICAL' else "24-48 hours"
            
            triage_assessment = {
                'overall_urgency': result['urgency'].lower(),
                'emergency_indicators': emergency_indicators,
                'requires_immediate_care': result['urgency'] == 'CRITICAL',
                'requires_care_within': care_within,
                'urgency_reasoning': [result['urgency_reason']],
                'red_flags': result.get('red_flags') or [],
                'engine_type': 'Vector Similarity Search',
                'verification_result': verification_result,
                'ood_detected': ood_detected
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

# --- UPDATED FORMATTER WITH SEVERITY OVERRIDE ---
def format_soap_report_with_vector_similarity(pet_name, raw_predictions, verification_result, override_severity=None):
    import datetime

    def get_val(data, keys, default=None):
        for k in keys:
            if isinstance(data, dict) and data.get(k): return data[k]
        return default

    # 1. PREPARE SYMPTOMS LIST
    ai_extracted_symptoms = verification_result.get("symptoms_consistent", [])
    if isinstance(ai_extracted_symptoms, str):
        try: 
            import ast
            ai_extracted_symptoms = ast.literal_eval(ai_extracted_symptoms)
        except: 
            ai_extracted_symptoms = [s.strip() for s in ai_extracted_symptoms.split(',') if s.strip()]
            
    if not ai_extracted_symptoms:
        ai_extracted_symptoms = get_val(raw_predictions, ['symptoms', 'symptoms_list', 'input_symptoms'], ["Symptoms noted in clinical text"])

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
    for pred in candidates[:3]: 
        name = get_val(pred, ['name', 'condition', 'disease', 'condition_name', 'prediction'], "Unknown Condition")
        conf = pred.get('confidence', 0)
        if conf <= 1: conf *= 100
        details = pred.get('details', {})
        
        # Merge Specific & Global Symptoms
        matched = pred.get('matched_symptoms')
        if not matched or matched == ["Symptoms noted in clinical text"]:
            matched = ai_extracted_symptoms
        if not matched:
            matched = ["Symptoms noted in clinical text"]

        diagnoses_output.append({
            "condition": name,
            "likelihood_percentage": float(conf),
            "description": details.get('description', f"Condition consistent with clinical presentation."),
            "matched_symptoms": matched,
            "urgency": details.get('urgency', verification_result.get('risk_assessment', 'Moderate')),
            "contagious": details.get('contagious', False)
        })

    # 4. DETERMINE SEVERITY
    ai_risk = verification_result.get("risk_assessment", "Moderate")
    final_severity = ai_risk
    if override_severity:
        severity_rank = {"CRITICAL": 4, "EMERGENCY": 4, "HIGH": 3, "URGENT": 3, "MODERATE": 2, "LOW": 1}
        override_upper = override_severity.upper()
        ai_upper = ai_risk.upper()
        if severity_rank.get(override_upper, 0) > severity_rank.get(ai_upper, 0):
            final_severity = override_severity.title()

    # 5. CONSTRUCT REPORT
    # CRITICAL FIX: Ensure clinical_summary is accessible. 
    # We return it in top-level for immediate use, but also put it in 'subjective' 
    # or 'plan' so it saves to the DB if the DB model lacks a 'clinical_summary' column.
    
    clinical_summary_text = verification_result.get("clinical_summary") or verification_result.get("reasoning") or f"{pet_name} presents with symptoms: {', '.join(ai_extracted_symptoms)}."

    soap_report = {
        "case_id": raw_predictions.get("case_id", "N/A"),
        "date_generated": datetime.datetime.now().isoformat(),
        
        # KEY FIX: Pass this explicitly
        "clinical_summary": clinical_summary_text,
        
        "subjective": f"Owner reports: {', '.join(ai_extracted_symptoms[:15])}.",
        
        "objective": {
            "symptoms": ai_extracted_symptoms,
            "duration": raw_predictions.get("duration", "Unspecified"),
            "vitals": {"temperature": "Not Recorded"}
        },
        "assessment": {
            "diagnoses": diagnoses_output
        },
        "plan": {
            "severityLevel": final_severity,
            # KEY FIX: Ensure aiExplanation is populated from verification result
            "aiExplanation": verification_result.get("severity_explanation") or verification_result.get("reasoning", ""),
            "careAdvice": verification_result.get("care_advice") if verification_result.get("care_advice") else [
                "Monitor appetite and activity levels.", 
                "Ensure access to fresh water.",
                "Keep a log of symptom progression."
            ],
            # KEY FIX: Store summary here too as a backup for the frontend
            "clinical_summary_backup": clinical_summary_text
        }
    }
    return soap_report