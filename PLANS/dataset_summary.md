# Pet Disease Classification Dataset - Summary

## Overview
A machine learning dataset for pet disease classification covering common household pets in the Philippines.

## Dataset Specifications

### File Information
- **Filename**: `pet_disease_dataset.csv`
- **Total Rows**: 1,568 samples
- **Unique Diseases**: 101 diseases
- **Samples per Disease**: 14 (1 real + 13 synthetic)
- **Format**: CSV with UTF-8 encoding

### CSV Structure
```csv
species,disease,symptoms,urgency,contagious,source
```

**Column Descriptions:**
- `species`: Pet type (dog, cat, rabbit, hamster, bird, turtle, fish)
- `disease`: Name of the illness
- `symptoms`: Natural language description (1-2 sentences, owner-friendly)
- `urgency`: Severity level (mild, moderate, severe)
- `contagious`: Whether disease spreads easily (yes, no)
- `source`: Data origin (real from dataset.md, synthetic generated)

## Species Coverage

| Species | Diseases | Samples | Percentage |
|---------|----------|---------|------------|
| Bird    | 22       | 308     | 19.6%      |
| Cat     | 24       | 336     | 21.4%      |
| Dog     | 13       | 182     | 11.6%      |
| Fish    | 12       | 168     | 10.7%      |
| Hamster | 9        | 126     | 8.0%       |
| Rabbit  | 19       | 266     | 17.0%      |
| Turtle  | 13       | 182     | 11.6%      |
| **Total** | **112** | **1,568** | **100%** |

## Disease Urgency Distribution

| Urgency  | Samples | Percentage |
|----------|---------|------------|
| Mild     | 378     | 24.1%      |
| Moderate | 686     | 43.8%      |
| Severe   | 504     | 32.1%      |

## Contagious Status

| Status | Samples | Percentage |
|--------|---------|------------|
| Yes    | 546     | 34.8%      |
| No     | 1,022   | 65.2%      |

## Sample Data Examples

### Dog Examples
```
My dog has coughing and watery eyes.
My dog seems lethargic with vomiting and diarrhea.
My dog keeps scratching constantly, red irritated skin.
```

### Cat Examples
```
My cat is sneezing a lot with watery eyes.
My cat has blood in urine, also frequent urination.
My cat won't stop scratching and has red swollen gums.
```

### Rabbit Examples
```
My rabbit has nasal discharge and is sneezing.
My rabbit won't hop and its feet look infected.
My rabbit hasn't pooped in a day and won't eat.
```

### Bird Examples
```
My bird has difficulty breathing with wheezing sounds.
My bird is vomiting and losing weight.
My bird shows drooping wing and can't fly.
```

### Fish Examples
```
My fish has white spots all over its body and fins.
My fish is swimming upside down and can't stay balanced.
My fish keeps rubbing against objects.
```

## Key Features

### Natural Language Symptoms
- Owner-friendly descriptions (no medical jargon)
- Varied sentence structures for diversity
- 1-3 symptoms per description
- Realistic and contextually accurate

### ML-Ready Format
- Clean CSV structure
- Balanced class distribution
- Categorical labels for classification
- Text suitable for NLP/embeddings

### Comprehensive Coverage
- All common Philippine household pets
- Major diseases per species
- Visible/owner-noticeable symptoms only
- Real symptom basis with synthetic augmentation

## Usage Recommendations

### Model Training
**Suitable for:**
- Random Forest classifier
- LightGBM/XGBoost
- Neural networks with text embeddings
- Multi-class/multi-label classification

### Preprocessing Suggestions
1. Text vectorization (TF-IDF, Word2Vec, or BERT embeddings)
2. Species one-hot encoding
3. Urgency/contagious encoding
4. Train-test split: 80-20 or 70-30

### Feature Engineering Ideas
- Symptom count per description
- Keyword extraction (coughing, vomiting, etc.)
- Species-specific feature importance
- Urgency prediction as auxiliary task

## Data Quality Notes

### Strengths
✓ Comprehensive coverage of 7 species
✓ 14 samples per disease for balanced learning
✓ Natural, varied language descriptions
✓ Grounded in real symptom data
✓ Ready for immediate ML use

### Considerations
- Synthetic samples based on symptom pools
- Language is owner-perspective only
- Some technical terms retained for accuracy
- Varies in symptom specificity by disease

## Generation Details

**Source Data**: `dataset.md` (curated disease information)
**Generator Script**: `final_dataset_generator.py`
**Generation Date**: 2024
**Method**: Rule-based natural language generation with symptom extraction

## Files Included

1. `pet_disease_dataset.csv` - Main dataset
2. `final_dataset_generator.py` - Generation script
3. `dataset.md` - Source disease information
4. `dataset_summary.md` - This documentation

## Next Steps for ML Training

1. **Load and explore the data**
   ```python
   import pandas as pd
   df = pd.read_csv('pet_disease_dataset.csv')
   df.info()
   df['disease'].value_counts()
   ```

2. **Text preprocessing**
   - Tokenization
   - Lowercasing
   - Stopword removal (optional)
   - Vectorization (TF-IDF or embeddings)

3. **Train classifier**
   - Split data (train/validation/test)
   - Train model (Random Forest, LightGBM, etc.)
   - Evaluate with accuracy, F1-score, confusion matrix
   - Test on real user inputs

4. **Deploy**
   - Save model
   - Create prediction API
   - Integrate with PawPal application

## License & Attribution

Dataset created for PawPal project - pet health diagnosis system for Philippine households.

---

**Ready for Machine Learning Training** ✓
