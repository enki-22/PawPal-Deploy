import pandas as pd
import shutil
from datetime import datetime

print("\n" + "="*60)
print("🔧 FIXING POISONED TRAINING DATA")
print("="*60)

# Backup original file
backup_file = f'training_data_BACKUP_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
shutil.copy('structured_training_from_vet_verified_augmented_fixed.csv', backup_file)
print(f"\n✅ Backup created: {backup_file}")

# Load data
df = pd.read_csv('structured_training_from_vet_verified_augmented_fixed.csv')
print(f"✅ Loaded {len(df)} samples, {df['disease'].nunique()} unique diseases")

# Define emergency diseases with correct urgency
EMERGENCY_FIXES = {
    'Canine Parvovirus': 'emergency',
    'Pyometra': 'severe',
    'Heatstroke': 'severe',
    'Heat Stroke': 'severe',
    'Feline Panleukopenia Virus': 'severe',
    'Urethral Obstruction': 'severe',
    'Urinary Obstruction': 'severe',
    'Gastric Dilation (Bloat)': 'severe',
    'Rabies': 'emergency',
    'Wet Tail': 'severe',
    'Wet Tail (Proliferative Ileitis)': 'severe',
    'Rabbit Hemorrhagic Disease Virus': 'severe',
    'Flystrike (Myiasis)': 'severe',
    'Ammonia Poisoning': 'severe',
    'pH Shock': 'severe',
    'Cold Water Shock': 'severe',
    'Heat Shock': 'severe',
    'Koi Herpes Virus': 'severe',
    'Avian Influenza': 'severe',
    'Newcastle Disease': 'severe',
    'Egg Binding': 'severe',
    'Dystocia': 'severe',
    'Dystocia (Egg Binding)': 'severe',
    'Dystocia (Egg Binding equivalent)': 'severe',
    'Heavy Metal Poisoning': 'severe',
    'Prolapse (Cloacal/Vent)': 'severe',
    'Vent Prolapse': 'severe',
    'Cloacal Prolapse': 'severe',
    'Breathing Difficulties': 'severe',
    'Drowning/Hypothermia': 'severe',
    'Infectious Canine Hepatitis': 'severe',
    'Pancreatitis (Acute)': 'severe',
    'Urinary Blockage': 'severe',
    'Feline Infectious Peritonitis (Wet form)': 'severe',
    'Shell Injuries/Trauma (Severe)': 'severe',
    'Nitrate Poisoning (Severe)': 'severe',
    'Oxygen Deprivation': 'severe',
    'Hemorrhagic Septicemia': 'severe',
    '(Hemorrhagic Septicemia / Ulcerative Syndromes)': 'severe',
    'Dropsy (Advanced)': 'severe',
    'Psittacosis (Chlamydiosis, Severe)': 'severe',
    "Pacheco's Disease": 'severe',
}

print("\n" + "-"*60)
print("FIXING EMERGENCY DISEASES")
print("-"*60)

total_fixes = 0
for disease, correct_urgency in EMERGENCY_FIXES.items():
    # Find samples with wrong urgency (not severe/critical/emergency)
    mask = (df['disease'] == disease) & (~df['urgency'].isin(['severe', 'critical', 'emergency']))
    wrong_count = mask.sum()
    
    if wrong_count > 0:
        old_values = df.loc[mask, 'urgency'].value_counts().to_dict()
        df.loc[mask, 'urgency'] = correct_urgency
        print(f"\n✅ {disease}:")
        print(f"   Fixed {wrong_count} samples: {old_values} → {correct_urgency}")
        total_fixes += wrong_count

print("\n" + "="*60)
print(f"✅ FIXED {total_fixes} POISONED SAMPLES")
print("="*60)

# Save fixed data
df.to_csv('structured_training_from_vet_verified_augmented_fixed.csv', index=False)
print(f"\n✅ Saved fixed training data")

# Verify fixes
print("\n" + "-"*60)
print("VERIFICATION")
print("-"*60)

critical_diseases = ['Canine Parvovirus', 'Pyometra', 'Heatstroke', 
                     'Feline Panleukopenia Virus', 'Urethral Obstruction']

all_good = True
for disease in critical_diseases:
    disease_samples = df[df['disease'] == disease]
    if len(disease_samples) > 0:
        wrong = disease_samples[~disease_samples['urgency'].isin(['severe', 'critical', 'emergency'])]
        if len(wrong) > 0:
            print(f"❌ {disease}: Still has {len(wrong)} wrong samples!")
            all_good = False
        else:
            urgency_dist = disease_samples['urgency'].value_counts().to_dict()
            print(f"✅ {disease}: {len(disease_samples)} samples - {urgency_dist}")

print("\n" + "="*60)
if all_good:
    print("✅ ALL FIXES VERIFIED SUCCESSFULLY!")
    print("\n⚠️  NEXT STEP: Run 'python train_model.py' to retrain")
else:
    print("❌ Some issues remain - check manually")
print("="*60)