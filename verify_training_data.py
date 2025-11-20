import pandas as pd

print("\n" + "="*60)
print("📊 TRAINING DATA QUALITY CHECK")
print("="*60)

try:
    df = pd.read_csv('structured_training_from_vet_verified_augmented_fixed.csv')
    print(f"\n✅ Loaded training data: {len(df)} samples")
    print(f"Total unique diseases: {df['disease'].nunique()}")
    
    # Check Flea Allergy
    print("\n" + "-"*60)
    print("🐜 FLEA ALLERGY ANALYSIS")
    print("-"*60)
    flea_samples = df[df['disease'].str.contains('Flea', case=False, na=False)]
    print(f"Flea-related samples: {len(flea_samples)}")
    
    if len(flea_samples) > 0:
        print(f"\nDiseases found:")
        print(flea_samples['disease'].value_counts())
        print(f"\nSample symptoms for Flea Allergy:")
        print(flea_samples[['disease', 'symptoms', 'urgency']].head(5).to_string())
    
    # Check Canine Parvovirus
    print("\n" + "-"*60)
    print("🚨 CANINE PARVOVIRUS ANALYSIS")
    print("-"*60)
    parvo_samples = df[df['disease'] == 'Canine Parvovirus']
    print(f"Canine Parvovirus samples: {len(parvo_samples)}")
    
    if len(parvo_samples) > 0:
        print(f"\nUrgency distribution:")
        print(parvo_samples['urgency'].value_counts())
        
        # Check for data poisoning
        wrong_urgency = parvo_samples[parvo_samples['urgency'].isin(['moderate', 'low', 'mild'])]
        if len(wrong_urgency) > 0:
            print(f"\n❌ ❌ ❌ DATA POISONED! Found {len(wrong_urgency)} Parvovirus samples with WRONG urgency:")
            print(wrong_urgency[['disease', 'symptoms', 'urgency']].to_string())
        else:
            print(f"\n✅ All Parvovirus samples have correct urgency")
        
        print(f"\nSample symptoms:")
        print(parvo_samples['symptoms'].head(3).to_string())
    
    # Check all critical diseases
    print("\n" + "-"*60)
    print("🚨 CRITICAL DISEASES URGENCY CHECK")
    print("-"*60)
    
    critical_diseases = [
        'Canine Parvovirus', 'Bloat/GDV', 'Gastric Dilation (Bloat)',
        'Pyometra', 'Heat Stroke', 'Heatstroke',
        'Feline Panleukopenia Virus', 'Urethral Obstruction', 'Urinary Obstruction',
    ]
    
    issues_found = []
    for disease in critical_diseases:
        disease_samples = df[df['disease'] == disease]
        if len(disease_samples) > 0:
            wrong_urgency = disease_samples[~disease_samples['urgency'].isin(['severe', 'critical', 'emergency'])]
            if len(wrong_urgency) > 0:
                print(f"\n❌ {disease}: {len(wrong_urgency)}/{len(disease_samples)} samples have WRONG urgency")
                print(f"   Urgency values: {wrong_urgency['urgency'].value_counts().to_dict()}")
                issues_found.append(disease)
            else:
                print(f"✅ {disease}: All {len(disease_samples)} samples OK")
    
    print("\n" + "="*60)
    if issues_found:
        print(f"\n🚨 TRAINING DATA IS CORRUPTED!")
        print(f"Issues found in {len(issues_found)} diseases: {issues_found}")
        print(f"\n⚠️  ACTION REQUIRED: Fix training data and retrain model")
    else:
        print(f"\n✅ Training data quality check PASSED")
    print("="*60)
    
except FileNotFoundError:
    print("❌ Error: structured_training_from_vet_verified_augmented_fixed.csv not found")
except Exception as e:
    print(f"❌ Error reading training data: {e}")