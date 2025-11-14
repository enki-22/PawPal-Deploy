"""
Dataset Merger
Combines the enriched new diseases with the main dataset
"""

import pandas as pd

def merge_datasets():
    print("=" * 60)
    print("DATASET MERGER")
    print("=" * 60)
    
    # Load datasets
    try:
        df_main = pd.read_csv('pet_disease_dataset_enriched.csv')
        print(f"✓ Loaded main dataset: {len(df_main)} samples")
    except FileNotFoundError:
        print("ERROR: pet_disease_dataset_enriched.csv not found!")
        return
    
    try:
        df_new = pd.read_csv('new_diseases_enriched.csv')
        print(f"✓ Loaded new diseases: {len(df_new)} samples")
    except FileNotFoundError:
        print("ERROR: new_diseases_enriched.csv not found!")
        print("Please run the variation generator first.")
        return
    
    # Display current statistics
    print(f"\nCurrent main dataset:")
    print(f"  - Total samples: {len(df_main)}")
    print(f"  - Unique diseases: {df_main['disease'].nunique()}")
    print(f"  - Species: {df_main['species'].nunique()}")
    
    print(f"\nNew diseases to add:")
    print(f"  - Total samples: {len(df_new)}")
    print(f"  - Unique diseases: {df_new['disease'].nunique()}")
    print(f"  - Species: {df_new['species'].nunique()}")
    
    # Merge
    df_combined = pd.concat([df_main, df_new], ignore_index=True)
    
    print(f"\n✓ Merged successfully!")
    print(f"\nFinal dataset:")
    print(f"  - Total samples: {len(df_combined)}")
    print(f"  - Unique diseases: {df_combined['disease'].nunique()}")
    print(f"  - Species: {df_combined['species'].nunique()}")
    
    # Show species distribution
    print(f"\nSpecies distribution:")
    print(df_combined['species'].value_counts().to_string())
    
    # Check for duplicates
    duplicates = df_combined.duplicated(subset=['species', 'disease', 'symptoms']).sum()
    if duplicates > 0:
        print(f"\n⚠ Warning: Found {duplicates} duplicate entries")
        print("Removing duplicates...")
        df_combined = df_combined.drop_duplicates(subset=['species', 'disease', 'symptoms'])
        print(f"✓ Removed duplicates. New total: {len(df_combined)}")
    
    # Save
    output_file = 'pet_disease_dataset_final.csv'
    df_combined.to_csv(output_file, index=False)
    print(f"\n✓ Saved final dataset to {output_file}")
    
    # Summary stats
    print("\n" + "=" * 60)
    print("FINAL DATASET SUMMARY")
    print("=" * 60)
    print(f"Total samples: {len(df_combined)}")
    print(f"Unique diseases: {df_combined['disease'].nunique()}")
    print(f"Average samples per disease: {len(df_combined) / df_combined['disease'].nunique():.1f}")
    print(f"\nUrgency distribution:")
    print(df_combined['urgency'].value_counts().to_string())
    print(f"\nContagious distribution:")
    print(df_combined['contagious'].value_counts().to_string())
    print("=" * 60)
    print("Dataset ready for training! 🚀")
    print("=" * 60)

if __name__ == "__main__":
    merge_datasets()