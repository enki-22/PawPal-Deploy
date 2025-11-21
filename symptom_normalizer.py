#!/usr/bin/env python3
"""
Symptom Normalizer - Maps 820 messy symptoms to 140 standard keys
Uses semantic matching, keyword rules, and fuzzy matching
"""

import json
import csv
import re
from difflib import SequenceMatcher
from collections import defaultdict

# ============================================================================
# STEP 1: LOAD THE DATA
# ============================================================================

def load_data():
    """Load unmapped symptoms and standard symptom map"""
    print("="*70)
    print("STEP 1: Loading Data")
    print("="*70)
    
    # Load unmapped symptoms
    with open('unmapped_symptoms.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    unmapped = []
    for line in lines:
        line = line.strip()
        # Extract symptom from lines like "1. symptom_name"
        if line and not line.startswith('NEW') and not line.startswith('='):
            # Remove bullet points and numbers
            symptom = re.sub(r'^\d+\.\s*', '', line)
            symptom = symptom.lstrip('- ')
            if symptom:
                unmapped.append(symptom)
    
    print(f"✓ Loaded {len(unmapped)} unmapped symptoms")
    
    # Load standard symptom map
    with open('symptom_map.json', 'r', encoding='utf-8') as f:
        symptom_map = json.load(f)
    
    standard_keys = list(symptom_map.keys())
    print(f"✓ Loaded {len(standard_keys)} standard symptom keys")
    
    return unmapped, standard_keys

# ============================================================================
# STEP 2: SEMANTIC MATCHING - THE MAGIC
# ============================================================================

def create_matching_rules():
    """
    Keyword-based matching rules for common symptom categories
    Returns: dict of {keyword_pattern: standard_key}
    """
    rules = {
        # Appetite/Eating
        'appetite|eating|anorexia|food|refusal_to_eat|lack_of_appetite': 'loss_of_appetite',
        
        # Vomiting
        'vomit|regurgit|throw.*up|projectile': 'vomiting',
        
        # Diarrhea
        'diarrhea|diarrhoea|loose.*stool|watery.*stool|fecal': 'diarrhea',
        
        # Bloody stool
        'blood.*stool|blood.*feces|bloody.*diarrhea|hemorrhagic': 'bloody_diarrhea',
        
        # Lethargy/Weakness
        'lethargy|lethargic|tired|fatigue|sluggish|inactive|decreased.*energy': 'lethargy',
        'weak|weakness|debilitat': 'weakness',
        
        # Breathing
        'breath|respirat|pant|wheez|gasp|dyspnea|labored': 'difficulty_breathing',
        'cough|hacking': 'coughing',
        'sneez': 'sneezing',
        
        # Eye symptoms
        'eye.*discharge|ocular.*discharge|watery.*eye': 'eye_discharge',
        'red.*eye|conjunctiv|eye.*inflammation': 'red_eyes',
        'cloudy.*eye|cataract': 'cloudy_eyes',
        'squint|blepharospasm': 'squinting',
        
        # Skin symptoms
        'itch|scratch|pruriti': 'itching',
        'hair.*loss|alopecia|bald|fur.*loss': 'hair_loss',
        'red.*skin|erythema|inflam.*skin': 'red_skin',
        'lesion|sore|ulcer|wound': 'skin_lesions',
        'rash|dermatitis': 'rash',
        'scab|crust': 'scabs',
        
        # Ear symptoms
        'ear.*discharge|otorrhea': 'ear_discharge',
        'ear.*scratch|ear.*itch': 'ear_scratching',
        'head.*shak': 'head_shaking',
        
        # Urinary
        'blood.*urine|hematuria': 'blood_in_urine',
        'frequent.*urinat|polyuria|urinat.*often': 'frequent_urination',
        'strain.*urinat|difficul.*urinat': 'straining_to_urinate',
        
        # Digestive
        'bloat|distend|gas': 'bloating',
        'constipat': 'constipation',
        'abdom.*pain|belly.*pain|stomach.*pain': 'abdominal_pain',
        
        # Nasal
        'nasal.*discharge|runny.*nose|rhinorrhea': 'nasal_discharge',
        'nasal.*congest': 'nasal_congestion',
        
        # Oral/Dental
        'bad.*breath|halitosis': 'bad_breath',
        'drool|salivat|hypersalivat': 'drooling',
        'gum|gingivit|periodontal': 'swollen_gums',
        
        # Movement
        'limp|lame': 'limping',
        'difficul.*walk|gait': 'difficulty_walking',
        'stiff|rigid': 'stiffness',
        'paralys|paresis': 'paralysis',
        
        # Neurological
        'seizure|convuls|fit': 'seizures',
        'aggress|attack': 'aggression',
        'confus|disorient': 'confusion',
        'head.*tilt': 'head_tilt',
        'circl': 'circling',
        
        # General
        'fever|pyrexia|hot': 'fever',
        'dehydrat': 'dehydration',
        'weight.*loss|emaciat|wasting': 'weight_loss',
        'weight.*gain|obes': 'weight_gain',
        'swell|edem': 'swelling',
        'lump|mass|tumor|growth': 'lumps',
        
        # Behavioral
        'hiding|hiding_away|withdrawal': 'hiding',
        'restless|pacing|anxious': 'restlessness',
        
        # Thirst
        'thirst|drink|polydipsia': 'increased_thirst',
    }
    
    return rules

def fuzzy_match(symptom, standard_key, threshold=0.7):
    """Calculate similarity between two strings"""
    ratio = SequenceMatcher(None, symptom, standard_key).ratio()
    return ratio >= threshold

def find_standard_key(unmapped_symptom, standard_keys, rules):
    """
    Try to find the standard key for an unmapped symptom
    Returns: (standard_key, match_type, confidence)
    """
    symptom_lower = unmapped_symptom.lower()
    
    # First: Check exact match
    if unmapped_symptom in standard_keys:
        return unmapped_symptom, 'exact', 1.0
    
    # Second: Check keyword rules (most reliable)
    for pattern, standard_key in rules.items():
        if re.search(pattern, symptom_lower):
            return standard_key, 'keyword', 0.9
    
    # Third: Fuzzy match against standard keys
    best_match = None
    best_ratio = 0.0
    
    for standard_key in standard_keys:
        ratio = SequenceMatcher(None, symptom_lower, standard_key.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = standard_key
    
    if best_ratio >= 0.8:  # High confidence threshold
        return best_match, 'fuzzy_high', best_ratio
    elif best_ratio >= 0.6:  # Medium confidence
        return best_match, 'fuzzy_medium', best_ratio
    
    # No match found
    return None, 'no_match', 0.0

def semantic_matching(unmapped, standard_keys):
    """
    Match unmapped symptoms to standard keys using semantic rules
    """
    print("\n" + "="*70)
    print("STEP 2: Semantic Matching")
    print("="*70)
    
    rules = create_matching_rules()
    print(f"✓ Created {len(rules)} keyword matching rules")
    
    # Match each unmapped symptom
    aliases = {}
    stats = defaultdict(int)
    unmatched = []
    
    for unmapped_symptom in unmapped:
        standard_key, match_type, confidence = find_standard_key(
            unmapped_symptom, standard_keys, rules
        )
        
        if standard_key:
            aliases[unmapped_symptom] = standard_key
            stats[match_type] += 1
        else:
            unmatched.append(unmapped_symptom)
    
    print(f"\n✓ Matched {len(aliases)}/{len(unmapped)} symptoms")
    print(f"\nMatch Statistics:")
    for match_type, count in sorted(stats.items()):
        print(f"  - {match_type}: {count}")
    
    print(f"\n⚠ Unmatched: {len(unmatched)} symptoms")
    if len(unmatched) <= 50:
        print("\nUnmatched symptoms:")
        for s in unmatched[:30]:
            print(f"  - {s}")
    
    return aliases, unmatched

# ============================================================================
# STEP 3: GENERATE THE ALIAS MAP
# ============================================================================

def save_alias_map(aliases, unmatched):
    """Save the alias map to JSON"""
    print("\n" + "="*70)
    print("STEP 3: Generate Alias Map")
    print("="*70)
    
    # Save aliases
    with open('symptom_aliases.json', 'w', encoding='utf-8') as f:
        json.dump(aliases, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Saved {len(aliases)} aliases to symptom_aliases.json")
    
    # Save unmatched for manual review
    with open('unmatched_symptoms.txt', 'w', encoding='utf-8') as f:
        f.write("UNMATCHED SYMPTOMS - MANUAL REVIEW NEEDED\n")
        f.write("="*70 + "\n\n")
        for symptom in sorted(unmatched):
            f.write(f"- {symptom}\n")
    
    print(f"✓ Saved {len(unmatched)} unmatched symptoms to unmatched_symptoms.txt")

# ============================================================================
# STEP 4: APPLY THE FIX TO THE CSV
# ============================================================================

def normalize_csv(aliases):
    """
    Apply aliases to knowledge_base_final.csv
    Replace all alias symptoms with standard keys
    """
    print("\n" + "="*70)
    print("STEP 4: Normalizing CSV")
    print("="*70)
    
    # Load CSV
    with open('knowledge_base_final.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✓ Loaded {len(rows)} diseases from knowledge_base_final.csv")
    
    # Track statistics
    total_symptoms_before = 0
    total_symptoms_after = 0
    replacements = 0
    unique_symptoms_before = set()
    unique_symptoms_after = set()
    
    # Normalize each row
    normalized_rows = []
    for row in rows:
        symptoms_str = row['symptoms']
        symptoms = [s.strip() for s in symptoms_str.split(',')]
        
        total_symptoms_before += len(symptoms)
        unique_symptoms_before.update(symptoms)
        
        # Replace aliases
        normalized_symptoms = []
        for symptom in symptoms:
            if symptom in aliases:
                normalized_symptoms.append(aliases[symptom])
                replacements += 1
            else:
                normalized_symptoms.append(symptom)
        
        # Remove duplicates (in case multiple aliases map to same standard key)
        normalized_symptoms = list(dict.fromkeys(normalized_symptoms))
        
        total_symptoms_after += len(normalized_symptoms)
        unique_symptoms_after.update(normalized_symptoms)
        
        # Update row
        row['symptoms'] = ', '.join(normalized_symptoms)
        normalized_rows.append(row)
    
    # Save normalized CSV
    with open('knowledge_base_normalized.csv', 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(normalized_rows)
    
    # Print statistics
    print(f"\n✓ Normalized {len(normalized_rows)} diseases")
    print(f"\nStatistics:")
    print(f"  Total symptom instances: {total_symptoms_before} → {total_symptoms_after}")
    print(f"  Replacements made: {replacements}")
    print(f"  Unique symptoms: {len(unique_symptoms_before)} → {len(unique_symptoms_after)}")
    print(f"  Reduction: {len(unique_symptoms_before) - len(unique_symptoms_after)} symptoms")
    print(f"  Compression: {(1 - len(unique_symptoms_after)/len(unique_symptoms_before))*100:.1f}%")
    
    print(f"\n✓ Saved to: knowledge_base_normalized.csv")
    
    return normalized_rows, unique_symptoms_before, unique_symptoms_after

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("SYMPTOM NORMALIZER - Semantic Matching Engine")
    print("="*70 + "\n")
    
    # Step 1: Load data
    unmapped, standard_keys = load_data()
    
    # Step 2: Semantic matching
    aliases, unmatched = semantic_matching(unmapped, standard_keys)
    
    # Step 3: Save alias map
    save_alias_map(aliases, unmatched)
    
    # Step 4: Normalize CSV
    normalized_rows, symptoms_before, symptoms_after = normalize_csv(aliases)
    
    # Final summary
    print("\n" + "="*70)
    print("NORMALIZATION COMPLETE!")
    print("="*70)
    print(f"✓ Mapped {len(aliases)} symptom aliases")
    print(f"✓ Reduced unique symptoms: {len(symptoms_before)} → {len(symptoms_after)}")
    print(f"✓ Compression rate: {(1 - len(symptoms_after)/len(symptoms_before))*100:.1f}%")
    print(f"⚠ Manual review needed: {len(unmatched)} symptoms")
    print("\nOutput Files:")
    print("  - symptom_aliases.json (alias map)")
    print("  - knowledge_base_normalized.csv (normalized database)")
    print("  - unmatched_symptoms.txt (manual review needed)")
    print("="*70 + "\n")
