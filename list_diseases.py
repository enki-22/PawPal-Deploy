"""
List all unique diseases in the pet disease dataset
"""
import pandas as pd
from collections import Counter

# Load dataset
DATASET_FILE = "pet_disease_dataset_final.csv"

print("=" * 60)
print("DISEASE LIST - PET DISEASE DATASET")
print("=" * 60)

df = pd.read_csv(DATASET_FILE)

# Get unique diseases
unique_diseases = sorted(df['disease'].unique())
disease_counts = df['disease'].value_counts()

print(f"\nTotal samples: {len(df)}")
print(f"Total unique diseases: {len(unique_diseases)}")

# Group by species to see distribution
species_list = sorted(df['species'].unique())
print(f"Species covered: {', '.join(species_list)}")

print("\n" + "=" * 60)
print("ALL DISEASES (Alphabetical)")
print("=" * 60)

for i, disease in enumerate(unique_diseases, 1):
    count = disease_counts[disease]
    # Get species that have this disease
    species_with_disease = df[df['disease'] == disease]['species'].unique()
    species_str = ', '.join(sorted(set(species_with_disease)))
    print(f"{i:3d}. {disease:40s} ({count:3d} samples) - [{species_str}]")

# Statistics by urgency
print("\n" + "=" * 60)
print("DISEASES BY URGENCY LEVEL")
print("=" * 60)

urgency_levels = df['urgency'].unique()
for urgency in sorted(urgency_levels):
    diseases_by_urgency = df[df['urgency'] == urgency]['disease'].unique()
    print(f"\n{urgency.upper()}: {len(diseases_by_urgency)} diseases")
    for disease in sorted(diseases_by_urgency)[:10]:  # Show first 10
        print(f"  - {disease}")
    if len(diseases_by_urgency) > 10:
        print(f"  ... and {len(diseases_by_urgency) - 10} more")

# Most common diseases
print("\n" + "=" * 60)
print("TOP 20 MOST COMMON DISEASES")
print("=" * 60)

for i, (disease, count) in enumerate(disease_counts.head(20).items(), 1):
    print(f"{i:2d}. {disease:40s} {count:4d} samples")

# Least common diseases (with minimum samples)
print("\n" + "=" * 60)
print("DISEASES WITH FEWER THAN 15 SAMPLES")
print("=" * 60)

rare_diseases = disease_counts[disease_counts < 15]
if len(rare_diseases) > 0:
    for disease, count in rare_diseases.items():
        print(f"  - {disease:40s} {count:2d} samples")
else:
    print("  None - all diseases have 15+ samples")

# Save to text file
output_file = "disease_list.txt"
with open(output_file, 'w', encoding='utf-8') as f:
    f.write("COMPLETE DISEASE LIST\n")
    f.write("=" * 60 + "\n\n")
    f.write(f"Total diseases: {len(unique_diseases)}\n\n")
    
    for i, disease in enumerate(unique_diseases, 1):
        count = disease_counts[disease]
        species_with_disease = df[df['disease'] == disease]['species'].unique()
        species_str = ', '.join(sorted(set(species_with_disease)))
        urgency = df[df['disease'] == disease]['urgency'].mode()[0]
        f.write(f"{i}. {disease} ({count} samples, {urgency} urgency) - [{species_str}]\n")

print(f"\n\n✓ Disease list saved to: {output_file}")
print("=" * 60)
