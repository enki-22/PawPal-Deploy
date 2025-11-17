#!/usr/bin/env python3
"""
Extract intended symptoms for each disease from pet_disease_dataset_final.csv
Identifies what symptoms SHOULD be associated with each disease based on vet research
"""

import csv
import json
from collections import defaultdict
from statistics import mode, StatisticsError

# CANONICAL SYMPTOMS LIST (69 symptoms)
CANONICAL_SYMPTOMS = {
    'vomiting', 'diarrhea', 'lethargy', 'loss_of_appetite', 'weight_loss', 'fever', 
    'dehydration', 'weakness', 'seizures', 'coughing', 'sneezing', 'wheezing', 
    'labored_breathing', 'difficulty_breathing', 'nasal_discharge', 'nasal_congestion', 
    'respiratory_distress', 'scratching', 'itching', 'hair_loss', 'bald_patches', 
    'red_skin', 'irritated_skin', 'skin_lesions', 'rash', 'scabs', 'dandruff', 
    'watery_eyes', 'eye_discharge', 'red_eyes', 'squinting', 'ear_discharge', 
    'ear_scratching', 'head_shaking', 'constipation', 'bloating', 'gas', 
    'excessive_eating', 'blood_in_urine', 'frequent_urination', 'straining_to_urinate', 
    'dark_urine', 'cloudy_urine', 'bad_breath', 'drooling', 'difficulty_eating', 
    'swollen_gums', 'red_gums', 'mouth_pain', 'aggression', 'hiding', 'restlessness', 
    'confusion', 'circling', 'limping', 'lameness', 'difficulty_walking', 'stiffness', 
    'reluctance_to_move', 'paralysis', 'drooping_wing', 'feather_loss', 'wing_droop', 
    'fluffed_feathers', 'tail_bobbing', 'white_spots', 'fin_rot', 'swimming_upside_down', 
    'gasping_at_surface', 'clamped_fins', 'rubbing_against_objects', 'cloudy_eyes', 
    'head_tilt', 'rolling', 'loss_of_balance', 'dental_issues', 'wet_tail', 'lumps', 
    'bumps', 'overgrown_teeth', 'swelling', 'straining', 'increased_thirst', 
    'increased_thirst', 'gasping', 'visible_parasites'
}

# Symptom indicators - map canonical symptoms to text patterns
SYMPTOM_INDICATORS = {
    'vomiting': ['vomit', 'throwing up', 'regurgitat', 'nausea'],
    'diarrhea': ['diarrhea', 'diarrhoea', 'loose stool', 'watery stool', 'soft stool'],
    'lethargy': ['letharg', 'tired', 'weak', 'listless', 'inactive', 'low energy', 'sluggish', 'fatigue'],
    'loss_of_appetite': ['not eating', 'loss of appetite', 'won\'t eat', 'refuses food', 'decreased appetite', 'anorexia', 'inappetence'],
    'weight_loss': ['weight loss', 'losing weight', 'weight gain', 'thin', 'emaciat'],
    'fever': ['fever', 'high temperature', 'elevated temperature', 'feverish', 'pyrexia'],
    'dehydration': ['dehydrat', 'dry mouth', 'sunken eyes'],
    'weakness': ['weak', 'weakness', 'frail', 'debilitat'],
    'seizures': ['seizure', 'convulsion', 'epilepsy', 'fitting', 'fit'],
    'coughing': ['cough', 'hacking', 'coughed'],
    'sneezing': ['sneez', 'sternutat'],
    'wheezing': ['wheez', 'whistling breath'],
    'labored_breathing': ['labored breathing', 'laboured breathing', 'difficult breathing', 'struggling to breathe'],
    'difficulty_breathing': ['difficulty breathing', 'breathing problem', 'can\'t breathe', 'respiratory distress', 'dyspnea'],
    'nasal_discharge': ['nasal discharge', 'discharge from nose', 'runny nose', 'nose discharge', 'nasal fluid'],
    'nasal_congestion': ['nasal congestion', 'congested nose', 'stuffy nose', 'blocked nose'],
    'respiratory_distress': ['respiratory distress', 'respiratory problem', 'breathing distress'],
    'scratching': ['scratch', 'scratching', 'clawing'],
    'itching': ['itch', 'itching', 'pruritus', 'itchy'],
    'hair_loss': ['hair loss', 'bald', 'alopecia', 'losing fur', 'losing hair', 'fur loss'],
    'bald_patches': ['bald patch', 'hairless patch', 'bare patch'],
    'red_skin': ['red skin', 'erythema', 'redness', 'inflamed skin'],
    'irritated_skin': ['irritated skin', 'skin irritation', 'irritation'],
    'skin_lesions': ['skin lesion', 'lesion', 'wound', 'sore'],
    'rash': ['rash', 'dermatitis', 'eruption'],
    'scabs': ['scab', 'crusting', 'crusty'],
    'dandruff': ['dandruff', 'flaking', 'scaling', 'scale'],
    'watery_eyes': ['watery eyes', 'tearing', 'tear', 'weepy eyes'],
    'eye_discharge': ['eye discharge', 'discharge from eye', 'weepy eyes', 'crusty eyes', 'ocular discharge'],
    'red_eyes': ['red eyes', 'eye redness', 'conjunctivitis', 'pink eye'],
    'squinting': ['squint', 'squinting', 'blepharospasm'],
    'ear_discharge': ['ear discharge', 'ear drainage', 'discharge from ear', 'ear fluid', 'ear wax'],
    'ear_scratching': ['scratch ear', 'scratching ear', 'pawing ear', 'rubbing ear', 'ear scratch'],
    'head_shaking': ['shaking head', 'shakes head', 'head shake', 'shake head', 'head toss'],
    'constipation': ['constipat', 'no bowel', 'can\'t defecate'],
    'bloating': ['bloat', 'bloated', 'abdominal distention', 'distended'],
    'gas': ['gas', 'flatulence', 'bloat'],
    'excessive_eating': ['excessive eating', 'overeating', 'polyphagia', 'eating too much'],
    'blood_in_urine': ['blood in urine', 'hematuria', 'bloody urine', 'blood urine'],
    'frequent_urination': ['frequent urination', 'polyuria', 'urinating often', 'urinating frequently'],
    'straining_to_urinate': ['straining to urinate', 'difficulty urinating', 'painful urination', 'dysuria'],
    'dark_urine': ['dark urine', 'dark colored urine', 'discolored urine'],
    'cloudy_urine': ['cloudy urine', 'turbid urine', 'discolored urine'],
    'bad_breath': ['bad breath', 'halitosis', 'foul breath', 'odor', 'odour'],
    'drooling': ['drool', 'salivation', 'excessive saliva', 'ptyalism'],
    'difficulty_eating': ['difficulty eating', 'eating problem', 'can\'t eat', 'dysphagia'],
    'swollen_gums': ['swollen gums', 'gum swelling', 'gum enlargement'],
    'red_gums': ['red gums', 'gum redness', 'inflamed gums'],
    'mouth_pain': ['mouth pain', 'oral pain', 'painful mouth'],
    'aggression': ['aggression', 'aggressive', 'hostile', 'attacking'],
    'hiding': ['hiding', 'hiding away', 'withdrawn'],
    'restlessness': ['restless', 'restlessness', 'pacing', 'unable to settle'],
    'confusion': ['confusion', 'confused', 'disoriented', 'disorient'],
    'circling': ['circling', 'circle', 'spinning'],
    'limping': ['limp', 'limping', 'lame'],
    'lameness': ['lame', 'lameness', 'limping'],
    'difficulty_walking': ['difficulty walking', 'walking problem', 'can\'t walk', 'ataxia'],
    'stiffness': ['stiff', 'stiffness', 'rigid', 'rigidity'],
    'reluctance_to_move': ['reluctant to move', 'reluctance to move', 'won\'t move', 'immobile'],
    'paralysis': ['paralysis', 'paralyzed', 'paresis', 'unable to move'],
    'drooping_wing': ['drooping wing', 'drooped wing', 'wing droop'],
    'feather_loss': ['feather loss', 'feather dropping', 'losing feathers', 'plucking'],
    'wing_droop': ['wing droop', 'drooping wing', 'drooped wing'],
    'fluffed_feathers': ['fluffed feathers', 'puffed feathers', 'ruffled feathers'],
    'tail_bobbing': ['tail bobbing', 'bobbing tail', 'tail bob'],
    'white_spots': ['white spot', 'white spots', 'white patch'],
    'fin_rot': ['fin rot', 'rotting fin', 'torn fin'],
    'swimming_upside_down': ['swimming upside down', 'upside down', 'inverted'],
    'gasping_at_surface': ['gasping at surface', 'gasping', 'surface gasping'],
    'clamped_fins': ['clamped fin', 'clamped fins', 'fin clamping'],
    'rubbing_against_objects': ['rubbing against', 'rubbing on', 'scratching on'],
    'cloudy_eyes': ['cloudy eyes', 'cloudy eye', 'opacity', 'opaque'],
    'head_tilt': ['head tilt', 'tilting head', 'head tilt'],
    'rolling': ['rolling', 'rolling over', 'rolling around'],
    'loss_of_balance': ['loss of balance', 'balance problem', 'unbalanced', 'vertigo'],
    'dental_issues': ['dental', 'tooth', 'teeth', 'dental disease'],
    'wet_tail': ['wet tail', 'wet tail disease', 'tail wet'],
    'lumps': ['lump', 'lumps', 'mass', 'masses', 'tumor', 'tumour', 'growth'],
    'bumps': ['bump', 'bumps', 'nodule', 'nodules'],
    'overgrown_teeth': ['overgrown teeth', 'overgrown tooth', 'teeth overgrown'],
    'swelling': ['swelling', 'swollen', 'edema', 'oedema', 'enlargement'],
    'straining': ['straining', 'strain', 'tenesmus'],
    'increased_thirst': ['increased thirst', 'drinking more', 'polydipsia', 'thirsty'],
    'gasping': ['gasping', 'gasps', 'gasped'],
    'visible_parasites': ['visible parasite', 'parasite', 'worm', 'mite', 'lice'],
}

def enhanced_symptom_extraction(raw_texts):
    """
    Analyze all raw text descriptions to find symptoms that SHOULD be extracted
    """
    potential_symptoms = set()
    
    # Combine all text for this disease
    full_text = ' '.join(raw_texts).lower()
    
    # Check for each canonical symptom by looking for key phrases
    for symptom, indicators in SYMPTOM_INDICATORS.items():
        for indicator in indicators:
            if indicator.lower() in full_text:
                potential_symptoms.add(symptom)
                break
    
    return list(potential_symptoms)

# STEP 1 - Load Dataset
print("Loading dataset...")
disease_symptom_map = defaultdict(lambda: {
    'species': set(),
    'raw_symptom_texts': [],
    'urgency_levels': [],
    'contagious': False,
    'sources': set()
})

record_count = 0
try:
    with open('pet_disease_dataset_final.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            record_count += 1
            disease = row.get('disease', 'Unknown')
            species = row.get('species', 'Unknown')
            symptoms_text = row.get('symptoms', '')
            urgency = row.get('urgency', 'moderate')
            contagious = row.get('contagious', 'no')
            source = row.get('source', 'unknown')
            
            disease_symptom_map[disease]['species'].add(species)
            disease_symptom_map[disease]['raw_symptom_texts'].append(symptoms_text)
            disease_symptom_map[disease]['urgency_levels'].append(urgency)
            disease_symptom_map[disease]['contagious'] = disease_symptom_map[disease]['contagious'] or (contagious == 'yes')
            disease_symptom_map[disease]['sources'].add(source)
except FileNotFoundError:
    print("ERROR: pet_disease_dataset_final.csv not found!")
    exit(1)

print(f"Loaded {record_count} records")
print(f"Grouped into {len(disease_symptom_map)} diseases")

# STEP 2 & 3 - Generate Disease Profiles with Enhanced Extraction
print("\nExtracting symptom profiles...")
disease_profiles = {}

for disease, data in disease_symptom_map.items():
    # Enhanced symptom extraction from all raw texts
    comprehensive_symptoms = enhanced_symptom_extraction(data['raw_symptom_texts'])
    
    # Get most common urgency
    if data['urgency_levels']:
        try:
            most_common_urgency = mode(data['urgency_levels'])
        except StatisticsError:
            most_common_urgency = data['urgency_levels'][0]
    else:
        most_common_urgency = 'moderate'
    
    disease_profiles[disease] = {
        'species': sorted(list(data['species'])),
        'symptoms': sorted(comprehensive_symptoms),
        'symptom_count': len(comprehensive_symptoms),
        'urgency': most_common_urgency,
        'contagious': 'yes' if data['contagious'] else 'no',
        'sources': sorted(list(data['sources'])),
        'sample_count': len(data['raw_symptom_texts'])
    }

# Save profiles
with open('disease_symptom_profiles.json', 'w') as f:
    json.dump(disease_profiles, f, indent=2)

print(f"✓ Extracted profiles for {len(disease_profiles)} diseases")
print(f"✓ Saved to disease_symptom_profiles.json")

# STEP 4 - Quality Report
print("\n" + "="*70)
print("DISEASE SYMPTOM PROFILE REPORT")
print("="*70)

total_symptoms = 0
low_symptom_count = 0

for disease, profile in sorted(disease_profiles.items()):
    symptom_count = profile['symptom_count']
    total_symptoms += symptom_count
    species_list = ', '.join(profile['species'])
    
    print(f"\n{disease}")
    print(f"  Species: {species_list}")
    print(f"  Symptoms ({symptom_count}): {', '.join(profile['symptoms'][:6])}" + 
          ("..." if symptom_count > 6 else ""))
    print(f"  Urgency: {profile['urgency']}")
    print(f"  Contagious: {profile['contagious']}")
    print(f"  Original samples: {profile['sample_count']}")
    
    if symptom_count < 3:
        print(f"  ⚠️  WARNING: Only {symptom_count} symptoms detected")
        low_symptom_count += 1

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Total diseases: {len(disease_profiles)}")
print(f"Total symptoms extracted: {total_symptoms}")
print(f"Average symptoms per disease: {total_symptoms / len(disease_profiles):.1f}")
print(f"Diseases with <3 symptoms: {low_symptom_count}")
print(f"\n✓ Disease profiles saved to: disease_symptom_profiles.json")
