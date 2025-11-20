import json

with open('pawpal_disease_metadata.json', 'r') as f:
    metadata = json.load(f)

# Check critical diseases
critical_check = [
    'Canine Parvovirus', 'Bloat/GDV', 'Pyometra', 'Heat Stroke',
    'Rabies', 'Urinary Obstruction', 'Urethral Obstruction',
    'Internal Bleeding', 'Respiratory Distress Syndrome',
    'Toxicity', 'Seizures', 'Feline Panleukopenia Virus',
]

print("\n" + "="*60)
print("🚨 CRITICAL DISEASE URGENCY CHECK")
print("="*60)

issues_found = []
for disease in critical_check:
    if disease in metadata:
        urgency = metadata[disease].get('urgency', 'MISSING')
        print(f"\n{disease}:")
        print(f"  Urgency: {urgency}")
        if urgency not in ['emergency', 'critical', 'severe']:
            print(f"  ❌ WRONG! Should be 'emergency', not '{urgency}'")
            issues_found.append((disease, urgency))
        else:
            print(f"  ✅ OK")
    else:
        print(f"\n{disease}: ❌ NOT FOUND IN METADATA")
        issues_found.append((disease, 'NOT FOUND'))

print("\n" + "="*60)
if issues_found:
    print(f"\n🚨 FOUND {len(issues_found)} CRITICAL ISSUES:")
    for disease, urgency in issues_found:
        print(f"  - {disease}: {urgency}")
    print("\n⚠️  METADATA IS CORRUPTED - MUST FIX BEFORE DEPLOYMENT")
else:
    print("\n✅ All critical diseases have correct urgency levels")
print("="*60)