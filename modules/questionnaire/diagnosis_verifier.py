"""
Diagnosis Verification Layer - Gemini Safety Check for Out-of-Domain (OOD) Disease Detection

This module provides a safety layer that uses Gemini to verify vector search predictions
and detect diseases that are not in the knowledge base (OOD diseases).
"""

import csv
import json
import os
import logging
from typing import List, Dict, Any, Optional
from chatbot.utils import get_gemini_client

logger = logging.getLogger(__name__)


class DiagnosisVerifier:
        """
        Verifies diagnosis predictions using Gemini AI to catch:
        1. Mismatched predictions (wrong disease for symptoms)
        2. Out-of-Domain (OOD) diseases not in the knowledge base
        """
        
        def __init__(self, knowledge_base_path: str = 'knowledge_base_enhanced.csv'):
            """
            Initialize the verifier with a knowledge base of valid diseases.
            
            Args:
                knowledge_base_path: Path to the CSV file containing verified diseases
            """
            self.knowledge_base_path = knowledge_base_path
            self.valid_diseases = set()
            self.diseases_by_species = {}
            self._load_valid_diseases()
            logger.info(f"✓ DiagnosisVerifier initialized with {len(self.valid_diseases)} valid diseases")
        
        def _load_valid_diseases(self):
            """Load valid diseases from the knowledge base CSV."""
            try:
                # Try relative path first (from project root)
                csv_path = self.knowledge_base_path
                if not os.path.exists(csv_path):
                    # Try from current directory
                    base_dir = os.path.dirname(os.path.abspath(__file__))
                    csv_path = os.path.join(base_dir, '..', '..', self.knowledge_base_path)
                    csv_path = os.path.normpath(csv_path)
                
                if not os.path.exists(csv_path):
                    logger.warning(f"⚠️ Knowledge base not found at {csv_path}, using empty set")
                    return
                
                with open(csv_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        disease_name = row.get('disease', '').strip()
                        species = row.get('species', '').strip()
                        
                        if disease_name:
                            self.valid_diseases.add(disease_name.lower())
                            
                            # Also track by species for better context
                            if species not in self.diseases_by_species:
                                self.diseases_by_species[species] = []
                            self.diseases_by_species[species].append(disease_name)
                
                logger.info(f"✓ Loaded {len(self.valid_diseases)} unique diseases from knowledge base")
                logger.info(f"✓ Diseases by species: {dict((k, len(v)) for k, v in self.diseases_by_species.items())}")
                
            except Exception as e:
                logger.error(f"✗ Failed to load knowledge base: {e}")
                logger.warning("⚠️ Continuing with empty disease set - OOD detection may be less accurate")
        
        def verify_diagnosis(
            self,
            user_symptoms: List[str],
            system_predictions: List[Dict[str, Any]],
            species: str = "Dog",
            user_notes: str = "",
            context_data: Optional[Dict[str, Any]] = None
        ) -> Dict[str, Any]:
            """
            Verify diagnosis predictions using Gemini AI.
            """
            try:
                # Get valid diseases for this species (or all if species not found)
                valid_diseases_list = self.diseases_by_species.get(species, [])
                if not valid_diseases_list:
                    # Fallback to all diseases
                    valid_diseases_list = list(set().union(*self.diseases_by_species.values())) if self.diseases_by_species else []
                
                # Format predictions for prompt
                predictions_text = self._format_predictions(system_predictions)
                
                # Prepare context data
                if context_data is None:
                    context_data = {}
                if not user_notes and context_data.get('user_notes'):
                    user_notes = context_data.get('user_notes', '')
                
                # Build the verification prompt
                prompt = self._build_verification_prompt(
                    user_symptoms=user_symptoms,
                    predictions_text=predictions_text,
                    valid_diseases=valid_diseases_list,
                    species=species,
                    user_notes=user_notes,
                    context_data=context_data
                )
                
                # Call Gemini
                model = get_gemini_client()
                logger.info("🤖 Sending diagnosis verification request to Gemini...")
                
                response = model.generate_content(prompt)
                
                if not response or not hasattr(response, 'text') or not response.text:
                    logger.warning("⚠️ Gemini returned empty response, using default verification")
                    return self._default_verification_result()
                
                # Parse Gemini's JSON response
                response_text = response.text.strip()
                logger.info(f"📋 Gemini verification response: {response_text[:200]}...")
                
                # Try to extract JSON from response (handle markdown code blocks)
                json_text = self._extract_json_from_response(response_text)
                
                try:
                    verification_result = json.loads(json_text)
                    logger.info("✓ Successfully parsed Gemini verification response")
                    
                    # Force print to console for visibility
                    print(f"\n🧠 [HYBRID AI BRAIN] Verification Result:")
                    print(f"   - Agreement: {verification_result.get('agreement')}")
                    print(f"   - Reasoning: {verification_result.get('reasoning')}")
                    print(f"   - Risk: {verification_result.get('risk_assessment')}")
                    if not verification_result.get('agreement'):
                        print(f"   - ⚠️  CORRECTION: {verification_result.get('alternative_diagnosis')}")
                    print("-" * 50 + "\n")
                    
                    # Validate and normalize the response
                    return self._normalize_verification_result(verification_result)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"✗ Failed to parse Gemini JSON response: {e}")
                    logger.error(f"   Response text: {response_text}")
                    return self._default_verification_result()
            
            except Exception as e:
                logger.error(f"✗ Diagnosis verification failed: {e}")
                logger.exception(e)
                return self._default_verification_result()
        
        def _format_predictions(self, predictions: List[Dict[str, Any]]) -> str:
            """Format predictions for the prompt."""
            if not predictions:
                return "No predictions available."
            
            lines = []
            for i, pred in enumerate(predictions[:5], 1):  # Top 5 only
                disease = pred.get('disease', 'Unknown')
                confidence = pred.get('confidence', 0) or pred.get('probability', 0) * 100
                urgency = pred.get('urgency', 'Unknown')
                matched_symptoms = pred.get('matched_symptoms', [])
                
                lines.append(
                    f"{i}. {disease} (Confidence: {confidence:.1f}%, Urgency: {urgency}, "
                    f"Matched Symptoms: {', '.join(matched_symptoms[:5])})"
                )
            
            return "\n".join(lines)
        
        def _build_verification_prompt(
            self,
            user_symptoms: List[str],
            predictions_text: str,
            valid_diseases: List[str],
            species: str,
            user_notes: str = "",
            context_data: Optional[Dict[str, Any]] = None
        ) -> str:
            """Build the verification prompt for Gemini."""
            
            # Format symptoms as string
            symptoms_str = ', '.join(user_symptoms)
            preds_str = predictions_text
            
            if context_data is None: context_data = {}
            user_notes_text = user_notes or context_data.get('user_notes', 'None')
            
            medical_history = context_data.get('medical_history', '')
            
            prompt = f"""
            Act as a Clinical Decision Support Tool. Analyze the Patient Data below.

            PATIENT DATA:
            - Species: {species}
            - Breed: {context_data.get('breed', 'Unknown')}
            - Age: {context_data.get('age', 'Unknown')}
            - User's Typed Notes: "{user_notes_text}"
            - Checkbox Symptoms: {symptoms_str}
            - Database Predictions: {preds_str}
            {f"- History: {medical_history}" if medical_history else ""}

            *** CLINICAL REASONING INSTRUCTIONS ***
            1. **AGE & BREED SENSITIVITY:** You MUST prioritize conditions based on the pet's age. 
           (e.g., For a cat <1 year with vomiting, prioritize Parasites or Foreign Body over Hairballs/Pancreatitis).
            2. **CLINICAL DISCLAIMER:** For every condition, DO NOT say "Consistent with presentation." 
            Instead use: "This condition may cause [symptom], but cannot be confirmed without veterinary evaluation."
            3. **RE-RANKING:** If the Database Predictions are logically poorly ordered for this pet's age/breed, set `agreement` to false and provide a logically re-ordered list in `alternative_diagnosis`.
            4. **MANDATORY** The 'name' provided in 'alternative_diagnosis' MUST match the primary condition you argued for in your 'reasoning' and 'clinical_summary'.
            5. **CLINICAL AUTONOMY:** If the Database Predictions are missing the most clinically likely condition for this pet's age/breed/symptoms, set `agreement` to false. In `alternative_diagnosis`, provide the name of the disease you believe is MOST accurate (e.g., "Fleas"), even if it is not in the provided database list.
            

            *** CLINICAL ALIGNMENT RUBRIC (STRICTLY FOLLOW) ***
            Instead of numeric percentages, categorize the alignment of symptoms to the condition:

            1. LEVEL: "Strong triage alignment"
               - Symptoms are pathognomonic or highly distinct (e.g., Bloody Diarrhea + Puppy -> Parvo).
               - Presentation fits the classic textbook profile of the condition.

            2. LEVEL: "Consistent with presentation"
               - Symptoms match the classic profile (3+ major symptoms match).
               - This is a common and likely explanation for the signs shown.

            3. LEVEL: "Possible consideration"
               - Symptoms are non-specific (e.g., just "Vomiting" or "Lethargy") and could fit many conditions.
               - The condition cannot be ruled out but remains unconfirmed.

            4. LEVEL: "Uncertain / Atypical"
               - Conflicting signs or insufficient data to draw a strong parallel.

            ANALYSIS INSTRUCTIONS:
            1. **REPLACE DIAGNOSTIC LANGUAGE:** Use "Clinical Impression" or "Differential" instead of "Diagnosis". Use "May be associated with" instead of "Indicates."
            2. **JUSTIFY SEVERITY (Rule #2):** Your 'severity_explanation' MUST start with "Based on [age/symptom frequency/risk]..." and justify why the risk is Low, Moderate, or High.
            3. **THE "BORING" RULE (Rule #4):** You MUST include one common, non-pathologic cause based on the symptom category. 
               - For Digestive: "Mild Dietary Indiscretion" (eating something unusual).
               - For Skin/Eyes/Ears: "Environmental Irritation" (dust, pollen, or seasonal change).
               - For Behavior/Respiratory: "Temporary Stress or Overexertion."
               - Label these as: "Non-specific / Mild Irritation."
            4. **SIGNAL UNCERTAINTY (Rule #7):** Use phrases like "May be associated with" or "Consideration for." Never say "This is [Disease]."
            5. **AGE-BASED FILTER:** Prioritize risks common to a {context_data.get('age')} pet.
            6. **HISTORY & TOXIN CHECK:** Scan user notes for ingested toxins (Xylitol, Chocolate, Grapes, etc). If found, force Risk to CRITICAL.
            7. **DATABASE CHECK:** If the Database Predictions are missing a likely condition for this signalment, set `agreement` to false and provide it in `alternative_diagnosis`.
            8. **ANATOMICAL CHECK:** If the Database Prediction suggests a condition in the wrong body location (e.g., Back pain vs. Knee pain), set `agreement` to false.
            9. **GENERATE CONTENT:** 'clinical_summary', 'care_advice', and 'severity_explanation' are MANDATORY. Do not skip them.
            10. **CLINICAL FILTERING:** If a Database Prediction is logically impossible or highly unlikely given the pet's age/breed (e.g., 'Arthritis' in a 0-year-old), OMIT it from the 'secondary_advice' list. Only provide advice for conditions you consider valid differentials.

            *** MANDATORY OUTPUT FORMAT (JSON) ***
            You MUST return your analysis in this EXACT JSON structure. Do not skip any fields.
            {{
                "agreement": boolean, 
                "reasoning": "Explain your clinical logic AND cite the Alignment Rubric level you chose.Cite Rule #2 here.", 
                "risk_assessment": "CRITICAL" | "HIGH" | "MODERATE" | "LOW", 
                "missed_red_flags": ["list", "of", "danger", "signs"],
                "severity_explanation": "REQUIRED: JUSTIFY risk based on signalment (e.g., 'HIGH risk due to kitten age').",

                "clinical_summary": "REQUIRED: A rich 3-4 sentence narrative summarizing signalment, user notes, and symptoms. Use the pet's name.",
                "care_advice": [
                    "Step 1: Specific home care action for this condition.", 
                    "Step 2: Environmental management (e.g. isolation/cleaning).",
                    "Step 3: Comfort measure (e.g. warm food/compress)."
                ],
                "severity_explanation": "REQUIRED: Specific explanation of why this risk level was chosen.",
                "symptoms_consistent": ["Symptom A", "Symptom B"],

                "what_to_do_specific": "MANDATORY: 2-3 specific immediate steps for THIS condition",
                "see_vet_if_specific": "MANDATORY: 2-3 specific worsening signs for THIS condition",

                "secondary_advice": [
                    {{
                        "disease": "Exact Name of Database Prediction #2",
                        "match_level": "Consistent with presentation" | "Possible consideration",
                        "what_to_do": "2 detailed sentences specific to this condition.",
                        "see_vet_if": "2 detailed sentences on worsening signs."
                    }},
                    {{
                        "disease": "Exact Name of Database Prediction #3",
                        "match_level": "Consistent with presentation" | "Possible consideration",
                        "what_to_do": "2 detailed sentences specific to this condition.",
                        "see_vet_if": "2 detailed sentences on worsening signs."
                    }}
                ],

                "alternative_diagnosis": {{
                "name": "Most probable condition you considered. (if disagreement)",
                "is_in_database": boolean, (Set to false if this name wasn't in the provided list)
                "match_level":  "Possible consideration",
                "matched_symptoms": ["Specific Symptom 1", "Specific Symptom 2"]
                }}
            }}
            """ 
            return prompt
        
        def _extract_json_from_response(self, response_text: str) -> str:
            """Extract JSON from Gemini response (handle markdown code blocks)."""
            # Remove markdown code blocks if present
            if "```json" in response_text:
                start = response_text.find("```json") + 7
                end = response_text.find("```", start)
                if end != -1:
                    return response_text[start:end].strip()
            elif "```" in response_text:
                start = response_text.find("```") + 3
                end = response_text.find("```", start)
                if end != -1:
                    return response_text[start:end].strip()
            
            # Try to find JSON object boundaries
            start = response_text.find("{")
            end = response_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                return response_text[start:end+1]
            
            return response_text
        
        def _normalize_verification_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
            """Normalize and validate the verification result."""
            
            # 1. Extract raw values
            raw_agreement = result.get("agreement")
            alt_diag_data = result.get("alternative_diagnosis")
            if not isinstance(alt_diag_data, dict):
                alt_diag_data = {}
                
            # 2. Smart Agreement Inference
            if raw_agreement is None:
                has_correction = bool(alt_diag_data.get("name"))
                if has_correction:
                    raw_agreement = False
                    logger.info("⚠️ Agreement was None, but Correction found -> Inferred Agreement: False")
                else:
                    raw_agreement = True
                    logger.info("⚠️ Agreement was None and No Correction -> Inferred Agreement: True")

            # 3. Extract Risk
            risk_raw = result.get("risk_assessment", "MODERATE")
            risk_upper = risk_raw.upper() if isinstance(risk_raw, str) else "MODERATE"
            valid_risks = {"CRITICAL", "HIGH", "MODERATE", "LOW"}
            if risk_upper not in valid_risks: risk_upper = "MODERATE"

            # 4. Extract Symptoms & Rich Content
            specific_matched = alt_diag_data.get("matched_symptoms", [])
            if isinstance(specific_matched, str): specific_matched = [specific_matched]
            
            global_consistent = result.get("symptoms_consistent", [])
            if isinstance(global_consistent, str): global_consistent = [global_consistent]
            
            # FAILSAFE: If global list is empty but specific list exists, auto-fill it
            if not global_consistent and specific_matched:
                global_consistent = specific_matched

            normalized = {
                "agreement": bool(raw_agreement),
                "reasoning": result.get("reasoning", "No specific reasoning provided."),
                "risk_assessment": risk_upper,
                "missed_red_flags": result.get("missed_red_flags", []),
                
                # --- CRITICAL: Pass rich content ---
                "clinical_summary": result.get("clinical_summary"),
                "care_advice": result.get("care_advice", []),
                "severity_explanation": result.get("severity_explanation"),
                "symptoms_consistent": global_consistent,
                
                "what_to_do_specific": result.get("what_to_do_specific"),
                "see_vet_if_specific": result.get("see_vet_if_specific"),
                "secondary_advice": result.get("secondary_advice", []),

                "alternative_diagnosis": {
                    "name": alt_diag_data.get("name"),
                    "is_in_database": bool(alt_diag_data.get("is_in_database", False)),
                    "confidence": max(0.0, min(1.0, float(alt_diag_data.get("confidence") or 0.0))),
                    "matched_symptoms": specific_matched
                }
            }
                
            return normalized
        
        def _default_verification_result(self) -> Dict[str, Any]:
            """Return a default verification result when Gemini fails."""
            return {
                "agreement": True,
                "reasoning": "Verification system unavailable - using system predictions as-is.",
                "risk_assessment": "MODERATE",
                "missed_red_flags": [],
                "alternative_diagnosis": {"name": None, "is_in_database": False, "confidence": 0.0, "matched_symptoms": []},
                "clinical_summary": None,
                "care_advice": [],
                "severity_explanation": None,
                "symptoms_consistent": []
            }