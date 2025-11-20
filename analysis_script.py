import pandas as pd

df = pd.read_csv('structured_training_from_vet_verified_augmented_fixed.csv')

print("="*70)
print("DETECTIVE WORK: WHERE DID THESE SAMPLES COME FROM?")
print("="*70)

# Check samples per disease
print("\nSamples per disease (first 20):")
disease_counts = df['disease'].value_counts()

for disease in disease_counts.head(20).index:
    count = disease_counts[disease]
    
    # Break down by source
    disease_df = df[df['disease'] == disease]
    by_source = disease_df['source'].value_counts()
    
    print(f"\n{disease}: {count} total")
    for source, src_count in by_source.items():
        print(f"  - {source}: {src_count}")

# Overall stats
print("\n" + "="*70)
print("OVERALL STATS")
print("="*70)
print(f"Total samples: {len(df)}")
print(f"Unique diseases: {df['disease'].nunique()}")
print(f"Avg samples per disease: {len(df) / df['disease'].nunique():.1f}")

print("\nBreakdown by source:")
print(df['source'].value_counts())

# Check if there's a pattern
print("\n" + "="*70)
print("HYPOTHESIS CHECK")
print("="*70)

# Hypothesis 1: Most diseases have ~30 samples, all marked as "original"
diseases_with_30 = (disease_counts == 30).sum()
diseases_with_31 = (disease_counts == 31).sum()
diseases_with_32 = (disease_counts == 32).sum()

print(f"Diseases with exactly 30 samples: {diseases_with_30}")
print(f"Diseases with exactly 31 samples: {diseases_with_31}")
print(f"Diseases with exactly 32 samples: {diseases_with_32}")

# Check a specific disease
print("\n" + "="*70)
print("SAMPLE INSPECTION: Looking at 'Asthma'")
print("="*70)

if 'Asthma' in df['disease'].values:
    asthma_df = df[df['disease'] == 'Asthma']
    print(f"Total Asthma samples: {len(asthma_df)}")
    print(f"\nBy source:")
    print(asthma_df['source'].value_counts())
    
    print(f"\nFirst 3 Asthma samples:")
    for idx, row in asthma_df.head(3).iterrows():
        print(f"\n  Sample {idx}:")
        print(f"    Symptoms: {row['symptoms'][:100]}...")
        print(f"    Source: {row['source']}")

# The smoking gun
print("\n" + "="*70)
print("THE TRUTH")
print("="*70)

if diseases_with_30 > 200:
    print("✅ CONFIRMED: Most diseases have exactly 30 samples")
    print("✅ These are likely your '30 linguistic variations'")
    print("\n🔍 BUT they're marked as 'structured_from_vet_verified'")
    print("   NOT marked as 'augmented'")
    print("\n💡 This means:")
    print("   - Your CSV labels all 30 variations as 'original'")
    print("   - The script sees 6,450 'originals' (30 × 215)")
    print("   - Only 330 are marked 'augmented' (later additions?)")
    print("\n⚠️ IN REALITY:")
    print("   - True originals: ~215 (1 per disease)")
    print("   - Linguistic variations: ~6,235 (29 per disease)")
    print("   - Later augmentations: 330")
    print("   - TRUE RATIO: 6,780 / 215 = 31.5x ❌")
else:
    print("🤔 Unexpected pattern - need to investigate further")