#!/usr/bin/env python3
"""
Interactive tool to review and categorize unmatched symptoms
"""

import json

# Load unmatched symptoms
with open('unmatched_symptoms.txt', 'r', encoding='utf-8') as f:
    lines = f.readlines()

unmatched = []
for line in lines:
    line = line.strip()
    if line and not line.startswith('UNMATCHED') and not line.startswith('='):
        symptom = line.lstrip('- ')
        if symptom:
            unmatched.append(symptom)

print("="*70)
print("UNMATCHED SYMPTOM CATEGORIZATION")
print("="*70)
print(f"Total unmatched: {len(unmatched)}\n")

# Categorize by patterns
categories = {
    'species_specific': [],
    'clinical_terms': [],
    'metadata_artifacts': [],
    'likely_duplicates': [],
    'unclear': []
}

# Pattern detection
for symptom in unmatched:
    symptom_lower = symptom.lower()
    
    # Species-specific
    if any(term in symptom_lower for term in ['fin', 'feather', 'shell', 'beak', 'wing', 'tail_bobbing', 'clamped']):
        categories['species_specific'].append(symptom)
    
    # Metadata artifacts
    elif any(term in symptom_lower for term in ['status:', 'species:', 'urgency:', 'symptoms_extracted', '✅', '❌']):
        categories['metadata_artifacts'].append(symptom)
    
    # Clinical terms
    elif any(term in symptom_lower for term in ['ascites', 'plantigrade', 'hypersalivation', 'dyspnea', 'tachypnea', 'polyuria', 'polydipsia', 'ataxia']):
        categories['clinical_terms'].append(symptom)
    
    # Likely duplicates (contains common symptom words)
    elif any(term in symptom_lower for term in ['increased', 'decreased', 'excessive', 'frequent', 'difficulty', 'loss_of', 'lack_of']):
        categories['likely_duplicates'].append(symptom)
    
    else:
        categories['unclear'].append(symptom)

# Print categorized results
print("CATEGORY BREAKDOWN:")
print("-"*70)
for category, symptoms in categories.items():
    print(f"\n{category.upper().replace('_', ' ')}: {len(symptoms)}")
    for symptom in symptoms[:5]:
        print(f"  • {symptom}")
    if len(symptoms) > 5:
        print(f"  ... and {len(symptoms)-5} more")

# Save categorized output
with open('unmatched_categorized.json', 'w', encoding='utf-8') as f:
    json.dump(categories, f, indent=2, ensure_ascii=False)

print("\n" + "="*70)
print("RECOMMENDATIONS:")
print("="*70)

print(f"""
1. METADATA ARTIFACTS ({len(categories['metadata_artifacts'])}) - REMOVE
   These are not real symptoms, just data formatting artifacts.
   Action: Filter these out before normalization.

2. SPECIES-SPECIFIC ({len(categories['species_specific'])}) - KEEP AS-IS
   These are valid symptoms unique to certain species.
   Action: Add to symptom_map.json as new standard keys.
   
3. CLINICAL TERMS ({len(categories['clinical_terms'])}) - MAP OR ADD
   Medical jargon that might map to existing symptoms.
   Examples:
   - ascites → bloating or swollen_abdomen
   - hypersalivation → drooling
   - plantigrade_stance → difficulty_walking
   Action: Manually review and add to symptom_aliases.json

4. LIKELY DUPLICATES ({len(categories['likely_duplicates'])}) - MAP
   Variations of existing symptoms.
   Action: Add keyword rules to symptom_normalizer.py

5. UNCLEAR ({len(categories['unclear'])}) - MANUAL REVIEW
   Need human judgment to categorize.
   Action: Review each one individually.
""")

print("✓ Saved categorized symptoms to: unmatched_categorized.json")
print("="*70)
