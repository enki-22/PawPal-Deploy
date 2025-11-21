#!/usr/bin/env python3
"""
Fix Critical Symptoms - Restore medical distinctions that were flattened
CRITICAL: bloody_diarrhea must NOT be flattened to diarrhea
"""

import json
import csv
import sys
from pathlib import Path

def audit_aliases(aliases_file='symptom_aliases_final.json'):
    """
    Audit symptom_aliases_final.json for problematic mappings
    """
    print("="*70)
    print("AUDIT STEP 1: Checking Aliases")
    print("="*70)
    
    with open(aliases_file, 'r', encoding='utf-8') as f:
        aliases = json.load(f)
    
    # Critical symptoms that should NOT be flattened
    critical_symptoms = {
        'bloody_diarrhea': 'bloody_diarrhea',  # Must map to itself (or not exist)
        'foul_smelling_bloody_diarrhea': 'bloody_diarrhea',  # OK to map here
        'projectile_vomiting': 'vomiting',  # OK to map to vomiting
        'severe_dehydration': 'dehydration',  # OK to map to dehydration
    }
    
    issues = []
    
    for symptom, expected in critical_symptoms.items():
        if symptom in aliases:
            actual = aliases[symptom]
            if actual != expected:
                issues.append(f"❌ BAD: '{symptom}' → '{actual}' (should be '{expected}')")
            else:
                print(f"✓ OK: '{symptom}' → '{actual}'")
        else:
            print(f"✓ OK: '{symptom}' not in aliases (preserved as-is)")
    
    # Check for other bloody symptoms
    bloody_mappings = {k: v for k, v in aliases.items() if 'bloody' in k.lower() or 'blood' in k.lower()}
    
    print(f"\nAll blood-related mappings ({len(bloody_mappings)}):")
    for k, v in sorted(bloody_mappings.items())[:10]:
        print(f"  {k} → {v}")
    
    if issues:
        print(f"\n⚠ ISSUES FOUND ({len(issues)}):")
        for issue in issues:
            print(f"  {issue}")
        return False
    else:
        print(f"\n✅ All critical aliases are correct!")
        return True

def audit_csv(csv_file='knowledge_base_production_final.csv'):
    """
    Audit CSV for critical symptom distinctions
    """
    print("\n" + "="*70)
    print("AUDIT STEP 2: Checking CSV Data")
    print("="*70)
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Critical diseases to check
    critical_checks = {
        'Canine parvovirus': {
            'must_have': ['bloody_diarrhea', 'vomiting', 'lethargy'],
            'must_not_have': [],
            'urgency': 'high'
        },
        'Roundworms': {
            'must_have': ['diarrhea'],  # Regular diarrhea, NOT bloody
            'must_not_have': ['bloody_diarrhea'],
            'urgency': 'moderate'
        },
        'Canine distemper': {
            'must_have': ['diarrhea', 'vomiting'],  # Can have either type
            'must_not_have': [],
            'urgency': 'medium'
        }
    }
    
    issues = []
    
    for row in rows:
        disease = row['disease']
        
        if disease in critical_checks:
            symptoms = [s.strip() for s in row['symptoms'].split(',')]
            checks = critical_checks[disease]
            
            print(f"\nChecking: {disease}")
            print(f"  Symptoms: {', '.join(symptoms)}")
            
            # Check must_have
            for required in checks['must_have']:
                if required in symptoms:
                    print(f"  ✓ Has '{required}'")
                else:
                    msg = f"❌ '{disease}' missing '{required}'"
                    print(f"  {msg}")
                    issues.append(msg)
            
            # Check must_not_have
            for forbidden in checks['must_not_have']:
                if forbidden in symptoms:
                    msg = f"❌ '{disease}' should NOT have '{forbidden}'"
                    print(f"  {msg}")
                    issues.append(msg)
                else:
                    print(f"  ✓ Correctly does NOT have '{forbidden}'")
    
    if issues:
        print(f"\n⚠ CSV ISSUES FOUND ({len(issues)}):")
        for issue in issues:
            print(f"  {issue}")
        return False, issues
    else:
        print(f"\n✅ All critical CSV entries are correct!")
        return True, []

def fix_aliases(aliases_file='symptom_aliases_final.json', output_file='symptom_aliases_final.json'):
    """
    Force correct mappings for critical symptoms
    """
    print("\n" + "="*70)
    print("FIX STEP 1: Updating Aliases")
    print("="*70)
    
    with open(aliases_file, 'r', encoding='utf-8') as f:
        aliases = json.load(f)
    
    original_count = len(aliases)
    
    # Force correct mappings
    forced_mappings = {
        # Bloody diarrhea variants should map to bloody_diarrhea
        'foul_smelling_bloody_diarrhea': 'bloody_diarrhea',
        'hemorrhagic_diarrhea': 'bloody_diarrhea',
        'bloody_stool': 'bloody_diarrhea',
        
        # Projectile vomiting can map to vomiting (intensity preserved elsewhere)
        'projectile_vomiting': 'vomiting',
        
        # Severe dehydration can map to dehydration
        'severe_dehydration': 'dehydration',
    }
    
    # Remove any bad mappings
    bad_mappings = [
        'bloody_diarrhea',  # Should never be an alias key (preserve as-is)
    ]
    
    changes = []
    
    for key in bad_mappings:
        if key in aliases:
            old_val = aliases[key]
            del aliases[key]
            changes.append(f"Removed: '{key}' → '{old_val}' (preserve as-is)")
    
    for key, value in forced_mappings.items():
        if key in aliases:
            if aliases[key] != value:
                old_val = aliases[key]
                aliases[key] = value
                changes.append(f"Updated: '{key}' → '{value}' (was '{old_val}')")
            else:
                print(f"✓ Already correct: '{key}' → '{value}'")
        else:
            aliases[key] = value
            changes.append(f"Added: '{key}' → '{value}'")
    
    # Save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(aliases, f, indent=2, ensure_ascii=False)
    
    if changes:
        print(f"\n✓ Made {len(changes)} changes:")
        for change in changes:
            print(f"  {change}")
    else:
        print(f"\n✓ No changes needed")
    
    print(f"✓ Aliases: {original_count} → {len(aliases)}")
    print(f"✓ Saved to: {output_file}")
    
    return aliases

def fix_csv(csv_file='knowledge_base_production_final.csv', output_file='knowledge_base_production_final.csv'):
    """
    Force correct symptoms for critical diseases
    """
    print("\n" + "="*70)
    print("FIX STEP 2: Updating CSV")
    print("="*70)
    
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    # Force correct symptoms for critical diseases
    forced_symptoms = {
        'Canine parvovirus': {
            'symptoms': ['vomiting', 'bloody_diarrhea', 'severe_dehydration', 'lethargy', 'fever', 'loss_of_appetite'],
            'urgency': 'high',
            'contagious': 'yes'
        },
        'Canine distemper': {
            'symptoms': ['fever', 'coughing', 'nasal_discharge', 'eye_discharge', 'vomiting', 'diarrhea', 'seizures'],
            'urgency': 'high',
            'contagious': 'yes'
        },
    }
    
    changes = []
    
    for row in rows:
        disease = row['disease']
        
        if disease in forced_symptoms:
            old_symptoms = row['symptoms']
            new_data = forced_symptoms[disease]
            
            # Update symptoms
            new_symptoms = ', '.join(new_data['symptoms'])
            if old_symptoms != new_symptoms:
                row['symptoms'] = new_symptoms
                changes.append(f"{disease}: Updated symptoms")
                print(f"\n✓ Updated: {disease}")
                print(f"  Before: {old_symptoms}")
                print(f"  After:  {new_symptoms}")
            
            # Update urgency
            if 'urgency' in new_data and row['urgency'] != new_data['urgency']:
                row['urgency'] = new_data['urgency']
                changes.append(f"{disease}: Updated urgency to {new_data['urgency']}")
            
            # Update contagious
            if 'contagious' in new_data and row['contagious'] != new_data['contagious']:
                row['contagious'] = new_data['contagious']
                changes.append(f"{disease}: Updated contagious to {new_data['contagious']}")
    
    # Save
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    if changes:
        print(f"\n✓ Made {len(changes)} changes:")
        for change in changes:
            print(f"  {change}")
    else:
        print(f"\n✓ No changes needed")
    
    print(f"✓ Saved to: {output_file}")
    
    return rows

def verify_fix():
    """
    Simulate diagnosis test to verify the fix
    """
    print("\n" + "="*70)
    print("VERIFY STEP 3: Simulating Diagnosis Test")
    print("="*70)
    
    # Import after fixes are applied
    try:
        from smart_triage_engine import SmartTriageEngine
        
        # Test with production file
        print("\nLoading engine with fixed data...")
        engine = SmartTriageEngine('knowledge_base_production_final.csv')
        
        # Test case 1: Parvo symptoms
        test_symptoms = ['vomiting', 'bloody_diarrhea', 'lethargy']
        print(f"\nTest 1: Symptoms = {test_symptoms}")
        
        result = engine.diagnose('Dog', test_symptoms)
        top_matches = result['top_matches'][:3]
        
        print(f"\nTop 3 matches:")
        for i, match in enumerate(top_matches, 1):
            disease = match['disease']
            score = match['match_score']
            user_cov = match['user_coverage']
            print(f"  {i}. {disease} ({score:.1f}% match, {user_cov:.1f}% user coverage)")
        
        # Verify Parvo is #1
        if top_matches[0]['disease'] == 'Canine parvovirus':
            print(f"\n✅ SUCCESS! Canine parvovirus is #1 (as expected)")
            return True
        else:
            print(f"\n❌ FAILED! Expected Canine parvovirus #1, got '{top_matches[0]['disease']}'")
            return False
    
    except Exception as e:
        print(f"\n⚠ Could not run verification test: {e}")
        print(f"  Please run test_parvo_fix.py manually to verify")
        return None

def main():
    """
    Main execution
    """
    print("\n" + "="*70)
    print("CRITICAL SYMPTOM DISTINCTION FIX")
    print("Restore: bloody_diarrhea ≠ diarrhea")
    print("="*70 + "\n")
    
    # Step 1: Audit
    aliases_ok = audit_aliases()
    csv_ok, csv_issues = audit_csv()
    
    if aliases_ok and csv_ok:
        print("\n" + "="*70)
        print("✅ NO FIXES NEEDED - All critical symptoms are correct!")
        print("="*70 + "\n")
        return
    
    # Step 2: Fix
    print("\n" + "="*70)
    print("APPLYING FIXES")
    print("="*70)
    
    if not aliases_ok:
        fix_aliases()
    
    if not csv_ok:
        fix_csv()
    
    # Step 3: Verify
    success = verify_fix()
    
    # Final summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    
    if success:
        print("✅ All fixes applied successfully!")
        print("✅ Canine parvovirus now has bloody_diarrhea")
        print("✅ Medical distinctions restored")
    elif success is None:
        print("✓ Fixes applied (verification skipped)")
        print("⚠ Please run test_parvo_fix.py to verify")
    else:
        print("❌ Fixes applied but verification failed")
        print("⚠ Please review the output above")
    
    print("\n" + "="*70)
    print("Files Updated:")
    print("  - symptom_aliases_final.json")
    print("  - knowledge_base_production_final.csv")
    print("="*70 + "\n")

if __name__ == "__main__":
    main()
