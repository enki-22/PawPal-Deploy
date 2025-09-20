import argparse
from pathlib import Path
import os
import json
import joblib
import pandas as pd
from decouple import config
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer


def load_dataset(input_dir: Path) -> pd.DataFrame:
    # Heuristic: read all CSVs and concat, keep columns: symptoms(text), label/diagnosis, species
    csv_files = list(input_dir.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {input_dir}")
    frames = []
    for f in csv_files:
        try:
            df = pd.read_csv(f)
            frames.append(df)
        except Exception:
            continue
    data = pd.concat(frames, ignore_index=True)

    # Normalize column names commonly seen
    rename_map = {
        'text': 'symptoms',  # This dataset uses 'text' for symptoms
        'Symptom': 'symptoms', 'Symptoms': 'symptoms', 'symptom': 'symptoms', 'symptoms_list': 'symptoms',
        'condition': 'label',  # This dataset uses 'condition' for diagnosis
        'Diagnosis': 'label', 'diagnosis': 'label', 'disease': 'label', 'Disease': 'label',
        'Species': 'species', 'Animal': 'species', 'animal_type': 'species', 'pet_type': 'species'
    }
    data = data.rename(columns=rename_map)

    if 'symptoms' not in data.columns or 'label' not in data.columns:
        raise ValueError("Dataset must contain 'symptoms' and 'label' columns (case-insensitive supported)")

    # Keep only relevant columns
    keep_cols = ['symptoms', 'label']
    if 'species' in data.columns:
        keep_cols.append('species')
    if 'record_type' in data.columns:
        keep_cols.append('record_type')
    data = data[keep_cols].dropna()

    # Filter to dogs/cats if species column exists
    if 'species' in data.columns:
        data['species'] = data['species'].str.lower().str.strip()
        data = data[data['species'].isin(['dog', 'cat'])]

    return data


def main() -> None:
    parser = argparse.ArgumentParser(description="Train RandomForest on symptom datasets")
    parser.add_argument("--input", default=None, help="Input directory containing CSVs")
    parser.add_argument("--output", default=None, help="Output directory for model")
    parser.add_argument("--model", default="symptom_rf.joblib", help="Model filename")
    parser.add_argument("--species", default="dog,cat", help="Species to include (comma-separated)")
    args = parser.parse_args()

    input_dir = Path(args.input or config('ML_DATA_DIR', default=str(Path(__file__).resolve().parent / 'data')))
    output_dir = Path(args.output or config('ML_MODELS_DIR', default=str(Path(__file__).resolve().parent / 'models')))
    output_dir.mkdir(parents=True, exist_ok=True)

    data = load_dataset(input_dir)

    # Filter species list if column exists
    species_set = set(s.strip().lower() for s in args.species.split(',') if s.strip())
    if 'species' in data.columns:
        data = data[data['species'].isin(species_set)]

    print(f"Loaded {len(data)} records")
    print(f"Label distribution:\n{data['label'].value_counts()}")
    if 'record_type' in data.columns:
        print(f"Record type distribution:\n{data['record_type'].value_counts()}")

    # Split
    X = data.drop(columns=['label'])
    y = data['label']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Preprocess: TF-IDF for text, OneHot for categorical features
    text_features = ['symptoms']
    transformers = []
    transformers.append(('text', TfidfVectorizer(ngram_range=(1,2), min_df=2), 'symptoms'))
    
    # Add categorical features if they exist
    categorical_features = []
    if 'species' in X.columns:
        categorical_features.append('species')
    if 'record_type' in X.columns:
        categorical_features.append('record_type')
    
    if categorical_features:
        transformers.append(('categorical', OneHotEncoder(handle_unknown='ignore'), categorical_features))

    preprocessor = ColumnTransformer(transformers=transformers, remainder='drop', verbose_feature_names_out=False)

    model = RandomForestClassifier(n_estimators=300, random_state=42, class_weight='balanced')
    pipeline = Pipeline([
        ('features', preprocessor),
        ('clf', model)
    ])

    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    
    try:
        report = classification_report(y_test, y_pred, zero_division=0)
        print(report)
        with open(output_dir / 'last_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
    except Exception:
        pass

    model_path = output_dir / args.model
    joblib.dump(pipeline, model_path)
    print(f"Saved model to {model_path}")


if __name__ == "__main__":
    main()
