#!/usr/bin/env python3
"""
Test Symptom Standardizer - Verify frontend keys map correctly
"""

from modules.questionnaire.symptom_standardizer import standardize_symptom

def test_standardizer():
    """
    Test all critical frontend keys
    """
    print("\n" + "="*70)
    print("TESTING SYMPTOM STANDARDIZER")
    print("="*70 + "\n")
    
    # Test cases: (frontend_key, expected_target)
    test_cases = [
        # Critical frontend mappings
        ('rash', 'skin_lesions'),
        ('gas', 'bloating'),
        ('excessive_eating', 'increased_appetite'),
        ('nasal_congestion', 'nasal_discharge'),
        ('respiratory_distress', 'difficulty_breathing'),
        ('scratching', 'itching'),
        ('bald_patches', 'hair_loss'),
        ('irritated_skin', 'red_skin'),
        ('dandruff', 'scabs'),
        ('lameness', 'limping'),
        ('reluctance_to_move', 'lethargy'),
        ('watery_eyes', 'eye_discharge'),
        ('ear_scratching', 'head_shaking'),
        ('dark_urine', 'blood_in_urine'),
        ('cloudy_urine', 'straining_to_urinate'),
        ('red_gums', 'swollen_gums'),
        ('wing_droop', 'drooping_wing'),
        ('bumps', 'lumps'),
        
        # Colloquial terms
        ('throwing up', 'vomiting'),
        ('puking', 'vomiting'),
        ('loose stool', 'diarrhea'),
        ('runny poop', 'diarrhea'),
        ('not eating', 'loss_of_appetite'),
        ('breathing weird', 'difficulty_breathing'),
        ('seems sad', 'lethargy'),
        
        # Direct matches (should stay as-is)
        ('vomiting', 'vomiting'),
        ('diarrhea', 'diarrhea'),
        ('lethargy', 'lethargy'),
        ('fever', 'fever'),
        ('coughing', 'coughing'),
    ]
    
    passed = 0
    failed = 0
    
    for input_symptom, expected_output in test_cases:
        result = standardize_symptom(input_symptom)
        status = "✓" if result == expected_output else "✗"
        
        if result == expected_output:
            passed += 1
            print(f"{status} {input_symptom:25} → {result:25}")
        else:
            failed += 1
            print(f"{status} {input_symptom:25} → {result:25} (expected: {expected_output})")
    
    # Summary
    print("\n" + "="*70)
    print("RESULTS")
    print("="*70)
    print(f"✓ Passed: {passed}/{len(test_cases)}")
    print(f"✗ Failed: {failed}/{len(test_cases)}")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED!")
    else:
        print(f"\n⚠ Some tests failed")
    
    print("="*70 + "\n")
    
    return failed == 0

if __name__ == "__main__":
    success = test_standardizer()
    exit(0 if success else 1)
