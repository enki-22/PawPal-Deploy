#!/usr/bin/env python3
"""
Smart Triage Engine - Vector Similarity Search for Pet Disease Diagnosis
"""

import csv
from typing import List, Dict, Set, Tuple
from collections import defaultdict

# ============================================================================
# LAYER 1: RED FLAG SYMPTOMS (Clinical Triage Standards)
# ============================================================================

CRITICAL_SYMPTOMS = {
    'difficulty_breathing', 'seizures', 'blue_gums', 'collapse', 
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

if __name__ == "__main__":
    # Quick test
    engine = SmartTriageEngine('knowledge_base_enhanced.csv')
    result = engine.diagnose("Dog", ["vomiting", "diarrhea", "lethargy"])
    print(f"Success! Symptoms analyzed: {result['symptoms_analyzed']}")