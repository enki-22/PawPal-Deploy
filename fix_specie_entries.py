#!/usr/bin/env python3
"""
Quick fix for "Specie" entries in augmented dataset
Changes "Specie" → "Rabbit" for Pinworm Infestation
"""

import csv

input_file = 'structured_training_from_vet_verified_augmented.csv'
output_file = 'structured_training_from_vet_verified_augmented_fixed.csv'

print("="*70)
print("FIXING 'Specie' ENTRIES")
print("="*70)

# Read and fix
fixed_count = 0
total_count = 0

with open(input_file, 'r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)
    
    fixed_data = []
    for row in reader:
        total_count += 1
        
        # Fix "Specie" → "Rabbit" (Pinworm is a rabbit disease)
        if row['species'] == 'Specie':
            row['species'] = 'Rabbit'
            fixed_count += 1
            if fixed_count == 1:  # Show first fix as example
                print(f"\nExample fix:")
                print(f"  Disease: {row['disease']}")
                print(f"  Species: Specie → Rabbit")
        
        fixed_data.append(row)

print(f"\n{'='*70}")
print(f"Total samples: {total_count}")
print(f"Fixed samples: {fixed_count}")
print(f"{'='*70}")

# Write fixed data
with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
    fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
    writer = csv.DictWriter(outfile, fieldnames=fieldnames)
    
    writer.writeheader()
    for row in fixed_data:
        writer.writerow(row)

print(f"\n✓ Fixed dataset saved to: {output_file}")
print(f"\nNext steps:")
print(f"1. Replace old file with fixed file:")
print(f"   mv {output_file} {input_file}")
print(f"")
print(f"2. Retrain model:")
print(f"   python train_model.py")
print(f"")
print(f"✓ All 'Specie' entries fixed to 'Rabbit'")
