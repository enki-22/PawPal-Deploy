"""
PawPal Risk Scoring System
==========================
Calculates risk scores for symptom logs using the 69 canonical symptoms
from the disease classifier training model.

Risk scoring weights are based on:
- Veterinary emergency indicators (RAP system, emergency triage guidelines)
- Symptom severity classifications from veterinary literature
- Species-specific pathology considerations
- Pattern combinations identified in training data analysis
"""

from datetime import datetime, timedelta


# ============================================================
# CANONICAL SYMPTOMS - MUST MATCH train_model.py EXACTLY
# ============================================================
CANONICAL_SYMPTOMS = [
    # General
    "vomiting", "diarrhea", "lethargy", "loss_of_appetite", "weight_loss",
    "fever", "dehydration", "weakness", "seizures",
    
    # Respiratory
    "coughing", "sneezing", "wheezing", "labored_breathing", "difficulty_breathing",
    "nasal_discharge", "nasal_congestion", "respiratory_distress",
    
    # Skin & Coat
    "scratching", "itching", "hair_loss", "bald_patches", "red_skin",
    "irritated_skin", "skin_lesions", "rash", "scabs", "dandruff",
    
    # Eyes & Ears
    "watery_eyes", "eye_discharge", "red_eyes", "squinting",
    "ear_discharge", "ear_scratching", "head_shaking",
    
    # Digestive
    "constipation", "bloating", "gas", "not_eating", "excessive_eating",
    
    # Urinary
    "blood_in_urine", "frequent_urination", "straining_to_urinate",
    "dark_urine", "cloudy_urine",
    
    # Oral/Dental
    "bad_breath", "drooling", "difficulty_eating", "swollen_gums",
    "red_gums", "mouth_pain",
    
    # Behavioral
    "aggression", "hiding", "restlessness", "confusion", "circling",
    
    # Mobility
    "limping", "lameness", "difficulty_walking", "stiffness",
    "reluctance_to_move", "paralysis",
    
    # Bird-specific
    "drooping_wing", "feather_loss", "wing_droop", "fluffed_feathers",
    "tail_bobbing",
    
    # Fish-specific
    "white_spots", "fin_rot", "swimming_upside_down", "gasping_at_surface",
    "clamped_fins", "rubbing_against_objects", "cloudy_eyes",
    
    # Rabbit-specific
    "head_tilt", "rolling", "loss_of_balance", "dental_issues",
    
    # Small mammal
    "wet_tail", "lumps", "bumps", "overgrown_teeth",
]


# ============================================================
# RISK WEIGHTS - Based on veterinary triage severity
# ============================================================

# CRITICAL SYMPTOMS (life-threatening)
CRITICAL_SYMPTOMS = {
    'seizures': 30,
    'difficulty_breathing': 25,
    'respiratory_distress': 28,
    'paralysis': 30,
    'cloudy_eyes': 25,  # Can indicate glaucoma emergency
    'blood_in_urine': 20,
    'straining_to_urinate': 22,  # Urinary blockage
    'bloating': 25,  # Can indicate bloat/GDV
}

# HIGH CONCERN SYMPTOMS
HIGH_CONCERN_SYMPTOMS = {
    'vomiting': 10,
    'diarrhea': 10,
    'fever': 12,
    'dehydration': 15,
    'weakness': 12,
    'loss_of_appetite': 8,
    'lethargy': 8,
    'weight_loss': 10,
    'labored_breathing': 15,
    'coughing': 8,
    'wheezing': 12,
    'nasal_congestion': 7,
    'confusion': 15,
    'aggression': 10,
    'limping': 10,
    'lameness': 10,
    'difficulty_walking': 12,
    'stiffness': 8,
    'reluctance_to_move': 10,
    'eye_discharge': 8,
    'ear_discharge': 8,
    'swollen_gums': 10,
    'red_gums': 10,
    'mouth_pain': 10,
}

# MODERATE CONCERN SYMPTOMS
MODERATE_SYMPTOMS = {
    'sneezing': 3,
    'itching': 3,
    'scratching': 3,
    'hair_loss': 5,
    'rash': 5,
    'scabs': 5,
    'dandruff': 2,
    'watery_eyes': 4,
    'red_eyes': 5,
    'squinting': 5,
    'ear_scratching': 4,
    'head_shaking': 4,
    'constipation': 6,
    'gas': 3,
    'bad_breath': 4,
    'drooling': 5,
    'restlessness': 5,
    'hiding': 5,
    'frequent_urination': 6,
    'dark_urine': 7,
    'cloudy_urine': 6,
    'difficulty_eating': 7,
    'circling': 8,
    'bald_patches': 4,
    'red_skin': 5,
    'irritated_skin': 5,
    'skin_lesions': 6,
    'nasal_discharge': 5,
}

# SPECIES-SPECIFIC SYMPTOMS (context-dependent)
SPECIES_SPECIFIC_SYMPTOMS = {
    # Bird
    'drooping_wing': 12,
    'feather_loss': 6,
    'wing_droop': 12,
    'fluffed_feathers': 8,
    'tail_bobbing': 10,
    
    # Fish
    'white_spots': 8,
    'fin_rot': 10,
    'swimming_upside_down': 15,
    'gasping_at_surface': 15,
    'clamped_fins': 8,
    'rubbing_against_objects': 7,
    
    # Rabbit
    'head_tilt': 15,
    'rolling': 15,
    'loss_of_balance': 15,
    'dental_issues': 10,
    
    # Small mammal
    'wet_tail': 18,  # Very serious in hamsters
    'lumps': 10,
    'bumps': 8,
    'overgrown_teeth': 10,
}

# LOW CONCERN (monitoring symptoms)
LOW_CONCERN_SYMPTOMS = {
    'not_eating': 5,  # Same as loss_of_appetite but less severe
    'excessive_eating': 4,
}


def get_symptom_risk_weight(symptom):
    """
    Get risk weight for a symptom
    
    Args:
        symptom (str): Symptom name from CANONICAL_SYMPTOMS
        
    Returns:
        int: Risk weight (0-30)
    """
    if symptom in CRITICAL_SYMPTOMS:
        return CRITICAL_SYMPTOMS[symptom]
    elif symptom in HIGH_CONCERN_SYMPTOMS:
        return HIGH_CONCERN_SYMPTOMS[symptom]
    elif symptom in MODERATE_SYMPTOMS:
        return MODERATE_SYMPTOMS[symptom]
    elif symptom in SPECIES_SPECIFIC_SYMPTOMS:
        return SPECIES_SPECIFIC_SYMPTOMS[symptom]
    elif symptom in LOW_CONCERN_SYMPTOMS:
        return LOW_CONCERN_SYMPTOMS[symptom]
    else:
        return 3  # Default low weight for unmapped symptoms


def calculate_exotic_risk_modifier(species, symptoms):
    """
    Calculate urgency modifier for exotic species (Bird, Fish) that are 'masters of disguise'.
    These species typically only show symptoms when very ill, so lethargy or loss_of_appetite
    should boost urgency by one tier.
    
    Args:
        species (str): Pet species (case-insensitive)
        symptoms (list): List of symptom codes
        
    Returns:
        dict: {
            'modifier_applied': bool,
            'original_level': str or None,
            'modified_level': str or None,
            'reason': str or None
        }
    """
    if not species or not symptoms:
        return {
            'modifier_applied': False,
            'original_level': None,
            'modified_level': None,
            'reason': None
        }
    
    species_lower = str(species).lower().strip()
    symptoms_set = set(symptoms) if isinstance(symptoms, list) else set()
    
    # Check if species is Bird or Fish
    is_exotic = species_lower in ['bird', 'fish']
    
    # Check if lethargy or loss_of_appetite is present
    has_warning_symptom = 'lethargy' in symptoms_set or 'loss_of_appetite' in symptoms_set
    
    if is_exotic and has_warning_symptom:
        return {
            'modifier_applied': True,
            'original_level': None,  # Will be set by caller
            'modified_level': None,  # Will be set by caller
            'reason': f"{species} showing lethargy/loss_of_appetite - exotic species are 'masters of disguise' and typically only show symptoms when very ill"
        }
    
    return {
        'modifier_applied': False,
        'original_level': None,
        'modified_level': None,
        'reason': None
    }


def calculate_risk_score(symptom_log, previous_logs=None, pet=None):
    """
    Calculate comprehensive risk score using canonical symptoms
    
    Args:
        symptom_log: SymptomLog model instance
        previous_logs: QuerySet or list of previous SymptomLog instances (optional)
        pet: Pet model instance (optional, for species-specific adjustments)
    
    Returns:
        dict: {
            'risk_score': int (0-100),
            'risk_level': str ('low'|'moderate'|'high'|'critical'),
            'risk_factors': list of str (contributing factors),
            'recommendation': str (user-facing recommendation),
            'symptoms_evaluated': int (number of valid symptoms),
            'total_symptoms_reported': int (total symptoms in log)
        }
    """
    risk_score = 0
    risk_factors = []
    
    # 1. BASE SYMPTOM SEVERITY
    symptoms = symptom_log.symptoms if isinstance(symptom_log.symptoms, list) else []
    severity = symptom_log.overall_severity
    
    # Validate symptoms are from canonical list
    valid_symptoms = [s for s in symptoms if s in CANONICAL_SYMPTOMS]
    if len(valid_symptoms) < len(symptoms):
        invalid = set(symptoms) - set(valid_symptoms)
        print(f"⚠️  Warning: Invalid symptoms detected: {invalid}")
    
    # Calculate base score from symptoms
    for symptom in valid_symptoms:
        weight = get_symptom_risk_weight(symptom)
        risk_score += weight
        
        # Add to risk factors if significant
        if weight >= 10:
            risk_factors.append(f"{symptom.replace('_', ' ').title()}: {weight} points")
    
    # 2. SEVERITY MULTIPLIER
    if severity == 'severe':
        risk_score *= 1.5
        risk_factors.append("Severe symptoms (1.5x multiplier)")
    elif severity == 'moderate':
        risk_score *= 1.2
        risk_factors.append("Moderate symptoms (1.2x multiplier)")
    
    # 3. SYMPTOM COMBINATIONS (synergistic risk from training data patterns)
    symptom_set = set(valid_symptoms)
    
    # GI distress combination
    if 'vomiting' in symptom_set and 'diarrhea' in symptom_set:
        risk_score += 10
        risk_factors.append("Combined GI symptoms (+10 points)")
        
        # If also has blood/dehydration
        if 'dehydration' in symptom_set or 'weakness' in symptom_set:
            risk_score += 8
            risk_factors.append("GI symptoms with dehydration/weakness (+8 points)")
    
    # Respiratory distress combination
    if 'difficulty_breathing' in symptom_set or 'respiratory_distress' in symptom_set:
        if 'coughing' in symptom_set or 'wheezing' in symptom_set:
            risk_score += 12
            risk_factors.append("Respiratory distress with coughing/wheezing (+12 points)")
    
    # Fever with systemic symptoms
    if 'fever' in symptom_set:
        systemic = [s for s in ['lethargy', 'weakness', 'loss_of_appetite'] if s in symptom_set]
        if systemic:
            risk_score += 8
            risk_factors.append(f"Fever with systemic symptoms (+8 points)")
    
    # Urinary blockage indicators
    if 'straining_to_urinate' in symptom_set or 'blood_in_urine' in symptom_set:
        if 'frequent_urination' in symptom_set or 'lethargy' in symptom_set:
            risk_score += 10
            risk_factors.append("Urinary blockage indicators (+10 points)")
    
    # Neurological concerns
    neuro_symptoms = [s for s in ['seizures', 'confusion', 'circling', 'head_tilt', 
                                   'loss_of_balance', 'paralysis', 'rolling'] 
                      if s in symptom_set]
    if len(neuro_symptoms) >= 2:
        risk_score += 15
        risk_factors.append(f"Multiple neurological symptoms ({len(neuro_symptoms)}) (+15 points)")
    elif len(neuro_symptoms) == 1:
        # Single neuro symptom is still concerning
        risk_score += 5
        risk_factors.append(f"Neurological symptom present (+5 points)")
    
    # Multiple symptoms
    if len(valid_symptoms) >= 7:
        risk_score += 15
        risk_factors.append(f"Numerous symptoms ({len(valid_symptoms)} total) (+15 points)")
    elif len(valid_symptoms) >= 5:
        risk_score += 10
        risk_factors.append(f"Multiple symptoms ({len(valid_symptoms)} total) (+10 points)")
    
    # 4. PROGRESSION (if previous logs available)
    if previous_logs and len(previous_logs) > 0:
        compared_to_yesterday = getattr(symptom_log, 'compared_to_yesterday', None)
        
        if compared_to_yesterday == 'worse':
            risk_score += 15
            risk_factors.append("Symptoms worsening (+15 points)")
            
            # Check if rapid deterioration
            if len(previous_logs) >= 2:
                yesterday_risk = getattr(previous_logs[0], 'risk_score', 0)
                if yesterday_risk > 0 and risk_score - yesterday_risk >= 20:
                    risk_score += 10
                    risk_factors.append("Rapid deterioration (+10 points)")
        
        elif compared_to_yesterday == 'same':
            # Check how long symptoms have persisted
            days_with_symptoms = len([log for log in previous_logs 
                                     if any(s in (log.symptoms if isinstance(log.symptoms, list) else []) 
                                           for s in valid_symptoms)])
            
            if days_with_symptoms >= 14:
                risk_score += 15
                risk_factors.append(f"Chronic symptoms ({days_with_symptoms} days) (+15 points)")
            elif days_with_symptoms >= 7:
                risk_score += 10
                risk_factors.append(f"Prolonged symptoms ({days_with_symptoms} days) (+10 points)")
    
    # 5. RAPID ONSET (within 24 hours)
    if previous_logs:
        symptom_date = getattr(symptom_log, 'symptom_date', None)
        if symptom_date:
            yesterday = symptom_date - timedelta(days=1)
            yesterday_logs = [log for log in previous_logs 
                            if getattr(log, 'symptom_date', None) == yesterday]
            
            if not yesterday_logs and severity in ['moderate', 'severe']:
                risk_score += 12
                risk_factors.append("Sudden onset (<24h) (+12 points)")
    
    # 6. PET-SPECIFIC FACTORS
    if pet:
        # Age considerations
        if hasattr(pet, 'age'):
            if pet.age < 1:  # Puppy/kitten/young
                risk_score *= 1.15
                risk_factors.append("Young age (1.15x multiplier)")
            elif pet.age > 10:  # Senior
                risk_score *= 1.1
                risk_factors.append("Senior age (1.1x multiplier)")
        
        # Species-specific considerations
        species = None
        if hasattr(pet, 'animal_type'):
            species = pet.animal_type.lower()
        elif hasattr(pet, 'species'):
            species = pet.species.lower()
        
        if species:
            # Hamsters: wet_tail is extremely serious
            if species == 'hamster' and 'wet_tail' in symptom_set:
                risk_score += 20
                risk_factors.append("Wet tail in hamster (critical) (+20 points)")
            
            # Rabbits: GI stasis is life-threatening
            if species == 'rabbit':
                if 'loss_of_appetite' in symptom_set or 'lethargy' in symptom_set:
                    if 'constipation' in symptom_set or 'bloating' in symptom_set:
                        risk_score += 15
                        risk_factors.append("Potential GI stasis in rabbit (+15 points)")
            
            # Fish: swimming issues are critical
            if species == 'fish':
                if 'swimming_upside_down' in symptom_set or 'gasping_at_surface' in symptom_set:
                    risk_score += 10
                    risk_factors.append("Critical swimming/breathing issue in fish (+10 points)")
            
            # Birds: respiratory issues escalate quickly
            if species == 'bird':
                if 'difficulty_breathing' in symptom_set or 'tail_bobbing' in symptom_set:
                    risk_score += 8
                    risk_factors.append("Respiratory compromise in bird (+8 points)")
            
            # Cats: urinary blockage is more common and critical
            if species == 'cat':
                if 'straining_to_urinate' in symptom_set:
                    risk_score += 12
                    risk_factors.append("Urinary blockage risk in cat (+12 points)")
            
            # Dogs: bloat/GDV is life-threatening emergency
            if species == 'dog':
                if 'bloating' in symptom_set:
                    if 'restlessness' in symptom_set or 'weakness' in symptom_set:
                        risk_score += 15
                        risk_factors.append("Potential bloat/GDV in dog (EMERGENCY) (+15 points)")
    
    # Cap at 100
    risk_score = min(int(risk_score), 100)
    
    # 7. DETERMINE RISK LEVEL
    if risk_score >= 70:
        risk_level = 'critical'
        recommendation = "🚨 URGENT: Seek emergency veterinary care immediately. Do not wait. This could be life-threatening."
    elif risk_score >= 50:
        risk_level = 'high'
        recommendation = "⚠️ HIGH PRIORITY: Contact your vet today or visit emergency clinic if after hours. These symptoms require prompt attention."
    elif risk_score >= 30:
        risk_level = 'moderate'
        recommendation = "📋 Schedule vet appointment within 24-48 hours. Monitor closely for worsening symptoms."
    else:
        risk_level = 'low'
        recommendation = "👁️ Continue monitoring. Contact vet if symptoms worsen or persist beyond 3-5 days."
    
    # 8. EXOTIC RISK MODIFIER (Bird/Fish are 'masters of disguise')
    # Get species from pet or symptom_log
    species = None
    if pet:
        if hasattr(pet, 'animal_type'):
            species = pet.animal_type
        elif hasattr(pet, 'species'):
            species = pet.species
    
    # Apply exotic risk modifier
    exotic_modifier = calculate_exotic_risk_modifier(species, valid_symptoms)
    original_risk_level = risk_level
    
    if exotic_modifier['modifier_applied']:
        # Boost urgency by one tier
        if risk_level == 'low':
            risk_level = 'moderate'
            recommendation = "📋 Schedule vet appointment within 24-48 hours. Monitor closely for worsening symptoms."
        elif risk_level == 'moderate':
            risk_level = 'high'
            recommendation = "⚠️ HIGH PRIORITY: Contact your vet today or visit emergency clinic if after hours. These symptoms require prompt attention."
        elif risk_level == 'high':
            risk_level = 'critical'
            recommendation = "🚨 URGENT: Seek emergency veterinary care immediately. Do not wait. This could be life-threatening."
        # 'critical' stays 'critical' (can't go higher)
        
        risk_factors.append(f"Exotic species modifier: {exotic_modifier['reason']} (boosted from {original_risk_level} to {risk_level})")
    
    return {
        'risk_score': risk_score,
        'risk_level': risk_level,
        'risk_factors': risk_factors,
        'recommendation': recommendation,
        'symptoms_evaluated': len(valid_symptoms),
        'total_symptoms_reported': len(symptoms),
        'exotic_modifier_applied': exotic_modifier['modifier_applied']
    }


def should_create_alert(symptom_log, previous_logs=None, risk_result=None):
    """
    Determine if a SymptomAlert should be created based on risk assessment
    
    Args:
        symptom_log: SymptomLog instance
        previous_logs: QuerySet or list of previous SymptomLog instances
        risk_result: Dict from calculate_risk_score (optional, will calculate if not provided)
    
    Returns:
        tuple: (should_alert: bool, alert_type: str or None, alert_message: str or None)
    """
    if risk_result is None:
        risk_result = calculate_risk_score(symptom_log, previous_logs)
    
    risk_score = risk_result['risk_score']
    risk_level = risk_result['risk_level']
    
    # CRITICAL RISK - Always alert
    if risk_level == 'critical':
        return (
            True,
            'risk_escalation',
            f"🚨 CRITICAL: {symptom_log.pet.name}'s symptoms have reached critical severity (risk score: {risk_score}). "
            f"Immediate veterinary care is strongly recommended. {risk_result['recommendation']}"
        )
    
    # RAPID DETERIORATION
    if previous_logs and len(previous_logs) > 0:
        compared = getattr(symptom_log, 'compared_to_yesterday', None)
        if compared == 'worse':
            yesterday_risk = getattr(previous_logs[0], 'risk_score', 0)
            if yesterday_risk > 0 and risk_score - yesterday_risk >= 20:
                return (
                    True,
                    'rapid_deterioration',
                    f"⚠️ ALERT: {symptom_log.pet.name}'s condition is rapidly deteriorating. "
                    f"Risk score increased from {yesterday_risk} to {risk_score} in 24 hours. "
                    f"Please contact your veterinarian immediately."
                )
    
    # NEW CRITICAL SYMPTOM
    symptoms = symptom_log.symptoms if isinstance(symptom_log.symptoms, list) else []
    critical_present = [s for s in symptoms if s in CRITICAL_SYMPTOMS]
    
    if critical_present and previous_logs:
        # Check if this is a new critical symptom
        all_previous_symptoms = set()
        for log in previous_logs[:3]:  # Check last 3 days
            prev_symptoms = log.symptoms if isinstance(log.symptoms, list) else []
            all_previous_symptoms.update(prev_symptoms)
        
        new_critical = [s for s in critical_present if s not in all_previous_symptoms]
        if new_critical:
            symptom_names = ', '.join([s.replace('_', ' ').title() for s in new_critical])
            return (
                True,
                'new_critical_symptom',
                f"⚠️ ALERT: {symptom_log.pet.name} is showing new critical symptom(s): {symptom_names}. "
                f"These symptoms require immediate veterinary attention. Please contact your vet right away."
            )
    
    # PROLONGED SYMPTOMS
    if previous_logs and len(previous_logs) >= 7:
        compared = getattr(symptom_log, 'compared_to_yesterday', None)
        if compared == 'same' or compared == 'worse':
            days_symptomatic = len(previous_logs) + 1
            if days_symptomatic >= 7 and risk_level in ['moderate', 'high']:
                return (
                    True,
                    'prolonged_symptoms',
                    f"📋 NOTICE: {symptom_log.pet.name}'s symptoms have persisted for {days_symptomatic} days. "
                    f"Prolonged symptoms warrant a veterinary evaluation even if they seem stable. "
                    f"Please schedule an appointment with your vet."
                )
    
    # HIGH RISK (but not critical)
    if risk_level == 'high':
        return (
            True,
            'risk_escalation',
            f"⚠️ HIGH PRIORITY: {symptom_log.pet.name}'s symptoms indicate high risk (score: {risk_score}). "
            f"{risk_result['recommendation']}"
        )
    
    # No alert needed
    return (False, None, None)


# Validation: Ensure all symptoms have risk weights
def validate_symptom_coverage():
    """
    Validate that all canonical symptoms have risk weights assigned
    Returns dict with coverage stats
    """
    all_weighted_symptoms = set()
    all_weighted_symptoms.update(CRITICAL_SYMPTOMS.keys())
    all_weighted_symptoms.update(HIGH_CONCERN_SYMPTOMS.keys())
    all_weighted_symptoms.update(MODERATE_SYMPTOMS.keys())
    all_weighted_symptoms.update(SPECIES_SPECIFIC_SYMPTOMS.keys())
    all_weighted_symptoms.update(LOW_CONCERN_SYMPTOMS.keys())
    
    missing = set(CANONICAL_SYMPTOMS) - all_weighted_symptoms
    extra = all_weighted_symptoms - set(CANONICAL_SYMPTOMS)
    
    return {
        'total_canonical': len(CANONICAL_SYMPTOMS),
        'total_weighted': len(all_weighted_symptoms),
        'coverage_rate': len(all_weighted_symptoms & set(CANONICAL_SYMPTOMS)) / len(CANONICAL_SYMPTOMS),
        'missing_weights': list(missing),
        'extra_weights': list(extra),
    }


if __name__ == "__main__":
    # Run validation
    print("="*60)
    print("RISK CALCULATOR VALIDATION")
    print("="*60)
    
    validation = validate_symptom_coverage()
    
    print(f"\nCanonical Symptoms: {validation['total_canonical']}")
    print(f"Weighted Symptoms: {validation['total_weighted']}")
    print(f"Coverage Rate: {validation['coverage_rate']*100:.1f}%")
    
    if validation['missing_weights']:
        print(f"\n⚠️  Missing weights for {len(validation['missing_weights'])} symptoms:")
        for symptom in validation['missing_weights']:
            print(f"  - {symptom}")
    else:
        print("\n✅ All canonical symptoms have risk weights assigned!")
    
    if validation['extra_weights']:
        print(f"\n⚠️  {len(validation['extra_weights'])} extra symptoms not in canonical list:")
        for symptom in validation['extra_weights']:
            print(f"  - {symptom}")
    
    print("\n" + "="*60)
