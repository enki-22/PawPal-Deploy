#!/usr/bin/env python3
"""
Final Cleanup - Remove fragment symptoms and achieve near-100% coverage
"""

import json
import csv
import re
from collections import Counter

def is_fragment_symptom(symptom):
    """
    Detect if a symptom is a meaningless fragment
    """
    # Leading underscores with short length
    if symptom.startswith('_') and len(symptom) < 20:
        return True
    
    # Just anatomical parts without context
    standalone_words = ['_head', '_tail', '_nose', '_gray', '_red', '_messy']
    if symptom in standalone_words:
        return True
    
    # Metadata artifacts
    if 'source:' in symptom or 'status:' in symptom:
        return True
    
    # Just numbers
    if re.match(r'^\d+\._', symptom):
        return True
    
    return False

def clean_csv_remove_fragments(input_csv='knowledge_base_production.csv', 
                                output_csv='knowledge_base_final_clean.csv'):
    """
    Remove fragment symptoms from CSV
    """
    print("="*70)
    print("FINAL CLEANUP: Removing Fragment Symptoms")
    print("="*70)
    
    # Load CSV
    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"✓ Loaded {len(rows)} diseases")
    
    # Track stats
    total_symptoms_before = 0
    total_symptoms_after = 0
    fragments_removed = 0
    unique_before = set()
    unique_after = set()
    
    # Clean each row
    clean_rows = []
    for row in rows:
        symptoms_str = row['symptoms']
        symptoms = [s.strip() for s in symptoms_str.split(',')]
        
        total_symptoms_before += len(symptoms)
        unique_before.update(symptoms)
        
        # Filter out fragments
        clean_symptoms = []
        for symptom in symptoms:
            if not is_fragment_symptom(symptom):
                clean_symptoms.append(symptom)
            else:
                fragments_removed += 1
        
        total_symptoms_after += len(clean_symptoms)
        unique_after.update(clean_symptoms)
        
        # Update row
        if clean_symptoms:  # Only keep diseases with symptoms
            row['symptoms'] = ', '.join(clean_symptoms)
            clean_rows.append(row)
    
    # Save clean CSV
    with open(output_csv, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(clean_rows)
    
    print(f"\n✓ Removed {fragments_removed} fragment symptom instances")
    print(f"✓ Unique symptoms: {len(unique_before)} → {len(unique_after)}")
    print(f"✓ Total instances: {total_symptoms_before} → {total_symptoms_after}")
    print(f"✓ Diseases retained: {len(rows)} → {len(clean_rows)}")
    print(f"✓ Saved to: {output_csv}")
    
    return clean_rows, unique_after

def calculate_final_coverage(clean_csv_symptoms):
    """
    Calculate coverage against symptom_map_updated.json
    """
    print("\n" + "="*70)
    print("FINAL COVERAGE ANALYSIS")
    print("="*70)
    
    # Load updated symptom map
    with open('symptom_map_updated.json', 'r', encoding='utf-8') as f:
        symptom_map = json.load(f)
    
    # Load updated aliases
    with open('symptom_aliases_updated.json', 'r', encoding='utf-8') as f:
        aliases = json.load(f)
    
    # All known symptoms (direct + aliases)
    all_known = set(symptom_map.keys()) | set(aliases.keys())
    
    # Calculate coverage
    covered = clean_csv_symptoms & all_known
    uncovered = clean_csv_symptoms - all_known
    
    coverage_pct = (len(covered) / len(clean_csv_symptoms) * 100) if clean_csv_symptoms else 100
    
    print(f"\nSymptom Coverage:")
    print(f"  Total unique in CSV: {len(clean_csv_symptoms)}")
    print(f"  In symptom_map: {len(clean_csv_symptoms & set(symptom_map.keys()))}")
    print(f"  In aliases: {len(clean_csv_symptoms & set(aliases.keys()))}")
    print(f"  Total covered: {len(covered)}")
    print(f"  Uncovered: {len(uncovered)}")
    print(f"  Coverage: {coverage_pct:.1f}%")
    
    if uncovered:
        print(f"\n⚠ Uncovered symptoms ({len(uncovered)}):")
        sorted_uncovered = sorted(list(uncovered))
        for s in sorted_uncovered[:30]:
            print(f"  - {s}")
        if len(uncovered) > 30:
            print(f"  ... and {len(uncovered)-30} more")
        
        # Save for reference
        with open('still_uncovered.txt', 'w', encoding='utf-8') as f:
            f.write("STILL UNCOVERED SYMPTOMS\n")
            f.write("="*70 + "\n\n")
            for symptom in sorted_uncovered:
                f.write(f"- {symptom}\n")
        print(f"\n✓ Saved to: still_uncovered.txt")
    
    return coverage_pct, uncovered

def analyze_top_symptoms(clean_csv_rows):
    """
    Show the most common symptoms in the clean CSV
    """
    print("\n" + "="*70)
    print("TOP 20 SYMPTOMS (After Cleanup)")
    print("="*70)
    
    all_symptoms = []
    for row in clean_csv_rows:
        symptoms = [s.strip() for s in row['symptoms'].split(',')]
        all_symptoms.extend(symptoms)
    
    counter = Counter(all_symptoms)
    
    print()
    for symptom, count in counter.most_common(20):
        print(f"{count:3} occurrences: {symptom}")
    
    return counter

if __name__ == "__main__":
    print("\n" + "="*70)
    print("FINAL CLEANUP - Fragment Removal & Coverage Analysis")
    print("="*70 + "\n")
    
    # Clean CSV
    clean_rows, unique_symptoms = clean_csv_remove_fragments()
    
    # Calculate coverage
    coverage, uncovered = calculate_final_coverage(unique_symptoms)
    
    # Analyze
    symptom_counts = analyze_top_symptoms(clean_rows)
    
    # Final summary
    print("\n" + "="*70)
    print("FINAL SUMMARY")
    print("="*70)
    print(f"✓ Clean database: knowledge_base_final_clean.csv")
    print(f"✓ Unique symptoms: {len(unique_symptoms)}")
    print(f"✓ Coverage: {coverage:.1f}%")
    print(f"✓ Uncovered: {len(uncovered)} symptoms")
    
    if coverage >= 90:
        print(f"\n🎉 EXCELLENT! >90% coverage achieved!")
    elif coverage >= 80:
        print(f"\n✅ GOOD! >80% coverage achieved!")
    else:
        print(f"\n⚠ More work needed to reach 90% coverage")
    
    print("="*70 + "\n")
