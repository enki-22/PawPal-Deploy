I need to train a Random Forest model for pet disease prediction with 90-95% accuracy TODAY.

## DATASETS I HAVE:

1. **Dataset #1 (Kaggle)**: Animal Disease Prediction Using Symptoms
   - File: animal_disease_prediction.csv
   - Animals: Dogs, Cats, Horses
   - Features: Animal_Type, Breed, Age, Gender, Weight, Symptom_1-4, Duration, Appetite_Loss, Vomiting, Diarrhea, Coughing, Labored_Breathing, Lameness, Skin_Lesions, Nasal_Discharge, Eye_Discharge, Body_Temperature, Heart_Rate
   - Target: Disease_Prediction

2. **Dataset #2 (Kaggle)**: Pet Health Symptoms Dataset
   - File: pet_health_symptoms.csv
   - Animals: Dogs, Cats
   - Features: text (symptom description), condition, record_type
   - 2,000 samples
   - 5 conditions: Skin Irritations, Digestive Issues, Parasites, Ear Infections, Mobility Problems

3. **Dataset #4 (Kaggle)**: Veterinary Clinical Dataset
   - File: veterinary_clinical_dataset.csv
   - Animals: Dogs, Cats
   - 10,000 records
   - Features: species, breed, age, weight, medical_history, symptoms, diagnostic_results

## GOAL:
Train ONE unified Random Forest model that:
- ✅ Achieves 90-95% accuracy
- ✅ Predicts 25-50 common pet diseases
- ✅ Supports Dogs, Cats, Horses (priority: Dogs & Cats)
- ✅ Can be called via API endpoint: POST /api/ml/predict
- ✅ Returns: [{condition, likelihood, urgency, matched_symptoms, contagious}]

## REQUIREMENTS:

### 1. DATA PREPROCESSING
- Combine all 3 datasets into one unified dataframe
- Standardize column names (species, breed, age, symptoms, disease)
- Handle missing values intelligently
- Encode categorical features (breed, species)
- Extract symptoms from text columns (dataset #2)
- Balance classes (use SMOTE if needed)
- Split: 80% train, 20% test

### 2. FEATURE ENGINEERING
Create these features:
- **Symptom binary flags**: has_vomiting, has_diarrhea, has_coughing, etc. (20-30 symptoms)
- **Symptom count**: total number of symptoms present
- **Severity indicators**: fever, labored_breathing, lethargy
- **Age groups**: puppy/kitten (<1yr), adult (1-7yr), senior (7+yr)
- **Weight categories**: underweight, normal, overweight
- **Duration numeric**: convert "2 days", "1 week" to days

### 3. MODEL TRAINING
```python
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV

# Hyperparameter tuning
param_grid = {
    'n_estimators': [200, 300, 500],
    'max_depth': [20, 30, None],
    'min_samples_split': [2, 5],
    'min_samples_leaf': [1, 2],
    'max_features': ['sqrt', 'log2']
}

rf = RandomForestClassifier(random_state=42, class_weight='balanced')
grid_search = GridSearchCV(rf, param_grid, cv=5, scoring='accuracy', n_jobs=-1)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
```

### 4. MODEL EVALUATION
- Print accuracy, precision, recall, F1-score
- Show confusion matrix
- Display feature importance (top 20)
- Test on each species separately (dog accuracy, cat accuracy, horse accuracy)
- Show per-disease accuracy for top 10 diseases

### 5. DISEASE MAPPING
Create a disease metadata dictionary:
```python
disease_metadata = {
    'Kennel Cough': {
        'urgency': 'Moderate',
        'contagious': True,
        'description': 'Respiratory infection causing persistent cough',
        'species': ['Dog']
    },
    'Gastroenteritis': {
        'urgency': 'Moderate',
        'contagious': False,
        'description': 'Inflammation of stomach and intestines',
        'species': ['Dog', 'Cat', 'Horse']
    },
    # ... generate for all diseases in dataset
}
```

### 6. PREDICTION FUNCTION
```python
def predict_disease(symptoms, species, breed, age, duration):
    """
    Input:
        symptoms: list of symptom strings
        species: 'Dog', 'Cat', 'Horse'
        breed: string
        age: int (years)
        duration: string ('2 days', '1 week')
    
    Output:
        [
            {
                'condition': 'Kennel Cough',
                'likelihood': 0.89,
                'urgency': 'Moderate',
                'matched_symptoms': ['Coughing', 'Nasal Discharge'],
                'description': '...',
                'contagious': True
            },
            # ... top 3 predictions
        ]
    """
    # Preprocess input
    # Run model.predict_proba()
    # Get top 3 predictions
    # Match with disease_metadata
    # Return formatted results
```

### 7. SAVE MODEL
Save these files:
- `random_forest_model.pkl` (trained model)
- `feature_columns.pkl` (column names for preprocessing)
- `disease_metadata.json` (disease info)
- `label_encoder.pkl` (for species/breed encoding)

### 8. CREATE API ENDPOINT STUB
```python
# ml_service.py
import pickle
import pandas as pd

def load_model():
    model = pickle.load(open('random_forest_model.pkl', 'rb'))
    feature_cols = pickle.load(open('feature_columns.pkl', 'rb'))
    return model, feature_cols

def predict_api(pet_id, symptoms, duration, pet_metadata):
    """
    Called by Django backend
    Returns top 3 disease predictions with metadata
    """
    # Use predict_disease() function
    pass
```

## OUTPUT FILES I NEED:
1. `train_model.py` - Complete training script
2. `random_forest_model.pkl` - Trained model
3. `feature_columns.pkl` - Feature names
4. `disease_metadata.json` - Disease info
5. `label_encoder.pkl` - Encoders
6. `predict.py` - Prediction function
7. `ml_service.py` - API integration stub
8. `model_evaluation.txt` - Accuracy report

## SUCCESS CRITERIA:
- ✅ Overall accuracy ≥ 90%
- ✅ Dog accuracy ≥ 92%
- ✅ Cat accuracy ≥ 90%
- ✅ Top 10 diseases accuracy ≥ 85%
- ✅ Model size < 100MB
- ✅ Prediction time < 0.5 seconds
- ✅ Returns top 3 predictions with confidence scores

## CONSTRAINTS:
- Use Python 3.9+
- Libraries: scikit-learn, pandas, numpy, imbalanced-learn (for SMOTE)
- No deep learning (must be Random Forest)
- Must handle unseen breeds gracefully
- Must work with incomplete symptoms (minimum 2 symptoms)

## EXECUTION ORDER:
1. Load and merge 3 datasets
2. EDA: show class distribution, missing values, species breakdown
3. Preprocessing: standardize, encode, feature engineering
4. Train with GridSearchCV
5. Evaluate and print detailed metrics
6. Save all artifacts
7. Test prediction function with sample inputs

START NOW. Show me the complete train_model.py script first, then execute it.