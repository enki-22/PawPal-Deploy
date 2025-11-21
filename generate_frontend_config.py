#!/usr/bin/env python3
"""
Generate frontend configuration from symptom_map.json
Creates a JavaScript module for use in React components
"""

import json

def generate_js_config():
    """Generate JavaScript config file from symptom_map.json"""
    
    # Load symptom map
    with open('symptom_map.json', 'r', encoding='utf-8') as f:
        symptom_map = json.load(f)
    
    # Group symptoms by category
    symptoms_by_category = {}
    for symptom_id, data in symptom_map.items():
        category = data['category']
        if category not in symptoms_by_category:
            symptoms_by_category[category] = []
        
        symptoms_by_category[category].append({
            'id': symptom_id,
            'question': data['question'],
            'severity': data['severity']
        })
    
    # Sort each category's symptoms by severity (descending)
    for category in symptoms_by_category:
        symptoms_by_category[category].sort(key=lambda x: x['severity'], reverse=True)
    
    # Generate JavaScript module
    js_content = f"""/**
 * Auto-generated symptom configuration
 * Generated from symptom_map.json
 * DO NOT EDIT MANUALLY - regenerate using generate_frontend_config.py
 */

export const SYMPTOM_MAP = {json.dumps(symptom_map, indent=2)};

export const SYMPTOMS_BY_CATEGORY = {json.dumps(symptoms_by_category, indent=2)};

export const CATEGORY_LABELS = {{
  "general": "General Symptoms",
  "digestive": "Digestive Issues",
  "respiratory": "Respiratory Problems",
  "skin": "Skin & Coat Issues",
  "urinary": "Urinary Issues",
  "neurological": "Neurological Issues",
  "musculoskeletal": "Movement Problems",
  "eyes": "Eye Problems",
  "ears": "Ear Problems",
  "oral": "Oral/Dental Problems",
  "behavioral": "Behavioral Changes",
  "reproductive": "Reproductive Issues",
  "aquatic": "Aquatic-Specific Issues",
  "avian": "Avian-Specific Issues"
}};

/**
 * Get symptoms for a specific category
 * @param {{string}} category - Category name
 * @returns {{Array}} List of symptoms
 */
export function getSymptomsByCategory(category) {{
  return SYMPTOMS_BY_CATEGORY[category] || [];
}}

/**
 * Get question text for a symptom
 * @param {{string}} symptomId - Symptom technical ID
 * @returns {{string}} User-friendly question
 */
export function getQuestionForSymptom(symptomId) {{
  return SYMPTOM_MAP[symptomId]?.question || `Do you observe: ${{symptomId}}?`;
}}

/**
 * Get all available categories
 * @returns {{Array}} List of category names
 */
export function getAllCategories() {{
  return Object.keys(SYMPTOMS_BY_CATEGORY);
}}

/**
 * Get severity for a symptom
 * @param {{string}} symptomId - Symptom technical ID
 * @returns {{number}} Severity (1-5)
 */
export function getSymptomSeverity(symptomId) {{
  return SYMPTOM_MAP[symptomId]?.severity || 1;
}}
"""
    
    # Write to frontend config directory
    output_path = 'frontend/src/config/symptomConfig.js'
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✓ Generated: {output_path}")
    except FileNotFoundError:
        # Fallback: write to current directory
        output_path = 'symptomConfig.js'
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✓ Generated: {output_path} (move to frontend/src/config/)")
    
    # Print statistics
    print(f"\n{'='*60}")
    print(f"Configuration Generated Successfully")
    print(f"{'='*60}")
    print(f"Total symptoms: {len(symptom_map)}")
    print(f"Categories: {len(symptoms_by_category)}")
    print(f"\nSymptoms per category:")
    for category, symptoms in sorted(symptoms_by_category.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"  {category:20} : {len(symptoms):3} symptoms")
    print(f"{'='*60}")

if __name__ == "__main__":
    generate_js_config()
