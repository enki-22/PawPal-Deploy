#!/usr/bin/env python3
"""
Generate structured training data from disease_symptom_profiles.json
Creates 30 realistic variations per disease while preserving vet-verified symptoms
"""

import json
import csv
import random
from collections import defaultdict

# CANONICAL SYMPTOMS (69 total)
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

def validate_symptoms(symptoms_list):
    """Validate that all symptoms are in canonical list"""
    invalid = [s for s in symptoms_list if s not in CANONICAL_SYMPTOMS]
    return invalid

def standardize_species(species_str):
    """Standardize species names"""
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

def generate_variations_for_disease(disease_name, profile, num_variations=30):
    """
    Generate realistic variations while preserving vet-verified symptoms
    
    Strategy:
    - Samples 0-9: Early stage (fewer symptoms, milder urgency)
    - Samples 10-19: Mid stage (moderate symptoms, baseline urgency)
    - Samples 20-29: Advanced stage (more symptoms, severe urgency)
    """
    variations = []
    base_symptoms = profile['symptoms']
    species_list = profile['species']
    base_urgency = profile['urgency']
    contagious = profile['contagious']
    
    # Validate symptoms
    invalid_symptoms = validate_symptoms(base_symptoms)
    if invalid_symptoms:
        print(f"⚠️  {disease_name}: Invalid symptoms: {invalid_symptoms}")
        return []
    
    # Ensure we have at least 3 symptoms
    if len(base_symptoms) < 3:
        print(f"⚠️  {disease_name}: Only {len(base_symptoms)} symptoms, needs manual review")
        return []
    
    # Generate variations with different symptom combinations
    for i in range(num_variations):
        # Determine stage and symptom count
        if i < 10:  # Early stage (samples 0-9)
            # Fewer symptoms, milder urgency
            symptom_count = min(random.randint(3, 4), len(base_symptoms))
            if base_urgency in ['severe', 'high', 'emergency']:
                urgency_variant = 'moderate'
            elif base_urgency == 'moderate':
                urgency_variant = 'mild'
            else:
                urgency_variant = base_urgency
                
        elif i < 20:  # Mid stage (samples 10-19)
            # Moderate symptoms, baseline urgency
            symptom_count = min(random.randint(4, 6), len(base_symptoms))
            urgency_variant = base_urgency
            
        else:  # Advanced stage (samples 20-29)
            # More symptoms, severe urgency
            symptom_count = min(random.randint(5, 7), len(base_symptoms))
            if base_urgency in ['mild', 'moderate']:
                urgency_variant = 'severe'
            else:
                urgency_variant = base_urgency
        
        # Select symptoms
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
        
        # Randomly select species if multiple
        if len(species_list) > 1:
            species = random.choice(species_list)
        else:
            species = species_list[0]
        
        # Standardize species name
        species = standardize_species(species)
        
        # Create training sample
        variation = {
            'species': species,
            'disease': disease_name,
            'symptoms': ', '.join(selected_symptoms),
            'urgency': urgency_variant,
            'contagious': contagious,
            'source': 'structured_from_vet_verified'
        }
        
        variations.append(variation)
    
    return variations

# Load disease profiles
print("Loading disease profiles...")
try:
    with open('disease_symptom_profiles.json', 'r') as f:
        disease_profiles = json.load(f)
    print(f"✓ Loaded {len(disease_profiles)} disease profiles")
except FileNotFoundError:
    print("ERROR: disease_symptom_profiles.json not found!")
    exit(1)

# Generate training data for all diseases
print("\nGenerating training variations...")
all_training_data = []
diseases_with_issues = []
total_variations_generated = 0

for disease_name, profile in sorted(disease_profiles.items()):
    variations = generate_variations_for_disease(disease_name, profile, num_variations=30)
    
    if len(variations) < 30:
        diseases_with_issues.append((disease_name, len(variations)))
    
    all_training_data.extend(variations)
    total_variations_generated += len(variations)
    
    if len(variations) > 0:
        print(f"  ✓ {disease_name}: {len(variations)} variations")

print(f"\n✓ Generated {total_variations_generated} total training samples")

# Quality checks
print("\n" + "="*70)
print("TRAINING DATA QUALITY REPORT")
print("="*70)

# Count by disease
disease_counts = defaultdict(int)
for sample in all_training_data:
    disease_counts[sample['disease']] += 1

# Count by species
species_counts = defaultdict(int)
for sample in all_training_data:
    species_counts[sample['species']] += 1

# Count by urgency
urgency_counts = defaultdict(int)
for sample in all_training_data:
    urgency_counts[sample['urgency']] += 1

# Count by contagious
contagious_counts = defaultdict(int)
for sample in all_training_data:
    contagious_counts[sample['contagious']] += 1

# Symptom statistics
symptom_counts = []
for sample in all_training_data:
    count = len(sample['symptoms'].split(', '))
    symptom_counts.append(count)

print(f"\nTotal samples: {len(all_training_data)}")
print(f"Unique diseases: {len(disease_counts)}")
print(f"Unique species: {len(species_counts)}")

print(f"\nDisease coverage:")
diseases_with_30 = sum(1 for count in disease_counts.values() if count == 30)
print(f"  Diseases with exactly 30 samples: {diseases_with_30}/{len(disease_counts)}")

print(f"\nSpecies distribution:")
for species in sorted(species_counts.keys()):
    count = species_counts[species]
    pct = 100 * count / len(all_training_data)
    print(f"  {species}: {count} ({pct:.1f}%)")

print(f"\nUrgency distribution:")
for urgency in sorted(urgency_counts.keys()):
    count = urgency_counts[urgency]
    pct = 100 * count / len(all_training_data)
    print(f"  {urgency}: {count} ({pct:.1f}%)")

print(f"\nContagious status:")
for status in sorted(contagious_counts.keys()):
    count = contagious_counts[status]
    pct = 100 * count / len(all_training_data)
    print(f"  {status}: {count} ({pct:.1f}%)")

print(f"\nSymptom count statistics:")
min_symptoms = min(symptom_counts)
max_symptoms = max(symptom_counts)
avg_symptoms = sum(symptom_counts) / len(symptom_counts)
print(f"  Min: {min_symptoms}")
print(f"  Max: {max_symptoms}")
print(f"  Average: {avg_symptoms:.1f}")
print(f"  Samples with <3 symptoms: {sum(1 for c in symptom_counts if c < 3)}")
print(f"  Samples with 3-5 symptoms: {sum(1 for c in symptom_counts if 3 <= c <= 5)}")
print(f"  Samples with >5 symptoms: {sum(1 for c in symptom_counts if c > 5)}")

# Report issues
if diseases_with_issues:
    print(f"\n⚠️  Diseases with <30 samples ({len(diseases_with_issues)}):")
    for disease, count in sorted(diseases_with_issues):
        print(f"  {disease}: {count} samples")

# Save to CSV
print(f"\n" + "="*70)
print("SAVING TRAINING DATA")
print("="*70)

output_file = 'structured_training_from_vet_verified.csv'
try:
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in all_training_data:
            writer.writerow(sample)
    
    print(f"✓ Saved {len(all_training_data)} samples to: {output_file}")
    
except Exception as e:
    print(f"ERROR saving CSV: {e}")
    exit(1)

# Summary
print(f"\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Input: disease_symptom_profiles.json ({len(disease_profiles)} diseases)")
print(f"Output: {output_file} ({len(all_training_data)} samples)")
print(f"Average samples per disease: {len(all_training_data) / len(disease_profiles):.1f}")
print(f"Data source: Vet-verified symptom associations")
print(f"Quality: {diseases_with_30}/{len(disease_counts)} diseases with exactly 30 samples")
print(f"\n✓ Training data generation complete!")
