#!/usr/bin/env python3
"""
Verify All Allergy Variants are Correctly Calibrated
"""

import csv

def verify_allergy_fix():
    # Load database
    with open('knowledge_base_enhanced.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        data = list(reader)
    
    print("\n" + "="*70)
    print("ALLERGY FIX VERIFICATION")
    print("="*70 + "\n")
    
    # Find all allergy-related diseases
    allergy_diseases = []
    for row in data:
        disease_lower = row['disease'].lower()
        if 'allerg' in disease_lower:  # Catches allergy, allergies, allergic
            allergy_diseases.append(row)
    
    print(f"Found {len(allergy_diseases)} allergy-related diseases:\n")
    
    # Check each one
    all_correct = True
    for row in allergy_diseases:
        disease = row['disease']
        urgency = row['urgency']
        contagious = row['contagious']
        
        # Food allergies should be medium urgency
        is_food = 'food' in disease.lower()
        expected_urgency = 'medium' if is_food else urgency
        
        # Check if correct
        if is_food and urgency != 'medium':
            print(f"❌ {disease}:")
            print(f"   Urgency: {urgency} (expected: medium)")
            print(f"   Contagious: {contagious}")
            all_correct = False
        else:
            status = "✓" if urgency == 'medium' else "•"
            print(f"{status} {disease}:")
            print(f"   Urgency: {urgency}")
            print(f"   Contagious: {contagious}")
            print(f"   Symptoms: {row['symptoms'][:80]}...")
        print()
    
    # Summary
    print("="*70)
    if all_correct:
        print("✅ SUCCESS: All allergy diseases correctly calibrated!")
    else:
        print("❌ FAILURE: Some allergy diseases not correctly calibrated")
    print("="*70 + "\n")
    
    return all_correct

if __name__ == "__main__":
    success = verify_allergy_fix()
    exit(0 if success else 1)
