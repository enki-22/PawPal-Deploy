"""
Pet Disease Dataset Generator
Generates a comprehensive ML dataset for pet disease classification.
"""

import csv
import random
import re

# Disease metadata (urgency and contagious status)
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
    "Hair loss": ("mild", "no"),
    "Skin and fur mites": ("mild", "yes"),
    
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

# Shared disease names across species
SHARED_DISEASES = {
    "dog": {"Diabetes", "Fleas", "Ringworm"},
    "cat": {"Diabetes", "Fleas", "Ringworm", "Obesity", "Pneumonia", "Conjunctivitis", "Ear infections"},
    "rabbit": {"Fleas", "Ringworm", "Pneumonia", "Conjunctivitis"},
    "hamster": {"Ringworm", "Pneumonia", "Conjunctivitis"},
    "bird": {"Ringworm", "Conjunctivitis"},
    "turtle": {"Pneumonia", "Ear infections"},
}


def parse_dataset_file(filepath):
    """Parse the dataset.md file to extract structured disease data."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    species_data = {}
    current_species = None
    current_disease = None
    current_symptoms = []
    
    lines = content.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Detect species headers
        if line.startswith('🐶'):
            current_species = "dog"
            species_data[current_species] = {}
        elif line.startswith('🐱'):
            current_species = "cat"
            species_data[current_species] = {}
        elif line.startswith('🐰'):
            current_species = "rabbit"
            species_data[current_species] = {}
        elif line.startswith('🐹'):
            current_species = "hamster"
            species_data[current_species] = {}
        elif line.startswith('🐦'):
            current_species = "bird"
            species_data[current_species] = {}
        elif line.startswith('🐢'):
            current_species = "turtle"
            species_data[current_species] = {}
        elif line.startswith('🐠'):
            current_species = "fish"
            species_data[current_species] = {}
        
        # Detect disease names
        elif line.startswith('•') and current_species:
            if current_disease and current_symptoms:
                species_data[current_species][current_disease] = current_symptoms
            
            # Extract disease name and brief symptoms
            match = re.match(r'•\s*(.+?)\s*\((.+?)\)', line)
            if match:
                current_disease = match.group(1).strip()
                brief_symptoms = match.group(2).strip()
                current_symptoms = [brief_symptoms]
            else:
                current_disease = line[1:].strip()
                current_symptoms = []
        
        # Collect symptom lines
        elif line.startswith('-') and current_disease:
            symptom = line[1:].strip()
            if symptom and len(symptom) > 3:
                current_symptoms.append(symptom)
    
    # Add last disease
    if current_disease and current_symptoms and current_species:
        species_data[current_species][current_disease] = current_symptoms
    
    return species_data


def generate_natural_symptom(species, disease, symptoms, variation=0):
    """Generate natural language symptom descriptions."""
    
    # Handle cases with few symptoms
    if len(symptoms) == 0:
        return f"My {species} is showing signs of {disease}"
    elif len(symptoms) == 1:
        return f"My {species} has {symptoms[0].lower().strip()}"
    
    # Select 2-4 symptoms randomly
    num_symptoms = random.randint(2, min(4, len(symptoms)))
    selected = random.sample(symptoms, num_symptoms)
    
    # Owner-friendly templates
    templates = [
        f"My {species} has {{symptoms}} and seems {{condition}}",
        f"My {species} is {{symptoms}} and {{condition}}",
        f"My {species} shows signs of {{symptoms}}",
        f"I noticed my {species} {{symptoms}} and looks {{condition}}",
        f"My {species} won't eat and {{symptoms}}",
    ]
    
    conditions = ["very tired", "weak", "lethargic", "uncomfortable", "in pain", 
                  "distressed", "unwell", "not itself", "sick"]
    
    # Clean and combine symptoms
    cleaned = []
    for s in selected:
        s = s.lower().strip()
        # Remove bullet formatting
        s = re.sub(r'^[-•]\s*', '', s)
        cleaned.append(s)
    
    symptom_text = ", ".join(cleaned[:2])
    if len(cleaned) > 2:
        symptom_text += f" and {cleaned[2]}"
    
    template = random.choice(templates)
    condition = random.choice(conditions)
    
    if "{{symptoms}}" in template and "{{condition}}" in template:
        text = template.format(symptoms=symptom_text, condition=condition)
    elif "{{symptoms}}" in template:
        text = template.format(symptoms=symptom_text)
    else:
        text = f"My {species} has {symptom_text}"
    
    return text


def generate_dataset(species_data, output_file="pet_disease_dataset.csv", samples_per_disease=12):
    """Generate the full dataset with synthetic samples."""
    
    rows = []
    
    for species, diseases in species_data.items():
        for disease, symptoms in diseases.items():
            # Skip if not in DISEASE_INFO
            disease_key = disease
            
            # Handle shared diseases
            if disease in ["Diabetes", "Fleas", "Ringworm", "Obesity", "Pneumonia", 
                          "Conjunctivitis", "Ear infections", "Diarrhea"]:
                # Adjust key for specific lookups if needed
                if disease == "Diarrhea" and species == "hamster":
                    disease_key = "Wet tail"
                    disease = "Diarrhea (wet tail)"
            
            if disease_key not in DISEASE_INFO:
                # Try to find a match
                for key in DISEASE_INFO.keys():
                    if disease.lower() in key.lower() or key.lower() in disease.lower():
                        disease_key = key
                        break
                else:
                    # Default values
                    urgency, contagious = "moderate", "no"
                    DISEASE_INFO[disease_key] = (urgency, contagious)
            
            urgency, contagious = DISEASE_INFO.get(disease_key, ("moderate", "no"))
            
            # Generate samples
            for i in range(samples_per_disease):
                symptom_text = generate_natural_symptom(species, disease, symptoms, i)
                source = "real" if i == 0 else "synthetic"
                
                rows.append([
                    species,
                    disease,
                    symptom_text,
                    urgency,
                    contagious,
                    source
                ])
    
    # Write to CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source'])
        writer.writerows(rows)
    
    print(f"Dataset generated: {output_file}")
    print(f"Total rows: {len(rows)}")
    print(f"Unique diseases: {len(set(row[1] for row in rows))}")
    print(f"Species distribution:")
    for sp in set(row[0] for row in rows):
        count = sum(1 for row in rows if row[0] == sp)
        print(f"  {sp}: {count} samples")


if __name__ == "__main__":
    # Parse the dataset file
    print("Parsing dataset.md...")
    species_data = parse_dataset_file("dataset.md")
    
    print(f"Found {len(species_data)} species")
    for species, diseases in species_data.items():
        print(f"  {species}: {len(diseases)} diseases")
    
    # Generate dataset
    print("\nGenerating ML dataset...")
    generate_dataset(species_data, "pet_disease_dataset.csv", samples_per_disease=12)
    print("\nDone!")
