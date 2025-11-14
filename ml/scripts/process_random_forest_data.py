"""
Process and Merge Random Forest CSV Datasets
Unifies 5 datasets into a single schema for Random Forest training.

Usage:
    python ml/scripts/process_random_forest_data.py
    python ml/scripts/process_random_forest_data.py --input-dir "ml/data/raw/Random Forest Datasets Text"
"""

import os
import sys
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Set
import argparse
from collections import defaultdict, Counter
import pandas as pd
import numpy as np

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

# Disease categorization mapping
DISEASE_CATEGORIES = {
    # Skin conditions
    'skin': ['dermatitis', 'hot_spots', 'mange', 'ringworm', 'fungal_infection', 'flea_allergy', 
             'skin_lesions', 'allergic_dermatitis', 'pyotraumatic', 'demodicosis', 'scabies'],
    
    # Digestive conditions
    'digestive': ['gastroenteritis', 'parvovirus', 'diarrhea', 'vomiting', 'constipation', 
                  'inflammatory_bowel', 'pancreatitis', 'gastric_ulcer', 'colitis'],
    
    # Respiratory conditions
    'respiratory': ['kennel_cough', 'pneumonia', 'upper_respiratory', 'bronchitis', 
                    'asthma', 'labored_breathing', 'nasal_discharge', 'sneezing'],
    
    # Ear conditions
    'ear': ['ear_infection', 'otitis', 'ear_mites', 'hematoma', 'ear_discharge'],
    
    # Eye conditions
    'eye': ['conjunctivitis', 'eye_infection', 'corneal_ulcer', 'eye_discharge', 'pink_eye'],
    
    # Dental conditions
    'dental': ['gingivitis', 'tartar', 'dental_disease', 'broken_tooth', 'tooth_abscess'],
    
    # Systemic/Other
    'systemic': ['fever', 'lethargy', 'seizures', 'diabetes', 'kidney_disease', 'liver_disease',
                 'heart_disease', 'cancer', 'infection', 'parasites', 'toxoplasmosis', 'brucellosis'],
    
    # Pregnancy-related
    'pregnancy': ['pyometra', 'pregnancy_complications', 'eclampsia'],
    
    # Mobility
    'mobility': ['lameness', 'arthritis', 'hip_dysplasia', 'mobility_problems']
}

# Symptom synonyms mapping
SYMPTOM_SYNONYMS = {
    'vomiting': ['vomit', 'throwing up', 'emesis', 'regurgitation'],
    'diarrhea': ['loose_stools', 'loose stools', 'runny_stool', 'runny stool'],
    'coughing': ['cough', 'hacking'],
    'labored_breathing': ['difficulty breathing', 'breathing problems', 'dyspnea', 'shortness of breath'],
    'appetite_loss': ['loss of appetite', 'anorexia', 'not eating', 'refusing food'],
    'lethargy': ['lethargic', 'tired', 'weak', 'low energy', 'depressed'],
    'lameness': ['limping', 'lameness', 'limb problems'],
    'skin_lesions': ['skin problems', 'rashes', 'sores', 'wounds'],
    'nasal_discharge': ['runny nose', 'nasal discharge', 'nose discharge'],
    'eye_discharge': ['watery eyes', 'eye discharge', 'tearing'],
    'ear_discharge': ['ear discharge', 'ear problems'],
    'excessive_scratching': ['scratching', 'itchy', 'pruritus'],
    'excessive_thirst': ['thirsty', 'drinking more', 'polydipsia'],
    'urination_changes': ['urination problems', 'frequent urination', 'difficulty urinating'],
    'seizures': ['seizure', 'convulsions', 'fits']
}


class RandomForestDataProcessor:
    """Process and merge multiple Random Forest datasets"""
    
    def __init__(self, input_dir: str = "ml/data/raw/Random Forest Datasets Text"):
        self.input_dir = Path(input_dir)
        self.output_dir = Path("ml/data/processed")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Statistics tracking
        self.stats = {
            "datasets": {},
            "total_before": 0,
            "total_after": 0,
            "disease_distribution": {},
            "category_distribution": {},
            "exotic_pet_count": 0,
            "digestive_count": 0,
            "missing_data": {}
        }
        
        # Unified schema template
        self.unified_schema = {
            'animal_type': str,
            'breed': str,
            'age': float,
            'weight': float,
            'gender': str,
            'vomiting': bool,
            'diarrhea': bool,
            'coughing': bool,
            'labored_breathing': bool,
            'appetite_loss': bool,
            'lethargy': bool,
            'lameness': bool,
            'skin_lesions': bool,
            'nasal_discharge': bool,
            'eye_discharge': bool,
            'ear_discharge': bool,
            'excessive_scratching': bool,
            'excessive_thirst': bool,
            'urination_changes': bool,
            'seizures': bool,
            'symptom_description': str,
            'body_temperature': float,
            'heart_rate': float,
            'symptom_duration_days': int,
            'is_pregnant': bool,
            'is_exotic_pet': bool,
            'disease': str,
            'disease_category': str
        }
    
    def normalize_disease_name(self, disease: str) -> str:
        """Normalize disease names to standard format"""
        if pd.isna(disease) or disease == '':
            return 'unknown'
        
        disease_lower = str(disease).lower().strip()
        
        # Common normalizations
        normalizations = {
            'parvo': 'parvovirus',
            'kennel cough': 'kennel_cough',
            'upper respiratory infection': 'upper_respiratory_infection',
            'uri': 'upper_respiratory_infection',
            'gi': 'gastroenteritis',
            'gastro': 'gastroenteritis',
            'hot spot': 'hot_spots',
            'hot spots': 'hot_spots',
            'ear infection': 'ear_infection',
            'otitis externa': 'ear_infection',
            'pink eye': 'conjunctivitis',
            'eye infection': 'conjunctivitis',
            'skin disease': 'skin_disease',
            'dermatitis': 'allergic_dermatitis',
            'mobility problems': 'mobility_problems',
            'digestive issues': 'digestive_issues'
        }
        
        # Check for exact match
        if disease_lower in normalizations:
            return normalizations[disease_lower]
        
        # Check for partial match
        for key, value in normalizations.items():
            if key in disease_lower:
                return value
        
        # Clean and standardize
        disease_clean = re.sub(r'[^\w\s]', '', disease_lower)
        disease_clean = re.sub(r'\s+', '_', disease_clean)
        
        return disease_clean
    
    def categorize_disease(self, disease: str) -> str:
        """Categorize disease by body system"""
        disease_norm = self.normalize_disease_name(disease)
        
        for category, keywords in DISEASE_CATEGORIES.items():
            for keyword in keywords:
                if keyword in disease_norm:
                    return category
        
        return 'systemic'  # Default category
    
    def extract_symptom_keywords(self, text: str) -> Set[str]:
        """Extract symptom keywords from text description"""
        if pd.isna(text) or text == '':
            return set()
        
        text_lower = str(text).lower()
        found_symptoms = set()
        
        # Check for each symptom and its synonyms
        for symptom, synonyms in SYMPTOM_SYNONYMS.items():
            if symptom in text_lower:
                found_symptoms.add(symptom)
            for synonym in synonyms:
                if synonym in text_lower:
                    found_symptoms.add(symptom)
                    break
        
        return found_symptoms
    
    def parse_temperature(self, temp_str: str) -> Optional[float]:
        """Parse temperature string to float"""
        if pd.isna(temp_str) or temp_str == '':
            return None
        
        temp_str = str(temp_str).strip()
        # Remove units and extract number
        temp_match = re.search(r'(\d+\.?\d*)', temp_str)
        if temp_match:
            temp = float(temp_match.group(1))
            # Convert to Celsius if in Fahrenheit range
            if temp > 50:  # Likely Fahrenheit
                temp = (temp - 32) * 5 / 9
            return temp
        return None
    
    def parse_duration(self, duration_str: str) -> Optional[int]:
        """Parse duration string to days"""
        if pd.isna(duration_str) or duration_str == '':
            return None
        
        duration_str = str(duration_str).lower().strip()
        
        # Extract number
        num_match = re.search(r'(\d+)', duration_str)
        if not num_match:
            return None
        
        num = int(num_match.group(1))
        
        # Convert to days
        if 'week' in duration_str or 'wk' in duration_str:
            return num * 7
        elif 'month' in duration_str or 'mo' in duration_str:
            return num * 30
        elif 'day' in duration_str or 'd' in duration_str:
            return num
        elif 'hour' in duration_str or 'hr' in duration_str:
            return max(1, num // 24)  # Round to at least 1 day
        else:
            return num  # Assume days
    
    def parse_boolean(self, value) -> bool:
        """Parse various boolean formats"""
        if pd.isna(value):
            return False
        
        if isinstance(value, bool):
            return value
        
        value_str = str(value).lower().strip()
        return value_str in ['yes', 'true', '1', 'y', 't']
    
    def load_dataset_1(self) -> pd.DataFrame:
        """Load animal_disease_prediction.csv"""
        file_path = self.input_dir / "cleaned_animal_disease_prediction.csv"
        
        if not file_path.exists():
            print(f"⚠️  Dataset 1 not found: {file_path}")
            return pd.DataFrame()
        
        print(f"📂 Loading Dataset 1: {file_path.name}")
        df = pd.read_csv(file_path)
        self.stats["datasets"]["dataset_1"] = {"before": len(df)}
        
        # Map to unified schema
        unified_data = []
        
        for _, row in df.iterrows():
            record = {
                'animal_type': str(row.get('Animal_Type', '')).strip() if pd.notna(row.get('Animal_Type')) else '',
                'breed': str(row.get('Breed', '')).strip() if pd.notna(row.get('Breed')) else '',
                'age': float(row.get('Age', 0)) if pd.notna(row.get('Age')) else None,
                'weight': float(row.get('Weight', 0)) if pd.notna(row.get('Weight')) else None,
                'gender': str(row.get('Gender', '')).strip() if pd.notna(row.get('Gender')) else '',
                
                # Boolean symptoms
                'vomiting': self.parse_boolean(row.get('Vomiting', False)),
                'diarrhea': self.parse_boolean(row.get('Diarrhea', False)),
                'coughing': self.parse_boolean(row.get('Coughing', False)),
                'labored_breathing': self.parse_boolean(row.get('Labored_Breathing', False)),
                'appetite_loss': self.parse_boolean(row.get('Appetite_Loss', False)),
                'lameness': self.parse_boolean(row.get('Lameness', False)),
                'skin_lesions': self.parse_boolean(row.get('Skin_Lesions', False)),
                'nasal_discharge': self.parse_boolean(row.get('Nasal_Discharge', False)),
                'eye_discharge': self.parse_boolean(row.get('Eye_Discharge', False)),
                
                # Extract lethargy from symptoms
                'lethargy': 'lethargy' in str(row.get('Symptom_1', '')).lower() or 
                           'lethargy' in str(row.get('Symptom_2', '')).lower() or
                           'lethargy' in str(row.get('Symptom_3', '')).lower() or
                           'lethargy' in str(row.get('Symptom_4', '')).lower(),
                
                # Other symptoms (set to False for now)
                'ear_discharge': False,
                'excessive_scratching': False,
                'excessive_thirst': False,
                'urination_changes': False,
                'seizures': False,
                
                # Symptom description
                'symptom_description': ' '.join([
                    str(row.get('Symptom_1', '')),
                    str(row.get('Symptom_2', '')),
                    str(row.get('Symptom_3', '')),
                    str(row.get('Symptom_4', ''))
                ]).strip(),
                
                # Vitals
                'body_temperature': self.parse_temperature(row.get('Body_Temperature', '')),
                'heart_rate': float(row.get('Heart_Rate', 0)) if pd.notna(row.get('Heart_Rate')) else None,
                
                # Duration
                'symptom_duration_days': self.parse_duration(row.get('Duration', '')),
                
                # Flags
                'is_pregnant': False,
                'is_exotic_pet': str(row.get('Animal_Type', '')).lower() not in ['dog', 'cat'],
                
                # Disease
                'disease': self.normalize_disease_name(row.get('Disease_Prediction', '')),
                'disease_category': ''
            }
            
            # Set disease category
            record['disease_category'] = self.categorize_disease(record['disease'])
            
            unified_data.append(record)
        
        result_df = pd.DataFrame(unified_data)
        self.stats["datasets"]["dataset_1"]["after"] = len(result_df)
        print(f"  ✅ Processed {len(result_df)} records")
        
        return result_df
    
    def load_dataset_2(self) -> pd.DataFrame:
        """Load pet-health-symptoms-dataset.csv"""
        file_path = self.input_dir / "pet-health-symptoms-dataset.csv"
        
        if not file_path.exists():
            print(f"⚠️  Dataset 2 not found: {file_path}")
            return pd.DataFrame()
        
        print(f"📂 Loading Dataset 2: {file_path.name}")
        df = pd.read_csv(file_path)
        self.stats["datasets"]["dataset_2"] = {"before": len(df)}
        
        unified_data = []
        
        for _, row in df.iterrows():
            text = str(row.get('text', '')).strip() if pd.notna(row.get('text')) else ''
            condition = str(row.get('condition', '')).strip() if pd.notna(row.get('condition')) else ''
            
            # Extract symptoms from text
            symptoms = self.extract_symptom_keywords(text)
            
            record = {
                'animal_type': '',  # Not specified
                'breed': '',
                'age': None,
                'weight': None,
                'gender': '',
                
                # Boolean symptoms from text extraction
                'vomiting': 'vomiting' in symptoms,
                'diarrhea': 'diarrhea' in symptoms,
                'coughing': 'coughing' in symptoms,
                'labored_breathing': 'labored_breathing' in symptoms,
                'appetite_loss': 'appetite_loss' in symptoms,
                'lethargy': 'lethargy' in symptoms,
                'lameness': 'lameness' in symptoms,
                'skin_lesions': 'skin_lesions' in symptoms,
                'nasal_discharge': 'nasal_discharge' in symptoms,
                'eye_discharge': 'eye_discharge' in symptoms,
                'ear_discharge': 'ear_discharge' in symptoms,
                'excessive_scratching': 'excessive_scratching' in symptoms,
                'excessive_thirst': 'excessive_thirst' in symptoms,
                'urination_changes': 'urination_changes' in symptoms,
                'seizures': 'seizures' in symptoms,
                
                # Symptom description
                'symptom_description': text,
                
                # Vitals
                'body_temperature': None,
                'heart_rate': None,
                
                # Duration
                'symptom_duration_days': None,
                
                # Flags
                'is_pregnant': False,
                'is_exotic_pet': False,  # Assume dogs/cats unless specified
                
                # Disease
                'disease': self.normalize_disease_name(condition),
                'disease_category': ''
            }
            
            record['disease_category'] = self.categorize_disease(record['disease'])
            
            unified_data.append(record)
        
        result_df = pd.DataFrame(unified_data)
        self.stats["datasets"]["dataset_2"]["after"] = len(result_df)
        print(f"  ✅ Processed {len(result_df)} records")
        
        return result_df
    
    def load_dataset_3(self) -> pd.DataFrame:
        """Load Animal_Vet.xlsx (pregnancy-related)"""
        file_path = self.input_dir / "Animal_Vet.xlsx"
        
        if not file_path.exists():
            print(f"⚠️  Dataset 3 not found: {file_path}")
            return pd.DataFrame()
        
        print(f"📂 Loading Dataset 3: {file_path.name}")
        
        try:
            df = pd.read_excel(file_path)
        except ImportError as e:
            print(f"  ⚠️  openpyxl not installed. Install with: pip install openpyxl")
            print(f"  ⚠️  Skipping Excel file...")
            return pd.DataFrame()
        except Exception as e:
            print(f"  ⚠️  Error reading Excel file: {e}")
            return pd.DataFrame()
        
        self.stats["datasets"]["dataset_3"] = {"before": len(df)}
        
        unified_data = []
        
        for _, row in df.iterrows():
            # Extract pregnancy status
            is_pregnant = False
            pregnancy_cols = [col for col in df.columns if 'pregnant' in str(col).lower() or 'pregnancy' in str(col).lower()]
            for col in pregnancy_cols:
                if self.parse_boolean(row.get(col, False)):
                    is_pregnant = True
                    break
            
            # Extract disease (look for disease/diagnosis columns)
            disease = 'unknown'
            disease_cols = [col for col in df.columns if 'disease' in str(col).lower() or 
                          'diagnosis' in str(col).lower() or 'condition' in str(col).lower()]
            for col in disease_cols:
                if pd.notna(row.get(col)) and str(row.get(col)).strip() != '':
                    disease = str(row.get(col)).strip()
                    break
            
            # Extract symptoms from all text columns
            symptom_text = ' '.join([
                str(row.get(col, '')) for col in df.columns 
                if pd.notna(row.get(col)) and isinstance(row.get(col), str)
            ])
            
            symptoms = self.extract_symptom_keywords(symptom_text)
            
            record = {
                'animal_type': str(row.get('Species', row.get('Animal_Type', ''))).strip() if pd.notna(row.get('Species', row.get('Animal_Type', ''))) else '',
                'breed': str(row.get('Breed', '')).strip() if pd.notna(row.get('Breed')) else '',
                'age': float(row.get('Age', 0)) if pd.notna(row.get('Age')) else None,
                'weight': float(row.get('Weight', 0)) if pd.notna(row.get('Weight')) else None,
                'gender': str(row.get('Gender', '')).strip() if pd.notna(row.get('Gender')) else '',
                
                # Boolean symptoms
                'vomiting': 'vomiting' in symptoms,
                'diarrhea': 'diarrhea' in symptoms,
                'coughing': 'coughing' in symptoms,
                'labored_breathing': 'labored_breathing' in symptoms,
                'appetite_loss': 'appetite_loss' in symptoms,
                'lethargy': 'lethargy' in symptoms,
                'lameness': 'lameness' in symptoms,
                'skin_lesions': 'skin_lesions' in symptoms,
                'nasal_discharge': 'nasal_discharge' in symptoms,
                'eye_discharge': 'eye_discharge' in symptoms,
                'ear_discharge': 'ear_discharge' in symptoms,
                'excessive_scratching': 'excessive_scratching' in symptoms,
                'excessive_thirst': 'excessive_thirst' in symptoms,
                'urination_changes': 'urination_changes' in symptoms,
                'seizures': 'seizures' in symptoms,
                
                # Symptom description
                'symptom_description': symptom_text,
                
                # Vitals
                'body_temperature': self.parse_temperature(row.get('Body_Temperature', row.get('Temperature', ''))),
                'heart_rate': float(row.get('Heart_Rate', 0)) if pd.notna(row.get('Heart_Rate')) else None,
                
                # Duration
                'symptom_duration_days': self.parse_duration(row.get('Duration', '')),
                
                # Flags
                'is_pregnant': is_pregnant,
                'is_exotic_pet': str(row.get('Species', row.get('Animal_Type', ''))).lower() not in ['dog', 'cat'],
                
                # Disease
                'disease': self.normalize_disease_name(disease),
                'disease_category': ''
            }
            
            record['disease_category'] = self.categorize_disease(record['disease'])
            
            unified_data.append(record)
        
        result_df = pd.DataFrame(unified_data)
        self.stats["datasets"]["dataset_3"]["after"] = len(result_df)
        print(f"  ✅ Processed {len(result_df)} records")
        
        return result_df
    
    def load_dataset_4(self) -> pd.DataFrame:
        """Load veterinary_clinical_data.csv"""
        file_path = self.input_dir / "veterinary_clinical_data.csv"
        
        if not file_path.exists():
            print(f"⚠️  Dataset 4 not found: {file_path}")
            return pd.DataFrame()
        
        print(f"📂 Loading Dataset 4: {file_path.name}")
        df = pd.read_csv(file_path)
        self.stats["datasets"]["dataset_4"] = {"before": len(df)}
        
        unified_data = []
        
        for _, row in df.iterrows():
            # Extract symptom text
            symptom_text = ''
            symptom_cols = [col for col in df.columns if 'symptom' in str(col).lower()]
            symptom_text = ' '.join([
                str(row.get(col, '')) for col in symptom_cols 
                if pd.notna(row.get(col))
            ])
            
            symptoms = self.extract_symptom_keywords(symptom_text)
            
            # Extract disease
            disease = 'unknown'
            disease_cols = [col for col in df.columns if 'disease' in str(col).lower() or 
                          'diagnosis' in str(col).lower()]
            for col in disease_cols:
                if pd.notna(row.get(col)) and str(row.get(col)).strip() != '':
                    disease = str(row.get(col)).strip()
                    break
            
            record = {
                'animal_type': str(row.get('species', row.get('Species', ''))).strip() if pd.notna(row.get('species', row.get('Species', ''))) else '',
                'breed': str(row.get('breed', row.get('Breed', ''))).strip() if pd.notna(row.get('breed', row.get('Breed', ''))) else '',
                'age': float(row.get('age', row.get('Age', 0))) if pd.notna(row.get('age', row.get('Age', 0))) else None,
                'weight': float(row.get('weight', row.get('Weight', 0))) if pd.notna(row.get('weight', row.get('Weight', 0))) else None,
                'gender': str(row.get('gender', row.get('Gender', ''))).strip() if pd.notna(row.get('gender', row.get('Gender', ''))) else '',
                
                # Boolean symptoms
                'vomiting': 'vomiting' in symptoms,
                'diarrhea': 'diarrhea' in symptoms,
                'coughing': 'coughing' in symptoms,
                'labored_breathing': 'labored_breathing' in symptoms,
                'appetite_loss': 'appetite_loss' in symptoms,
                'lethargy': 'lethargy' in symptoms,
                'lameness': 'lameness' in symptoms,
                'skin_lesions': 'skin_lesions' in symptoms,
                'nasal_discharge': 'nasal_discharge' in symptoms,
                'eye_discharge': 'eye_discharge' in symptoms,
                'ear_discharge': 'ear_discharge' in symptoms,
                'excessive_scratching': 'excessive_scratching' in symptoms,
                'excessive_thirst': 'excessive_thirst' in symptoms,
                'urination_changes': 'urination_changes' in symptoms,
                'seizures': 'seizures' in symptoms,
                
                # Symptom description
                'symptom_description': symptom_text,
                
                # Vitals
                'body_temperature': self.parse_temperature(row.get('body_temperature', row.get('Body_Temperature', ''))),
                'heart_rate': float(row.get('heart_rate', row.get('Heart_Rate', 0))) if pd.notna(row.get('heart_rate', row.get('Heart_Rate', 0))) else None,
                
                # Duration
                'symptom_duration_days': self.parse_duration(row.get('duration', row.get('Duration', ''))),
                
                # Flags
                'is_pregnant': False,
                'is_exotic_pet': str(row.get('species', row.get('Species', ''))).lower() not in ['dog', 'cat'],
                
                # Disease
                'disease': self.normalize_disease_name(disease),
                'disease_category': ''
            }
            
            record['disease_category'] = self.categorize_disease(record['disease'])
            
            unified_data.append(record)
        
        result_df = pd.DataFrame(unified_data)
        self.stats["datasets"]["dataset_4"]["after"] = len(result_df)
        print(f"  ✅ Processed {len(result_df)} records")
        
        return result_df
    
    def load_dataset_5(self) -> pd.DataFrame:
        """Load veterinary_data.csv"""
        file_path = self.input_dir / "veterinary_data.csv"
        
        if not file_path.exists():
            print(f"⚠️  Dataset 5 not found: {file_path}")
            return pd.DataFrame()
        
        print(f"📂 Loading Dataset 5: {file_path.name}")
        df = pd.read_csv(file_path)
        self.stats["datasets"]["dataset_5"] = {"before": len(df)}
        
        unified_data = []
        
        for _, row in df.iterrows():
            # Extract symptom text
            symptom_text = ''
            symptom_cols = [col for col in df.columns if 'symptom' in str(col).lower()]
            symptom_text = ' '.join([
                str(row.get(col, '')) for col in symptom_cols 
                if pd.notna(row.get(col))
            ])
            
            symptoms = self.extract_symptom_keywords(symptom_text)
            
            # Extract disease
            disease = 'unknown'
            disease_cols = [col for col in df.columns if 'disease' in str(col).lower() or 
                          'diagnosis' in str(col).lower() or 'classification' in str(col).lower()]
            for col in disease_cols:
                if pd.notna(row.get(col)) and str(row.get(col)).strip() != '':
                    disease = str(row.get(col)).strip()
                    break
            
            record = {
                'animal_type': str(row.get('species', row.get('Species', row.get('Animal_Type', '')))).strip() if pd.notna(row.get('species', row.get('Species', row.get('Animal_Type', '')))) else '',
                'breed': str(row.get('breed', row.get('Breed', ''))).strip() if pd.notna(row.get('breed', row.get('Breed', ''))) else '',
                'age': float(row.get('age', row.get('Age', 0))) if pd.notna(row.get('age', row.get('Age', 0))) else None,
                'weight': float(row.get('weight', row.get('Weight', 0))) if pd.notna(row.get('weight', row.get('Weight', 0))) else None,
                'gender': str(row.get('gender', row.get('Gender', ''))).strip() if pd.notna(row.get('gender', row.get('Gender', ''))) else '',
                
                # Boolean symptoms
                'vomiting': 'vomiting' in symptoms,
                'diarrhea': 'diarrhea' in symptoms,
                'coughing': 'coughing' in symptoms,
                'labored_breathing': 'labored_breathing' in symptoms,
                'appetite_loss': 'appetite_loss' in symptoms,
                'lethargy': 'lethargy' in symptoms,
                'lameness': 'lameness' in symptoms,
                'skin_lesions': 'skin_lesions' in symptoms,
                'nasal_discharge': 'nasal_discharge' in symptoms,
                'eye_discharge': 'eye_discharge' in symptoms,
                'ear_discharge': 'ear_discharge' in symptoms,
                'excessive_scratching': 'excessive_scratching' in symptoms,
                'excessive_thirst': 'excessive_thirst' in symptoms,
                'urination_changes': 'urination_changes' in symptoms,
                'seizures': 'seizures' in symptoms,
                
                # Symptom description
                'symptom_description': symptom_text,
                
                # Vitals
                'body_temperature': self.parse_temperature(row.get('body_temperature', row.get('Body_Temperature', row.get('Temperature', '')))),
                'heart_rate': float(row.get('heart_rate', row.get('Heart_Rate', 0))) if pd.notna(row.get('heart_rate', row.get('Heart_Rate', 0))) else None,
                
                # Duration
                'symptom_duration_days': self.parse_duration(row.get('duration', row.get('Duration', ''))),
                
                # Flags
                'is_pregnant': False,
                'is_exotic_pet': str(row.get('species', row.get('Species', row.get('Animal_Type', '')))).lower() not in ['dog', 'cat'],
                
                # Disease
                'disease': self.normalize_disease_name(disease),
                'disease_category': ''
            }
            
            record['disease_category'] = self.categorize_disease(record['disease'])
            
            unified_data.append(record)
        
        result_df = pd.DataFrame(unified_data)
        self.stats["datasets"]["dataset_5"]["after"] = len(result_df)
        print(f"  ✅ Processed {len(result_df)} records")
        
        return result_df
    
    def clean_and_merge(self, dataframes: List[pd.DataFrame]) -> pd.DataFrame:
        """Clean and merge all dataframes"""
        print(f"\n🔄 Merging {len(dataframes)} datasets...")
        
        # Combine all dataframes
        combined_df = pd.concat(dataframes, ignore_index=True)
        self.stats["total_before"] = len(combined_df)
        
        print(f"  Total records before cleaning: {len(combined_df)}")
        
        # Remove duplicates based on key fields
        print("  Removing duplicates...")
        before_dedup = len(combined_df)
        combined_df = combined_df.drop_duplicates(
            subset=['animal_type', 'symptom_description', 'disease'],
            keep='first'
        )
        print(f"  Removed {before_dedup - len(combined_df)} duplicates")
        
        # Handle missing values
        print("  Handling missing values...")
        
        # Fill missing boolean symptoms with False
        bool_cols = ['vomiting', 'diarrhea', 'coughing', 'labored_breathing', 'appetite_loss',
                    'lethargy', 'lameness', 'skin_lesions', 'nasal_discharge', 'eye_discharge',
                    'ear_discharge', 'excessive_scratching', 'excessive_thirst', 
                    'urination_changes', 'seizures', 'is_pregnant', 'is_exotic_pet']
        for col in bool_cols:
            combined_df[col] = combined_df[col].fillna(False).astype(bool)
        
        # Fill missing strings with empty string
        str_cols = ['animal_type', 'breed', 'gender', 'symptom_description', 'disease', 'disease_category']
        for col in str_cols:
            combined_df[col] = combined_df[col].fillna('').astype(str)
        
        # Standardize animal_type
        combined_df['animal_type'] = combined_df['animal_type'].str.lower().str.strip()
        combined_df['animal_type'] = combined_df['animal_type'].replace({
            'canine': 'dog',
            'feline': 'cat',
            'canis': 'dog',
            'felis': 'cat'
        })
        
        # Update is_exotic_pet flag
        combined_df['is_exotic_pet'] = ~combined_df['animal_type'].isin(['dog', 'cat', ''])
        
        # Remove records with no disease
        print("  Removing records with no disease...")
        before_no_disease = len(combined_df)
        combined_df = combined_df[combined_df['disease'] != 'unknown']
        combined_df = combined_df[combined_df['disease'] != '']
        print(f"  Removed {before_no_disease - len(combined_df)} records with no disease")
        
        # Remove records with no symptoms
        print("  Removing records with no symptoms...")
        before_no_symptoms = len(combined_df)
        symptom_cols = ['vomiting', 'diarrhea', 'coughing', 'labored_breathing', 'appetite_loss',
                       'lethargy', 'lameness', 'skin_lesions', 'nasal_discharge', 'eye_discharge',
                       'ear_discharge', 'excessive_scratching', 'excessive_thirst', 
                       'urination_changes', 'seizures']
        has_symptoms = combined_df[symptom_cols].any(axis=1) | (combined_df['symptom_description'].str.len() > 0)
        combined_df = combined_df[has_symptoms]
        print(f"  Removed {before_no_symptoms - len(combined_df)} records with no symptoms")
        
        self.stats["total_after"] = len(combined_df)
        print(f"  ✅ Final dataset size: {len(combined_df)} records")
        
        return combined_df
    
    def generate_statistics(self, df: pd.DataFrame):
        """Generate comprehensive statistics"""
        print(f"\n📊 Generating statistics...")
        
        # Disease distribution
        self.stats["disease_distribution"] = df['disease'].value_counts().to_dict()
        
        # Category distribution
        self.stats["category_distribution"] = df['disease_category'].value_counts().to_dict()
        
        # Exotic pet count
        self.stats["exotic_pet_count"] = int(df['is_exotic_pet'].sum())
        
        # Digestive disease count
        self.stats["digestive_count"] = int((df['disease_category'] == 'digestive').sum())
        
        # Missing data statistics
        self.stats["missing_data"] = {}
        for col in df.columns:
            missing_count = df[col].isna().sum()
            if missing_count > 0:
                self.stats["missing_data"][col] = {
                    "missing": int(missing_count),
                    "percentage": float(missing_count / len(df) * 100)
                }
        
        # Symptom co-occurrence
        symptom_cols = ['vomiting', 'diarrhea', 'coughing', 'labored_breathing', 'appetite_loss',
                        'lethargy', 'lameness', 'skin_lesions', 'nasal_discharge', 'eye_discharge',
                        'ear_discharge', 'excessive_scratching', 'excessive_thirst', 
                        'urination_changes', 'seizures']
        
        symptom_cooccurrence = {}
        for i, sym1 in enumerate(symptom_cols):
            for sym2 in symptom_cols[i+1:]:
                cooccur_count = int(((df[sym1] == True) & (df[sym2] == True)).sum())
                if cooccur_count > 0:
                    key = f"{sym1} + {sym2}"
                    symptom_cooccurrence[key] = cooccur_count
        
        self.stats["symptom_cooccurrence"] = symptom_cooccurrence
    
    def save_outputs(self, df: pd.DataFrame):
        """Save all output files"""
        print(f"\n💾 Saving output files...")
        
        # 1. Unified dataset
        output_path = self.output_dir / "random_forest_unified.csv"
        df.to_csv(output_path, index=False)
        print(f"  ✅ Saved unified dataset: {output_path} ({len(df)} records)")
        
        # 2. Exotic pets subset
        exotic_df = df[df['is_exotic_pet'] == True].copy()
        if len(exotic_df) > 0:
            output_path = self.output_dir / "rf_exotic_pets.csv"
            exotic_df.to_csv(output_path, index=False)
            print(f"  ✅ Saved exotic pets subset: {output_path} ({len(exotic_df)} records)")
        
        # 3. Digestive diseases subset
        digestive_df = df[df['disease_category'] == 'digestive'].copy()
        if len(digestive_df) > 0:
            output_path = self.output_dir / "rf_digestive.csv"
            digestive_df.to_csv(output_path, index=False)
            print(f"  ✅ Saved digestive diseases subset: {output_path} ({len(digestive_df)} records)")
        
        # 4. Disease mapping
        disease_mapping = {}
        for disease in df['disease'].unique():
            if disease:
                category = df[df['disease'] == disease]['disease_category'].iloc[0]
                # Determine severity (simple heuristic)
                severity = 'moderate'
                if 'parvo' in disease.lower() or 'seizure' in disease.lower():
                    severity = 'severe'
                elif 'mild' in disease.lower() or 'minor' in disease.lower():
                    severity = 'mild'
                
                disease_mapping[disease] = {
                    "category": category,
                    "severity": severity,
                    "count": int((df['disease'] == disease).sum())
                }
        
        output_path = self.output_dir / "disease_mapping.json"
        with open(output_path, 'w') as f:
            json.dump(disease_mapping, f, indent=2)
        print(f"  ✅ Saved disease mapping: {output_path}")
        
        # 5. Symptom vocabulary
        symptom_vocab = {
            "symptoms": list(SYMPTOM_SYNONYMS.keys()),
            "synonyms": SYMPTOM_SYNONYMS,
            "all_unique_symptoms": []
        }
        
        # Extract all unique symptoms from descriptions
        all_symptoms = set()
        for desc in df['symptom_description'].dropna():
            symptoms = self.extract_symptom_keywords(desc)
            all_symptoms.update(symptoms)
        
        symptom_vocab["all_unique_symptoms"] = sorted(list(all_symptoms))
        
        output_path = self.output_dir / "symptom_vocabulary.json"
        with open(output_path, 'w') as f:
            json.dump(symptom_vocab, f, indent=2)
        print(f"  ✅ Saved symptom vocabulary: {output_path}")
    
    def print_report(self):
        """Print comprehensive statistics report"""
        print(f"\n{'='*60}")
        print("📊 PROCESSING REPORT")
        print(f"{'='*60}\n")
        
        # Dataset statistics
        print("DATASET STATISTICS:")
        print("-" * 60)
        for dataset_name, stats in self.stats["datasets"].items():
            before = stats.get("before", 0)
            after = stats.get("after", 0)
            print(f"  {dataset_name:20s} | Before: {before:5d} | After: {after:5d}")
        
        print(f"\n  {'Total':20s} | Before: {self.stats['total_before']:5d} | After: {self.stats['total_after']:5d}")
        
        # Disease distribution
        print(f"\nTOP 15 DISEASES:")
        print("-" * 60)
        top_diseases = sorted(self.stats["disease_distribution"].items(), key=lambda x: x[1], reverse=True)[:15]
        for disease, count in top_diseases:
            print(f"  {disease:30s} | {count:5d}")
        
        # Category distribution
        print(f"\nDISEASE CATEGORY DISTRIBUTION:")
        print("-" * 60)
        for category, count in sorted(self.stats["category_distribution"].items(), key=lambda x: x[1], reverse=True):
            print(f"  {category:20s} | {count:5d}")
        
        # Special subsets
        print(f"\nSPECIAL SUBSETS:")
        print("-" * 60)
        print(f"  Exotic pets:        {self.stats['exotic_pet_count']:5d}")
        print(f"  Digestive diseases: {self.stats['digestive_count']:5d}")
        
        # Missing data
        if self.stats["missing_data"]:
            print(f"\nMISSING DATA (Top 10):")
            print("-" * 60)
            sorted_missing = sorted(self.stats["missing_data"].items(), 
                                  key=lambda x: x[1]["percentage"], reverse=True)[:10]
            for col, stats in sorted_missing:
                print(f"  {col:25s} | {stats['missing']:5d} ({stats['percentage']:.1f}%)")
        
        # Symptom co-occurrence (top 10)
        if self.stats.get("symptom_cooccurrence"):
            print(f"\nTOP 10 SYMPTOM CO-OCCURRENCES:")
            print("-" * 60)
            top_cooccur = sorted(self.stats["symptom_cooccurrence"].items(), 
                               key=lambda x: x[1], reverse=True)[:10]
            for pair, count in top_cooccur:
                print(f"  {pair:40s} | {count:5d}")
        
        print(f"\n{'='*60}")
        print(f"✅ Processing complete!")
        print(f"   Final dataset ready for Random Forest training: {self.stats['total_after']} records")
        print(f"{'='*60}\n")
    
    def process_all(self):
        """Process all datasets"""
        print("🚀 Starting Random Forest Data Processing")
        print(f"   Input directory: {self.input_dir}")
        print(f"   Output directory: {self.output_dir}")
        print(f"{'='*60}\n")
        
        # Load all datasets
        datasets = [
            self.load_dataset_1(),
            self.load_dataset_2(),
            self.load_dataset_3(),
            self.load_dataset_4(),
            self.load_dataset_5()
        ]
        
        # Filter out empty dataframes
        datasets = [df for df in datasets if not df.empty]
        
        if not datasets:
            print("❌ No datasets loaded successfully!")
            return
        
        # Merge and clean
        unified_df = self.clean_and_merge(datasets)
        
        # Generate statistics
        self.generate_statistics(unified_df)
        
        # Save outputs
        self.save_outputs(unified_df)
        
        # Print report
        self.print_report()


def main():
    parser = argparse.ArgumentParser(
        description="Process and merge Random Forest CSV datasets",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--input-dir", type=str, 
                       default="ml/data/raw/Random Forest Datasets Text",
                       help="Input directory containing datasets")
    parser.add_argument("--output-dir", type=str,
                       default="ml/data/processed",
                       help="Output directory for processed files")
    
    args = parser.parse_args()
    
    processor = RandomForestDataProcessor(input_dir=args.input_dir)
    processor.output_dir = Path(args.output_dir)
    processor.output_dir.mkdir(parents=True, exist_ok=True)
    
    processor.process_all()


if __name__ == "__main__":
    main()

