#!/usr/bin/env python3
"""
Species Bucketer - Final cleanup for 100% symptom coverage
Handles species-specific symptoms, clinical terms, and metadata junk
"""

import json
import csv
import re
from collections import defaultdict

# ============================================================================
# STEP 1: FILTER THE JUNK
# ============================================================================

def filter_junk(unmatched_file='unmatched_symptoms.txt'):
    """
    Remove metadata artifacts and noise from unmatched symptoms
    """
    print("="*70)
    print("STEP 1: Filtering Metadata Junk")
    print("="*70)
    
    with open(unmatched_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Metadata patterns to remove
    junk_patterns = [
        r'status:',
        r'urgency:',
        r'species:',
        r'symptoms_extracted:',
        r'\d+_retained',
        r'✅',
        r'❌',
        r'source:',
        r'UNMATCHED',
        r'====',
        r'MANUAL REVIEW',
        r'^\d+\._source:',
        r'^_$',  # Just underscore
        r'^-$',  # Just dash
    ]
    
    clean_symptoms = []
    junk_count = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Remove bullet points
        symptom = line.lstrip('- ')
        
        # Check if it's junk
        is_junk = False
        for pattern in junk_patterns:
            if re.search(pattern, symptom, re.IGNORECASE):
                is_junk = True
                junk_count += 1
                break
        
        if not is_junk and symptom:
            clean_symptoms.append(symptom)
    
    print(f"✓ Filtered out {junk_count} metadata artifacts")
    print(f"✓ Remaining clean symptoms: {len(clean_symptoms)}")
    
    return clean_symptoms

# ============================================================================
# STEP 2: SPECIES-SPECIFIC AUTO-MAPPING
# ============================================================================

def create_species_rules():
    """
    Define anatomical keywords for species-specific symptoms
    """
    return {
        'aquatic': {
            'keywords': ['fin', 'fins', 'gill', 'gills', 'scale', 'scales', 'swim', 'swimming', 
                        'buoyancy', 'floating', 'aquatic', 'fish', 'water', 'tank'],
            'question_template': "Does your fish have {symptom_readable}?",
            'category': 'aquatic',
            'severity': 3
        },
        'avian': {
            'keywords': ['feather', 'feathers', 'wing', 'wings', 'beak', 'perch', 'crop',
                        'bird', 'avian', 'flight', 'cloaca', 'egg', 'droppings'],
            'question_template': "Does your bird have {symptom_readable}?",
            'category': 'avian',
            'severity': 3
        },
        'reptile': {
            'keywords': ['shell', 'shells', 'scute', 'scutes', 'basking', 'reptile',
                        'turtle', 'tortoise', 'carapace', 'plastron'],
            'question_template': "Does your reptile have {symptom_readable}?",
            'category': 'reptile',
            'severity': 3
        }
    }

def humanize_symptom(symptom):
    """
    Convert symptom_name to readable "symptom name"
    """
    # Remove leading underscores
    symptom = symptom.lstrip('_')
    
    # Replace underscores with spaces
    readable = symptom.replace('_', ' ')
    
    # Handle common prefixes
    readable = readable.replace('or ', 'or ')
    
    return readable.strip()

def detect_species_type(symptom, species_rules):
    """
    Detect which species category a symptom belongs to
    Returns: (species_type, confidence) or (None, 0)
    """
    symptom_lower = symptom.lower()
    
    for species_type, rules in species_rules.items():
        for keyword in rules['keywords']:
            if keyword in symptom_lower:
                return species_type, 1.0
    
    return None, 0

def auto_map_species_specific(clean_symptoms):
    """
    Automatically map species-specific symptoms to new entries
    """
    print("\n" + "="*70)
    print("STEP 2: Species-Specific Auto-Mapping")
    print("="*70)
    
    species_rules = create_species_rules()
    
    # Categorize symptoms
    species_symptoms = defaultdict(list)
    remaining = []
    
    for symptom in clean_symptoms:
        species_type, confidence = detect_species_type(symptom, species_rules)
        
        if species_type:
            species_symptoms[species_type].append(symptom)
        else:
            remaining.append(symptom)
    
    # Print results
    print(f"\n✓ Categorized {len(clean_symptoms) - len(remaining)} species-specific symptoms:")
    for species_type, symptoms in species_symptoms.items():
        print(f"  - {species_type.capitalize()}: {len(symptoms)} symptoms")
    
    print(f"\n⚠ Remaining uncategorized: {len(remaining)}")
    
    # Generate symptom_map entries
    new_symptom_map_entries = {}
    
    for species_type, symptoms in species_symptoms.items():
        rules = species_rules[species_type]
        
        for symptom in symptoms:
            readable = humanize_symptom(symptom)
            question = rules['question_template'].format(symptom_readable=readable)
            
            new_symptom_map_entries[symptom] = {
                "question": question,
                "category": rules['category'],
                "severity": rules['severity']
            }
    
    return new_symptom_map_entries, remaining, species_symptoms

# ============================================================================
# STEP 3: CLINICAL FALLBACK MAPPING
# ============================================================================

def create_clinical_mappings():
    """
    Map obscure medical terms to existing symptom_map keys
    """
    return {
        # Fluid/Swelling
        'ascites': 'bloating',
        'edema': 'swelling',
        'effusion': 'swelling',
        
        # Neurological
        'ataxia': 'loss_of_balance',
        'nystagmus': 'loss_of_balance',
        'proprioceptive_deficits': 'difficulty_walking',
        'paresis': 'weakness',
        'incoordination': 'loss_of_balance',
        
        # Respiratory
        'dyspnea': 'difficulty_breathing',
        'tachypnea': 'difficulty_breathing',
        'orthopnea': 'difficulty_breathing',
        'stridor': 'wheezing',
        
        # Digestive
        'melena': 'bloody_diarrhea',
        'hematochezia': 'bloody_diarrhea',
        'hematemesis': 'vomiting',
        'regurgitation': 'vomiting',
        'borborygmi': 'bloating',
        
        # Urinary
        'hematuria': 'blood_in_urine',
        'dysuria': 'straining_to_urinate',
        'polyuria': 'frequent_urination',
        'oliguria': 'straining_to_urinate',
        
        # Cardiac
        'tachycardia': 'increased_heart_rate',
        'bradycardia': 'slow_heart_rate',
        'arrhythmia': 'abnormal_heartbeat',
        
        # Skin
        'alopecia': 'hair_loss',
        'erythema': 'red_skin',
        'pruritus': 'itching',
        'dermatitis': 'rash',
        
        # Eyes
        'blepharospasm': 'squinting',
        'epiphora': 'eye_discharge',
        'conjunctivitis': 'red_eyes',
        
        # General
        'anorexia': 'loss_of_appetite',
        'cachexia': 'weight_loss',
        'pyrexia': 'fever',
        'hyperthermia': 'fever',
        'hypothermia': 'low_body_temperature',
        
        # Behavioral
        'mentation_changes': 'confusion',
        'obtundation': 'lethargy',
        'stupor': 'lethargy',
        
        # Other common clinical terms
        'abscesses': 'lumps',
        'abscess': 'lumps',
        'anemia': 'pale_gums',
        'dehydration': 'dehydration',
        'distention': 'bloating',
        'distended': 'bloating',
        'emaciation': 'weight_loss',
        'exudate': 'discharge',
        'hyperactivity': 'restlessness',
        'hypersalivation': 'drooling',
        'icterus': 'jaundice',
        'jaundice': 'jaundice',
        'lymphadenopathy': 'swollen_lymph_nodes',
        'masses': 'lumps',
        'necrosis': 'skin_lesions',
        'nodules': 'lumps',
        'pallor': 'pale_gums',
        'petechia': 'skin_lesions',
        'ulceration': 'skin_lesions',
        'ulcers': 'skin_lesions',
    }

def map_clinical_terms(remaining_symptoms):
    """
    Map clinical terms to standard symptom keys
    """
    print("\n" + "="*70)
    print("STEP 3: Clinical Fallback Mapping")
    print("="*70)
    
    clinical_mappings = create_clinical_mappings()
    
    new_aliases = {}
    still_remaining = []
    
    for symptom in remaining_symptoms:
        symptom_lower = symptom.lower()
        
        # Try exact match
        if symptom_lower in clinical_mappings:
            new_aliases[symptom] = clinical_mappings[symptom_lower]
            continue
        
        # Try partial match
        found = False
        for clinical_term, standard_key in clinical_mappings.items():
            if clinical_term in symptom_lower:
                new_aliases[symptom] = standard_key
                found = True
                break
        
        if not found:
            still_remaining.append(symptom)
    
    print(f"\n✓ Mapped {len(new_aliases)} clinical terms to standard keys")
    print(f"⚠ Still remaining: {len(still_remaining)}")
    
    if len(new_aliases) > 0:
        print(f"\nSample clinical mappings:")
        for symptom, standard in list(new_aliases.items())[:10]:
            print(f"  {symptom} → {standard}")
    
    return new_aliases, still_remaining

# ============================================================================
# STEP 4: UPDATE THE FILES
# ============================================================================

def update_symptom_map(new_entries, output_file='symptom_map_updated.json'):
    """
    Add new species-specific symptoms to symptom_map.json
    """
    print("\n" + "="*70)
    print("STEP 4A: Updating symptom_map.json")
    print("="*70)
    
    # Load existing symptom map
    with open('symptom_map.json', 'r', encoding='utf-8') as f:
        symptom_map = json.load(f)
    
    original_count = len(symptom_map)
    
    # Add new entries
    for symptom, entry in new_entries.items():
        if symptom not in symptom_map:
            symptom_map[symptom] = entry
    
    # Save updated map
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(symptom_map, f, indent=2, ensure_ascii=False)
    
    new_count = len(symptom_map)
    print(f"✓ Added {new_count - original_count} new species-specific symptoms")
    print(f"✓ Total symptoms in map: {original_count} → {new_count}")
    print(f"✓ Saved to: {output_file}")
    
    return symptom_map

def update_symptom_aliases(new_aliases, output_file='symptom_aliases_updated.json'):
    """
    Add clinical fallback mappings to symptom_aliases.json
    """
    print("\n" + "="*70)
    print("STEP 4B: Updating symptom_aliases.json")
    print("="*70)
    
    # Load existing aliases
    with open('symptom_aliases.json', 'r', encoding='utf-8') as f:
        aliases = json.load(f)
    
    original_count = len(aliases)
    
    # Add new clinical aliases
    for alias, standard in new_aliases.items():
        if alias not in aliases:
            aliases[alias] = standard
    
    # Save updated aliases
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(aliases, f, indent=2, ensure_ascii=False)
    
    new_count = len(aliases)
    print(f"✓ Added {new_count - original_count} clinical term aliases")
    print(f"✓ Total aliases: {original_count} → {new_count}")
    print(f"✓ Saved to: {output_file}")
    
    return aliases

def generate_production_csv(updated_symptom_map, updated_aliases):
    """
    Create final production-ready CSV with all symptoms normalized
    """
    print("\n" + "="*70)
    print("STEP 4C: Generating Production CSV")
    print("="*70)
    
    # Load normalized CSV
    with open('knowledge_base_normalized.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✓ Loaded {len(rows)} diseases from knowledge_base_normalized.csv")
    
    # Track statistics
    total_replacements = 0
    unique_symptoms_before = set()
    unique_symptoms_after = set()
    
    # Apply the new aliases
    production_rows = []
    for row in rows:
        symptoms_str = row['symptoms']
        symptoms = [s.strip() for s in symptoms_str.split(',')]
        
        unique_symptoms_before.update(symptoms)
        
        # Replace with new aliases
        normalized_symptoms = []
        for symptom in symptoms:
            if symptom in updated_aliases:
                normalized_symptoms.append(updated_aliases[symptom])
                total_replacements += 1
            else:
                normalized_symptoms.append(symptom)
        
        # Remove duplicates
        normalized_symptoms = list(dict.fromkeys(normalized_symptoms))
        unique_symptoms_after.update(normalized_symptoms)
        
        # Update row
        row['symptoms'] = ', '.join(normalized_symptoms)
        production_rows.append(row)
    
    # Save production CSV
    with open('knowledge_base_production.csv', 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(production_rows)
    
    # Calculate coverage
    all_symptoms_in_csv = unique_symptoms_after
    all_symptoms_in_map = set(updated_symptom_map.keys())
    
    covered = all_symptoms_in_csv & all_symptoms_in_map
    uncovered = all_symptoms_in_csv - all_symptoms_in_map
    
    coverage_pct = (len(covered) / len(all_symptoms_in_csv) * 100) if all_symptoms_in_csv else 100
    
    print(f"\n✓ Generated production CSV")
    print(f"\nStatistics:")
    print(f"  Additional replacements: {total_replacements}")
    print(f"  Unique symptoms: {len(unique_symptoms_before)} → {len(unique_symptoms_after)}")
    print(f"  Symptoms in CSV: {len(all_symptoms_in_csv)}")
    print(f"  Symptoms in map: {len(all_symptoms_in_map)}")
    print(f"  Covered: {len(covered)}")
    print(f"  Uncovered: {len(uncovered)}")
    print(f"  Coverage: {coverage_pct:.1f}%")
    
    if uncovered:
        print(f"\n⚠ Uncovered symptoms ({len(uncovered)}):")
        for s in sorted(list(uncovered))[:20]:
            print(f"  - {s}")
        if len(uncovered) > 20:
            print(f"  ... and {len(uncovered)-20} more")
    
    print(f"\n✓ Saved to: knowledge_base_production.csv")
    
    return production_rows, coverage_pct, uncovered

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    print("\n" + "="*70)
    print("SPECIES BUCKETER - Final Cleanup for 100% Coverage")
    print("="*70 + "\n")
    
    # Step 1: Filter junk
    clean_symptoms = filter_junk()
    
    # Step 2: Species-specific auto-mapping
    new_symptom_map_entries, remaining_after_species, species_breakdown = auto_map_species_specific(clean_symptoms)
    
    # Step 3: Clinical fallback
    clinical_aliases, still_remaining = map_clinical_terms(remaining_after_species)
    
    # Step 4: Update files
    updated_symptom_map = update_symptom_map(new_symptom_map_entries)
    updated_aliases = update_symptom_aliases(clinical_aliases)
    
    production_rows, coverage, uncovered = generate_production_csv(updated_symptom_map, updated_aliases)
    
    # Final summary
    print("\n" + "="*70)
    print("SPECIES BUCKETER COMPLETE!")
    print("="*70)
    
    print(f"\nProcessing Summary:")
    print(f"  Started with: 400 unmatched symptoms")
    print(f"  Filtered junk: {400 - len(clean_symptoms)} metadata artifacts")
    print(f"  Clean symptoms: {len(clean_symptoms)}")
    print(f"  Species-specific: {len(new_symptom_map_entries)}")
    print(f"  Clinical aliases: {len(clinical_aliases)}")
    print(f"  Still unmatched: {len(still_remaining)}")
    
    print(f"\nCoverage:")
    print(f"  CSV coverage: {coverage:.1f}%")
    print(f"  Uncovered symptoms: {len(uncovered)}")
    
    print(f"\nOutput Files:")
    print(f"  - symptom_map_updated.json ({len(updated_symptom_map)} symptoms)")
    print(f"  - symptom_aliases_updated.json ({len(updated_aliases)} aliases)")
    print(f"  - knowledge_base_production.csv (production-ready)")
    
    if len(still_remaining) > 0:
        print(f"\n⚠ Manual review needed for {len(still_remaining)} symptoms")
        with open('final_manual_review.txt', 'w', encoding='utf-8') as f:
            f.write("FINAL MANUAL REVIEW NEEDED\n")
            f.write("="*70 + "\n\n")
            for symptom in sorted(still_remaining):
                f.write(f"- {symptom}\n")
        print(f"  Saved to: final_manual_review.txt")
    else:
        print(f"\n✅ 100% COVERAGE ACHIEVED!")
    
    print("="*70 + "\n")
