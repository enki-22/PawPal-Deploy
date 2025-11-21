#!/usr/bin/env python3
"""
Source of Truth Sync Script
Synchronizes knowledge_base_enhanced.csv with vet-verified overhaul.md
"""

import csv
import json
import re
from collections import defaultdict

# ============================================================================
# STEP 1: PARSE THE SOURCE OF TRUTH (.md)
# ============================================================================

def parse_overhaul_md(md_file='overhaul.md'):
    """
    Parse overhaul.md to extract disease → symptoms mapping
    
    Returns:
        dict: {
            'disease_name': {
                'species': 'Dog|Cat|...',
                'symptoms': ['symptom1', 'symptom2', ...]
            }
        }
    """
    print("="*70)
    print("STEP 1: Parsing Source of Truth (overhaul.md)")
    print("="*70)
    
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    diseases = {}
    current_species = None
    current_disease = None
    current_symptoms = []
    
    lines = content.split('\n')
    
    for line in lines:
        line_stripped = line.strip()
        
        # Detect species header (emoji + species name)
        if line_stripped.startswith('🐶'):
            current_species = 'Dog'
        elif line_stripped.startswith('🐱'):
            current_species = 'Cat'
        elif line_stripped.startswith('🐰'):
            current_species = 'Rabbit'
        elif line_stripped.startswith('🐹'):
            current_species = 'Hamster'
        elif line_stripped.startswith('🐦'):
            current_species = 'Bird'
        elif line_stripped.startswith('🐢'):
            current_species = 'Turtle'
        elif line_stripped.startswith('🐠'):
            current_species = 'Fish'
        
        # Detect disease entry (starts with •)
        elif line_stripped.startswith('•'):
            # Save previous disease if exists
            if current_disease and current_symptoms:
                diseases[current_disease] = {
                    'species': current_species,
                    'symptoms': current_symptoms.copy()
                }
            
            # Extract disease name (remove • and preview symptoms in parentheses)
            disease_line = line_stripped[1:].strip()  # Remove •
            # Extract name before parentheses
            match = re.match(r'([^(]+)', disease_line)
            if match:
                current_disease = match.group(1).strip()
                current_symptoms = []
        
        # Detect symptom line (starts with -, --, Tab, or plain text in disease block)
        elif line_stripped and current_disease:
            # Skip if it's a new species/disease/empty/section header
            if not line_stripped.startswith('🐶') and \
               not line_stripped.startswith('🐱') and \
               not line_stripped.startswith('🐰') and \
               not line_stripped.startswith('🐹') and \
               not line_stripped.startswith('🐦') and \
               not line_stripped.startswith('🐢') and \
               not line_stripped.startswith('🐠') and \
               not line_stripped.startswith('Keep') and \
               not line_stripped.startswith('Add') and \
               not line_stripped.startswith('Remove'):
                
                # Extract symptom text (handle dashes, bullets, tabs)
                symptom_text = line_stripped.lstrip('-\t •').strip()
                
                # Skip empty lines or headers/metadata
                if symptom_text and len(symptom_text) > 0:
                    # Clean and normalize
                    symptom_clean = clean_symptom(symptom_text)
                    if symptom_clean:
                        current_symptoms.append(symptom_clean)
    
    # Save last disease
    if current_disease and current_symptoms:
        diseases[current_disease] = {
            'species': current_species,
            'symptoms': current_symptoms.copy()
        }
    
    print(f"✓ Parsed {len(diseases)} diseases from overhaul.md")
    print(f"✓ Species covered: {set(d['species'] for d in diseases.values())}")
    
    return diseases

def clean_symptom(text):
    """
    Clean symptom text: lowercase, remove special chars, replace spaces with underscores
    """
    # Skip contextual lines
    skip_phrases = [
        'after', 'some dogs', 'long term', 'in severe', 'severe cases',
        'cutaneous', 'splenic', 'intestinal', 'visceral', 'may'
    ]
    if any(phrase in text.lower() for phrase in skip_phrases):
        return None
    
    # Remove parenthetical notes
    text = re.sub(r'\([^)]*\)', '', text)
    
    # Basic cleaning
    text = text.lower()
    text = text.strip()
    
    # Remove special characters but keep important ones
    text = re.sub(r'["\']', '', text)
    text = re.sub(r'[/]', '_or_', text)
    
    # Replace spaces and hyphens with underscores
    text = re.sub(r'[\s-]+', '_', text)
    
    # Remove trailing/leading underscores
    text = text.strip('_')
    
    # Skip if too long (likely a sentence, not a symptom)
    if len(text) > 50:
        return None
    
    # Skip empty
    if not text or text == '_':
        return None
    
    return text

# ============================================================================
# STEP 2: UPDATE THE DATABASE (.csv)
# ============================================================================

def sync_csv_with_source(csv_file, diseases_dict, output_file='knowledge_base_final.csv'):
    """
    Update CSV with symptoms from source of truth
    """
    print("\n" + "="*70)
    print("STEP 2: Syncing CSV with Source of Truth")
    print("="*70)
    
    # Load CSV
    rows = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✓ Loaded {len(rows)} rows from {csv_file}")
    
    # Sync
    matched_count = 0
    updated_rows = []
    
    for row in rows:
        disease_name = row['disease'].strip()
        
        # Try to find match in source
        if disease_name in diseases_dict:
            # OVERWRITE symptoms with source of truth
            source_data = diseases_dict[disease_name]
            row['symptoms'] = ', '.join(source_data['symptoms'])
            row['species'] = source_data['species']
            matched_count += 1
            print(f"  ✓ Updated: {disease_name} ({len(source_data['symptoms'])} symptoms)")
        
        updated_rows.append(row)
    
    # Write output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(updated_rows)
    
    print(f"\n✓ Synced {matched_count}/{len(rows)} diseases")
    print(f"✓ Saved to: {output_file}")
    
    return updated_rows

# ============================================================================
# STEP 3: GAP ANALYSIS
# ============================================================================

def analyze_gaps(csv_rows, symptom_map_file='symptom_map.json'):
    """
    Identify symptoms in CSV that are NOT in symptom_map.json
    """
    print("\n" + "="*70)
    print("STEP 3: Gap Analysis - New/Unmapped Symptoms")
    print("="*70)
    
    # Load existing symptom map
    try:
        with open(symptom_map_file, 'r', encoding='utf-8') as f:
            symptom_map = json.load(f)
        mapped_symptoms = set(symptom_map.keys())
        print(f"✓ Loaded {len(mapped_symptoms)} mapped symptoms from {symptom_map_file}")
    except FileNotFoundError:
        mapped_symptoms = set()
        print(f"⚠ {symptom_map_file} not found, treating all as unmapped")
    
    # Collect all symptoms from CSV
    all_csv_symptoms = set()
    for row in csv_rows:
        symptoms_str = row.get('symptoms', '')
        symptoms = [s.strip() for s in symptoms_str.split(',') if s.strip()]
        all_csv_symptoms.update(symptoms)
    
    # Find gaps
    unmapped = all_csv_symptoms - mapped_symptoms
    
    print(f"\n📊 Summary:")
    print(f"  Total symptoms in CSV: {len(all_csv_symptoms)}")
    print(f"  Already mapped: {len(all_csv_symptoms & mapped_symptoms)}")
    print(f"  NEW/UNMAPPED: {len(unmapped)}")
    
    if unmapped:
        print(f"\n⚠ NEW SYMPTOMS NEED MAPPING:")
        print(f"{'='*70}")
        sorted_unmapped = sorted(unmapped)
        for i, symptom in enumerate(sorted_unmapped, 1):
            print(f"{i:3}. {symptom}")
        
        # Save to file for easy reference
        with open('unmapped_symptoms.txt', 'w', encoding='utf-8') as f:
            f.write("NEW/UNMAPPED SYMPTOMS\n")
            f.write("="*70 + "\n\n")
            for symptom in sorted_unmapped:
                f.write(f"- {symptom}\n")
        
        print(f"\n✓ Saved to: unmapped_symptoms.txt")
    else:
        print(f"\n✅ All symptoms are already mapped!")
    
    return unmapped

# ============================================================================
# STEP 4: MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("SOURCE OF TRUTH SYNC - BULK UPDATE")
    print("="*70 + "\n")
    
    # Step 1: Parse markdown
    diseases = parse_overhaul_md('overhaul.md')
    
    # Step 2: Sync CSV
    updated_rows = sync_csv_with_source('knowledge_base_enhanced.csv', diseases)
    
    # Step 3: Gap analysis
    unmapped = analyze_gaps(updated_rows)
    
    print("\n" + "="*70)
    print("SYNC COMPLETE!")
    print("="*70)
    print(f"✓ Output: knowledge_base_final.csv")
    print(f"✓ Unmapped symptoms: {len(unmapped)}")
    if unmapped:
        print(f"✓ See: unmapped_symptoms.txt")
    print("="*70 + "\n")
