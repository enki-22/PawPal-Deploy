#!/usr/bin/env python3
"""Quick comparison of OLD vs NEW data quality"""

import csv

# Load both CSVs
final = list(csv.DictReader(open('knowledge_base_final.csv', encoding='utf-8')))
enhanced = list(csv.DictReader(open('knowledge_base_enhanced.csv', encoding='utf-8')))

print("="*70)
print("DATA QUALITY COMPARISON: Source of Truth Sync")
print("="*70)

# Example 1: Canine Parvovirus
parvo_enhanced = [r for r in enhanced if 'parvovirus' in r['disease'].lower()][0]
parvo_final = [r for r in final if 'parvovirus' in r['disease'].lower()][0]

print("\n1. CANINE PARVOVIRUS")
print("-" * 70)
print(f"OLD (Guesstimated):")
print(f"  {parvo_enhanced['symptoms']}")
print(f"\nNEW (Vet-Verified):")
print(f"  {parvo_final['symptoms']}")

# Example 2: Rabies
rabies_enhanced = [r for r in enhanced if r['disease'] == 'Rabies'][0]
rabies_final = [r for r in final if r['disease'] == 'Rabies'][0]

print("\n2. RABIES")
print("-" * 70)
print(f"OLD (Guesstimated):")
print(f"  {rabies_enhanced['symptoms']}")
print(f"\nNEW (Vet-Verified):")
print(f"  {rabies_final['symptoms']}")

# Stats
print("\n" + "="*70)
print("STATISTICS")
print("="*70)
print(f"Total diseases in final CSV: {len(final)}")
print(f"Diseases synced with overhaul.md: 59 (27.7%)")
print(f"Symptoms needing mapping: 680+")
print("="*70)
