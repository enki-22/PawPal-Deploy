#!/usr/bin/env python3
"""
Full Stack Sync - Map all frontend keys to CSV keys
Synchronizes React component → symptom_aliases_final.json → Backend
"""

import json
import csv

def get_frontend_symptom_keys():
    """
    All symptom keys hard-coded in ConversationalSymptomChecker.jsx
    """
    return {
        # PRIMARY_SYMPTOMS_BY_CONCERN
        # Digestive Issues
        'vomiting': 'vomiting',  # Already in CSV
        'diarrhea': 'diarrhea',  # Already in CSV
        'loss_of_appetite': 'loss_of_appetite',  # Already in CSV
        'constipation': 'constipation',  # Already in CSV
        'weight_loss': 'weight_loss',  # Already in CSV
        'bloating': 'bloating',  # Already in CSV
        'gas': 'bloating',  # Map to bloating (same symptom)
        'excessive_eating': 'increased_appetite',  # Map to standard key
        
        # Respiratory Problems
        'coughing': 'coughing',  # Already in CSV
        'sneezing': 'sneezing',  # Already in CSV
        'wheezing': 'wheezing',  # Already in CSV
        'labored_breathing': 'difficulty_breathing',  # Already in CSV
        'difficulty_breathing': 'difficulty_breathing',  # Already in CSV
        'nasal_discharge': 'nasal_discharge',  # Already in CSV
        'nasal_congestion': 'nasal_discharge',  # Map to nasal_discharge
        'respiratory_distress': 'difficulty_breathing',  # Map to difficulty_breathing
        
        # Skin & Coat Issues
        'scratching': 'itching',  # Map to itching (same action)
        'itching': 'itching',  # Already in CSV
        'hair_loss': 'hair_loss',  # Already in CSV
        'bald_patches': 'hair_loss',  # Map to hair_loss
        'red_skin': 'red_skin',  # Already in CSV
        'irritated_skin': 'red_skin',  # Map to red_skin
        'skin_lesions': 'skin_lesions',  # Already in CSV
        'rash': 'skin_lesions',  # Map to skin_lesions
        'scabs': 'scabs',  # Already in CSV
        'dandruff': 'scabs',  # Map to scabs (scaling/crusting)
        
        # Behavioral Changes
        'lethargy': 'lethargy',  # Already in CSV
        'aggression': 'aggression',  # Already in CSV
        'hiding': 'hiding',  # Already in CSV
        'restlessness': 'restlessness',  # Already in CSV
        'confusion': 'confusion',  # Already in CSV
        'circling': 'circling',  # Already in CSV
        'weakness': 'weakness',  # Already in CSV
        'seizures': 'seizures',  # Already in CSV
        
        # Movement Problems
        'limping': 'limping',  # Already in CSV
        'lameness': 'limping',  # Map to limping
        'difficulty_walking': 'difficulty_walking',  # Already in CSV
        'stiffness': 'stiffness',  # Already in CSV
        'reluctance_to_move': 'lethargy',  # Map to lethargy (similar presentation)
        'paralysis': 'paralysis',  # Already in CSV
        
        # Eyes & Ears
        'watery_eyes': 'eye_discharge',  # Map to eye_discharge
        'eye_discharge': 'eye_discharge',  # Already in CSV
        'red_eyes': 'red_eyes',  # Already in CSV
        'squinting': 'squinting',  # Already in CSV
        'ear_discharge': 'ear_discharge',  # Already in CSV
        'ear_scratching': 'head_shaking',  # Map to head_shaking (related)
        'head_shaking': 'head_shaking',  # Already in CSV
        
        # Urinary Issues
        'blood_in_urine': 'blood_in_urine',  # Already in CSV
        'frequent_urination': 'frequent_urination',  # Already in CSV
        'straining_to_urinate': 'straining_to_urinate',  # Already in CSV
        'dark_urine': 'blood_in_urine',  # Map to blood_in_urine (closest for triage)
        'cloudy_urine': 'straining_to_urinate',  # Map to urinary issues indicator
        
        # Oral/Dental Problems
        'bad_breath': 'bad_breath',  # Already in CSV
        'drooling': 'drooling',  # Already in CSV
        'difficulty_eating': 'difficulty_eating',  # Already in CSV
        'swollen_gums': 'swollen_gums',  # Already in CSV
        'red_gums': 'swollen_gums',  # Map to swollen_gums (inflammation)
        'mouth_pain': 'mouth_pain',  # Already in CSV
        
        # GENERAL_ADDITIONAL_SYMPTOMS
        'fever': 'fever',  # Already in CSV
        'dehydration': 'dehydration',  # Already in CSV
        
        # SPECIES_SPECIFIC_SYMPTOMS - Bird
        'drooping_wing': 'drooping_wing',  # Already in CSV (species-specific)
        'feather_loss': 'feather_loss',  # Already in CSV (species-specific)
        'wing_droop': 'drooping_wing',  # Map to drooping_wing
        'fluffed_feathers': 'fluffed_feathers',  # Already in CSV (species-specific)
        'tail_bobbing': 'tail_bobbing',  # Already in CSV (species-specific)
        
        # SPECIES_SPECIFIC_SYMPTOMS - Fish
        'white_spots': 'white_spots',  # Already in CSV (species-specific)
        'fin_rot': 'fin_rot',  # Already in CSV (species-specific)
        'swimming_upside_down': 'swimming_upside_down',  # Already in CSV (species-specific)
        'gasping_at_surface': 'gasping_at_surface',  # Already in CSV (species-specific)
        'clamped_fins': 'clamped_fins',  # Already in CSV (species-specific)
        'rubbing_against_objects': 'rubbing_against_objects',  # Already in CSV (species-specific)
        'cloudy_eyes': 'cloudy_eyes',  # Already in CSV
        
        # SPECIES_SPECIFIC_SYMPTOMS - Rabbit
        'head_tilt': 'head_tilt',  # Already in CSV
        'rolling': 'rolling',  # Already in CSV
        'loss_of_balance': 'loss_of_balance',  # Already in CSV
        'dental_issues': 'dental_issues',  # Already in CSV
        
        # SPECIES_SPECIFIC_SYMPTOMS - Small Mammals
        'wet_tail': 'wet_tail',  # Already in CSV (species-specific)
        'lumps': 'lumps',  # Already in CSV
        'bumps': 'lumps',  # Map to lumps
        'overgrown_teeth': 'overgrown_teeth',  # Already in CSV
    }

def check_csv_coverage(frontend_mappings):
    """
    Check which frontend keys are already in the CSV
    """
    print("="*70)
    print("CHECKING CSV COVERAGE")
    print("="*70)
    
    # Load CSV and extract all unique symptoms
    with open('knowledge_base_enhanced.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    csv_symptoms = set()
    for row in rows:
        symptoms = [s.strip() for s in row['symptoms'].split(',')]
        csv_symptoms.update(symptoms)
    
    print(f"\n✓ Total unique symptoms in CSV: {len(csv_symptoms)}")
    
    # Check coverage
    target_keys = set(frontend_mappings.values())
    in_csv = target_keys & csv_symptoms
    not_in_csv = target_keys - csv_symptoms
    
    print(f"✓ Frontend targets in CSV: {len(in_csv)}/{len(target_keys)}")
    print(f"⚠ Not in CSV: {len(not_in_csv)}")
    
    if not_in_csv:
        print(f"\nSymptoms not in CSV (may be in symptom_map):")
        for symptom in sorted(not_in_csv):
            print(f"  - {symptom}")
    
    return csv_symptoms, in_csv, not_in_csv

def update_symptom_aliases(frontend_mappings):
    """
    Update symptom_aliases_final.json with frontend mappings
    """
    print("\n" + "="*70)
    print("UPDATING SYMPTOM ALIASES")
    print("="*70)
    
    # Load existing aliases
    with open('symptom_aliases_final.json', 'r', encoding='utf-8') as f:
        aliases = json.load(f)
    
    original_count = len(aliases)
    
    # Add new mappings (only if frontend key != target key)
    new_mappings = 0
    updated_mappings = 0
    
    for frontend_key, target_key in frontend_mappings.items():
        # Skip if frontend key == target key (no alias needed)
        if frontend_key == target_key:
            continue
        
        # Add or update alias
        if frontend_key in aliases:
            if aliases[frontend_key] != target_key:
                print(f"  Updated: {frontend_key} → {target_key} (was {aliases[frontend_key]})")
                aliases[frontend_key] = target_key
                updated_mappings += 1
        else:
            aliases[frontend_key] = target_key
            new_mappings += 1
    
    # Save updated aliases
    with open('symptom_aliases_final.json', 'w', encoding='utf-8') as f:
        json.dump(aliases, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Added {new_mappings} new mappings")
    print(f"✓ Updated {updated_mappings} existing mappings")
    print(f"✓ Total aliases: {original_count} → {len(aliases)}")
    print(f"✓ Saved to: symptom_aliases_final.json")
    
    return aliases

def verify_mappings(frontend_mappings, aliases):
    """
    Verify all frontend keys are now mapped
    """
    print("\n" + "="*70)
    print("VERIFICATION")
    print("="*70)
    
    print(f"\nTotal frontend keys: {len(frontend_mappings)}")
    
    # Check coverage
    direct_matches = 0
    via_alias = 0
    unmapped = []
    
    for frontend_key, expected_target in frontend_mappings.items():
        if frontend_key == expected_target:
            # Direct match (no alias needed)
            direct_matches += 1
        elif frontend_key in aliases and aliases[frontend_key] == expected_target:
            # Mapped via alias
            via_alias += 1
        else:
            unmapped.append(frontend_key)
    
    print(f"✓ Direct matches (no alias needed): {direct_matches}")
    print(f"✓ Mapped via aliases: {via_alias}")
    print(f"✓ Total coverage: {direct_matches + via_alias}/{len(frontend_mappings)}")
    
    if unmapped:
        print(f"\n⚠ Unmapped keys ({len(unmapped)}):")
        for key in unmapped:
            print(f"  - {key}")
    else:
        print(f"\n✅ 100% coverage! All frontend keys are mapped!")
    
    return len(unmapped) == 0

def main():
    """
    Main execution
    """
    print("\n" + "="*70)
    print("FULL STACK SYNC - Frontend → Aliases → Backend")
    print("="*70 + "\n")
    
    # Step 1: Get frontend mappings
    frontend_mappings = get_frontend_symptom_keys()
    print(f"✓ Extracted {len(frontend_mappings)} frontend symptom keys")
    
    # Step 2: Check CSV coverage
    csv_symptoms, in_csv, not_in_csv = check_csv_coverage(frontend_mappings)
    
    # Step 3: Update alias file
    aliases = update_symptom_aliases(frontend_mappings)
    
    # Step 4: Verify
    success = verify_mappings(frontend_mappings, aliases)
    
    # Summary
    print("\n" + "="*70)
    print("SYNC COMPLETE!")
    print("="*70)
    
    print(f"\n✅ Frontend keys: {len(frontend_mappings)}")
    print(f"✅ Alias mappings: {len(aliases)}")
    print(f"✅ CSV coverage: {len(in_csv)} symptoms")
    
    if success:
        print(f"\n🎉 SUCCESS! All frontend keys are now mapped!")
    else:
        print(f"\n⚠ Some keys still unmapped (see above)")
    
    print("\n📋 Next Steps:")
    print("  1. Update symptom_standardizer.py to load from JSON")
    print("  2. Test: python -c \"from modules.questionnaire.symptom_standardizer import standardize_symptom; print(standardize_symptom('rash'))\"")
    print("  3. Expected output: skin_lesions")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
