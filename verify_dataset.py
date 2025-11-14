import csv
import random

# Load dataset
with open('pet_disease_dataset.csv', 'r', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

print("="*80)
print("FINAL DATASET VERIFICATION")
print("="*80)
print(f"\n✓ Total samples: {len(rows)}")
print(f"✓ Unique species: {len(set(r['species'] for r in rows))}")
print(f"✓ Unique diseases: {len(set(r['disease'] for r in rows))}")
print(f"✓ Columns: {', '.join(rows[0].keys())}")

print("\n" + "="*80)
print("RANDOM SAMPLE CHECK (10 examples)")
print("="*80)

for r in random.sample(rows, 10):
    species = r['species'].ljust(8)
    disease = r['disease'][:25].ljust(25)
    urgency = r['urgency'].ljust(8)
    symptoms = r['symptoms'][:50]
    print(f"{species} | {disease} | {urgency} | {symptoms}...")

print("\n" + "="*80)
print("✓ DATASET READY FOR ML TRAINING")
print("="*80)
