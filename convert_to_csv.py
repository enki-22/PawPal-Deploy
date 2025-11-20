import re
import csv

# Your canonical symptom list from train_model.py
CANONICAL_SYMPTOMS = [
    "vomiting", "diarrhea", "lethargy", "loss_of_appetite", "weight_loss",
    "fever", "dehydration", "weakness", "seizures",
    "coughing", "sneezing", "wheezing", "labored_breathing", "difficulty_breathing",
    "nasal_discharge", "nasal_congestion", "respiratory_distress",
    "scratching", "itching", "hair_loss", "bald_patches", "red_skin",
    "irritated_skin", "skin_lesions", "rash", "scabs", "dandruff",
    "watery_eyes", "eye_discharge", "red_eyes", "squinting",
    "ear_discharge", "ear_scratching", "head_shaking",
    "constipation", "bloating", "gas", "not_eating", "excessive_eating",
    "blood_in_urine", "frequent_urination", "straining_to_urinate",
    "dark_urine", "cloudy_urine",
    "bad_breath", "drooling", "difficulty_eating", "swollen_gums",
    "red_gums", "mouth_pain",
    "aggression", "hiding", "restlessness", "confusion", "circling",
    "limping", "lameness", "difficulty_walking", "stiffness",
    "reluctance_to_move", "paralysis",
    "drooping_wing", "feather_loss", "wing_droop", "fluffed_feathers",
    "tail_bobbing",
    "white_spots", "fin_rot", "swimming_upside_down", "gasping_at_surface",
    "clamped_fins", "rubbing_against_objects", "cloudy_eyes",
    "head_tilt", "rolling", "loss_of_balance", "dental_issues",
    "wet_tail", "lumps", "bumps", "overgrown_teeth",
    "pale_gums", "swelling", "discharge", "anemia", "skin_ulcers",
    "mucus", "crusty_eyes", "swollen_joints", "muscle_wasting",
    "excessive_thirst", "increased_urination", "bloody_stool",
    "straining_to_defecate", "abdominal_pain", "distended_abdomen",
    "open_mouth_breathing", "whimpering", "vocalization", "grinding_teeth",
    "hunched_posture", "shivering", "tremors", "incoordination"
]

# Comprehensive symptom mapping from verbose descriptions to canonical names
SYMPTOM_MAPPINGS = {
    # General symptoms
    "lethargy": "lethargy",
    "lethargic": "lethargy",
    "low energy": "lethargy",
    "tired": "lethargy",
    "weakness": "weakness",
    "weak": "weakness",
    "collapse": "weakness",
    "vomiting": "vomiting",
    "regurgitation": "vomiting",
    "throwing up": "vomiting",
    "diarrhea": "diarrhea",
    "loose stool": "diarrhea",
    "watery stool": "diarrhea",
    "soft stool": "diarrhea",
    "weight loss": "weight_loss",
    "losing weight": "weight_loss",
    "thin": "weight_loss",
    "emaciation": "weight_loss",
    "loss of appetite": "loss_of_appetite",
    "not eating": "loss_of_appetite",
    "decreased appetite": "loss_of_appetite",
    "anorexia": "loss_of_appetite",
    "refusal to eat": "loss_of_appetite",
    "fever": "fever",
    "high temperature": "fever",
    "dehydration": "dehydration",
    "seizures": "seizures",
    "convulsions": "seizures",
    
    # Respiratory
    "coughing": "coughing",
    "cough": "coughing",
    "sneezing": "sneezing",
    "wheezing": "wheezing",
    "difficulty breathing": "difficulty_breathing",
    "labored breathing": "labored_breathing",
    "gasping": "difficulty_breathing",
    "respiratory distress": "respiratory_distress",
    "breathing problems": "difficulty_breathing",
    "nasal discharge": "nasal_discharge",
    "runny nose": "nasal_discharge",
    "nose discharge": "nasal_discharge",
    "nasal congestion": "nasal_congestion",
    "open mouth breathing": "open_mouth_breathing",
    
    # Skin & Coat
    "scratching": "scratching",
    "itching": "itching",
    "itchy": "itching",
    "hair loss": "hair_loss",
    "fur loss": "hair_loss",
    "bald patches": "bald_patches",
    "alopecia": "hair_loss",
    "red skin": "red_skin",
    "redness": "red_skin",
    "irritated skin": "irritated_skin",
    "skin lesions": "skin_lesions",
    "sores": "skin_lesions",
    "ulcers": "skin_ulcers",
    "rash": "rash",
    "scabs": "scabs",
    "crusting": "scabs",
    "dandruff": "dandruff",
    "flaky skin": "dandruff",
    "scaling": "dandruff",
    
    # Eyes & Ears
    "watery eyes": "watery_eyes",
    "eye discharge": "eye_discharge",
    "discharge from eyes": "eye_discharge",
    "red eyes": "red_eyes",
    "squinting": "squinting",
    "cloudy eyes": "cloudy_eyes",
    "ear discharge": "ear_discharge",
    "head shaking": "head_shaking",
    "ear scratching": "ear_scratching",
    
    # Digestive
    "constipation": "constipation",
    "bloating": "bloating",
    "distended abdomen": "distended_abdomen",
    "swollen abdomen": "distended_abdomen",
    "abdominal distention": "distended_abdomen",
    "gas": "gas",
    "abdominal pain": "abdominal_pain",
    
    # Urinary
    "blood in urine": "blood_in_urine",
    "bloody urine": "blood_in_urine",
    "hematuria": "blood_in_urine",
    "frequent urination": "frequent_urination",
    "increased urination": "frequent_urination",
    "straining to urinate": "straining_to_urinate",
    "difficulty urinating": "straining_to_urinate",
    "dark urine": "dark_urine",
    "cloudy urine": "cloudy_urine",
    
    # Oral/Dental
    "bad breath": "bad_breath",
    "halitosis": "bad_breath",
    "drooling": "drooling",
    "excessive saliva": "drooling",
    "difficulty eating": "difficulty_eating",
    "difficulty chewing": "difficulty_eating",
    "swollen gums": "swollen_gums",
    "red gums": "red_gums",
    "pale gums": "pale_gums",
    "overgrown teeth": "overgrown_teeth",
    "dental issues": "dental_issues",
    
    # Behavioral
    "aggression": "aggression",
    "hiding": "hiding",
    "restlessness": "restlessness",
    "confusion": "confusion",
    "disorientation": "confusion",
    
    # Mobility
    "limping": "limping",
    "lameness": "lameness",
    "difficulty walking": "difficulty_walking",
    "stiffness": "stiffness",
    "reluctance to move": "reluctance_to_move",
    "paralysis": "paralysis",
    "incoordination": "incoordination",
    "loss of coordination": "incoordination",
    
    # Bird-specific
    "drooping wing": "drooping_wing",
    "feather loss": "feather_loss",
    "fluffed feathers": "fluffed_feathers",
    "tail bobbing": "tail_bobbing",
    
    # Fish-specific
    "white spots": "white_spots",
    "fin rot": "fin_rot",
    "swimming upside down": "swimming_upside_down",
    "gasping at surface": "gasping_at_surface",
    "clamped fins": "clamped_fins",
    "rubbing against objects": "rubbing_against_objects",
    "flashing": "rubbing_against_objects",
    
    # Rabbit/Small mammal
    "head tilt": "head_tilt",
    "rolling": "rolling",
    "loss of balance": "loss_of_balance",
    "wet tail": "wet_tail",
    "lumps": "lumps",
    "bumps": "bumps",
    
    # Additional
    "swelling": "swelling",
    "discharge": "discharge",
    "anemia": "anemia",
    "mucus": "mucus",
    "swollen joints": "swollen_joints",
    "muscle wasting": "muscle_wasting",
    "excessive thirst": "excessive_thirst",
    "increased drinking": "excessive_thirst",
    "bloody stool": "bloody_stool",
    "blood in stool": "bloody_stool",
    "straining to defecate": "straining_to_defecate",
    "vocalization": "vocalization",
    "grinding teeth": "grinding_teeth",
    "hunched posture": "hunched_posture",
    "shivering": "shivering",
    "tremors": "tremors",
}

def normalize_symptom(symptom_text):
    """Convert verbose symptom description to canonical name."""
    # Clean the text
    symptom = symptom_text.lower().strip()
    
    # Remove common prefixes/suffixes
    symptom = re.sub(r'^(visible|noticeable|excessive|frequent|persistent|chronic|acute|severe|mild|occasional|intermittent)\s+', '', symptom)
    symptom = re.sub(r'\s+(visible|noticeable)$', '', symptom)
    
    # Remove parenthetical notes and dashes
    symptom = re.sub(r'\([^)]*\)', '', symptom)
    symptom = re.sub(r'—.*$', '', symptom)
    symptom = re.sub(r'\s*-\s*.*$', '', symptom)
    
    # Remove "or" alternatives (keep first part)
    if ' or ' in symptom:
        symptom = symptom.split(' or ')[0]
    if '/' in symptom:
        symptom = symptom.split('/')[0]
    
    symptom = symptom.strip()
    
    # Try direct mapping first
    if symptom in SYMPTOM_MAPPINGS:
        return SYMPTOM_MAPPINGS[symptom]
    
    # Try keyword matching
    for key, canonical in SYMPTOM_MAPPINGS.items():
        if key in symptom or symptom in key:
            return canonical
    
    # Fallback: convert to underscore format
    canonical = re.sub(r'[^\w\s]', '', symptom)
    canonical = canonical.replace(' ', '_')
    canonical = re.sub(r'_+', '_', canonical)
    canonical = canonical.strip('_')
    
    return canonical if canonical else None

def standardize_species(species_text):
    """Standardize species name."""
    species = species_text.strip().strip('[]')
    
    # Handle compound names first (before plural standardization)
    # Use regex to handle any spacing variations
    species = re.sub(r'[Tt]urtle\s*/\s*[Rr]eptile', 'Turtle', species)
    species = re.sub(r'[Tt]urtle\s*-\s*[Rr]eptile', 'Turtle', species)
    
    # Standardize plural to singular (case-insensitive)
    species_lower = species.lower()
    if 'dogs' in species_lower:
        species = re.sub(r'[Dd]ogs', 'Dog', species)
    if 'cats' in species_lower:
        species = re.sub(r'[Cc]ats', 'Cat', species)
    if 'birds' in species_lower:
        species = re.sub(r'[Bb]irds', 'Bird', species)
    if 'rabbits' in species_lower:
        species = re.sub(r'[Rr]abbits', 'Rabbit', species)
    if 'hamsters' in species_lower:
        species = re.sub(r'[Hh]amsters', 'Hamster', species)
    if 'turtles' in species_lower:
        species = re.sub(r'[Tt]urtles', 'Turtle', species)
    if 'fishes' in species_lower:
        species = re.sub(r'[Ff]ishes', 'Fish', species)
    
    # Standardize case for known species
    if species.lower() in ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'turtle', 'fish']:
        return species.capitalize()
    
    # Handle SPECIES or other weird values
    if species.upper() == 'SPECIES' or not species:
        return None
    
    # Default: capitalize first letter
    return species.capitalize()

def parse_simple_format(content):
    """Parse the simple bullet-list format from top of file."""
    diseases = []
    current_species = None
    current_disease = None
    current_symptoms = []
    
    lines = content.split('\n')
    
    for line in lines:
        line_stripped = line.strip()
        
        # STOP if we hit the detailed format section
        if line_stripped.startswith('Disease:'):
            break
        
        # Detect species header (emoji + species name)
        if re.match(r'^[🐶🐱🐰🐹🐦🐢🐠]', line_stripped):
            # Save previous disease if exists before switching species
            if current_disease and current_symptoms and current_species:
                diseases.append({
                    'species': current_species,
                    'disease': current_disease,
                    'symptoms': ', '.join(list(dict.fromkeys(current_symptoms))),
                    'urgency': 'medium',
                    'contagious': 'no',
                    'source': 'overhaul_simple'
                })
                current_disease = None
                current_symptoms = []
            
            current_species = re.sub(r'^[🐶🐱🐰🐹🐦🐢🐠]\s*', '', line_stripped)
            current_species = standardize_species(current_species)
            continue
        
        # Detect any bullet point (•) - either a valid disease or a marker to stop current disease
        if line_stripped.startswith('•'):
            # Save previous disease if exists (regardless of whether new bullet has parenthesis)
            if current_disease and current_symptoms:
                diseases.append({
                    'species': current_species,
                    'disease': current_disease,
                    'symptoms': ', '.join(list(dict.fromkeys(current_symptoms))),
                    'urgency': 'medium',
                    'contagious': 'no',
                    'source': 'overhaul_simple'
                })
                current_disease = None
                current_symptoms = []
            
            # Only start a new disease if this bullet has proper format (parenthesis)
            if '(' in line_stripped and current_species:
                # Extract disease name and initial symptoms
                disease_part = line_stripped.lstrip('•\t ')
                
                # Extract disease name (before parenthesis)
                disease_name = disease_part.split('(')[0].strip()
                # Extract symptoms from parenthesis
                symptom_text = disease_part.split('(')[1].split(')')[0]
                current_disease = disease_name
                current_symptoms = []
                
                # Parse symptoms from parenthesis
                for symptom in symptom_text.split(','):
                    canonical = normalize_symptom(symptom.strip())
                    if canonical:
                        current_symptoms.append(canonical)
            continue
        
        # Detect symptom sub-bullets (- symptom)
        if line_stripped.startswith('-') and current_disease:
            symptom_raw = line_stripped.lstrip('-\t ').split('—')[0].strip()
            if symptom_raw and len(symptom_raw) > 2:
                canonical = normalize_symptom(symptom_raw)
                if canonical:
                    current_symptoms.append(canonical)
    
    # Save last disease
    if current_disease and current_symptoms and current_species:
        diseases.append({
            'species': current_species,
            'disease': current_disease,
            'symptoms': ', '.join(list(dict.fromkeys(current_symptoms))),
            'urgency': 'medium',
            'contagious': 'no',
            'source': 'overhaul_simple'
        })
    
    return diseases

def parse_detailed_format(content):
    """Parse the detailed Disease: format with FINAL SYMPTOM LIST."""
    disease_sections = re.split(r'^Disease:', content, flags=re.MULTILINE)
    diseases = []
    
    for section in disease_sections[1:]:
        lines = section.strip().split('\n')
        
        # Extract disease name
        disease_name = lines[0].strip().strip('[]')
        
        # Extract species
        species_line = next((l for l in lines if l.startswith('Species:')), None)
        if not species_line:
            continue
        species = species_line.replace('Species:', '').strip()
        species = standardize_species(species)
        
        # Skip if species is invalid (None means 'SPECIES' or empty)
        if not species:
            continue
        
        # Extract urgency
        urgency_line = next((l for l in lines if l.startswith('Urgency:')), None)
        if not urgency_line:
            continue
        urgency = urgency_line.replace('Urgency:', '').strip().lower()
        if 'emergency' in urgency or 'critical' in urgency:
            urgency = 'emergency'
        elif 'high' in urgency:
            urgency = 'high'
        elif 'severe' in urgency:
            urgency = 'severe'
        elif 'medium' in urgency or 'moderate' in urgency:
            urgency = 'medium'
        else:
            urgency = 'medium'
        
        # Extract contagious
        contagious_line = next((l for l in lines if l.startswith('Contagious:')), None)
        if not contagious_line:
            continue
        contagious = contagious_line.replace('Contagious:', '').strip().lower()
        contagious = 'yes' if ('yes' in contagious or 'zoonotic' in contagious) else 'no'
        
        # Extract symptoms from FINAL SYMPTOM LIST
        symptom_section_start = None
        for i, line in enumerate(lines):
            if 'FINAL SYMPTOM LIST' in line:
                symptom_section_start = i + 1
                break
        
        if symptom_section_start is None:
            continue
        
        symptoms = []
        for i in range(symptom_section_start, len(lines)):
            line = lines[i].strip()
            if line.startswith('Urgency:') or line.startswith('Contagious:'):
                break
            if line.startswith('•') or line.startswith('-'):
                symptom_raw = line.lstrip('•-\t ').split('—')[0].split('(')[0].strip()
                if symptom_raw and len(symptom_raw) > 2:
                    canonical = normalize_symptom(symptom_raw)
                    if canonical:
                        symptoms.append(canonical)
        
        # Remove duplicates while preserving order
        symptoms = list(dict.fromkeys(symptoms))
        
        if symptoms and disease_name and species:
            diseases.append({
                'species': species,
                'disease': disease_name,
                'symptoms': ', '.join(symptoms),
                'urgency': urgency,
                'contagious': contagious,
                'source': 'overhaul_detailed'
            })
    
    return diseases

def parse_overhaul_md(file_path):
    """Parse overhaul.md and extract disease information from BOTH formats."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Parse both formats
    simple_diseases = parse_simple_format(content)
    detailed_diseases = parse_detailed_format(content)
    
    # Combine and deduplicate by (species, disease) pair
    all_diseases = simple_diseases + detailed_diseases
    
    # Prefer detailed format over simple if duplicate exists
    unique_diseases = {}
    for disease in all_diseases:
        key = (disease['species'], disease['disease'])
        # Prefer detailed format (has proper urgency/contagious data)
        if key not in unique_diseases or disease['source'] == 'overhaul_detailed':
            unique_diseases[key] = disease
    
    return list(unique_diseases.values())

def write_csv(diseases, output_path):
    """Write diseases to CSV file."""
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source'])
        writer.writeheader()
        writer.writerows(diseases)
    
    print(f"✅ Converted {len(diseases)} diseases to CSV")

if __name__ == "__main__":
    input_file = "overhaul.md"
    output_file = "overhaul_converted.csv"
    
    print("🔄 Parsing overhaul.md with canonical symptom mapping...")
    diseases = parse_overhaul_md(input_file)
    
    print(f"\n📊 Found {len(diseases)} diseases:")
    species_count = {}
    for d in diseases:
        species_count[d['species']] = species_count.get(d['species'], 0) + 1
    
    for species, count in sorted(species_count.items()):
        print(f"  {species}: {count} diseases")
    
    print(f"\n💾 Writing to CSV...")
    write_csv(diseases, output_file)
    
    print("\n✅ Done!")
    print("\n📋 Sample rows:")
    for disease in diseases[:3]:
        print(f"\n{disease['species']} - {disease['disease']}")
        print(f"  Symptoms: {disease['symptoms'][:100]}...")
        print(f"  Urgency: {disease['urgency']} | Contagious: {disease['contagious']}")