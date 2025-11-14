"""
Final Optimized Pet Disease Dataset Generator
Creates high-quality natural language symptom descriptions for ML training.
"""

import csv
import random
import re
from collections import defaultdict

# Disease metadata
DISEASE_CONFIG = {
    "Canine distemper": ("severe", "yes"), "Canine influenza": ("moderate", "yes"),
    "Canine parvovirus": ("severe", "yes"), "Ticks": ("moderate", "no"),
    "Fleas": ("mild", "yes"), "Heartworms": ("severe", "no"),
    "Kennel cough": ("moderate", "yes"), "Rabies": ("severe", "yes"),
    "Obesity": ("mild", "no"), "Diabetes": ("moderate", "no"),
    "Cataracts": ("mild", "no"), "Arthritis": ("mild", "no"),
    "Ear infections": ("moderate", "no"), "Diarrhea": ("moderate", "no"),
    "Broken bones": ("severe", "no"),
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
    "Overgrown teeth": ("moderate", "no"), "Hairballs": ("moderate", "no"),
    "Snuffles": ("moderate", "yes"), "Myxomatosis": ("severe", "yes"),
    "Ear mites": ("mild", "yes"), "Sore hocks": ("moderate", "no"),
    "Flystrike": ("severe", "no"), "Breathing difficulties": ("severe", "no"),
    "Gastrointestinal stasis": ("severe", "no"), "Conjunctivitis": ("mild", "no"),
    "Corneal ulceration": ("moderate", "no"), "Otitis media/interna": ("moderate", "no"),
    "Splay leg": ("moderate", "no"), "Rhinitis": ("moderate", "yes"),
    "Pneumonia": ("severe", "yes"), "Hutch burn": ("mild", "no"),
    "Wet dewlap": ("mild", "no"), "Ringworm": ("mild", "yes"),
    "Wet tail": ("severe", "yes"), "Constipation": ("moderate", "no"),
    "Protrusion of the eyeball": ("severe", "no"),
    "Milk gland infection": ("moderate", "no"), "Skin abscesses": ("moderate", "no"),
    "Hair loss": ("mild", "no"), "Skin and fur mites": ("mild", "yes"),
    "Avian Gastric Yeast": ("moderate", "no"), "Candidiasis": ("moderate", "yes"),
    "Pacheco's Disease": ("severe", "yes"), "Giardiasis": ("moderate", "yes"),
    "Trichomoniasis": ("moderate", "yes"), "Roundworms": ("moderate", "yes"),
    "Cataract": ("mild", "no"), "Fractures": ("severe", "no"), 
    "Gout": ("moderate", "no"), "Aspergillosis": ("severe", "no"), 
    "Avian Influenza": ("severe", "yes"), "Newcastle Disease": ("severe", "yes"), 
    "Air sac mites": ("moderate", "yes"), "Cloacal prolapse": ("severe", "no"), 
    "Egg binding": ("severe", "no"), "Feather cysts": ("mild", "no"), 
    "Bumblefoot": ("moderate", "no"), "Scaly face": ("moderate", "yes"),
    "Psittacine Beak and Feather Disease": ("severe", "yes"),
    "Heavy metal poisoning": ("severe", "no"),
    "Septicemia": ("severe", "no"), "Infectious stomatitis": ("moderate", "yes"),
    "Eye abscesses": ("moderate", "no"), "Abnormal beak growth": ("mild", "no"),
    "Stargazing": ("severe", "no"), "Dystocia": ("severe", "no"),
    "Vent prolapse": ("severe", "no"), "Abscesses": ("moderate", "no"),
    "Dysecdysis": ("mild", "no"), "Skin parasites": ("mild", "yes"),
    "Scale rot": ("moderate", "no"),
    "Papilloma": ("mild", "yes"), "Lymphocystis": ("mild", "yes"),
    "Fin Rot": ("moderate", "yes"), "Ich": ("moderate", "yes"),
    "Fungus": ("moderate", "yes"), "Popeye": ("moderate", "no"),
    "Skin and Gill Flukes": ("moderate", "yes"), "Lernaea": ("moderate", "yes"),
    "Swim Bladder Disease": ("moderate", "no"),
    "Vitamin C Deficiency": ("moderate", "no"), "Egg Retention": ("severe", "no"),
}


def extract_key_symptoms(symptom_list):
    """Extract and clean key symptoms from technical descriptions."""
    
    key_symptoms = []
    
    for symptom in symptom_list[:30]:
        s = symptom.lower().strip()
        s = re.sub(r'\([^)]*\)', '', s)  # Remove parentheses
        s = re.sub(r'\bsuch as\b.*', '', s)  # Remove "such as..." parts
        s = s.strip('- •')
        
        if 3 < len(s) < 100:  # Reasonable length
            key_symptoms.append(s)
    
    # Remove near-duplicates
    unique = []
    for s in key_symptoms:
        is_dup = False
        for u in unique:
            if s in u or u in s:
                is_dup = True
                break
        if not is_dup:
            unique.append(s)
    
    return unique[:20]


def create_owner_description(species, disease, symptoms, seed_num):
    """Create natural owner-friendly descriptions with good variety."""
    
    if not symptoms:
        return f"My {species} seems unwell and lethargic"
    
    random.seed(seed_num)
    
    # Select 1-3 symptoms
    n_symptoms = min(random.randint(1, 3), len(symptoms))
    selected = random.sample(symptoms, n_symptoms)
    
    # Various natural sentence structures
    patterns = [
        "My {pet} has {s1}",
        "My {pet} is {s1}",
        "My {pet} seems sick with {s1}",
        "My {pet} has been {s1}",
        "I noticed my {pet} has {s1}",
        "My {pet} shows {s1}",
        "My {pet} keeps {s1}",
        "My {pet} won't stop {s1}",
        "I'm worried, my {pet} has {s1}",
        "My {pet} appears to have {s1}",
    ]
    
    # Two-symptom patterns
    two_symptom_patterns = [
        "My {pet} has {s1} and {s2}",
        "My {pet} is {s1} with {s2}",
        "My {pet} has {s1}, also {s2}",
        "My {pet} shows {s1} and {s2}",
        "I noticed my {pet} has {s1} and {s2}",
        "My {pet} has been {s1} and {s2}",
        "My {pet} is {s1}, plus {s2}",
    ]
    
    # Three-symptom patterns
    three_symptom_patterns = [
        "My {pet} has {s1}, {s2}, and {s3}",
        "My {pet} shows {s1}, {s2}, and {s3}",
        "My {pet} has been {s1} with {s2} and {s3}",
    ]
    
    # Select pattern based on number of symptoms
    if n_symptoms == 1:
        pattern = random.choice(patterns)
        desc = pattern.format(pet=species, s1=selected[0])
    elif n_symptoms == 2:
        pattern = random.choice(two_symptom_patterns)
        desc = pattern.format(pet=species, s1=selected[0], s2=selected[1])
    else:
        pattern = random.choice(three_symptom_patterns)
        desc = pattern.format(pet=species, s1=selected[0], s2=selected[1], s3=selected[2])
    
    # Clean up
    desc = desc.strip()
    if not desc.endswith('.'):
        desc += '.'
    
    # Capitalize first letter
    if desc:
        desc = desc[0].upper() + desc[1:]
    
    random.seed()  # Reset
    return desc


def parse_markdown_data(filepath):
    """Parse dataset.md file."""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    species_diseases = defaultdict(dict)
    current_species = None
    current_disease = None
    current_symptoms = []
    
    emoji_map = {
        '🐶': 'dog', '🐱': 'cat', '🐰': 'rabbit',
        '🐹': 'hamster', '🐦': 'bird', '🐢': 'turtle', '🐠': 'fish'
    }
    
    for line in content.split('\n'):
        line = line.strip()
        
        # Detect species
        for emoji, sp in emoji_map.items():
            if line.startswith(emoji):
                current_species = sp
                break
        
        # Detect disease
        if line.startswith('•') and current_species:
            # Save previous disease
            if current_disease and current_symptoms:
                species_diseases[current_species][current_disease] = extract_key_symptoms(current_symptoms)
            
            # Parse new disease
            match = re.match(r'•\s*(.+?)\s*\((.+?)\)', line)
            if match:
                current_disease = match.group(1).strip()
                brief = match.group(2).strip()
                current_symptoms = [brief]
            else:
                disease_text = line[1:].strip()
                current_disease = disease_text
                current_symptoms = []
        
        # Collect symptoms
        elif line.startswith('-') and current_disease:
            symptom = line[1:].strip()
            if len(symptom) > 2:
                current_symptoms.append(symptom)
    
    # Save last disease
    if current_disease and current_symptoms:
        species_diseases[current_species][current_disease] = extract_key_symptoms(current_symptoms)
    
    return species_diseases


def generate_ml_dataset(data, output_file, samples_per_disease=14):
    """Generate the complete ML dataset."""
    
    rows = []
    stats = defaultdict(int)
    
    for species, diseases in data.items():
        for disease, symptoms in diseases.items():
            # Get disease metadata
            urgency, contagious = DISEASE_CONFIG.get(disease, ("moderate", "no"))
            
            # Generate samples
            for i in range(samples_per_disease):
                description = create_owner_description(species, disease, symptoms, i * 7)
                source = "real" if i == 0 else "synthetic"
                
                rows.append({
                    'species': species,
                    'disease': disease,
                    'symptoms': description,
                    'urgency': urgency,
                    'contagious': contagious,
                    'source': source
                })
                
                stats[species] += 1
                stats[f"urgency_{urgency}"] += 1
                stats[f"contagious_{contagious}"] += 1
    
    # Write CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    # Report
    print(f"\n{'='*70}")
    print(f"  DATASET SUCCESSFULLY GENERATED")
    print(f"{'='*70}")
    print(f"Output file: {output_file}")
    print(f"Total samples: {len(rows)}")
    print(f"Unique diseases: {len(set(r['disease'] for r in rows))}")
    print(f"Samples per disease: {samples_per_disease}")
    
    print(f"\n{'Species Distribution':^70}")
    print(f"{'-'*70}")
    for sp in sorted(['dog', 'cat', 'rabbit', 'hamster', 'bird', 'turtle', 'fish']):
        count = stats[sp]
        pct = 100 * count / len(rows)
        print(f"  {sp:12s}: {count:4d} samples ({pct:5.1f}%)")
    
    print(f"\n{'Urgency Distribution':^70}")
    print(f"{'-'*70}")
    for urg in ['mild', 'moderate', 'severe']:
        count = stats[f"urgency_{urg}"]
        pct = 100 * count / len(rows)
        print(f"  {urg:12s}: {count:4d} samples ({pct:5.1f}%)")
    
    print(f"\n{'Contagious Status':^70}")
    print(f"{'-'*70}")
    for cont in ['yes', 'no']:
        count = stats[f"contagious_{cont}"]
        pct = 100 * count / len(rows)
        print(f"  {cont:12s}: {count:4d} samples ({pct:5.1f}%)")
    
    print(f"\n{'='*70}")
    print(f"  ✓ Ready for Random Forest/LightGBM training")
    print(f"{'='*70}\n")
    
    return len(rows)


if __name__ == "__main__":
    print("\n" + "="*70)
    print("  PET DISEASE ML DATASET GENERATOR")
    print("  For Philippine Common Household Pets")
    print("="*70)
    
    # Parse data
    print("\n[1/2] Parsing disease data from dataset.md...")
    species_data = parse_markdown_data("dataset.md")
    
    total_diseases = sum(len(d) for d in species_data.values())
    print(f"      ✓ Found {len(species_data)} species, {total_diseases} diseases")
    
    # Generate dataset
    print("\n[2/2] Generating natural language samples...")
    total_rows = generate_ml_dataset(species_data, "pet_disease_dataset.csv", samples_per_disease=14)
    
    print("✓ Generation complete!\n")
