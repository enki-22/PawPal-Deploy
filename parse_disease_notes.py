"""
Disease Research Notes Parser
Converts structured disease notes into CSV format
"""

import pandas as pd
import re

def parse_disease_notes(text):
    """Parse disease research notes into structured data"""
    diseases = []
    
    # Split by disease entries
    disease_blocks = re.split(r'Disease:\s+', text)[1:]  # Skip first empty split
    
    for block in disease_blocks:
        lines = block.strip().split('\n')
        
        # Initialize disease entry
        disease_entry = {
            'species': None,
            'disease': None,
            'symptoms': None,
            'urgency': None,
            'contagious': None,
            'source': 'research'
        }
        
        # Parse disease name (first line)
        disease_entry['disease'] = lines[0].strip()
        
        # Parse remaining fields
        for line in lines[1:]:
            line = line.strip()
            
            if line.startswith('Species:'):
                species = line.split('Species:')[1].strip()
                # Remove brackets if present
                species = re.sub(r'[\[\]]', '', species)
                disease_entry['species'] = species.lower()
            
            elif line.startswith('Urgency:'):
                urgency = line.split('Urgency:')[1].strip().lower()
                # Map urgency levels
                urgency_map = {
                    'low': 'low',
                    'medium': 'medium',
                    'moderate': 'medium',
                    'high': 'high',
                    'emergency': 'emergency',
                    'critical': 'emergency',
                    'severe': 'high'
                }
                disease_entry['urgency'] = urgency_map.get(urgency, urgency)
            
            elif line.startswith('Contagious:'):
                contagious = line.split('Contagious:')[1].strip().lower()
                disease_entry['contagious'] = contagious
            
            elif line.startswith('FINAL SYMPTOM LIST'):
                # Start collecting symptoms
                continue
            
            elif line.startswith('•'):
                # This is a symptom
                symptom = line.replace('•', '').strip()
                # Remove technical terms in parentheses but keep descriptive parts
                symptom = re.sub(r'\s*\([^)]*\)\s*$', '', symptom)
                symptom = re.sub(r'\s*—[^—]*$', '', symptom)  # Remove em-dash explanations
                
                if disease_entry['symptoms'] is None:
                    disease_entry['symptoms'] = symptom
                else:
                    disease_entry['symptoms'] += ', ' + symptom
        
        # Only add if we have complete data
        if all([disease_entry['species'], disease_entry['disease'], 
                disease_entry['symptoms'], disease_entry['urgency']]):
            diseases.append(disease_entry)
    
    return diseases

# Read the disease notes file
with open('disease_research_notes.txt', 'r', encoding='utf-8') as f:
    notes_text = f.read()

# Parse the notes
print("Parsing disease research notes...")
diseases = parse_disease_notes(notes_text)

# Create DataFrame
df = pd.DataFrame(diseases)

# Clean up species names
df['species'] = df['species'].str.strip().str.title()

# Display summary
print(f"\n✓ Parsed {len(df)} diseases")
print(f"\nSpecies distribution:")
print(df['species'].value_counts())
print(f"\nUrgency distribution:")
print(df['urgency'].value_counts())
print(f"\nContagious distribution:")
print(df['contagious'].value_counts())

# Save to CSV
output_file = 'new_diseases_base.csv'
df.to_csv(output_file, index=False)
print(f"\n✓ Saved to {output_file}")

# Show sample
print(f"\nSample entries:")
print(df.head(3).to_string())