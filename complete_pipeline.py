"""
COMPLETE DATASET ENRICHMENT PIPELINE
====================================
Step 1: Parse research notes → base CSV
Step 2: Generate 30 variations per disease
Step 3: Merge with existing dataset
Step 4: Balance and prepare for training

Usage:
    python complete_pipeline.py --notes disease_research_notes.txt --existing pet_disease_dataset.csv
"""

import pandas as pd
import re
import random
import numpy as np
from pathlib import Path
import argparse

# ============================================================================
# STEP 1: PARSE RESEARCH NOTES
# ============================================================================

def parse_research_notes(file_path):
    """Parse structured disease notes into base DataFrame"""
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()
    
    diseases = []
    entries = re.split(r'\n\s*Disease:\s*', text)
    
    for entry in entries[1:]:
        try:
            lines = entry.strip().split('\n')
            disease_name = lines[0].strip('[]').strip()
            
            species_match = re.search(r'Species:\s*\[?([^\n\]]+)', entry)
            if not species_match:
                continue
            species = species_match.group(1).strip()
            
            symptom_section = re.search(
                r'FINAL SYMPTOM LIST[^\n]*:\s*\n(.*?)\nUrgency:', 
                entry, re.DOTALL | re.IGNORECASE
            )
            if not symptom_section:
                continue
            
            symptom_text = symptom_section.group(1)
            symptoms = re.findall(r'•\s*([^\n]+)', symptom_text)
            
            symptoms_clean = []
            for s in symptoms:
                clean = re.sub(r'\([^)]*\)', '', s)
                clean = re.split(r'[/—]', clean)[0].strip()
                if clean and len(clean) > 3:
                    symptoms_clean.append(clean)
            
            urgency_match = re.search(r'Urgency:\s*(\w+)', entry, re.IGNORECASE)
            urgency = urgency_match.group(1).strip().lower() if urgency_match else 'medium'
            if urgency == 'emergency':
                urgency = 'high'
            
            contagious_match = re.search(r'Contagious:\s*(\w+)', entry, re.IGNORECASE)
            contagious = contagious_match.group(1).strip().lower() if contagious_match else 'no'
            
            if symptoms_clean:
                diseases.append({
                    'species': species,
                    'disease': disease_name,
                    'symptoms': ', '.join(symptoms_clean),
                    'urgency': urgency,
                    'contagious': contagious,
                    'source': 'research_base'
                })
                
        except Exception as e:
            continue
    
    return pd.DataFrame(diseases)

# ============================================================================
# STEP 2: GENERATE VARIATIONS
# ============================================================================

SEVERITY_MODIFIERS = {
    'fever': ['mild fever', 'high fever', 'fever above 40°C', 'intermittent fever', 'fever that comes and goes'],
    'lethargy': ['mild lethargy', 'extreme lethargy', 'lethargy and weakness', 'severe weakness', 'complete exhaustion'],
    'appetite': ['reduced appetite', 'complete loss of appetite', 'loss of appetite', 'refusing to eat', 'selective eating'],
    'discharge': ['clear discharge', 'yellow discharge', 'green discharge', 'thick discharge', 'mucoid discharge'],
    'pain': ['mild pain', 'severe pain', 'obvious pain', 'pain on touch', 'signs of discomfort'],
    'breathing': ['difficulty breathing', 'labored breathing', 'rapid breathing', 'shallow breathing', 'gasping'],
}

def vary_symptom(symptom):
    """Apply natural variations to symptom"""
    symptom_lower = symptom.lower()
    for key, variations in SEVERITY_MODIFIERS.items():
        if key in symptom_lower:
            return random.choice(variations + [symptom])
    return symptom

def generate_variations(df_base, num_variations=30):
    """Generate variations for all diseases"""
    all_variations = []
    
    for idx, row in df_base.iterrows():
        base_symptoms = [s.strip() for s in row['symptoms'].split(',')]
        
        if len(base_symptoms) < 3:
            continue
        
        for i in range(num_variations):
            num_symptoms = random.randint(3, min(7, len(base_symptoms)))
            selected_symptoms = random.sample(base_symptoms, num_symptoms)
            
            varied_symptoms = [
                vary_symptom(s) if random.random() < 0.3 else s 
                for s in selected_symptoms
            ]
            random.shuffle(varied_symptoms)
            
            variation = row.copy()
            variation['symptoms'] = ', '.join(varied_symptoms)
            variation['source'] = f'variation_{i+1}'
            all_variations.append(variation)
    
    return pd.DataFrame(all_variations)

# ============================================================================
# STEP 3: MERGE AND BALANCE
# ============================================================================

def merge_and_balance(df_old, df_new):
    """Merge datasets and balance classes"""
    
    # Combine
    df_combined = pd.concat([df_old, df_new], ignore_index=True)
    
    # Remove exact duplicates
    df_combined = df_combined.drop_duplicates(subset=['species', 'disease', 'symptoms'])
    
    # Balance classes (optional - sample to max of 50 per disease)
    balanced_dfs = []
    for disease in df_combined['disease'].unique():
        disease_df = df_combined[df_combined['disease'] == disease]
        if len(disease_df) > 50:
            disease_df = disease_df.sample(n=50, random_state=42)
        balanced_dfs.append(disease_df)
    
    df_balanced = pd.concat(balanced_dfs, ignore_index=True)
    
    return df_balanced

# ============================================================================
# MAIN PIPELINE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description='PawPal Dataset Enrichment Pipeline')
    parser.add_argument('--notes', default='disease_research_notes.txt', help='Research notes file')
    parser.add_argument('--existing', default='pet_disease_dataset.csv', help='Existing dataset CSV')
    parser.add_argument('--variations', type=int, default=30, help='Number of variations per disease')
    args = parser.parse_args()
    
    print("=" * 80)
    print("PAWPAL DATASET ENRICHMENT PIPELINE")
    print("=" * 80)
    
    # Step 1: Parse notes
    print("\n[STEP 1/4] Parsing research notes...")
    df_base = parse_research_notes(args.notes)
    print(f"✓ Parsed {len(df_base)} new diseases")
    print(f"  Species: {df_base['species'].nunique()}")
    print(f"  Diseases: {df_base['disease'].nunique()}")
    
    # Step 2: Generate variations
    print(f"\n[STEP 2/4] Generating {args.variations} variations per disease...")
    df_enriched = generate_variations(df_base, num_variations=args.variations)
    print(f"✓ Generated {len(df_enriched)} total samples")
    
    # Step 3: Load existing dataset
    print(f"\n[STEP 3/4] Loading existing dataset...")
    df_existing = pd.read_csv(args.existing)
    print(f"✓ Loaded {len(df_existing)} existing samples")
    
    # Step 4: Merge and balance
    print(f"\n[STEP 4/4] Merging and balancing...")
    df_final = merge_and_balance(df_existing, df_enriched)
    print(f"✓ Final dataset: {len(df_final)} samples")
    
    # Save outputs
    df_base.to_csv('pawpal_enriched_base.csv', index=False)
    df_enriched.to_csv('pawpal_enriched_variations.csv', index=False)
    df_final.to_csv('pet_disease_dataset_enriched.csv', index=False)
    
    # Summary statistics
    print("\n" + "=" * 80)
    print("ENRICHMENT SUMMARY")
    print("=" * 80)
    print(f"Original dataset:     {len(df_existing):,} samples")
    print(f"New diseases added:   {df_base['disease'].nunique()}")
    print(f"Variations generated: {len(df_enriched):,} samples")
    print(f"Final dataset:        {len(df_final):,} samples")
    print(f"Total diseases:       {df_final['disease'].nunique()}")
    print(f"\nSpecies distribution:")
    print(df_final['species'].value_counts().to_string())
    
    print("\n" + "=" * 80)
    print("NEXT STEPS FOR 95% ACCURACY")
    print("=" * 80)
    print("1. Review pet_disease_dataset_enriched.csv")
    print("2. Retrain your model with this enriched dataset")
    print("3. Key improvements to implement:")
    print("   - Use TF-IDF or CountVectorizer for symptom encoding")
    print("   - Try ensemble methods (Random Forest + LightGBM + XGBoost)")
    print("   - Implement stratified cross-validation")
    print("   - Add symptom importance weighting")
    print("4. Expected accuracy: 85-95% (vs current 75%)")
    print("=" * 80)

if __name__ == "__main__":
    random.seed(42)
    np.random.seed(42)
    main()