"""
New Diseases Variation Generator
Generates 30 variations per disease by:
- Shuffling symptom order
- Selecting different symptom combinations (3-7 symptoms)
- Adding severity modifiers
- Creating realistic clinical presentations
"""

import pandas as pd
import random
import numpy as np

# Severity modifiers to add natural variation
SEVERITY_MODIFIERS = {
    'fever': ['mild fever', 'high fever', 'fever above 40°C', 'intermittent fever', 'fever that comes and goes'],
    'lethargy': ['mild lethargy', 'extreme lethargy', 'lethargy and weakness', 'severe weakness', 'complete exhaustion'],
    'appetite': ['reduced appetite', 'complete loss of appetite', 'loss of appetite', 'refusing to eat', 'selective eating'],
    'discharge': ['clear discharge', 'yellow discharge', 'green discharge', 'thick discharge', 'mucoid discharge'],
    'pain': ['mild pain', 'severe pain', 'obvious pain', 'pain on touch', 'signs of discomfort'],
    'breathing': ['difficulty breathing', 'labored breathing', 'rapid breathing', 'shallow breathing', 'gasping'],
}

def parse_symptoms(symptom_string):
    """Parse comma-separated symptoms into list"""
    if pd.isna(symptom_string):
        return []
    return [s.strip() for s in symptom_string.split(',')]

def vary_symptom(symptom):
    """Apply natural language variations to a symptom"""
    symptom_lower = symptom.lower()
    
    # Check for severity modifiers
    for key, variations in SEVERITY_MODIFIERS.items():
        if key in symptom_lower:
            return random.choice(variations + [symptom])
    
    return symptom

def generate_variations(row, num_variations=30):
    """Generate variations of a disease entry"""
    base_symptoms = parse_symptoms(row['symptoms'])
    variations = []
    
    # Ensure we have at least 3 symptoms
    if len(base_symptoms) < 3:
        print(f"Warning: {row['disease']} for {row['species']} has fewer than 3 symptoms. Using all available.")
        # Still create variations but with all symptoms
        for i in range(num_variations):
            varied_symptoms = [
                vary_symptom(s) if random.random() < 0.3 else s 
                for s in base_symptoms
            ]
            random.shuffle(varied_symptoms)
            
            variation = row.copy()
            variation['symptoms'] = ', '.join(varied_symptoms)
            variation['source'] = f'variation_{i+1}'
            variations.append(variation)
        return variations
    
    for i in range(num_variations):
        # Randomly select 3-7 symptoms (or all if less than 7)
        num_symptoms = random.randint(3, min(7, len(base_symptoms)))
        selected_symptoms = random.sample(base_symptoms, num_symptoms)
        
        # Apply variations to some symptoms (30% chance)
        varied_symptoms = [
            vary_symptom(s) if random.random() < 0.3 else s 
            for s in selected_symptoms
        ]
        
        # Shuffle order
        random.shuffle(varied_symptoms)
        
        # Create variation
        variation = row.copy()
        variation['symptoms'] = ', '.join(varied_symptoms)
        variation['source'] = f'variation_{i+1}'
        variations.append(variation)
    
    return variations

def main():
    print("=" * 60)
    print("NEW DISEASES VARIATION GENERATOR")
    print("=" * 60)
    
    # Load base diseases
    input_file = 'new_diseases_base.csv'
    output_file = 'new_diseases_enriched.csv'
    
    try:
        df = pd.read_csv(input_file)
        print(f"✓ Loaded {len(df)} diseases from {input_file}")
    except FileNotFoundError:
        print(f"ERROR: {input_file} not found!")
        print("Please run the parser script first.")
        return
    
    print(f"\nBase dataset:")
    print(f"  - Diseases: {len(df)}")
    print(f"  - Species: {df['species'].nunique()}")
    print(f"  - Avg symptoms: {df['symptoms'].str.count(',').add(1).mean():.1f}")
    
    # Generate variations
    print(f"\nGenerating 30 variations per disease...")
    all_variations = []
    
    for idx, row in df.iterrows():
        variations = generate_variations(row, num_variations=30)
        all_variations.extend(variations)
        if (idx + 1) % 10 == 0:
            print(f"  Processed {idx + 1}/{len(df)} diseases...")
    
    # Create full dataset
    df_full = pd.DataFrame(all_variations)
    
    print(f"\n✓ Generated {len(df_full)} total samples")
    print(f"\nFinal dataset statistics:")
    print(f"  - Total samples: {len(df_full)}")
    print(f"  - Samples per disease: {len(df_full) / df['disease'].nunique():.0f}")
    print(f"  - Species distribution:")
    print(df_full['species'].value_counts().to_string())
    
    # Save
    df_full.to_csv(output_file, index=False)
    print(f"\n✓ Saved to {output_file}")
    
    # Preview
    print(f"\nSample variations for first disease:")
    first_disease = df_full[df_full['disease'] == df_full['disease'].iloc[0]].head(3)
    for idx, row in first_disease.iterrows():
        print(f"\n{row['species']} - {row['disease']}:")
        print(f"  {row['symptoms']}")
    
    print("\n" + "=" * 60)
    print("NEXT STEP: MERGE WITH MAIN DATASET")
    print("=" * 60)
    print(f"Run this command to merge:")
    print(f"")
    print(f"df_main = pd.read_csv('pet_disease_dataset_enriched.csv')")
    print(f"df_new = pd.read_csv('{output_file}')")
    print(f"df_combined = pd.concat([df_main, df_new], ignore_index=True)")
    print(f"df_combined.to_csv('pet_disease_dataset_final.csv', index=False)")
    print(f"")
    print(f"Your final dataset will have: {len(df_full)} new samples!")
    print("=" * 60)

if __name__ == "__main__":
    random.seed(42)  # For reproducibility
    np.random.seed(42)
    main()