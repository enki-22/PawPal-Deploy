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
        
        Args:
            user_symptoms: List of symptoms reported by the user
            system_predictions: List of predictions from vector search (top matches)
            species: Pet species (Dog, Cat, etc.)
            user_notes: User's typed notes/description (optional)
            context_data: Additional context data dictionary (optional)
        
        Returns:
            dict: Verification result with structure:
            {
                "agreement": boolean,
                "reasoning": "Clinical explanation",
                "risk_assessment": "CRITICAL" | "HIGH" | "MODERATE" | "LOW",
                "missed_red_flags": ["list", "of", "symptoms"],
                "alternative_diagnosis": {
                    "name": "Name of better fitting disease or null",
                    "is_in_database": boolean,
                    "confidence": float  # 0.0 to 1.0
                },
                "clinical_summary": "Professional narrative string"
            }
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
        
        # Format predictions (already formatted, use as-is)
        preds_str = predictions_text
        
        # Get user notes from context_data if not provided directly
        if context_data is None:
            context_data = {}
        user_notes_text = user_notes or context_data.get('user_notes', 'None')
        
        # Get medical history from symptom tracker (Memory Upgrade)
        medical_history = context_data.get('medical_history', '')
        risk_score = context_data.get('risk_score')
        urgency_level = context_data.get('urgency_level')
        
        # Build medical history section for prompt
        medical_history_section = ""
        if medical_history:
            medical_history_section = f"""
        - **Symptom Tracker History (7-Day Trend):**
          {medical_history}"""
            if risk_score is not None:
                medical_history_section += f"\n          Risk Score: {risk_score}/100"
            if urgency_level:
                medical_history_section += f"\n          Previous Urgency: {urgency_level}"
        
        prompt = f"""
        Act as a Senior Veterinary Diagnostician. Analyze the Patient Data to validate the System Predictions.

        DATA:

        - Species: {species}

        - User's Typed Notes: "{user_notes_text}"

        - Checkbox Symptoms: {symptoms_str}

        - Database Predictions: {preds_str}{medical_history_section}

        ANALYSIS INSTRUCTIONS:

        1. **HISTORY & TOXIN CHECK:** - Read the "User's Typed Notes" carefully. Did the pet eat something specific? (e.g., Gum/Xylitol, Chocolate, Grapes, Medications). 

           - If a toxin ingestion is described, you MUST diagnose the specific toxicity (e.g., "Xylitol Toxicity") as the primary condition, even if the Database predicted generic vomiting.

        2. **ANATOMICAL CONSISTENCY CHECK (Critical):**

           - Compare the User's reported **Location of Pain** vs. the **Diagnosis**.

           - *Example:* If User says "Back pain" or "Cries when touched on spine", and Database predicts "Patellar Luxation" (Knee) or "Otitis" (Ear), you MUST **DISAGREE**.

           - *Example:* If User says "Head shaking", and Database predicts "Gastritis" (Stomach), you MUST **DISAGREE**.

           - **Rule:** The Diagnosis MUST explain the PRIMARY area of pain. If the user mentions "Back Pain", the diagnosis must be spinal or hip-related (e.g., IVDD, Arthritis, Disco), NOT a knee/leg injury.

        3. **SYMPTOM PROGRESSION (Memory Check):**
           
           - **CRITICAL:** If "Symptom Tracker History" is provided above, this pet has been tracked over multiple days.
           
           - Consider the progression: Is the condition worsening, improving, or stable? A pet that has been sick for 5 days with worsening symptoms is MORE URGENT than a pet with the same symptoms for 1 day.
           
           - If the tracker shows a "worsening trend" or "high risk score", this should INCREASE your risk assessment (e.g., from MODERATE to HIGH, or HIGH to CRITICAL).
           
           - Example: "Vomiting for 1 day" = MODERATE risk. "Vomiting for 5 days with worsening trend" = HIGH/CRITICAL risk.

        4. **SYMPTOM NUANCE (Rule Out Mimics):**

           - Compare the severity described vs. the database prediction.

           - *Example:* "Honking noise + Acts normal after" matches **Reverse Sneezing** (Low Risk), NOT Choking.

           - *Example:* "Distended abdomen + Unproductive vomiting" matches **GDV/Bloat** (Critical Risk), NOT Indigestion.

           - If the Database Prediction is too mild (e.g., Indigestion for Bloat) or too severe (e.g., Obstruction for Reverse Sneezing), REJECT it and provide the correct diagnosis.

        5. **RISK ASSESSMENT:**

           - Assign a risk level based on the *likely* condition: CRITICAL, HIGH, MODERATE, or LOW.
           
           - **Factor in symptom duration and progression** from the tracker history if available.

        6. **CLINICAL SUMMARY:** Write a professional, 3-4 sentence veterinary narrative of the patient presentation. Combine the species, age, and symptoms into a natural narrative (e.g., "Charlie, a 2-year-old male Dog, presents with..."). Ignore typos in user notes.

        7. **CARE ADVICE:** Generate 3-5 specific, actionable care steps relevant to the diagnosed condition. These should be condition-specific, not generic advice. Examples:
           - For "Xylitol Toxicity": ["Immediately seek emergency veterinary care - do not wait", "Do not induce vomiting unless directed by a veterinarian", "Bring the product packaging to the clinic if available", "Monitor blood glucose levels closely"]
           - For "Mild Skin Irritation": ["Apply a cool compress to the affected area", "Prevent the pet from scratching (use an E-collar if necessary)", "Schedule a routine veterinary appointment within 48 hours"]

        8. **SEVERITY EXPLANATION:** Provide a specific, concise explanation of why the risk level was chosen. Examples:
           - "Non-emergent but requires antiviral treatment within 24-48 hours"
           - "Critical due to potential for rapid progression and organ failure"
           - "Low risk - self-limiting condition with supportive care"

        OUTPUT JSON:

        {{

            "agreement": boolean, 

            "reasoning": "Explain your logic.", 

            "risk_assessment": "CRITICAL" | "HIGH" | "MODERATE" | "LOW", 

            "missed_red_flags": ["list", "of", "danger", "signs"],



            "clinical_summary": "Professional veterinary narrative (3-4 sentences).",

            "care_advice": ["Action 1", "Action 2", "Action 3"],

            "severity_explanation": "Specific explanation of risk level.",



            "alternative_diagnosis": {{

               "name": "Most Accurate Disease Name (if disagreement)",

               "is_in_database": boolean,

               "confidence": float (0.90+)

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
        
        # Return as-is if no markers found
        return response_text
    
    def _normalize_verification_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize and validate the verification result."""
        
        # 1. Extract raw values
        raw_agreement = result.get("agreement")
        alt_diag_data = result.get("alternative_diagnosis")
        if not isinstance(alt_diag_data, dict):
            alt_diag_data = {}
            
        # 2. Smart Agreement Inference
        # If agreement is explicitly None (AI output null), infer from correction
        if raw_agreement is None:
            has_correction = bool(alt_diag_data.get("name"))
            if has_correction:
                # AI offered a correction, so it likely disagreed
                raw_agreement = False
                logger.info("⚠️ Agreement was None, but Correction found -> Inferred Agreement: False")
            else:
                # No correction offered, so stick with original predictions
                raw_agreement = True
                logger.info("⚠️ Agreement was None and No Correction -> Inferred Agreement: True")

        # Extract risk_assessment and normalize to uppercase
        risk_raw = result.get("risk_assessment", "MODERATE")
        if isinstance(risk_raw, str):
            risk_upper = risk_raw.upper()
        else:
            risk_upper = "MODERATE"
        
        # Map new format risk levels to old format if needed
        risk_mapping = {
            "LOW": "LOW",
            "MODERATE": "MODERATE", 
            "HIGH": "HIGH",
            "CRITICAL": "CRITICAL"
        }
        risk_assessment = risk_mapping.get(risk_upper, "MODERATE")

        normalized = {
            "agreement": bool(raw_agreement),
            "reasoning": result.get("reasoning", "No specific reasoning provided."),
            "risk_assessment": risk_assessment,
            "missed_red_flags": result.get("missed_red_flags", []),
            
            # Pass through rich content (default to None if missing)
            "clinical_summary": result.get("clinical_summary"),
            "care_advice": result.get("care_advice", []),
            "severity_explanation": result.get("severity_explanation"),
            
            "alternative_diagnosis": {
                "name": alt_diag_data.get("name"),
                "is_in_database": bool(alt_diag_data.get("is_in_database", False)),
                "confidence": max(0.0, min(1.0, float(alt_diag_data.get("confidence", 0.0))))
            }
        }
        
        # Validate risk_assessment
        valid_risks = {"CRITICAL", "HIGH", "MODERATE", "LOW"}
        if normalized["risk_assessment"] not in valid_risks:
            normalized["risk_assessment"] = "MODERATE"
            
        # Source of Truth Check: Validate is_in_database using actual database
        suggested_name = normalized["alternative_diagnosis"]["name"]
        if suggested_name:
            # Perform case-insensitive check against valid_diseases set
            suggested_name_lower = suggested_name.lower().strip()
            is_actually_in_db = suggested_name_lower in self.valid_diseases
            
            # Log if AI's guess differed from actual database check
            if normalized["alternative_diagnosis"]["is_in_database"] != is_actually_in_db:
                logger.info(
                    f"🤖 AI hallucinated DB presence for '{suggested_name}'. "
                    f"AI guessed: {normalized['alternative_diagnosis']['is_in_database']}, Actual: {is_actually_in_db}. "
                    f"Corrected to {is_actually_in_db}."
                )
                normalized["alternative_diagnosis"]["is_in_database"] = is_actually_in_db
            
        return normalized
    
    def _default_verification_result(self) -> Dict[str, Any]:
        """Return a default verification result when Gemini fails."""
        return {
            "agreement": True,
            "reasoning": "Verification system unavailable - using system predictions as-is.",
            "risk_assessment": "MODERATE",
            "missed_red_flags": [],
            "alternative_diagnosis": {"name": None, "is_in_database": False, "confidence": 0.0},
            "clinical_summary": None,
            "care_advice": [],
            "severity_explanation": None
        }
