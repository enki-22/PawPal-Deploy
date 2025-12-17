#!/usr/bin/env python3
"""
Smart Triage Engine - Vector Similarity Search for Pet Disease Diagnosis
"""

import csv
import json
import numpy as np
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from sentence_transformers import SentenceTransformer, util

# ============================================================================
# LAYER 1: RED FLAG SYMPTOMS (Clinical Triage Standards)
# ============================================================================

CRITICAL_SYMPTOMS = {
    'difficulty_breathing', 'seizures', 'tremors', 'blue_gums', 'collapse', 
    'uncontrolled_bleeding', 'unconscious', 'not_breathing',
    'severe_trauma', 'poisoning', 'bloat', 'heatstroke',
    'sudden_paralysis', 'respiratory_distress', 'cardiac_arrest',
    'profuse_bleeding', 'severe_burn'
}

HIGH_URGENCY_SYMPTOMS = {
    'bloody_diarrhea', 'blood_in_vomit', 'eye_injury', 'severe_pain',
    'distended_abdomen', 'unable_to_urinate', 'straining_to_urinate',
    'blood_in_urine', 'severe_vomiting', 'profuse_diarrhea',
    'broken_bone', 'deep_wound', 'bite_wound', 'labored_breathing',
    'pale_gums', 'yellow_gums', 'high_fever', 'severe_lethargy'
}

MODERATE_URGENCY_SYMPTOMS = {
    'vomiting', 'diarrhea', 'loss_of_appetite', 'lethargy',
    'coughing', 'sneezing', 'limping', 'ear_infection',
    'skin_lesions', 'itching', 'discharge', 'fever', 'dehydration'
}

# ============================================================================
# LAYER 2: KNOWLEDGE BASE LOADER
# ============================================================================

class DiseaseKnowledgeBase:
    def __init__(self, csv_path='knowledge_base_enhanced.csv'):
        self.diseases = []
        self.diseases_by_species = defaultdict(list)
        self.load_knowledge_base(csv_path)
    
    def load_knowledge_base(self, csv_file: str):
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    symptoms_str = row.get('symptoms', '')
                    symptoms = [s.strip() for s in symptoms_str.split(',') if s.strip()]
                    
                    disease_profile = {
                        'species': row.get('species', '').strip(),
                        'disease_name': row.get('disease', '').strip(),
                        'symptoms': symptoms,
                        'base_urgency': row.get('urgency', 'medium').strip().lower(),
                        'contagious': row.get('contagious', 'no').strip().lower() == 'yes',
                        'source': row.get('source', '').strip()
                    }
                    
                    self.diseases.append(disease_profile)
                    self.diseases_by_species[disease_profile['species']].append(disease_profile)
        except FileNotFoundError:
            print(f"Error: {csv_file} not found. Using empty knowledge base.")
    
    def get_diseases_for_species(self, species: str) -> List[Dict]:
        return self.diseases_by_species.get(species, [])

# ============================================================================
# LAYER 3: URGENCY DETECTOR
# ============================================================================

class UrgencyDetector:
    @staticmethod
    def assess_urgency(symptoms: List[str]) -> Tuple[str, str, List[str]]:
        symptoms_set = set(s.lower().replace(' ', '_') for s in symptoms)
        
        critical_found = symptoms_set.intersection(CRITICAL_SYMPTOMS)
        if critical_found:
            return ("CRITICAL", f"Life-threatening symptoms detected: {', '.join(critical_found)}", list(critical_found))
        
        high_found = symptoms_set.intersection(HIGH_URGENCY_SYMPTOMS)
        if high_found:
            return ("HIGH", f"Urgent symptoms detected: {', '.join(high_found)}", list(high_found))
        
        moderate_found = symptoms_set.intersection(MODERATE_URGENCY_SYMPTOMS)
        if moderate_found:
            return ("MODERATE", f"Symptoms require veterinary attention: {', '.join(moderate_found)}", list(moderate_found))
        
        return ("LOW", "Routine symptoms - monitor and consult vet if worsens", [])

# ============================================================================
# LAYER 4: DISEASE MATCHER
# ============================================================================

class DiseaseMatched:
    @staticmethod
    def calculate_weighted_match(user_symptoms: Set[str], disease_symptoms: Set[str]) -> Dict:
        if not user_symptoms:
            return {'score': 0.0, 'matched': set(), 'user_coverage': 0, 'disease_coverage': 0}
        
        matched_symptoms = user_symptoms.intersection(disease_symptoms)
        
        # Weighted scoring: 70% User Coverage (Recall), 30% Disease Coverage (Precision)
        user_coverage = len(matched_symptoms) / len(user_symptoms) if user_symptoms else 0
        disease_coverage = len(matched_symptoms) / len(disease_symptoms) if disease_symptoms else 0
        
        weighted_score = (0.7 * user_coverage) + (0.3 * disease_coverage)
        
        return {
            'score': weighted_score,
            'matched': matched_symptoms,
            'user_coverage': user_coverage,
            'disease_coverage': disease_coverage
        }
    
    @staticmethod
    def match_diseases(user_symptoms: List[str], diseases: List[Dict], top_n: int = 5) -> List[Dict]:
        user_symptom_set = set(s.lower().replace(' ', '_') for s in user_symptoms)
        results = []
        
        for disease in diseases:
            disease_symptom_set = set(s.lower().replace(' ', '_') for s in disease['symptoms'])
            match_data = DiseaseMatched.calculate_weighted_match(user_symptom_set, disease_symptom_set)
            
            if match_data['score'] > 0:
                results.append({
                    'disease': disease['disease_name'],
                    'match_percentage': round(match_data['score'] * 100, 1),
                    'matched_symptoms': list(match_data['matched']),
                    'user_coverage': round(match_data['user_coverage'] * 100, 1),
                    'base_urgency': disease['base_urgency'],
                    'contagious': disease['contagious'],
                    'total_disease_symptoms': len(disease['symptoms'])
                })
        
        results.sort(key=lambda x: x['match_percentage'], reverse=True)
        return results[:top_n]

# ============================================================================
# LAYER 5: SMART TRIAGE ENGINE (Main Orchestrator)
# ============================================================================

class SmartTriageEngine:
    def __init__(self, knowledge_base_file: str):
        self.knowledge_base = DiseaseKnowledgeBase(knowledge_base_file)
        self.urgency_detector = UrgencyDetector()
        self.disease_matcher = DiseaseMatched()
        
        # === HYBRID EXTRACTION: Sentence Transformer for semantic matching ===
        print("🔄 Loading multilingual sentence transformer for semantic symptom matching...")
        from sentence_transformers import SentenceTransformer
        self.semantic_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        
        # Cache for symptom embeddings (computed once at startup)
        self.symptom_vectors = None
        self.symptom_names = []
        
        # Load and cache symptom vectors
        self.cache_symptom_vectors()
    
    def diagnose(self, species: str, symptoms: List[str], top_n: int = 5) -> Dict:
        # Step 1: Assess urgency
        urgency_level, urgency_reason, red_flags = self.urgency_detector.assess_urgency(symptoms)
        
        # Step 2: Filter diseases
        relevant_diseases = self.knowledge_base.get_diseases_for_species(species)
        
        # Step 3: Match diseases
        disease_matches = []
        if relevant_diseases:
            disease_matches = self.disease_matcher.match_diseases(symptoms, relevant_diseases, top_n)
        
        # Step 4: Construct Response
        recommendations = {
            'CRITICAL': "Seek immediate emergency veterinary care",
            'HIGH': "Contact your veterinarian urgently - same day appointment recommended",
            'MODERATE': "Schedule veterinary appointment within 1-2 days",
            'LOW': "Monitor symptoms and consult vet if condition worsens"
        }

        # === THE FIX IS HERE ===
        # We explicitly include 'symptoms_analyzed' in the return dictionary.
        return {
            'urgency': urgency_level,
            'urgency_reason': urgency_reason,
            'red_flags': red_flags if red_flags else None,
            'top_matches': disease_matches,
            'species': species,
            'symptoms_analyzed': len(symptoms),  # <--- THIS WAS MISSING
            'recommendation': recommendations.get(urgency_level, "Consult with a veterinarian"),
            'disclaimer': "This is not a substitute for professional veterinary diagnosis."
        }

    def _get_recommendation(self, urgency_level):
        # Helper method kept for compatibility if needed elsewhere
        recommendations = {
            'CRITICAL': "Seek immediate emergency veterinary care",
            'HIGH': "Contact your veterinarian urgently - same day appointment recommended",
            'MODERATE': "Schedule veterinary appointment within 1-2 days",
            'LOW': "Monitor symptoms and consult vet if condition worsens"
        }
        return recommendations.get(urgency_level, "Consult with a veterinarian")
    
    def cache_symptom_vectors(self):
        """
        Pre-compute embeddings for all symptoms in all_symptoms.json.
        This allows fast semantic matching at runtime.
        """
        if self.semantic_model is None:
            print("🔄 Lazy loading multilingual sentence transformer...")
            from sentence_transformers import SentenceTransformer
            self.semantic_model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')
        # ======================
        try:
            with open('all_symptoms.json', 'r', encoding='utf-8') as f:
                all_symptoms_data = json.load(f)
            
            # FIX: Handle both list and dict formats
            if isinstance(all_symptoms_data, list):
                # It's already a list of symptom codes (e.g., ["vomiting", "fever", "pale_gums"])
                self.symptom_names = all_symptoms_data
                print(f"📋 Loaded {len(self.symptom_names)} symptoms from list format")
            elif isinstance(all_symptoms_data, dict):
                # It's a dictionary, extract the keys
                self.symptom_names = list(all_symptoms_data.keys())
                print(f"📋 Loaded {len(self.symptom_names)} symptoms from dictionary format")
            else:
                print(f"❌ ERROR: Unknown format for all_symptoms.json: {type(all_symptoms_data)}")
                print(f"   Expected: list or dict, Got: {type(all_symptoms_data)}")
                self.symptom_vectors = None
                return
            
            # Create human-readable descriptions for better semantic matching
            symptom_descriptions = []
            for code in self.symptom_names:
                # Use the code as description (e.g., "vomiting", "pale_gums")
                # Convert underscores to spaces for better semantic matching
                desc = code.replace('_', ' ')
                symptom_descriptions.append(desc)
            
            print(f"🔄 Encoding {len(symptom_descriptions)} symptoms for semantic search...")
            self.symptom_vectors = self.semantic_model.encode(
                symptom_descriptions, 
                convert_to_tensor=True,
                show_progress_bar=True
            )
            print(f"✅ Symptom vectors cached successfully")
            
        except FileNotFoundError:
            print("⚠️  Warning: all_symptoms.json not found. Semantic matching disabled.")
            self.symptom_vectors = None
        except Exception as e:
            print(f"⚠️  Error caching symptom vectors: {e}")
            self.symptom_vectors = None
    
    def find_similar_symptoms(self, text: str, threshold: float = 0.70) -> List[Tuple[str, float]]:
        """
        Find symptoms semantically similar to the input text using vector similarity.
        
        Args:
            text: User's free-text description (e.g., "Nagsusuka" or "gums that are pale")
            threshold: Minimum similarity score (0-1). Default 0.70 for Tagalog sensitivity.
        
        Returns:
            List of tuples: [(symptom_code, similarity_score), ...]
        """
        if not text.strip() or self.symptom_vectors is None:
            return []

        

        
        
        try:
            # Encode user text
            text_embedding = self.semantic_model.encode(text, convert_to_tensor=True)
            
            # Compute cosine similarity with all cached symptom vectors
            similarities = util.cos_sim(text_embedding, self.symptom_vectors)[0]
            
            # Filter by threshold and convert to list of tuples
            matches = []
            for idx, score in enumerate(similarities):
                score_float = float(score)
                if score_float >= threshold:
                    symptom_code = self.symptom_names[idx]
                    matches.append((symptom_code, score_float))
            
            # Sort by similarity score (highest first)
            matches.sort(key=lambda x: x[1], reverse=True)
            
            return matches
            
        except Exception as e:
            print(f"⚠️  Error in semantic matching: {e}")
            return []

if __name__ == "__main__":
    # Quick test
    engine = SmartTriageEngine('knowledge_base_enhanced.csv')
    result = engine.diagnose("Dog", ["vomiting", "diarrhea", "lethargy"])
    print(f"Success! Symptoms analyzed: {result['symptoms_analyzed']}")