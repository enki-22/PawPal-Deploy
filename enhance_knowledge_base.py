#!/usr/bin/env python3
"""
Step 1: Enhance Knowledge Base - Expand symptoms to 5-7 per disease
Uses veterinary medical knowledge to add clinically relevant symptoms
"""

import csv
import json

# Enhanced disease symptom profiles with 5-7 standard clinical symptoms
# Based on veterinary literature and clinical presentation patterns

ENHANCED_SYMPTOMS = {
    # DOGS - Common Diseases
    "Canine distemper": ["fever", "coughing", "nasal_discharge", "eye_discharge", "vomiting", "diarrhea", "seizures"],
    "Canine influenza": ["coughing", "sneezing", "nasal_discharge", "fever", "lethargy", "loss_of_appetite"],
    "Canine parvovirus": ["vomiting", "bloody_diarrhea", "lethargy", "loss_of_appetite", "fever", "dehydration"],
    "Heartworms": ["coughing", "difficulty_breathing", "lethargy", "weight_loss", "exercise_intolerance", "fainting"],
    "Kennel cough": ["dry_cough", "gagging", "retching", "nasal_discharge", "sneezing", "lethargy"],
    "Rabies": ["aggression", "behavioral_changes", "paralysis", "hypersalivation", "difficulty_swallowing", "seizures", "hydrophobia"],
    "Obesity": ["excessive_weight", "difficulty_breathing", "decreased_activity", "inability_to_groom", "joint_pain"],
    "Cataracts": ["cloudy_eyes", "vision_impairment", "bumping_into_objects", "eye_inflammation", "squinting"],
    "Arthritis": ["limping", "stiffness", "difficulty_standing", "reluctance_to_move", "joint_swelling", "pain_on_touch"],
    "Ear infections": ["ear_scratching", "head_shaking", "ear_discharge", "odor", "redness", "pain"],
    "Diarrhea": ["loose_stool", "frequent_defecation", "abdominal_pain", "vomiting", "lethargy", "dehydration"],
    "Broken bones": ["limping", "swelling", "pain", "inability_to_bear_weight", "deformity"],
    
    # CATS - Common Diseases
    "Chronic Kidney Disease": ["increased_thirst", "increased_urination", "weight_loss", "vomiting", "loss_of_appetite", "lethargy"],
    "Cat Acne": ["chin_blackheads", "swelling", "redness", "itching", "crusty_lesions"],
    "Diabetes": ["increased_thirst", "increased_urination", "weight_loss", "increased_appetite", "lethargy", "weakness"],
    "Eosinophilic Granuloma Complex": ["skin_lesions", "ulcers", "itching", "hair_loss", "swelling"],
    "Feline Immunodeficiency Virus": ["weight_loss", "fever", "enlarged_lymph_nodes", "oral_infections", "poor_coat_condition", "lethargy"],
    "Feline Infectious Peritonitis": ["distended_abdomen", "fever", "lethargy", "weight_loss", "difficulty_breathing", "jaundice"],
    "Feline Leukemia Virus": ["pale_gums", "weight_loss", "fever", "loss_of_appetite", "enlarged_lymph_nodes", "lethargy"],
    "Feline Lower Urinary Tract Disease": ["straining_to_urinate", "blood_in_urine", "frequent_urination", "urinating_outside_litter_box", "vocalization_during_urination"],
    "Feline Panleukopenia Virus": ["vomiting", "diarrhea", "lethargy", "fever", "dehydration", "loss_of_appetite"],
    "Fleas": ["scratching", "itching", "hair_loss", "skin_irritation", "visible_parasites"],
    "Hyperthyroidism": ["weight_loss", "increased_appetite", "hyperactivity", "vomiting", "increased_thirst", "diarrhea"],
    "Inflammatory Bowel Disease": ["vomiting", "diarrhea", "weight_loss", "loss_of_appetite", "abdominal_pain", "lethargy"],
    "Intestinal Parasites": ["diarrhea", "vomiting", "weight_loss", "visible_worms", "potbelly", "poor_coat_condition"],
    "Mammary Tumors": ["breast_lumps", "swelling", "discharge", "ulceration", "pain"],
    "Mast Cell Tumor": ["skin_mass", "swelling", "redness", "ulceration", "itching"],
    "Obesity": ["excessive_weight", "difficulty_jumping", "decreased_activity", "loss_of_waistline", "difficulty_grooming"],
    "Osteoarthritis": ["limping", "stiffness", "reluctance_to_jump", "decreased_activity", "joint_swelling"],
    "Pancreatitis": ["vomiting", "abdominal_pain", "loss_of_appetite", "lethargy", "dehydration", "fever"],
    "Periodontal Disease": ["bad_breath", "red_gums", "tooth_loss", "difficulty_eating", "drooling", "bleeding_gums"],
    "Pyometra": ["vaginal_discharge", "lethargy", "increased_thirst", "vomiting", "fever", "distended_abdomen"],
    "Squamous Cell Carcinoma": ["oral_mass", "drooling", "difficulty_eating", "bad_breath", "weight_loss", "bleeding"],
    "Upper Respiratory Infection": ["sneezing", "nasal_discharge", "eye_discharge", "fever", "loss_of_appetite", "coughing"],
    "Urethral Obstruction": ["straining_to_urinate", "crying_during_urination", "blood_in_urine", "lethargy", "vomiting", "collapse"],
    
    # RABBITS - Common Diseases
    "Overgrown teeth": ["drooling", "difficulty_eating", "weight_loss", "facial_swelling", "eye_discharge"],
    "Hairballs": ["loss_of_appetite", "small_droppings", "lethargy", "abdominal_pain", "hunched_posture"],
    "Snuffles": ["nasal_discharge", "sneezing", "difficulty_breathing", "eye_discharge", "lethargy", "loss_of_appetite"],
    "Myxomatosis": ["swollen_eyelids", "facial_swelling", "lethargy", "loss_of_appetite", "difficulty_breathing", "fever"],
    "Ear mites": ["head_shaking", "ear_scratching", "crusty_ears", "head_tilt", "discharge"],
    "Sore hocks": ["foot_sores", "reluctance_to_move", "pain", "hair_loss_on_feet", "swelling"],
    "Flystrike": ["maggots_on_skin", "wet_fur", "foul_odor", "lethargy", "shock"],
    "Breathing difficulties": ["labored_breathing", "noisy_breathing", "nasal_discharge", "open_mouth_breathing", "lethargy"],
    "Gastrointestinal stasis": ["no_fecal_output", "loss_of_appetite", "abdominal_pain", "lethargy", "hunched_posture", "teeth_grinding"],
    "Conjunctivitis": ["eye_discharge", "red_eyes", "swelling", "squinting", "rubbing_eyes"],
    "Corneal ulceration": ["squinting", "eye_discharge", "cloudy_eye", "light_sensitivity", "rubbing_eye"],
    "Otitis media/interna": ["head_tilt", "loss_of_balance", "circling", "loss_of_appetite", "ear_discharge"],
    "Splay leg": ["legs_splayed_outward", "inability_to_stand", "difficulty_walking", "dragging_legs"],
    
    # BIRDS - Common Diseases
    "Psittacosis": ["lethargy", "difficulty_breathing", "nasal_discharge", "eye_discharge", "loss_of_appetite", "diarrhea"],
    "Avian Influenza": ["sudden_death", "respiratory_distress", "coughing", "nasal_discharge", "lethargy", "diarrhea"],
    "Newcastle Disease": ["twisted_neck", "paralysis", "tremors", "circling", "loss_of_appetite", "diarrhea"],
    "Air sac mites / gapeworms": ["open_mouth_breathing", "tail_bobbing", "difficulty_breathing", "coughing", "voice_changes"],
    "Cloacal prolapse": ["tissue_protruding_from_vent", "straining", "swelling", "bleeding", "distress"],
    "Egg binding": ["straining", "distended_abdomen", "weakness", "tail_wagging", "lethargy", "difficulty_breathing"],
    "Feather cysts": ["lumps_under_skin", "feather_abnormalities", "swelling", "irritation", "picking_at_area"],
    "Bumblefoot": ["foot_swelling", "lameness", "reluctance_to_perch", "foot_lesions", "pain"],
    "Ringworm": ["feather_loss", "crusty_skin", "scaly_patches", "beak_lesions", "itching"],
    "Scaly face / tassel foot / feather mites": ["crusty_beak", "scaly_legs", "feather_loss", "itching", "restlessness"],
    "Psittacine Beak and Feather Disease": ["feather_loss", "beak_deformities", "abnormal_feather_growth", "skin_lesions", "immunosuppression"],
    "Heavy metal poisoning": ["weakness", "seizures", "tremors", "vomiting", "lethargy", "loss_of_coordination"],
    
    # TURTLES - Common Diseases
    "Septicemia": ["red_spots_on_skin", "lethargy", "loss_of_appetite", "respiratory_distress", "swelling"],
    "Infectious stomatitis": ["mouth_rot", "swollen_gums", "discharge", "loss_of_appetite", "difficulty_eating"],
    "Eye abscesses / conjunctivitis": ["swollen_eyes", "discharge", "inability_to_open_eyes", "rubbing_eyes", "lethargy"],
    "Ear infections": ["swollen_ear_area", "head_tilt", "difficulty_eating", "discharge", "lethargy"],
    "Abnormal beak growth": ["overgrown_beak", "difficulty_eating", "beak_deformity", "weight_loss"],
    "Stargazing": ["abnormal_head_posture", "inability_to_right_self", "incoordination", "seizures"],
    "Pneumonia": ["open_mouth_breathing", "nasal_discharge", "wheezing", "lethargy", "loss_of_appetite", "buoyancy_problems"],
    "Dystocia": ["egg_retention", "straining", "distended_abdomen", "lethargy", "loss_of_appetite"],
    "Vent prolapse": ["tissue_protruding", "swelling", "straining", "bleeding", "infection"],
    "Abscesses": ["lumps", "swelling", "discharge", "pain", "lethargy"],
    "Dysecdysis": ["retained_shed", "difficulty_shedding", "constricted_limbs", "dull_skin"],
    "Skin parasites": ["visible_parasites", "scratching", "restlessness", "anemia", "skin_lesions"],
    "Scale rot / blister disease": ["skin_ulcers", "blisters", "redness", "fluid_filled_lesions", "lethargy"],
    
    # FISH - Common Diseases
    "Ich": ["white_spots", "scratching_against_objects", "clamped_fins", "lethargy", "rapid_breathing"],
    "Fin rot": ["frayed_fins", "discoloration", "fin_deterioration", "lethargy", "loss_of_appetite"],
    "Dropsy": ["swollen_abdomen", "raised_scales", "lethargy", "loss_of_appetite", "bulging_eyes"],
    "Swim bladder disease": ["swimming_upside_down", "floating_sideways", "difficulty_swimming", "loss_of_appetite", "lethargy"],
    "Columnaris": ["white_patches", "frayed_fins", "rapid_breathing", "lethargy", "clamped_fins"],
    "Velvet disease": ["gold_dust_appearance", "scratching", "clamped_fins", "rapid_breathing", "loss_of_appetite"],
    "(Hemorrhagic Septicemia / Ulcerative Syndromes)": ["red_streaks", "ulcers", "lethargy", "loss_of_appetite", "abnormal_swimming"],
    "Ammonia Poisoning": ["gasping_at_surface", "red_gills", "lethargy", "loss_of_appetite", "rapid_breathing"],
    
    # HAMSTERS - Common Diseases
    "Wet Tail": ["diarrhea", "wet_tail_area", "lethargy", "hunched_posture", "loss_of_appetite", "dehydration"],
    "Respiratory infection": ["sneezing", "nasal_discharge", "difficulty_breathing", "lethargy", "loss_of_appetite"],
    "Skin abscesses": ["lumps", "swelling", "discharge", "pain", "lethargy"],
    "Overgrown teeth": ["drooling", "difficulty_eating", "weight_loss", "facial_swelling", "pawing_at_mouth"],
    "Mites": ["hair_loss", "scratching", "scaly_skin", "restlessness", "crusty_ears"],
}

def enhance_csv(input_file, output_file):
    """Enhance the CSV with 5-7 standard symptoms per disease"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    enhanced_count = 0
    unchanged_count = 0
    
    for row in rows:
        disease = row['disease']
        current_symptoms = [s.strip() for s in row['symptoms'].split(',')]
        
        # Check if we have enhanced symptoms for this disease
        if disease in ENHANCED_SYMPTOMS:
            # Use our curated 5-7 symptom list
            row['symptoms'] = ', '.join(ENHANCED_SYMPTOMS[disease])
            enhanced_count += 1
            print(f"✓ Enhanced: {disease} ({len(current_symptoms)} → {len(ENHANCED_SYMPTOMS[disease])} symptoms)")
        else:
            # Keep existing but ensure quality
            if len(current_symptoms) < 5:
                print(f"⚠ Needs review: {disease} (only {len(current_symptoms)} symptoms)")
            unchanged_count += 1
    
    # Write enhanced CSV
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source'])
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"\n{'='*60}")
    print(f"Enhanced: {enhanced_count} diseases")
    print(f"Unchanged: {unchanged_count} diseases")
    print(f"Output: {output_file}")
    print(f"{'='*60}")

if __name__ == "__main__":
    enhance_csv('overhaul_converted.csv', 'knowledge_base_enhanced.csv')
