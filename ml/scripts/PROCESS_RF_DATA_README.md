# Random Forest Data Processing Script

## Overview

This script processes and merges 5 Random Forest CSV/XLSX datasets into a unified schema for training.

## Datasets Processed

1. **cleaned_animal_disease_prediction.csv** - Animal disease prediction with symptoms
2. **pet-health-symptoms-dataset.csv** - Pet health symptoms with text descriptions
3. **Animal_Vet.xlsx** - Veterinary data with pregnancy-related information
4. **veterinary_clinical_data.csv** - Clinical veterinary records
5. **veterinary_data.csv** - Veterinary data analysis

## Usage

```bash
# Basic usage (default paths)
python ml/scripts/process_random_forest_data.py

# Custom input/output directories
python ml/scripts/process_random_forest_data.py --input-dir "path/to/datasets" --output-dir "path/to/output"
```

## Dependencies

Required packages (should already be installed):
- pandas
- numpy
- openpyxl (for Excel file reading)

If openpyxl is missing:
```bash
pip install openpyxl
```

## Output Files

The script generates 5 output files in `ml/data/processed/`:

1. **random_forest_unified.csv** - Main unified dataset (~12,000-15,000 records)
2. **rf_exotic_pets.csv** - Subset for exotic pets (rabbits, birds, etc.)
3. **rf_digestive.csv** - Subset for digestive-related diseases
4. **disease_mapping.json** - Disease name → category → severity mapping
5. **symptom_vocabulary.json** - All symptoms and synonyms

## Unified Schema

The unified schema includes:
- **Demographics**: animal_type, breed, age, weight, gender
- **15 Boolean Symptoms**: vomiting, diarrhea, coughing, labored_breathing, etc.
- **Text**: symptom_description (for NLP processing)
- **Vitals**: body_temperature, heart_rate
- **Duration**: symptom_duration_days
- **Flags**: is_pregnant, is_exotic_pet
- **Target**: disease, disease_category

## Disease Categories

Diseases are automatically categorized into:
- **skin**: Dermatitis, hot spots, mange, ringworm, etc.
- **digestive**: Gastroenteritis, parvovirus, diarrhea, etc.
- **respiratory**: Kennel cough, pneumonia, URI, etc.
- **ear**: Ear infections, otitis, ear mites, etc.
- **eye**: Conjunctivitis, eye infections, etc.
- **dental**: Gingivitis, tartar, dental disease, etc.
- **systemic**: Fever, seizures, diabetes, etc.
- **pregnancy**: Pyometra, pregnancy complications
- **mobility**: Lameness, arthritis, hip dysplasia

## Statistics Report

The script generates a comprehensive report showing:
- Records per dataset (before/after)
- Top 15 diseases
- Disease category distribution
- Exotic pet count
- Digestive disease count
- Missing data statistics
- Symptom co-occurrence patterns

## Notes

- The script automatically handles missing values
- Duplicates are removed based on animal_type + symptom_description + disease
- Records with no disease or symptoms are filtered out
- Animal types are standardized (canine→dog, feline→cat)
- Temperature units are normalized to Celsius
- Duration strings are converted to days






