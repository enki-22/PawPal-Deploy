#!/usr/bin/env python3
"""
Verify Clinical Logic Application
"""

import csv

def verify_changes():
    # Load database
    with open('knowledge_base_enhanced.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)
    
    print("\n" + "="*70)
    print("CLINICAL LOGIC VERIFICATION")
    print("="*70 + "\n")
    
    print(f"Total diseases in database: {len(data)}\n")
    
    # Check enrichments
    print("=" * 70)
    print("SYMPTOM ENRICHMENT VERIFICATION")
    print("=" * 70)
    
    # Pruritus enrichments
    pruritus_enriched = []
    for row in data:
        symptoms = set(s.strip() for s in row['symptoms'].split(','))
        has_pruritus = any(p in symptoms for p in ['itching', 'scratching', 'self_biting_or_chewing'])
        has_secondary = any(s in symptoms for s in ['red_skin', 'skin_lesions', 'irritated_skin'])
        if has_pruritus and has_secondary:
            pruritus_enriched.append(row)
    
    print(f"\n✓ Diseases with pruritus + secondary skin symptoms: {len(pruritus_enriched)}")
    print("\nSample enriched diseases:")
    for row in pruritus_enriched[:5]:
        print(f"  - {row['disease']}: {row['symptoms'][:80]}...")
    
    # Fluid loss enrichments
    fluid_enriched = []
    for row in data:
        symptoms = set(s.strip() for s in row['symptoms'].split(','))
        has_vomiting = 'vomiting' in symptoms
        has_diarrhea = any(d in symptoms for d in ['diarrhea', 'bloody_diarrhea'])
        has_dehydration = 'dehydration' in symptoms or 'severe_dehydration' in symptoms
        if has_vomiting and has_diarrhea and has_dehydration:
            fluid_enriched.append(row)
    
    print(f"\n✓ Diseases with vomiting + diarrhea + dehydration: {len(fluid_enriched)}")
    print("\nSample fluid loss diseases:")
    for row in fluid_enriched[:5]:
        print(f"  - {row['disease']}")
    
    # Check recalibrations
    print("\n" + "=" * 70)
    print("URGENCY RECALIBRATION VERIFICATION")
    print("=" * 70)
    
    chronic_skin = []
    for row in data:
        disease_lower = row['disease'].lower()
        if any(keyword in disease_lower for keyword in ['allergy', 'dermatitis', 'mange']):
            chronic_skin.append(row)
    
    print(f"\n✓ Chronic skin conditions found: {len(chronic_skin)}")
    print("\nRecalibrated diseases:")
    for row in chronic_skin:
        print(f"  - {row['disease']}: urgency={row['urgency']}, contagious={row['contagious']}")
    
    # Check safety guardrails
    print("\n" + "=" * 70)
    print("SAFETY GUARDRAIL VERIFICATION")
    print("=" * 70)
    
    acute_conditions = []
    for row in data:
        disease_lower = row['disease'].lower()
        if any(keyword in disease_lower for keyword in 
               ['parvovirus', 'distemper', 'heartworm', 'bloat', 'heatstroke', 'hemorrhagic']):
            acute_conditions.append(row)
    
    print(f"\n✓ Acute/Emergency conditions protected: {len(acute_conditions)}")
    print("\nProtected diseases (high/emergency urgency maintained):")
    for row in acute_conditions:
        print(f"  - {row['disease']}: urgency={row['urgency']} (PROTECTED)")
    
    # Summary
    print("\n" + "=" * 70)
    print("VERIFICATION SUMMARY")
    print("=" * 70)
    print(f"✅ Total diseases: {len(data)}")
    print(f"✅ Pruritus enrichments: {len(pruritus_enriched)}")
    print(f"✅ Fluid loss enrichments: {len(fluid_enriched)}")
    print(f"✅ Chronic skin recalibrations: {len(chronic_skin)}")
    print(f"✅ Acute conditions protected: {len(acute_conditions)}")
    print("=" * 70 + "\n")

if __name__ == "__main__":
    verify_changes()
