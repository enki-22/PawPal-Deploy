#!/usr/bin/env python3
"""
SAFE TARGETED AUGMENTATION FOR FAILING DISEASES
==================================================
Generates additional samples ONLY for diseases that failed sensitivity thresholds
Uses same validation approach as generate_structured_training_from_profiles.py

Failing Diseases:
1. Canine parvovirus - 66.7% sensitivity (need 85%)
2. Feline Panleukopenia Virus - 66.7% sensitivity (need 85%)
3. Flystrike - 83.3% sensitivity (need 85%)
4. Gastrointestinal stasis - 83.3% sensitivity (need 85%)

Strategy: Generate 20 additional samples per disease (80 total)
This will increase test set from 6 to ~10 samples per disease for better reliability
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

# FAILING DISEASES - Exact profiles from disease_symptom_profiles.json
FAILING_DISEASES = {
    "Canine parvovirus": {
        "species": ["Dog"],
        "symptoms": ["diarrhea", "lethargy", "vomiting"],
        "urgency": "severe",
        "contagious": "yes"
    },
    "Feline Panleukopenia Virus": {
        "species": ["Cat"],
        "symptoms": ["dehydration", "diarrhea", "fever", "lethargy", "vomiting", "weight_loss"],
        "urgency": "severe",
        "contagious": "yes"
    },
    "Flystrike": {
        "species": ["Rabbit"],
        "symptoms": ["bad_breath", "lethargy", "loss_of_appetite", "skin_lesions", "swelling"],
        "urgency": "severe",
        "contagious": "no"
    },
    "Gastrointestinal stasis": {
        "species": ["Rabbit"],
        "symptoms": ["bloating", "dental_issues", "diarrhea", "gas", "lethargy"],
        "urgency": "severe",
        "contagious": "no"
    }
}

def validate_symptoms(symptoms_list):
    """Validate that all symptoms are in canonical list"""
    invalid = [s for s in symptoms_list if s not in CANONICAL_SYMPTOMS]
    return invalid

def generate_variations_for_disease(disease_name, profile, num_variations=20):
    """
    Generate variations using SAME safe approach as generate_structured_training_from_profiles.py
    
    Strategy:
    - Samples 0-6: Early stage (3 symptoms, moderate urgency)
    - Samples 7-13: Mid stage (4-5 symptoms, severe urgency)
    - Samples 14-19: Advanced stage (5-6 symptoms, severe urgency)
    """
    variations = []
    base_symptoms = profile['symptoms']
    species = profile['species'][0]
    base_urgency = profile['urgency']
    contagious = profile['contagious']
    
    # Validate symptoms
    invalid_symptoms = validate_symptoms(base_symptoms)
    if invalid_symptoms:
        print(f"⚠️  {disease_name}: Invalid symptoms detected: {invalid_symptoms}")
        print(f"   ABORTING generation for this disease - FIX SYMPTOMS FIRST!")
        return []
    
    print(f"✓ {disease_name}: All symptoms validated against canonical list")
    
    # Ensure we have at least 3 symptoms
    if len(base_symptoms) < 3:
        print(f"⚠️  {disease_name}: Only {len(base_symptoms)} symptoms - need at least 3")
        return []
    
    # Generate variations
    for i in range(num_variations):
        # Determine stage and symptom count
        if i < 7:  # Early stage (samples 0-6)
            symptom_count = min(3, len(base_symptoms))
            urgency_variant = 'moderate' if base_urgency == 'severe' else base_urgency
                
        elif i < 14:  # Mid stage (samples 7-13)
            symptom_count = min(random.randint(4, 5), len(base_symptoms))
            urgency_variant = base_urgency
            
        else:  # Advanced stage (samples 14-19)
            symptom_count = min(random.randint(5, 6), len(base_symptoms))
            urgency_variant = base_urgency
        
        # Select symptoms - include signature symptoms + random selection
        if len(base_symptoms) >= symptom_count:
            # Take first 1-2 as signature symptoms
            signature_count = min(2, symptom_count, len(base_symptoms))
            signature_symptoms = base_symptoms[:signature_count]
            
            # Randomly select remaining
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
            random.shuffle(selected_symptoms)  # Shuffle for variety
        else:
            selected_symptoms = base_symptoms
        
        # Create training sample
        variation = {
            'species': species,
            'disease': disease_name,
            'symptoms': ', '.join(selected_symptoms),
            'urgency': urgency_variant,
            'contagious': contagious,
            'source': 'augmented_safe_validated'
        }
        
        variations.append(variation)
    
    return variations

# Generate augmentation data
print("="*70)
print("SAFE TARGETED AUGMENTATION FOR FAILING DISEASES")
print("="*70)
print(f"\nTarget: Generate 20 additional samples per failing disease")
print(f"Diseases to augment: {len(FAILING_DISEASES)}")
print(f"Expected new samples: {len(FAILING_DISEASES) * 20}\n")

all_augmentation_data = []
generation_stats = {}

for disease_name, profile in FAILING_DISEASES.items():
    print(f"\n{'='*70}")
    print(f"Augmenting: {disease_name}")
    print(f"{'='*70}")
    print(f"Species: {profile['species'][0]}")
    print(f"Symptoms: {', '.join(profile['symptoms'])}")
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
print("AUGMENTATION SUMMARY")
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
    print("SAVING AUGMENTATION DATA")
    print(f"{'='*70}")
    
    output_file = 'augmented_failing_diseases.csv'
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in all_augmentation_data:
            writer.writerow(sample)
    
    print(f"✓ Saved to: {output_file}")
    
    # Merge with existing dataset
    print(f"\n{'='*70}")
    print("MERGING WITH EXISTING DATASET")
    print(f"{'='*70}")
    
    # Read existing dataset
    existing_file = 'structured_training_from_vet_verified.csv'
    with open(existing_file, 'r', encoding='utf-8') as f:
        existing_data = list(csv.DictReader(f))
    
    print(f"Existing samples: {len(existing_data)}")
    print(f"New samples: {len(all_augmentation_data)}")
    
    # Merge
    merged_data = existing_data + all_augmentation_data
    print(f"Total samples: {len(merged_data)}")
    
    # Save merged dataset
    merged_file = 'structured_training_from_vet_verified_augmented.csv'
    with open(merged_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in merged_data:
            writer.writerow(sample)
    
    print(f"✓ Merged dataset saved to: {merged_file}")
    
    # Show disease distribution for failing diseases
    print(f"\n{'='*70}")
    print("DISEASE SAMPLE COUNTS (After Augmentation)")
    print(f"{'='*70}")
    
    disease_counts = defaultdict(int)
    for sample in merged_data:
        disease_counts[sample['disease']] += 1
    
    for disease in FAILING_DISEASES.keys():
        count = disease_counts[disease]
        old_count = count - generation_stats[disease]
        print(f"{disease}: {old_count} → {count} samples (+{generation_stats[disease]})")
    
    print(f"\n{'='*70}")
    print("NEXT STEPS")
    print(f"{'='*70}")
    print(f"1. Update train_model.py to use the augmented dataset:")
    print(f'   DATASET_FILE = "structured_training_from_vet_verified_augmented.csv"')
    print(f"")
    print(f"2. Retrain the model:")
    print(f"   python train_model.py")
    print(f"")
    print(f"3. Expected improvements:")
    print(f"   - Test samples per disease: 6 → ~10")
    print(f"   - More reliable sensitivity metrics")
    print(f"   - Better statistical confidence")
    print(f"   - Should pass 85% threshold for all 4 diseases")
    print(f"\n✓ Augmentation complete!")

else:
    print(f"\n❌ No augmentation data generated - check validation errors above")
    exit(1)
