#!/usr/bin/env python3
"""Check the quality of normalization"""

import json
import csv
from collections import Counter

# Load aliases
with open('symptom_aliases.json', 'r') as f:
    aliases = json.load(f)

print("="*70)
print("NORMALIZATION QUALITY CHECK")
print("="*70)

# Show top alias mappings
print("\n1. TOP 20 MOST USEFUL ALIAS MAPPINGS")
print("-"*70)
alias_groups = {}
for alias, standard in aliases.items():
    if standard not in alias_groups:
        alias_groups[standard] = []
    alias_groups[standard].append(alias)

# Sort by number of aliases per standard key
top_groups = sorted(alias_groups.items(), key=lambda x: len(x[1]), reverse=True)[:20]
for standard, alias_list in top_groups:
    print(f"\n{standard} ← {len(alias_list)} aliases")
    for alias in alias_list[:3]:
        print(f"  • {alias}")
    if len(alias_list) > 3:
        print(f"  ... and {len(alias_list)-3} more")

# Compare before/after
print("\n" + "="*70)
print("2. CSV QUALITY COMPARISON")
print("="*70)

# Load both CSVs
final = list(csv.DictReader(open('knowledge_base_final.csv', encoding='utf-8')))
normalized = list(csv.DictReader(open('knowledge_base_normalized.csv', encoding='utf-8')))

# Example: Canine parvovirus
parvo_final = [r for r in final if 'parvovirus' in r['disease'].lower()][0]
parvo_norm = [r for r in normalized if 'parvovirus' in r['disease'].lower()][0]

print("\nExample: Canine Parvovirus")
print("-"*70)
print("BEFORE (final):")
print(f"  {parvo_final['symptoms']}")
print("\nAFTER (normalized):")
print(f"  {parvo_norm['symptoms']}")

# Statistics
print("\n" + "="*70)
print("3. STATISTICS")
print("="*70)

final_symptoms = set()
for row in final:
    symptoms = [s.strip() for s in row['symptoms'].split(',')]
    final_symptoms.update(symptoms)

norm_symptoms = set()
for row in normalized:
    symptoms = [s.strip() for s in row['symptoms'].split(',')]
    norm_symptoms.update(symptoms)

print(f"\nUnique symptoms:")
print(f"  Before: {len(final_symptoms)}")
print(f"  After: {len(norm_symptoms)}")
print(f"  Reduction: {len(final_symptoms) - len(norm_symptoms)} ({(1-len(norm_symptoms)/len(final_symptoms))*100:.1f}%)")

# Most common symptoms after normalization
all_norm_symptoms = []
for row in normalized:
    symptoms = [s.strip() for s in row['symptoms'].split(',')]
    all_norm_symptoms.extend(symptoms)

print("\n" + "="*70)
print("4. TOP 20 MOST COMMON SYMPTOMS (after normalization)")
print("="*70)
counter = Counter(all_norm_symptoms)
for symptom, count in counter.most_common(20):
    print(f"{count:3} occurrences: {symptom}")

print("\n" + "="*70)
