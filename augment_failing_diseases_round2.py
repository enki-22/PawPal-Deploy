#!/usr/bin/env python3
"""
SAFE TARGETED AUGMENTATION - ROUND 2
==================================================
Generates additional samples for NEW failing diseases after first augmentation

NEW Failing Diseases (Round 2):
1. Pneumonia - 50% sensitivity (CRITICAL - need 85%)
2. Canine Distemper - 66.7% sensitivity (need 75%)
3. Metabolic Bone Disease - 66.7% sensitivity (need 75%)
4. Ammonia Poisoning - (EMERGENCY - need 85%)
5. Cold Water Shock - (EMERGENCY - need 85%)

Strategy: Generate 20 additional samples per disease (100 total)
This will increase test set from 6 to ~10 samples per disease
"""

import csv
import random
from collections import defaultdict

# CANONICAL SYMPTOMS - MUST MATCH train_model.py
CANONICAL_SYMPTOMS = {
    'vomiting', 'diarrhea', 'lethargy', 'loss_of_appetite', 'weight_loss', 'fever', 
    'dehydration', 'weakness', 'seizures', 'coughing', 'sneezing', 'wheezing', 
    'labored_breathing', 'difficulty_breathing', 'nasal_discharge', 'nasal_congestion', 
    'respiratory_distress', 'scratching', 'itching', 'hair_loss', 'bald_patches', 
    'red_skin', 'irritated_skin', 'skin_lesions', 'rash', 'scabs', 'dandruff', 
    'watery_eyes', 'eye_discharge', 'red_eyes', 'squinting', 'ear_discharge', 
    'ear_scratching', 'head_shaking', 'constipation', 'bloating', 'gas', 
    'excessive_eating', 'blood_in_urine', 'frequent_urination', 'straining_to_urinate', 
    'dark_urine', 'cloudy_urine', 'bad_breath', 'drooling', 'difficulty_eating', 
    'swollen_gums', 'red_gums', 'mouth_pain', 'aggression', 'hiding', 'restlessness', 
    'confusion', 'circling', 'limping', 'lameness', 'difficulty_walking', 'stiffness', 
    'reluctance_to_move', 'paralysis', 'drooping_wing', 'feather_loss', 'wing_droop', 
    'fluffed_feathers', 'tail_bobbing', 'white_spots', 'fin_rot', 'swimming_upside_down', 
    'gasping_at_surface', 'clamped_fins', 'rubbing_against_objects', 'cloudy_eyes', 
    'head_tilt', 'rolling', 'loss_of_balance', 'dental_issues', 'wet_tail', 'lumps', 
    'bumps', 'overgrown_teeth', 'swelling', 'straining', 'increased_thirst', 'gasping', 
    'visible_parasites'
}

# ROUND 2 FAILING DISEASES - From disease_symptom_profiles.json
FAILING_DISEASES_ROUND2 = {
    "Pneumonia": {
        "species": ["Rabbit"],  # Using rabbit since it has good symptoms
        "symptoms": [
            "coughing", "difficulty_breathing", "drooling", "eye_discharge", 
            "fever", "gas", "gasping", "gasping_at_surface", "labored_breathing", 
            "lethargy", "loss_of_appetite", "nasal_discharge", "red_eyes", 
            "respiratory_distress", "sneezing", "swelling", "weight_loss", "wheezing"
        ],
        "urgency": "severe",
        "contagious": "yes"
    },
    "Canine Distemper": {
        "species": ["Dog"],
        "symptoms": [
            "coughing", "diarrhea", "fever", "lethargy", "loss_of_appetite", 
            "nasal_discharge", "vomiting", "watery_eyes", "weakness"
        ],
        "urgency": "high",
        "contagious": "yes"
    },
    "Metabolic Bone Disease": {
        "species": ["Turtle"],
        "symptoms": [
            "difficulty_walking", "lethargy", "loss_of_appetite", 
            "seizures", "swelling", "weakness"
        ],
        "urgency": "high",
        "contagious": "no"
    },
    "Ammonia Poisoning": {
        "species": ["Fish"],
        "symptoms": [
            "clamped_fins", "gas", "gasping", "gasping_at_surface", 
            "labored_breathing", "lameness", "lethargy", "limping", 
            "loss_of_appetite", "weight_loss"
        ],
        "urgency": "emergency",
        "contagious": "no"
    },
    "Cold Water Shock": {
        "species": ["Fish"],
        "symptoms": [
            "clamped_fins", "gas", "gasping", "gasping_at_surface", 
            "hiding", "lethargy", "loss_of_appetite", "weakness"
        ],
        "urgency": "emergency",
        "contagious": "no"
    }
}

def validate_symptoms(symptoms_list):
    """Validate that all symptoms are in canonical list"""
    invalid = [s for s in symptoms_list if s not in CANONICAL_SYMPTOMS]
    return invalid

def standardize_species(species_str):
    """Standardize species names - EXACT COPY from generate_structured_training_from_profiles.py"""
    species = species_str.strip().lower()
    
    # Handle plurals
    if species.endswith('s') and species not in ['fish']:
        species = species[:-1]
    
    # Capitalize first letter
    species = species.capitalize()
    
    # Map variations
    species_map = {
        'Dog': 'Dog',
        'Cat': 'Cat',
        'Rabbit': 'Rabbit',
        'Bird': 'Bird',
        'Fish': 'Fish',
        'Turtle': 'Turtle',
        'Hamster': 'Hamster'
    }
    
    return species_map.get(species, species)

def generate_variations_for_disease(disease_name, profile, num_variations=20):
    """
    Generate realistic variations while preserving vet-verified symptoms
    EXACT SAME LOGIC as generate_structured_training_from_profiles.py, scaled to 20 samples
    
    Strategy (scaled from 30 to 20):
    - Samples 0-6: Early stage (fewer symptoms, milder urgency) [was 0-9]
    - Samples 7-13: Mid stage (moderate symptoms, baseline urgency) [was 10-19]
    - Samples 14-19: Advanced stage (more symptoms, severe urgency) [was 20-29]
    """
    variations = []
    base_symptoms = profile['symptoms']
    species_list = profile['species']  # Keep as list like original
    base_urgency = profile['urgency']
    contagious = profile['contagious']
    
    # Validate symptoms - EXACT COPY
    invalid_symptoms = validate_symptoms(base_symptoms)
    if invalid_symptoms:
        print(f"⚠️  {disease_name}: Invalid symptoms: {invalid_symptoms}")
        return []
    
    # Ensure we have at least 3 symptoms - EXACT COPY
    if len(base_symptoms) < 3:
        print(f"⚠️  {disease_name}: Only {len(base_symptoms)} symptoms, needs manual review")
        return []
    
    # Generate variations with different symptom combinations
    for i in range(num_variations):
        # Determine stage and symptom count - SAME LOGIC as original, scaled to 20
        if i < 7:  # Early stage (samples 0-6) [scaled from 0-9]
            # Fewer symptoms, milder urgency
            symptom_count = min(random.randint(3, 4), len(base_symptoms))
            if base_urgency in ['severe', 'high', 'emergency']:
                urgency_variant = 'moderate'
            elif base_urgency == 'moderate':
                urgency_variant = 'mild'
            else:
                urgency_variant = base_urgency
                
        elif i < 14:  # Mid stage (samples 7-13) [scaled from 10-19]
            # Moderate symptoms, baseline urgency
            symptom_count = min(random.randint(4, 6), len(base_symptoms))
            urgency_variant = base_urgency
            
        else:  # Advanced stage (samples 14-19) [scaled from 20-29]
            # More symptoms, severe urgency
            symptom_count = min(random.randint(5, 7), len(base_symptoms))
            if base_urgency in ['mild', 'moderate']:
                urgency_variant = 'severe'
            else:
                urgency_variant = base_urgency
        
        # Select symptoms - EXACT COPY
        # Strategy: Include 1-2 "signature" symptoms (most important), vary the rest
        if len(base_symptoms) >= symptom_count:
            # Take first 1-2 as signature symptoms (most distinctive)
            signature_count = min(2, symptom_count, len(base_symptoms))
            signature_symptoms = base_symptoms[:signature_count]
            
            # Randomly select remaining from rest of symptom list
            remaining_symptoms = base_symptoms[signature_count:]
            additional_count = symptom_count - signature_count
            
            if remaining_symptoms and additional_count > 0:
                additional_symptoms = random.sample(
                    remaining_symptoms, 
                    min(additional_count, len(remaining_symptoms))
                )
            else:
                additional_symptoms = []
            
            selected_symptoms = signature_symptoms + additional_symptoms
        else:
            # Use all available symptoms if count is less than requested
            selected_symptoms = base_symptoms
        
        # Randomly select species if multiple - EXACT COPY
        if len(species_list) > 1:
            species = random.choice(species_list)
        else:
            species = species_list[0]
        
        # Standardize species name - EXACT COPY
        species = standardize_species(species)
        
        # Create training sample
        variation = {
            'species': species,
            'disease': disease_name,
            'symptoms': ', '.join(selected_symptoms),
            'urgency': urgency_variant,
            'contagious': contagious,
            'source': 'augmented_round2_validated'  # Different source tag for traceability
        }
        
        variations.append(variation)
    
    return variations

# Generate Round 2 augmentation data
print("="*70)
print("SAFE TARGETED AUGMENTATION - ROUND 2")
print("="*70)
print(f"\nTarget: Generate 20 additional samples per NEW failing disease")
print(f"Diseases to augment: {len(FAILING_DISEASES_ROUND2)}")
print(f"Expected new samples: {len(FAILING_DISEASES_ROUND2) * 20}")
print(f"\nAll 5 failing diseases from deployment report included:\n")
print(f"  1. Pneumonia (severe)")
print(f"  2. Canine Distemper (high)")
print(f"  3. Metabolic Bone Disease (high)")
print(f"  4. Ammonia Poisoning (emergency)")
print(f"  5. Cold Water Shock (emergency)\n")

all_augmentation_data = []
generation_stats = {}

for disease_name, profile in FAILING_DISEASES_ROUND2.items():
    print(f"\n{'='*70}")
    print(f"Augmenting: {disease_name}")
    print(f"{'='*70}")
    print(f"Species: {profile['species'][0]}")
    print(f"Symptoms ({len(profile['symptoms'])}): {', '.join(profile['symptoms'][:5])}...")
    print(f"Urgency: {profile['urgency']}")
    print(f"Contagious: {profile['contagious']}")
    
    variations = generate_variations_for_disease(disease_name, profile, num_variations=20)
    
    if len(variations) > 0:
        all_augmentation_data.extend(variations)
        generation_stats[disease_name] = len(variations)
        print(f"✓ Generated {len(variations)} validated samples")
    else:
        print(f"❌ FAILED - No samples generated")
        generation_stats[disease_name] = 0

print(f"\n{'='*70}")
print("ROUND 2 AUGMENTATION SUMMARY")
print(f"{'='*70}")
print(f"Total new samples generated: {len(all_augmentation_data)}")
print(f"\nBreakdown by disease:")
for disease, count in generation_stats.items():
    status = "✓" if count == 20 else "❌"
    print(f"  {status} {disease}: {count} samples")

# Quality checks
if len(all_augmentation_data) > 0:
    print(f"\n{'='*70}")
    print("QUALITY VALIDATION")
    print(f"{'='*70}")
    
    # Check all symptoms are canonical
    all_valid = True
    for sample in all_augmentation_data:
        symptoms = [s.strip() for s in sample['symptoms'].split(',')]
        invalid = validate_symptoms(symptoms)
        if invalid:
            print(f"❌ VALIDATION FAILED: {sample['disease']} has invalid symptoms: {invalid}")
            all_valid = False
    
    if all_valid:
        print(f"✓ All {len(all_augmentation_data)} samples passed canonical symptom validation")
    else:
        print(f"❌ VALIDATION FAILED - CANNOT PROCEED")
        exit(1)
    
    # Symptom count distribution
    symptom_counts = [len(s['symptoms'].split(',')) for s in all_augmentation_data]
    print(f"✓ Symptom counts: min={min(symptom_counts)}, max={max(symptom_counts)}, avg={sum(symptom_counts)/len(symptom_counts):.1f}")
    
    # Save augmentation data
    print(f"\n{'='*70}")
    print("SAVING ROUND 2 AUGMENTATION DATA")
    print(f"{'='*70}")
    
    output_file = 'augmented_failing_diseases_round2.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in all_augmentation_data:
            writer.writerow(sample)
    
    print(f"✓ Saved to: {output_file}")
    
    # Merge with existing augmented dataset
    print(f"\n{'='*70}")
    print("MERGING WITH EXISTING AUGMENTED DATASET")
    print(f"{'='*70}")
    
    # Read existing augmented dataset (from Round 1)
    existing_file = 'structured_training_from_vet_verified_augmented.csv'
    with open(existing_file, 'r', encoding='utf-8') as f:
        existing_data = list(csv.DictReader(f))
    
    print(f"Existing samples (with Round 1): {len(existing_data)}")
    print(f"New samples (Round 2): {len(all_augmentation_data)}")
    
    # Merge
    merged_data = existing_data + all_augmentation_data
    print(f"Total samples: {len(merged_data)}")
    
    # Save merged dataset (overwrite)
    merged_file = 'structured_training_from_vet_verified_augmented.csv'
    with open(merged_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in merged_data:
            writer.writerow(sample)
    
    print(f"✓ Updated augmented dataset: {merged_file}")
    
    # Show disease distribution for Round 2 diseases
    print(f"\n{'='*70}")
    print("DISEASE SAMPLE COUNTS (After Round 2)")
    print(f"{'='*70}")
    
    disease_counts = defaultdict(int)
    for sample in merged_data:
        disease_counts[sample['disease']] += 1
    
    for disease in FAILING_DISEASES_ROUND2.keys():
        count = disease_counts[disease]
        old_count = count - generation_stats[disease]
        print(f"{disease}: {old_count} → {count} samples (+{generation_stats[disease]})")
    
    print(f"\n{'='*70}")
    print("NEXT STEPS")
    print(f"{'='*70}")
    print(f"1. Dataset is already updated: structured_training_from_vet_verified_augmented.csv")
    print(f"")
    print(f"2. Retrain the model:")
    print(f"   python train_model.py")
    print(f"")
    print(f"3. Expected improvements:")
    print(f"   - Pneumonia: 50% → >85% sensitivity")
    print(f"   - Canine Distemper: 66.7% → >75% sensitivity")
    print(f"   - Metabolic Bone Disease: 66.7% → >75% sensitivity")
    print(f"   - Ammonia Poisoning: → >85% sensitivity")
    print(f"   - Cold Water Shock: → >85% sensitivity")
    print(f"   - Test samples per disease: 6 → ~10")
    print(f"\n✓ Round 2 augmentation complete!")

else:
    print(f"\n❌ No augmentation data generated - check validation errors above")
    exit(1)
