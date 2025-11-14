# Run this to see what you have
import pandas as pd

df = pd.read_csv('pet_disease_dataset_enriched.csv')
diseases_by_species = df.groupby('species')['disease'].unique()

for species, diseases in diseases_by_species.items():
    print(f"\n{species} ({len(diseases)} diseases):")
    for disease in sorted(diseases):
        print(f"  - {disease}")