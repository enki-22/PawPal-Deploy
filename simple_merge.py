import csv
print("Starting merge...")

# Load files
with open('pet_disease_dataset_final.csv', 'r', encoding='latin-1') as f:
    original = list(csv.DictReader(f))
print(f"Loaded original: {len(original)} samples")

with open('structured_training_from_vet_verified.csv', 'r', encoding='utf-8') as f:
    structured = list(csv.DictReader(f))
print(f"Loaded structured: {len(structured)} samples")

# Simple merge: 50/50 split
final = original[:3150] + structured[:3300]
print(f"Merged: {len(final)} samples")

# Save
with open('pet_disease_dataset_final_merged.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=original[0].keys())
    writer.writeheader()
    writer.writerows(final)

print("Saved to pet_disease_dataset_final_merged.csv")
print("Done!")
