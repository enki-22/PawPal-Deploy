import os
import json
import pickle
import warnings
from collections import Counter
import time

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.pipeline import Pipeline as SKPipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler, LabelEncoder, FunctionTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
import lightgbm as lgb
from lightgbm import early_stopping
from imblearn.over_sampling import SMOTE
import re

warnings.filterwarnings("ignore")

# ========================
# CLEAN CONFIG - PAWPAL ONLY
# ========================
DATASET_FILE = "pet_disease_dataset_final.csv"


OUTPUTS = {
    "model": "pawpal_model.pkl",
    "label_encoder": "pawpal_label_encoder.pkl",
    "disease_metadata": "pawpal_disease_metadata.json",
    "evaluation": "pawpal_evaluation.txt",
}

RANDOM_STATE = 42
TEST_SIZE = 0.2
MIN_SAMPLES_PER_CLASS = 8  # With 14 samples per disease, this keeps most

# Expanded symptom vocabulary for your dataset
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
    
    # Digestive (removed duplicates: vomiting, diarrhea already in General)
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
    
    # Bird-specific (removed duplicate: labored_breathing already in Respiratory)
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

SYMPTOM_MAPPINGS = {
    # Your dataset specific mappings
    "keeps scratching": "scratching",
    "scratching constantly": "scratching",
    "won't stop scratching": "scratching",
    "keeps shaking head": "head_shaking",
    "shaking head": "head_shaking",
    "not eating": "loss_of_appetite",
    "won't eat": "loss_of_appetite",
    "hasn't eaten": "loss_of_appetite",
    "refuses food": "loss_of_appetite",
    "throwing up": "vomiting",
    "keeps vomiting": "vomiting",
    "watery eyes": "eye_discharge",
    "teary eyes": "eye_discharge",
    "red swollen gums": "swollen_gums",
    "swollen gums": "swollen_gums",
    "blood in urine": "blood_in_urine",
    "bloody urine": "blood_in_urine",
    "peeing blood": "blood_in_urine",
    "frequent urination": "frequent_urination",
    "peeing a lot": "frequent_urination",
    "can't breathe": "difficulty_breathing",
    "breathing weird": "labored_breathing",
    "difficulty breathing": "difficulty_breathing",
    "white spots": "white_spots",
    "drooping wing": "drooping_wing",
    "can't fly": "drooping_wing",
    "swimming upside down": "swimming_upside_down",
    "won't hop": "lameness",
    "limping": "lameness",
    "red irritated skin": "red_skin",
    "irritated skin": "irritated_skin",
    "losing weight": "weight_loss",
    "getting thin": "weight_loss",
}


def extract_symptoms_from_text(text: str) -> list:
    """Extract symptoms from natural language descriptions"""
    if not isinstance(text, str) or not text.strip():
        return []
    
    text_lower = text.lower()
    symptoms = set()
    
    # Check for mapped phrases first (longer phrases)
    for phrase, symptom in sorted(SYMPTOM_MAPPINGS.items(), key=lambda x: -len(x[0])):
        if phrase in text_lower:
            symptoms.add(symptom)
    
    # Then check for canonical symptoms
    words = re.findall(r"[a-zA-Z]+", text_lower)
    for i in range(len(words)):
        # Unigrams
        if words[i] in CANONICAL_SYMPTOMS:
            symptoms.add(words[i])
        
        # Bigrams
        if i < len(words) - 1:
            bigram = f"{words[i]}_{words[i+1]}"
            if bigram in CANONICAL_SYMPTOMS:
                symptoms.add(bigram)
        
        # Trigrams
        if i < len(words) - 2:
            trigram = f"{words[i]}_{words[i+1]}_{words[i+2]}"
            if trigram in CANONICAL_SYMPTOMS:
                symptoms.add(trigram)
    
    return list(symptoms)


def load_pawpal_dataset(file_path: str) -> pd.DataFrame:
    """Load and process the PawPal dataset"""
    print(f"Loading PawPal dataset from: {file_path}")
    df = pd.read_csv(file_path)
    
    print(f"Original shape: {df.shape}")
    print(f"Columns: {list(df.columns)}")
    
    # Process each row
    rows = []
    for _, row in df.iterrows():
        species = row.get('species', '').strip().capitalize()
        disease = row.get('disease', '').strip()
        symptoms_text = row.get('symptoms', '')
        urgency = row.get('urgency', 'moderate').strip().lower()
        contagious = str(row.get('contagious', 'no')).strip().lower() == 'yes'
        
        # Extract symptoms
        symptoms_list = extract_symptoms_from_text(symptoms_text)
        
        # Map urgency to duration (for feature engineering)
        duration_map = {'mild': 1.0, 'moderate': 3.0, 'severe': 7.0}
        duration = duration_map.get(urgency, 3.0)
        
        rows.append({
            'species': species,
            'disease': disease,
            'symptoms_text': symptoms_text,
            'symptoms_list': symptoms_list,
            'symptom_count': len(symptoms_list),
            'urgency': urgency,
            'contagious': contagious,
            'duration_days': duration,
        })
    
    processed_df = pd.DataFrame(rows)
    
    # Data quality report
    print(f"\n{'='*60}")
    print("DATASET QUALITY REPORT")
    print(f"{'='*60}")
    print(f"Total samples: {len(processed_df)}")
    print(f"Unique diseases: {processed_df['disease'].nunique()}")
    print(f"Unique species: {processed_df['species'].nunique()}")
    print(f"\nSpecies distribution:")
    print(processed_df['species'].value_counts().to_string())
    print(f"\nDisease distribution (top 15):")
    print(processed_df['disease'].value_counts().head(15).to_string())
    print(f"\nSymptom extraction rate: {(processed_df['symptom_count'] > 0).mean()*100:.1f}%")
    print(f"Avg symptoms per sample: {processed_df['symptom_count'].mean():.1f}")
    print(f"{'='*60}\n")
    
    return processed_df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create features from the dataset"""
    out = df.copy()
    
    # Binary symptom flags
    for symptom in CANONICAL_SYMPTOMS:
        out[f'has_{symptom}'] = out['symptoms_list'].apply(
            lambda lst: 1 if symptom in lst else 0
        )
    
    # Urgency encoding
    urgency_map = {'mild': 1, 'moderate': 2, 'severe': 3}
    out['urgency_encoded'] = out['urgency'].map(urgency_map).fillna(2)
    
    # Contagious flag
    out['contagious_flag'] = out['contagious'].astype(int)
    
    # Symptom category counts
    respiratory_symptoms = ['coughing', 'sneezing', 'wheezing', 'labored_breathing', 
                           'nasal_discharge', 'difficulty_breathing']
    out['respiratory_count'] = out['symptoms_list'].apply(
        lambda lst: sum(1 for s in lst if s in respiratory_symptoms)
    )
    
    digestive_symptoms = ['vomiting', 'diarrhea', 'constipation', 'loss_of_appetite']
    out['digestive_count'] = out['symptoms_list'].apply(
        lambda lst: sum(1 for s in lst if s in digestive_symptoms)
    )
    
    skin_symptoms = ['scratching', 'itching', 'hair_loss', 'red_skin', 'skin_lesions']
    out['skin_count'] = out['symptoms_list'].apply(
        lambda lst: sum(1 for s in lst if s in skin_symptoms)
    )
    
    # Severity score
    out['severity_score'] = (
        out['urgency_encoded'] + 
        (out['symptom_count'] / 3.0) +  # Normalized
        out['contagious_flag'] * 2  # Contagious diseases get higher score
    )
    
    return out


# Module-level function for pickling compatibility
def _ravel_column(x):
    """Helper to flatten a single column for TF-IDF."""
    return np.ravel(x)


def build_preprocessor(categorical_cols: list, numeric_cols: list, text_col: str) -> ColumnTransformer:
    """Build the preprocessing pipeline"""
    
    text_pipeline = SKPipeline([
        ('ravel', FunctionTransformer(_ravel_column, validate=False)),
        ('tfidf', TfidfVectorizer(
            max_features=300,  # Reduced since we have symptom flags
            ngram_range=(1, 2),
            min_df=2,
            sublinear_tf=True,
        ))
    ])
    
    preprocessor = ColumnTransformer([
        ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_cols),
        ('num', StandardScaler(), numeric_cols),
        ('text', text_pipeline, [text_col]),
    ], remainder='drop')
    
    return preprocessor


def main():
    print("="*60)
    print("PAWPAL DISEASE CLASSIFIER - CLEAN TRAINING")
    print("="*60)
    
    # 1) Load dataset
    if not os.path.exists(DATASET_FILE):
        raise FileNotFoundError(f"Dataset not found: {DATASET_FILE}")
    
    df = load_pawpal_dataset(DATASET_FILE)

    # 1) Load dataset
    if not os.path.exists(DATASET_FILE):
        raise FileNotFoundError(f"Dataset not found: {DATASET_FILE}")
    
    df = load_pawpal_dataset(DATASET_FILE)
    
    # ============================================================
    # FIX: CLEAN UP SPECIES DATA
    # ============================================================
    print("\n🔧 Cleaning species data...")
    
    # Standardize species names (remove plurals)
    species_mapping = {
        'Dogs': 'Dog',
        'Cats': 'Cat', 
        'Birds': 'Bird',
        'Rabbits': 'Rabbit',
        'Species': 'REMOVE',  # Mark for removal
    }
    
    df['species'] = df['species'].replace(species_mapping)
    
    # Remove invalid "Species" entries
    before_count = len(df)
    df = df[df['species'] != 'REMOVE'].reset_index(drop=True)
    removed_count = before_count - len(df)
    
    print(f"✓ Standardized species names (Dogs→Dog, Cats→Cat, etc.)")
    print(f"✓ Removed {removed_count} invalid 'Species' entries")
    print(f"✓ Final dataset: {len(df)} samples")
    print(f"✓ Unique species: {df['species'].nunique()}")
    print(f"\nCleaned species distribution:")
    print(df['species'].value_counts().to_string())
    print("="*60)
    # ============================================================
    
    
    # 2) Engineer features
    print("Engineering features...")
    df = engineer_features(df)
    
    # 3) Filter rare diseases
    disease_counts = df['disease'].value_counts()
    valid_diseases = disease_counts[disease_counts >= MIN_SAMPLES_PER_CLASS].index
    df = df[df['disease'].isin(valid_diseases)].reset_index(drop=True)
    
    print(f"\nKept {len(valid_diseases)} diseases with >= {MIN_SAMPLES_PER_CLASS} samples")
    print(f"Final dataset: {len(df)} samples\n")
    
    # 4) Prepare features and target
    categorical_cols = ['species', 'urgency']
    numeric_cols = [
        'symptom_count', 'urgency_encoded', 'contagious_flag',
        'respiratory_count', 'digestive_count', 'skin_count', 'severity_score',
        'duration_days',
    ] + [f'has_{s}' for s in CANONICAL_SYMPTOMS]
    text_col = 'symptoms_text'
    
    all_feature_cols = categorical_cols + numeric_cols + [text_col]
    X = df[all_feature_cols].copy()
    y_raw = df['disease']
    
    # Encode target
    le = LabelEncoder()
    y = le.fit_transform(y_raw)
    num_classes = len(le.classes_)
    
    print(f"Number of classes: {num_classes}")
    print(f"Class distribution:")
    print(pd.Series(y).value_counts().describe())
    
    # 5) Split data
    X_train, X_test, y_train, y_test, species_train, species_test = train_test_split(
        X, y, df['species'],
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
        stratify=y
    )
    
    print(f"\nTrain: {len(X_train)} | Test: {len(X_test)}")
    
    # 6) Preprocess
    print("\nPreprocessing features...")
    preprocessor = build_preprocessor(categorical_cols, numeric_cols, text_col)
    preprocessor.fit(X_train)
    
    X_train_t = preprocessor.transform(X_train)
    X_test_t = preprocessor.transform(X_test)
    
    print(f"Feature shape after preprocessing: {X_train_t.shape}")
    
    # 7) Apply SMOTE for balance
    print("\nApplying SMOTE for class balance...")
    try:
        smote = SMOTE(random_state=RANDOM_STATE, k_neighbors=min(5, MIN_SAMPLES_PER_CLASS-1))
        X_train_t, y_train = smote.fit_resample(X_train_t, y_train)
        print(f"After SMOTE: {X_train_t.shape[0]} samples")
    except Exception as e:
        print(f"SMOTE failed: {e}")
        print("Continuing without oversampling...")
    
    # 8) Train LightGBM
    print(f"\n{'='*60}")
    print("TRAINING MODEL")
    print(f"{'='*60}\n")
    
    model = lgb.LGBMClassifier(
        objective='multiclass',
        num_class=num_classes,
        n_estimators=2000,
        learning_rate=0.03,
        num_leaves=128,
        max_depth=8,
        min_child_samples=5,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=0.1,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=-1,
    )
    
    start = time.time()
    model.fit(
        X_train_t, y_train,
        eval_set=[(X_test_t, y_test)],
        callbacks=[early_stopping(100, verbose=False)]
    )
    train_time = time.time() - start
    
    # 9) Evaluate
    y_pred = model.predict(X_test_t)
    test_acc = accuracy_score(y_test, y_pred)
    
    print(f"Test Accuracy: {test_acc:.4f} ({test_acc*100:.2f}%)")
    print(f"Training time: {train_time:.2f}s")
    
    # 10) Cross-validation
    print(f"\n{'='*60}")
    print("CROSS-VALIDATION (5-FOLD)")
    print(f"{'='*60}\n")
    
    X_full = preprocessor.transform(X)
    y_full = y
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_scores = []
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(X_full, y_full), 1):
        X_fold_train, X_fold_val = X_full[train_idx], X_full[val_idx]
        y_fold_train, y_fold_val = y_full[train_idx], y_full[val_idx]
        
        # SMOTE per fold
        try:
            smote_fold = SMOTE(random_state=RANDOM_STATE, k_neighbors=min(5, MIN_SAMPLES_PER_CLASS-1))
            X_fold_train, y_fold_train = smote_fold.fit_resample(X_fold_train, y_fold_train)
        except:
            pass
        
        fold_model = lgb.LGBMClassifier(
            objective='multiclass',
            num_class=num_classes,
            n_estimators=2000,
            learning_rate=0.03,
            num_leaves=128,
            max_depth=8,
            min_child_samples=5,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=RANDOM_STATE,
            n_jobs=-1,
            verbosity=-1,
        )
        
        fold_model.fit(X_fold_train, y_fold_train)
        score = accuracy_score(y_fold_val, fold_model.predict(X_fold_val))
        cv_scores.append(score)
        print(f"Fold {fold}: {score:.4f}")
    
    mean_cv = np.mean(cv_scores)
    std_cv = np.std(cv_scores)
    
    print(f"\nMean CV Accuracy: {mean_cv:.4f} ({mean_cv*100:.2f}%)")
    print(f"Std: ±{std_cv:.4f}")
    
    # 11) Detailed evaluation
    print(f"\n{'='*60}")
    print("DETAILED EVALUATION")
    print(f"{'='*60}\n")
    
    report = classification_report(y_test, y_pred, target_names=le.classes_, zero_division=0)
    
    # Species-wise accuracy
    species_acc = {}
    for sp in species_test.unique():
        mask = species_test == sp
        if mask.sum() > 0:
            sp_acc = accuracy_score(y_test[mask], y_pred[mask])
            species_acc[sp] = sp_acc
            print(f"{sp}: {sp_acc:.4f} ({sp_acc*100:.2f}%)")
    
    # Save evaluation
    with open(OUTPUTS['evaluation'], 'w') as f:
        f.write("PAWPAL MODEL EVALUATION\n")
        f.write("="*60 + "\n\n")
        f.write(f"Test Accuracy: {test_acc:.4f}\n")
        f.write(f"CV Accuracy: {mean_cv:.4f} ± {std_cv:.4f}\n\n")
        f.write("Classification Report:\n")
        f.write(report)
        f.write("\n\nSpecies-wise Accuracy:\n")
        for sp, acc in species_acc.items():
            f.write(f"  {sp}: {acc:.4f}\n")
    
    # 12) Save artifacts
    print(f"\n{'='*60}")
    print("SAVING ARTIFACTS")
    print(f"{'='*60}\n")
    
    with open(OUTPUTS['model'], 'wb') as f:
        pickle.dump({
            'model': model,
            'preprocessor': preprocessor,
            'random_state': RANDOM_STATE,
        }, f)
    print(f"✓ Model: {OUTPUTS['model']}")
    
    with open(OUTPUTS['label_encoder'], 'wb') as f:
        pickle.dump(le, f)
    print(f"✓ Label encoder: {OUTPUTS['label_encoder']}")
    
    # Build metadata
    metadata = {}
    for disease in le.classes_:
        disease_rows = df[df['disease'] == disease]
        metadata[disease] = {
            'urgency': disease_rows['urgency'].mode()[0] if len(disease_rows) > 0 else 'moderate',
            'contagious': bool(disease_rows['contagious'].any()),
            'species': disease_rows['species'].unique().tolist(),
            'sample_symptoms': disease_rows['symptoms_text'].iloc[0] if len(disease_rows) > 0 else '',
        }
    
    with open(OUTPUTS['disease_metadata'], 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✓ Metadata: {OUTPUTS['disease_metadata']}")
    
    # 13) Final summary
    print(f"\n{'='*60}")
    print("🎯 FINAL RESULTS")
    print(f"{'='*60}")
    print(f"Dataset: {len(df)} samples, {num_classes} diseases")
    print(f"Species: {df['species'].nunique()}")
    print(f"\nPerformance:")
    print(f"  Test Accuracy:  {test_acc*100:.2f}%")
    print(f"  CV Accuracy:    {mean_cv*100:.2f}% ± {std_cv*100:.2f}%")
    print(f"\nTraining Time: {train_time:.2f}s")
    print(f"{'='*60}")
    
    if mean_cv >= 0.85:
        print("\n✅ EXCELLENT! 85%+ accuracy achieved!")
    elif mean_cv >= 0.75:
        print("\n✅ GOOD! 75%+ accuracy - solid baseline")
    else:
        print("\n⚠️  Below 75% - may need more data or feature engineering")
    
    print("\n✓ Training complete!")


if __name__ == "__main__":
    main()