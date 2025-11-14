"""
Improved Pet Disease Dataset Generator
Creates natural, owner-friendly symptom descriptions.
"""

import csv
import random
import re

# Disease metadata
DISEASE_INFO = {
    # Dogs
    "Canine distemper": ("severe", "yes"), "Canine influenza": ("moderate", "yes"),
    "Canine parvovirus": ("severe", "yes"), "Ticks": ("moderate", "no"),
    "Fleas": ("mild", "yes"), "Heartworms": ("severe", "no"),
    "Kennel cough": ("moderate", "yes"), "Rabies": ("severe", "yes"),
    "Obesity": ("mild", "no"), "Diabetes": ("moderate", "no"),
    "Cataracts": ("mild", "no"), "Arthritis": ("mild", "no"),
    "Ear infections": ("moderate", "no"), "Diarrhea": ("moderate", "no"),
    "Broken bones": ("severe", "no"),
    # Cats
    "Chronic Kidney Disease": ("severe", "no"), "Cat Acne": ("mild", "no"),
    "Eosinophilic Granuloma Complex": ("moderate", "no"),
    "Feline Immunodeficiency Virus": ("severe", "yes"),
    "Feline Infectious Peritonitis": ("severe", "yes"),
    "Feline Leukemia Virus": ("severe", "yes"),
    "Feline Lower Urinary Tract Disease": ("moderate", "no"),
    "Feline Panleukopenia Virus": ("severe", "yes"),
    "Hyperthyroidism": ("moderate", "no"),
    "Inflammatory Bowel Disease": ("moderate", "no"),
    "Intestinal Parasites": ("moderate", "yes"),
    "Mammary Tumors": ("severe", "no"), "Mast Cell Tumor": ("severe", "no"),
    "Osteoarthritis": ("mild", "no"), "Pancreatitis": ("moderate", "no"),
    "Periodontal Disease": ("mild", "no"), "Gingivitis": ("mild", "no"),
    "Pyometra": ("severe", "no"), "Squamous Cell Carcinoma": ("severe", "no"),
    "Upper Respiratory Infection": ("moderate", "yes"),
    "Urethral Obstruction": ("severe", "no"),
    # Rabbits
    "Overgrown teeth": ("moderate", "no"), "Hairballs": ("moderate", "no"),
    "Snuffles": ("moderate", "yes"), "Myxomatosis": ("severe", "yes"),
    "Ear mites": ("mild", "yes"), "Sore hocks": ("moderate", "no"),
    "Flystrike": ("severe", "no"), "Breathing difficulties": ("severe", "no"),
    "Gastrointestinal stasis": ("severe", "no"), "Conjunctivitis": ("mild", "no"),
    "Corneal ulceration": ("moderate", "no"), "Otitis media/interna": ("moderate", "no"),
    "Splay leg": ("moderate", "no"), "Rhinitis": ("moderate", "yes"),
    "Pneumonia": ("severe", "yes"), "Hutch burn": ("mild", "no"),
    "Wet dewlap": ("mild", "no"), "Ringworm": ("mild", "yes"),
    # Hamsters
    "Wet tail": ("severe", "yes"), "Constipation": ("moderate", "no"),
    "Protrusion of the eyeball": ("severe", "no"),
    "Milk gland infection": ("moderate", "no"), "Skin abscesses": ("moderate", "no"),
    "Hair loss": ("mild", "no"), "Skin and fur mites": ("mild", "yes"),
    # Birds
    "Avian Gastric Yeast": ("moderate", "no"), "Candidiasis": ("moderate", "yes"),
    "Pacheco's Disease": ("severe", "yes"), "Giardiasis": ("moderate", "yes"),
    "Trichomoniasis": ("moderate", "yes"), "Roundworms": ("moderate", "yes"),
    "Conjunctivitis": ("mild", "no"), "Cataract": ("mild", "no"),
    "Fractures": ("severe", "no"), "Gout": ("moderate", "no"),
    "Aspergillosis": ("severe", "no"), "Avian Influenza": ("severe", "yes"),
    "Newcastle Disease": ("severe", "yes"), "Air sac mites": ("moderate", "yes"),
    "Cloacal prolapse": ("severe", "no"), "Egg binding": ("severe", "no"),
    "Feather cysts": ("mild", "no"), "Bumblefoot": ("moderate", "no"),
    "Scaly face": ("moderate", "yes"),
    "Psittacine Beak and Feather Disease": ("severe", "yes"),
    "Heavy metal poisoning": ("severe", "no"),
    # Turtles/Reptiles
    "Septicemia": ("severe", "no"), "Infectious stomatitis": ("moderate", "yes"),
    "Eye abscesses": ("moderate", "no"), "Abnormal beak growth": ("mild", "no"),
    "Stargazing": ("severe", "no"), "Dystocia": ("severe", "no"),
    "Vent prolapse": ("severe", "no"), "Abscesses": ("moderate", "no"),
    "Dysecdysis": ("mild", "no"), "Skin parasites": ("mild", "yes"),
    "Scale rot": ("moderate", "no"),
    # Fish
    "Papilloma": ("mild", "yes"), "Lymphocystis": ("mild", "yes"),
    "Fin Rot": ("moderate", "yes"), "Ich": ("moderate", "yes"),
    "Fungus": ("moderate", "yes"), "Popeye": ("moderate", "no"),
    "Skin and Gill Flukes": ("moderate", "yes"), "Lernaea": ("moderate", "yes"),
    "Swim Bladder Disease": ("moderate", "no"),
    "Vitamin C Deficiency": ("moderate", "no"), "Egg Retention": ("severe", "no"),
}

# Symptom extraction patterns
SYMPTOM_KEYWORDS = {
    'cough': ['coughing', 'cough', 'dry cough', 'persistent cough'],
    'fever': ['fever', 'high temperature', 'hot to touch'],
    'vomit': ['vomiting', 'vomit', 'throwing up', 'regurgitation', 'regurgitate'],
    'diarrhea': ['diarrhea', 'loose stool', 'watery stool', 'soft stool'],
    'discharge': ['discharge', 'drainage', 'nasal discharge', 'eye discharge'],
    'lethargy': ['lethargy', 'lethargic', 'tired', 'weak', 'low energy', 'no energy'],
    'appetite': ['no appetite', 'won\'t eat', 'not eating', 'decreased appetite', 'loss of appetite'],
    'weight': ['weight loss', 'losing weight', 'getting thin'],
    'itch': ['itching', 'scratching', 'scratch', 'itchy'],
    'limping': ['limping', 'limps', 'lameness', 'won\'t walk'],
    'breathing': ['breathing difficulty', 'labored breathing', 'difficulty breathing', 'gasping'],
    'eyes': ['watery eyes', 'red eyes', 'swollen eyes', 'cloudy eyes', 'eye problem'],
    'seizure': ['seizures', 'seizure', 'convulsions'],
    'paralysis': ['paralysis', 'paralyzed', 'can\'t move'],
    'sneeze': ['sneezing', 'sneeze', 'sneezes'],
    'drool': ['drooling', 'drool', 'excessive saliva'],
    'swelling': ['swelling', 'swollen', 'enlarged'],
    'pain': ['pain', 'painful', 'discomfort', 'hurts'],
    'blood': ['blood', 'bloody', 'bleeding'],
    'thirst': ['thirsty', 'drinking more', 'increased thirst'],
    'urination': ['urinating more', 'frequent urination', 'peeing often'],
}


def simplify_symptoms(symptom_list):
    """Convert technical symptoms to simple owner-friendly terms."""
    simplified = []
    
    for symptom in symptom_list[:20]:  # Limit processing
        symptom = symptom.lower().strip()
        # Remove technical terms and parentheses
        symptom = re.sub(r'\([^)]*\)', '', symptom)
        symptom = re.sub(r'\bsuch as\b.*', '', symptom)
        
        # Extract key phrases
        for key, variants in SYMPTOM_KEYWORDS.items():
            for variant in variants:
                if variant in symptom:
                    simplified.append(variant)
                    break
        
        # Add short raw symptoms
        if len(symptom) < 50 and len(symptom.split()) <= 5:
            simplified.append(symptom)
    
    # Remove duplicates while preserving some order
    seen = set()
    result = []
    for s in simplified:
        if s not in seen and len(s) > 3:
            seen.add(s)
            result.append(s)
    
    return result[:15]  # Max 15 symptoms


def generate_natural_description(species, disease, symptom_pool, variation):
    """Generate natural, varied symptom descriptions."""
    
    if not symptom_pool or len(symptom_pool) == 0:
        return f"My {species} is showing signs of illness"
    
    # Different templates for variety
    templates = [
        "My {pet} has {s1} and {s2}",
        "My {pet} is {s1} and seems {condition}",
        "I noticed my {pet} {s1}, also {s2}",
        "My {pet} has been {s1} with {s2}",
        "My {pet} shows {s1} and {s2}",
        "My {pet} won't stop {s1} and looks {condition}",
        "My {pet} keeps {s1}, and I see {s2}",
        "{s1} and {s2} in my {pet}",
        "My {pet} seems {condition} with {s1}",
        "I'm worried about my {pet}, it has {s1} and {s2}",
    ]
    
    conditions = [
        "very sick", "unwell", "not itself", "weak", "tired", 
        "uncomfortable", "in distress", "lethargic", "in pain"
    ]
    
    # Select symptoms based on variation
    random.seed(variation)
    num_symptoms = min(random.randint(2, 3), len(symptom_pool))
    selected_symptoms = random.sample(symptom_pool, num_symptoms)
    
    template = random.choice(templates)
    condition = random.choice(conditions)
    
    # Fill template
    if "{s1}" in template and "{s2}" in template:
        s1 = selected_symptoms[0]
        s2 = selected_symptoms[1] if len(selected_symptoms) > 1 else "other symptoms"
        result = template.format(pet=species, s1=s1, s2=s2, condition=condition)
    elif "{s1}" in template:
        s1 = ", ".join(selected_symptoms[:2])
        result = template.format(pet=species, s1=s1, condition=condition)
    else:
        result = f"My {species} has {', '.join(selected_symptoms[:2])}"
    
    # Clean up
    result = result.replace("  ", " ").strip()
    if not result.endswith(('.', '!', '?')):
        result += "."
    
    random.seed()  # Reset seed
    return result


def parse_dataset_file(filepath):
    """Parse dataset.md with improved symptom extraction."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    species_data = {}
    current_species = None
    current_disease = None
    current_symptoms = []
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Species headers
        species_map = {
            '🐶': 'dog', '🐱': 'cat', '🐰': 'rabbit', 
            '🐹': 'hamster', '🐦': 'bird', '🐢': 'turtle', '🐠': 'fish'
        }
        
        for emoji, sp_name in species_map.items():
            if line.startswith(emoji):
                current_species = sp_name
                species_data[current_species] = {}
                break
        
        # Disease detection
        if line.startswith('•') and current_species:
            if current_disease and current_symptoms:
                species_data[current_species][current_disease] = simplify_symptoms(current_symptoms)
            
            match = re.match(r'•\s*(.+?)\s*\((.+?)\)', line)
            if match:
                current_disease = match.group(1).strip()
                brief = match.group(2).strip()
                current_symptoms = [brief]
            else:
                current_disease = line[1:].strip()
                current_symptoms = []
        
        # Symptom collection
        elif line.startswith('-') and current_disease:
            symptom = line[1:].strip()
            if symptom and len(symptom) > 2:
                current_symptoms.append(symptom)
    
    # Final disease
    if current_disease and current_symptoms and current_species:
        species_data[current_species][current_disease] = simplify_symptoms(current_symptoms)
    
    return species_data


def generate_comprehensive_dataset(species_data, output_file, samples_per_disease=14):
    """Generate complete dataset with quality samples."""
    
    rows = []
    disease_count = {}
    
    for species, diseases in species_data.items():
        for disease, symptoms in diseases.items():
            # Find disease info
            disease_key = disease
            if disease_key not in DISEASE_INFO:
                for key in DISEASE_INFO.keys():
                    if disease.lower() in key.lower() or key.lower() in disease.lower():
                        disease_key = key
                        break
                else:
                    disease_key = disease
                    DISEASE_INFO[disease_key] = ("moderate", "no")
            
            urgency, contagious = DISEASE_INFO[disease_key]
            
            # Track diseases
            if disease not in disease_count:
                disease_count[disease] = 0
            
            # Generate samples
            for i in range(samples_per_disease):
                symptom_text = generate_natural_description(species, disease, symptoms, i)
                source = "real" if i == 0 else "synthetic"
                
                rows.append([species, disease, symptom_text, urgency, contagious, source])
                disease_count[disease] += 1
    
    # Write CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source'])
        writer.writerows(rows)
    
    print(f"\n{'='*60}")
    print(f"DATASET GENERATED: {output_file}")
    print(f"{'='*60}")
    print(f"Total samples: {len(rows)}")
    print(f"Unique diseases: {len(disease_count)}")
    print(f"\nSpecies Distribution:")
    for sp in sorted(set(row[0] for row in rows)):
        count = sum(1 for row in rows if row[0] == sp)
        print(f"  {sp:12s}: {count:4d} samples")
    
    print(f"\nUrgency Distribution:")
    for urg in ['mild', 'moderate', 'severe']:
        count = sum(1 for row in rows if row[3] == urg)
        print(f"  {urg:12s}: {count:4d} samples ({100*count/len(rows):.1f}%)")
    
    print(f"\nContagious Distribution:")
    for cont in ['yes', 'no']:
        count = sum(1 for row in rows if row[4] == cont)
        print(f"  {cont:12s}: {count:4d} samples ({100*count/len(rows):.1f}%)")
    
    print(f"\nSource Distribution:")
    for src in ['real', 'synthetic']:
        count = sum(1 for row in rows if row[5] == src)
        print(f"  {src:12s}: {count:4d} samples")
    
    print(f"{'='*60}\n")


if __name__ == "__main__":
    print("="*60)
    print("PET DISEASE DATASET GENERATOR")
    print("="*60)
    
    print("\n1. Parsing dataset.md...")
    species_data = parse_dataset_file("dataset.md")
    
    total_diseases = sum(len(diseases) for diseases in species_data.values())
    print(f"   Found {len(species_data)} species with {total_diseases} diseases")
    
    for species, diseases in species_data.items():
        print(f"   - {species:12s}: {len(diseases):2d} diseases")
    
    print("\n2. Generating natural language samples...")
    generate_comprehensive_dataset(species_data, "pet_disease_dataset.csv", samples_per_disease=14)
    
    print("✓ Dataset generation complete!")
