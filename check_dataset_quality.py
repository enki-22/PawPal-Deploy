import csv
import random

# Read the dataset
with open('pet_disease_dataset.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print("="*80)
print("DATASET QUALITY CHECK")
print("="*80)

# Sample from each species
species_list = list(set(row['species'] for row in rows))

for species in sorted(species_list):
    species_rows = [r for r in rows if r['species'] == species]
    print(f"\n{species.upper()} - {len(species_rows)} total samples")
    print("-" * 80)
    
    # Show 5 random samples
    samples = random.sample(species_rows, min(5, len(species_rows)))
    for s in samples:
        disease = s['disease'][:30].ljust(30)
        urgency = s['urgency'].ljust(8)
        contagious = s['contagious'].ljust(3)
        symptoms = s['symptoms'][:65]
        print(f"{disease} | {urgency} | {contagious} | {symptoms}...")

print("\n" + "="*80)
print("END OF QUALITY CHECK")
print("="*80)
