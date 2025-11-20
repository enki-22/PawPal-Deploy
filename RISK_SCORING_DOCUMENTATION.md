# PawPal Risk Scoring System Documentation

## Overview
Comprehensive risk scoring system for symptom progression tracking using the **81 canonical symptoms** from the disease classifier training model.

> **Note:** The training model actually contains **81 canonical symptoms**, not 69 as initially stated. All 81 symptoms are fully covered with risk weights.

## Validation Results
```
✅ Coverage Rate: 100.0%
✅ All 81 canonical symptoms have risk weights assigned
✅ No missing symptoms
✅ No extra symptoms
```

## Architecture

### File Structure
```
utils/
└── risk_calculator.py          # Main risk scoring module
    ├── CANONICAL_SYMPTOMS       # 81 symptoms from train_model.py
    ├── Risk weight dictionaries
    ├── calculate_risk_score()   # Main scoring function
    ├── should_create_alert()    # Alert logic
    └── validate_symptom_coverage() # Validation
```

## Risk Categories & Weights

### Critical Symptoms (Life-Threatening)
**8 symptoms** weighted 20-30 points each:
- `seizures`: 30 points
- `paralysis`: 30 points
- `respiratory_distress`: 28 points
- `difficulty_breathing`: 25 points
- `cloudy_eyes`: 25 points (glaucoma emergency)
- `bloating`: 25 points (bloat/GDV risk)
- `straining_to_urinate`: 22 points (urinary blockage)
- `blood_in_urine`: 20 points

### High Concern Symptoms
**24 symptoms** weighted 8-15 points each:
- Includes: vomiting, diarrhea, fever, dehydration, weakness, labored_breathing, confusion, etc.

### Moderate Symptoms
**29 symptoms** weighted 2-8 points each:
- Includes: sneezing, itching, scratching, hair_loss, rash, constipation, etc.

### Species-Specific Symptoms
**16 symptoms** weighted 6-18 points each:
- **Bird**: drooping_wing, wing_droop, fluffed_feathers, tail_bobbing, feather_loss
- **Fish**: swimming_upside_down, gasping_at_surface, fin_rot, white_spots, clamped_fins, rubbing_against_objects
- **Rabbit**: head_tilt, rolling, loss_of_balance, dental_issues
- **Small mammal**: wet_tail (18 pts!), lumps, bumps, overgrown_teeth

### Low Concern Symptoms
**2 symptoms** weighted 4-5 points:
- `not_eating`: 5 points
- `excessive_eating`: 4 points

## Scoring Algorithm

### 1. Base Symptom Score
Sum of individual symptom weights from canonical list.

### 2. Severity Multiplier
- **Severe**: 1.5x multiplier
- **Moderate**: 1.2x multiplier
- **Mild**: 1.0x (no multiplier)

### 3. Symptom Combinations (+10-15 points)
Synergistic risk patterns identified in training data:

#### GI Distress
- Vomiting + Diarrhea: +10 points
- + Dehydration/Weakness: +8 additional points

#### Respiratory Emergency
- Difficulty_breathing/respiratory_distress + Coughing/Wheezing: +12 points

#### Systemic Infection
- Fever + (Lethargy/Weakness/Loss_of_appetite): +8 points

#### Urinary Blockage
- Straining_to_urinate/Blood_in_urine + (Frequent_urination/Lethargy): +10 points

#### Neurological Crisis
- 2+ neurological symptoms: +15 points
- 1 neurological symptom: +5 points

#### Multiple Symptoms
- 7+ symptoms: +15 points
- 5-6 symptoms: +10 points

### 4. Progression Factors (+10-15 points)

#### Worsening
- Compared_to_yesterday = 'worse': +15 points
- Rapid deterioration (risk increase ≥20 in 24h): +10 additional points

#### Prolonged
- Symptoms persisting 14+ days: +15 points
- Symptoms persisting 7-13 days: +10 points

#### Sudden Onset
- Moderate/severe symptoms appearing within 24h: +12 points

### 5. Pet-Specific Adjustments

#### Age Multipliers
- **Puppy/Kitten (<1 year)**: 1.15x multiplier
- **Senior (>10 years)**: 1.1x multiplier

#### Species-Critical Conditions
Additional risk points for known dangerous conditions:

| Species | Condition | Points | Notes |
|---------|-----------|--------|-------|
| Hamster | Wet tail | +20 | Extremely serious |
| Rabbit | GI stasis indicators | +15 | Loss_of_appetite + Constipation/Bloating |
| Fish | Swimming issues | +10 | Swimming_upside_down or Gasping_at_surface |
| Bird | Respiratory issues | +8 | Difficulty_breathing or Tail_bobbing |
| Cat | Urinary blockage | +12 | Straining_to_urinate (very common) |
| Dog | Bloat/GDV | +15 | Bloating + Restlessness/Weakness |

### 6. Risk Level Determination

| Score Range | Risk Level | Recommendation |
|-------------|------------|----------------|
| 70-100 | **Critical** | 🚨 URGENT: Seek emergency care immediately |
| 50-69 | **High** | ⚠️ Contact vet today or emergency clinic |
| 30-49 | **Moderate** | 📋 Schedule appointment within 24-48 hours |
| 0-29 | **Low** | 👁️ Monitor, contact vet if worsens/persists 3-5 days |

## Usage

### Basic Risk Calculation
```python
from utils.risk_calculator import calculate_risk_score
from chatbot.models import SymptomLog

# Get symptom log
log = SymptomLog.objects.get(id=123)

# Calculate risk (basic)
result = calculate_risk_score(log)

print(f"Risk Score: {result['risk_score']}")
print(f"Risk Level: {result['risk_level']}")
print(f"Recommendation: {result['recommendation']}")
print(f"\nRisk Factors:")
for factor in result['risk_factors']:
    print(f"  - {factor}")
```

### With Previous Logs & Pet Context
```python
# Get previous logs for progression analysis
previous_logs = SymptomLog.objects.filter(
    pet=log.pet,
    symptom_date__lt=log.symptom_date
).order_by('-symptom_date')[:14]  # Last 2 weeks

# Calculate with full context
result = calculate_risk_score(
    symptom_log=log,
    previous_logs=previous_logs,
    pet=log.pet
)
```

### Alert Generation
```python
from utils.risk_calculator import should_create_alert
from chatbot.models import SymptomAlert

# Check if alert should be created
should_alert, alert_type, alert_message = should_create_alert(
    symptom_log=log,
    previous_logs=previous_logs,
    risk_result=result  # Optional, will calculate if not provided
)

if should_alert:
    # Create alert
    SymptomAlert.objects.create(
        symptom_log=log,
        pet=log.pet,
        user=log.user,
        alert_type=alert_type,
        alert_message=alert_message
    )
```

## Alert Triggers

### 1. Critical Risk (Always)
- Risk level = 'critical' (score ≥70)

### 2. Rapid Deterioration
- Compared_to_yesterday = 'worse'
- Risk score increase ≥20 points in 24 hours

### 3. New Critical Symptom
- Any critical symptom appearing that wasn't present in last 3 days

### 4. Prolonged Symptoms
- Symptoms persisting ≥7 days
- Risk level = 'moderate' or 'high'
- Status = 'same' or 'worse'

### 5. High Risk
- Risk level = 'high' (score ≥50)

## Integration with Views

### Recommended Implementation
```python
from utils.risk_calculator import calculate_risk_score, should_create_alert

def save_symptom_log(request):
    # ... create symptom_log ...
    
    # Get previous logs
    previous_logs = SymptomLog.objects.filter(
        pet=symptom_log.pet,
        symptom_date__lt=symptom_log.symptom_date
    ).order_by('-symptom_date')[:14]
    
    # Calculate risk
    risk_result = calculate_risk_score(
        symptom_log=symptom_log,
        previous_logs=previous_logs,
        pet=symptom_log.pet
    )
    
    # Update symptom log
    symptom_log.risk_score = risk_result['risk_score']
    symptom_log.risk_level = risk_result['risk_level']
    symptom_log.save()
    
    # Check for alerts
    should_alert, alert_type, alert_message = should_create_alert(
        symptom_log=symptom_log,
        previous_logs=previous_logs,
        risk_result=risk_result
    )
    
    if should_alert:
        SymptomAlert.objects.create(
            symptom_log=symptom_log,
            pet=symptom_log.pet,
            user=symptom_log.user,
            alert_type=alert_type,
            alert_message=alert_message
        )
    
    return Response({
        'symptom_log': SymptomLogSerializer(symptom_log).data,
        'risk_assessment': risk_result,
        'alert_created': should_alert
    })
```

## Veterinary Basis & Citations

### Risk Weight Sources
1. **Veterinary Emergency Triage**
   - RAP (Recognize, Assess, Prioritize) system
   - Emergency severity classifications

2. **Symptom Severity Literature**
   - Critical symptoms: Life-threatening conditions requiring immediate intervention
   - High concern: Conditions requiring same-day veterinary evaluation
   - Moderate: Symptoms warranting scheduled appointment

3. **Species-Specific Pathology**
   - Hamster wet tail: 90%+ mortality without treatment
   - Rabbit GI stasis: Life-threatening within 12-24 hours
   - Fish swim bladder disorders: Critical oxygenation issues
   - Dog bloat/GDV: 15-minute window for intervention
   - Cat urinary blockage: Fatal within 48-72 hours

4. **Training Data Patterns**
   - Symptom combinations correlated with high-urgency diagnoses
   - Multi-system involvement indicators
   - Progression patterns from disease dataset

## Testing & Validation

### Run Validation
```bash
python utils\risk_calculator.py
```

### Expected Output
```
============================================================
RISK CALCULATOR VALIDATION
============================================================

Canonical Symptoms: 81
Weighted Symptoms: 81
Coverage Rate: 100.0%

✅ All canonical symptoms have risk weights assigned!

============================================================
```

## Future Enhancements

1. **Machine Learning Integration**
   - Use trained model predictions to adjust risk weights
   - Learn from actual outcomes (vet visits, diagnoses)

2. **Breed-Specific Risk Factors**
   - Brachycephalic breeds (breathing issues)
   - Large breeds (bloat risk)
   - Purebreds (genetic conditions)

3. **Environmental Context**
   - Season (heat stroke, hypothermia)
   - Recent activities (trauma, ingestion)
   - Vaccination status

4. **Historical Risk Patterns**
   - Pet's baseline health
   - Previous conditions
   - Known allergies/sensitivities

## Maintenance

### Adding New Symptoms
1. Add to `CANONICAL_SYMPTOMS` list
2. Add to appropriate risk weight dictionary
3. Run validation to confirm 100% coverage
4. Update this documentation

### Adjusting Risk Weights
1. Review veterinary literature
2. Analyze outcome data (if available)
3. Update weight in appropriate dictionary
4. Document rationale in code comments

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintained by:** PawPal Development Team
