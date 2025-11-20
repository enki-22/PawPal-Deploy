#!/usr/bin/env python3
"""
3X AUGMENTATION FOR OVERHAUL DISEASES
======================================
Generates 3 variations per disease from overhaul_converted.csv

Rules:
- DO: Shuffle symptom order, create different symptom combinations
- DON'T: Add new symptoms, mix symptoms from other diseases
- All variations use ONLY symptoms from the original disease
"""

import csv
import random

def augment_disease_3x(disease):
    """
    Create 3 variations of a disease by:
    1. Shuffling symptom order
    2. Creating different symptom combinations (subsets)
    3. Keeping all medical information accurate
    
    Rules:
    - DO NOT add new symptoms
    - DO NOT mix symptoms from other diseases
    - DO create different orderings and combinations
    """
    species = disease['species']
    disease_name = disease['disease']
    symptoms = disease['symptoms'].split(', ')
    urgency = disease['urgency']
    contagious = disease['contagious']
    source = disease['source']
    
    variations = []
    
    # Variation 1: Full symptom list, shuffled order
    symptoms_v1 = symptoms.copy()
    random.shuffle(symptoms_v1)
    variations.append({
        'species': species,
        'disease': disease_name,
        'symptoms': ', '.join(symptoms_v1),
        'urgency': urgency,
        'contagious': contagious,
        'source': f"{source}_augmented"
    })
    
    # Variation 2: 70-90% of symptoms, shuffled
    if len(symptoms) >= 3:
        # Take between 70-90% of symptoms, but at least 2
        num_symptoms = max(2, int(len(symptoms) * random.uniform(0.7, 0.9)))
        symptoms_v2 = random.sample(symptoms, num_symptoms)
        random.shuffle(symptoms_v2)
    else:
        # If less than 3 symptoms, just shuffle
        symptoms_v2 = symptoms.copy()
        random.shuffle(symptoms_v2)
    
    variations.append({
        'species': species,
        'disease': disease_name,
        'symptoms': ', '.join(symptoms_v2),
        'urgency': urgency,
        'contagious': contagious,
        'source': f"{source}_augmented"
    })
    
    # Variation 3: Different subset (60-80% if enough symptoms), shuffled
    if len(symptoms) >= 4:
        num_symptoms = max(2, int(len(symptoms) * random.uniform(0.6, 0.8)))
        # Ensure we get a different subset than v2
        attempts = 0
        while attempts < 10:
            symptoms_v3 = random.sample(symptoms, num_symptoms)
            if set(symptoms_v3) != set(symptoms_v2):  # Different from v2
                break
            attempts += 1
        random.shuffle(symptoms_v3)
    else:
        # If few symptoms, just create a different ordering
        symptoms_v3 = symptoms.copy()
        random.shuffle(symptoms_v3)
    
    variations.append({
        'species': species,
        'disease': disease_name,
        'symptoms': ', '.join(symptoms_v3),
        'urgency': urgency,
        'contagious': contagious,
        'source': f"{source}_augmented"
    })
    
    return variations

def augment_dataset(input_file, output_file):
    """Read diseases from CSV and create 3x augmented dataset."""
    diseases = []
    augmented_diseases = []
    
    # Read original diseases
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            diseases.append(row)
    
    print(f"📖 Read {len(diseases)} original diseases")
    
    # Set random seed for reproducibility
    random.seed(42)
    
    # Augment each disease 3x
    for disease in diseases:
        variations = augment_disease_3x(disease)
        augmented_diseases.extend(variations)
    
    print(f"✨ Generated {len(augmented_diseases)} augmented variations")
    
    # Write augmented dataset
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source'])
        writer.writeheader()
        writer.writerows(augmented_diseases)
    
    print(f"💾 Wrote {len(augmented_diseases)} rows to {output_file}")
    
    # Print stats
    species_count = {}
    for d in augmented_diseases:
        species_count[d['species']] = species_count.get(d['species'], 0) + 1
    
    print("\n📊 Augmented diseases per species:")
    for species, count in sorted(species_count.items()):
        print(f"  {species}: {count} variations ({count // 3} original)")
    
    print("\n✅ Augmentation complete!")
    print(f"\n📈 Dataset size: {len(diseases)} → {len(augmented_diseases)} (3x)")

if __name__ == "__main__":
    input_file = "overhaul_converted.csv"
    output_file = "overhaul_augmented_3x.csv"
    
    print("🔄 Starting 3x augmentation...\n")
    augment_dataset(input_file, output_file)
    
    print("\n🎯 Next step: Combine with existing training data if needed!")