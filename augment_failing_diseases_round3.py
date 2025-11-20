#!/usr/bin/env python3
"""
ROUND 3 AUGMENTATION - SAFE TARGETED DATA GENERATION
====================================================

Target: 5 critical diseases below safety threshold after Round 2

FAILING DISEASES (Post-Round 2):
1. Squamous Cell Carcinoma (Cat) - 83.3% sensitivity
2. Newcastle Disease (Bird) - 83.3% sensitivity  
3. Feline Panleukopenia Virus (Cat) - 80.0% sensitivity
4. Enteritis (Rabbit) - 83.3% sensitivity
5. Cold Water Shock (Fish) - 50.0% sensitivity ⚠️ CRITICAL

SAFETY PROTOCOL:
✅ DO: Generate 30 variations of existing vet-verified symptoms
✅ DO: Shuffle symptom order and combinations
✅ DO: Use stage-based symptom counts (early/mid/advanced)
❌ DON'T: Add new symptoms not in verified list
❌ DON'T: Create medically inaccurate descriptions
❌ DON'T: Mix symptoms from different diseases

This script mirrors generate_structured_training_from_profiles.py
but targets only the 5 failing diseases for focused improvement.
"""

import json
import csv
import random

# Set seed for reproducibility
random.seed(42)

# ============================================================
# DISEASE PROFILES - VET VERIFIED SYMPTOMS ONLY
# ============================================================
FAILING_DISEASES = {
    "Squamous Cell Carcinoma": {
        "species": ["Cat"],
        "symptoms": [
            "bad_breath",
            "dental_issues", 
            "drooling",
            "lumps",
            "skin_lesions",
            "weight_loss"
        ],
        "urgency": "severe",
        "contagious": "no"
    },
    "Newcastle Disease": {
        "species": ["Bird"],
        "symptoms": [
            "diarrhea",
            "difficulty_breathing",
            "eye_discharge",
            "nasal_discharge",
            "paralysis",
            "sneezing",
            "weight_loss"
        ],
        "urgency": "severe",
        "contagious": "yes"
    },
    "Feline Panleukopenia Virus": {
        "species": ["Cat"],
        "symptoms": [
            "dehydration",
            "diarrhea",
            "fever",
            "lethargy",
            "vomiting",
            "weight_loss"
        ],
        "urgency": "severe",
        "contagious": "yes"
    },
    "Enteritis": {
        "species": ["Rabbit"],
        "symptoms": [
            "bloating",
            "dehydration",
            "dental_issues",
            "diarrhea",
            "gas",
            "loss_of_appetite",
            "restlessness",
            "weight_loss"
        ],
        "urgency": "emergency",
        "contagious": "no"
    },
    "Cold Water Shock": {
        "species": ["Fish"],
        "symptoms": [
            "clamped_fins",
            "gas",
            "gasping",
            "gasping_at_surface",
            "hiding",
            "lethargy",
            "loss_of_appetite",
            "weakness"
        ],
        "urgency": "emergency",
        "contagious": "no"
    }
}

def standardize_species(species_name):
    """Standardize species names to match training expectations"""
    mapping = {
        'cat': 'Cat',
        'cats': 'Cat',
        'bird': 'Bird',
        'birds': 'Bird',
        'rabbit': 'Rabbit',
        'rabbits': 'Rabbit',
        'fish': 'Fish'
    }
    return mapping.get(species_name.lower(), species_name.capitalize())

def generate_variations_for_disease(disease_name, profile, num_variations=30):
    """
    Generate realistic variations while preserving vet-verified symptoms
    
    EXACT PATTERN from generate_structured_training_from_profiles.py:
    - Samples 0-9: Early stage (fewer symptoms, milder urgency)
    - Samples 10-19: Mid stage (moderate symptoms, baseline urgency)
    - Samples 20-29: Advanced stage (more symptoms, severe urgency)
    
    ✅ SAFE: Only uses symptoms from profile['symptoms']
    ✅ SAFE: Maintains medical accuracy through stage-based progression
    ✅ SAFE: Follows proven generation pattern
    """
    variations = []
    base_symptoms = profile['symptoms']
    species_list = profile['species']
    base_urgency = profile['urgency']
    contagious = profile['contagious']
    
    # Ensure we have enough symptoms
    if len(base_symptoms) < 3:
        print(f"⚠️  {disease_name}: Only {len(base_symptoms)} symptoms, skipping")
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
            'source': 'augmented_round3_validated'
        }
        
        variations.append(variation)
    
    return variations


def main():
    print("="*70)
    print("ROUND 3 AUGMENTATION - SAFE TARGETED GENERATION")
    print("="*70)
    print("\nTarget: 5 critical diseases below safety threshold")
    print("\nFailing Diseases:")
    for i, disease in enumerate(FAILING_DISEASES.keys(), 1):
        profile = FAILING_DISEASES[disease]
        print(f"  {i}. {disease} ({profile['species'][0]})")
        print(f"     Symptoms: {len(profile['symptoms'])}")
        print(f"     Urgency: {profile['urgency']}")
    
    print(f"\n{'='*70}")
    print("GENERATION STRATEGY")
    print(f"{'='*70}")
    print("✅ 30 variations per disease (150 total samples)")
    print("✅ Stage-based progression (early/mid/advanced)")
    print("✅ Only vet-verified symptoms from profiles")
    print("✅ Follows generate_structured_training_from_profiles.py pattern")
    print(f"{'='*70}\n")
    
    # Generate augmentation data
    all_augmentation_data = []
    
    for disease_name, profile in FAILING_DISEASES.items():
        print(f"\nGenerating variations for: {disease_name}")
        print(f"  Base symptoms: {', '.join(profile['symptoms'][:3])}...")
        print(f"  Total symptom pool: {len(profile['symptoms'])}")
        
        variations = generate_variations_for_disease(disease_name, profile, num_variations=30)
        
        if variations:
            all_augmentation_data.extend(variations)
            print(f"  ✓ Generated {len(variations)} variations")
            
            # Show symptom count distribution
            symptom_counts = [len(v['symptoms'].split(', ')) for v in variations]
            print(f"  Symptom range: {min(symptom_counts)}-{max(symptom_counts)}")
        else:
            print(f"  ⚠️  Skipped (insufficient symptoms)")
    
    # Summary
    print(f"\n{'='*70}")
    print("AUGMENTATION SUMMARY")
    print(f"{'='*70}")
    print(f"Total samples generated: {len(all_augmentation_data)}")
    print(f"Diseases augmented: {len(FAILING_DISEASES)}")
    print(f"Samples per disease: 30")
    
    # Quality checks
    print(f"\n{'='*70}")
    print("QUALITY VERIFICATION")
    print(f"{'='*70}")
    
    # Check all samples have required fields
    required_fields = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
    all_valid = all(all(field in sample for field in required_fields) for sample in all_augmentation_data)
    print(f"✓ All samples have required fields: {all_valid}")
    
    # Check symptom counts
    symptom_counts = [len(sample['symptoms'].split(', ')) for sample in all_augmentation_data]
    print(f"✓ Symptom count range: {min(symptom_counts)}-{max(symptom_counts)}")
    print(f"✓ Average symptoms per sample: {sum(symptom_counts)/len(symptom_counts):.1f}")
    
    # Check source tagging
    sources = set(sample['source'] for sample in all_augmentation_data)
    print(f"✓ Source tags: {sources}")
    
    print(f"\n{'='*70}")
    
    # Save augmentation data
    output_file = 'augmented_failing_diseases_round3.csv'
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
    
    # Read existing augmented dataset (includes Round 1 & Round 2)
    existing_file = 'structured_training_from_vet_verified_augmented_fixed.csv'
    with open(existing_file, 'r', encoding='utf-8') as f:
        existing_data = list(csv.DictReader(f))
    
    print(f"Existing samples (with Round 1 & 2): {len(existing_data)}")
    print(f"New samples (Round 3): {len(all_augmentation_data)}")
    
    # Merge
    merged_data = existing_data + all_augmentation_data
    print(f"Total samples: {len(merged_data)}")
    
    # Save merged dataset (overwrite)
    merged_file = 'structured_training_from_vet_verified_augmented_fixed.csv'
    with open(merged_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        
        writer.writeheader()
        for sample in merged_data:
            writer.writerow(sample)
    
    print(f"✓ Updated augmented dataset: {merged_file}")
    
    # Final summary
    print(f"\n{'='*70}")
    print("✅ ROUND 3 AUGMENTATION COMPLETE")
    print(f"{'='*70}")
    print("\nExpected Improvements:")
    print("  • Squamous Cell Carcinoma: 30→60 samples")
    print("  • Newcastle Disease: 30→60 samples")
    print("  • Feline Panleukopenia Virus: 50→80 samples")
    print("  • Enteritis: 30→60 samples")
    print("  • Cold Water Shock: 50→80 samples")
    print("\nNext Steps:")
    print("  1. Run: python train_model.py")
    print("  2. Verify sensitivity improvements for all 5 diseases")
    print("  3. Check if failures reduced from 5 to 0-2")
    print(f"\n{'='*70}\n")


if __name__ == "__main__":
    main()
