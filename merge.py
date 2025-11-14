import pandas as pd

# Load datasets
df_old = pd.read_csv('pet_disease_dataset.csv')
df_new = pd.read_csv('pawpal_enriched_full.csv')

# Merge (keep old data + add new enriched data)
df_combined = pd.concat([df_old, df_new], ignore_index=True)

# Remove any duplicates based on disease name
df_combined = df_combined.drop_duplicates(subset=['species', 'disease', 'symptoms'], keep='last')

print(f"Combined dataset: {len(df_combined)} samples")
df_combined.to_csv('pet_disease_dataset_enriched.csv', index=False)