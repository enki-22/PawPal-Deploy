"""
Ensemble Image Classifier Training Script
Trains EfficientNet-B0 and MobileNetV3-Large, then combines them into an ensemble.

Usage:
    python ml/train_image_classifier.py
    python ml/train_image_classifier.py --data-dir ml/data/raw
"""

import os
import sys
import json
import io
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import argparse
from collections import defaultdict
import numpy as np
import pandas as pd
from tqdm import tqdm
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# Fix Windows encoding
if sys.platform == 'win32':
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# TensorFlow imports
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetB0, MobileNetV3Large
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint, CSVLogger
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, balanced_accuracy_score
from sklearn.utils.class_weight import compute_class_weight
from PIL import Image
import warnings
warnings.filterwarnings('ignore')

# Suppress TensorFlow warnings
tf.get_logger().setLevel('ERROR')
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))


# Training configuration
TRAINING_CONFIG = {
    'image_size': (224, 224),
    'batch_size': 32,
    'epochs': 40,
    'early_stopping_patience': 7,
    'learning_rate': 0.001,
    'optimizer': 'adam',
    'loss': 'categorical_crossentropy',
}

# 28 Classes as defined by user
CLASSES = [
    # SKIN_CONDITIONS (7)
    'healthy_skin',
    'allergic_dermatitis',
    'hot_spots',
    'mange',
    'fungal_infection',
    'flea_allergy',
    'wound_laceration',
    
    # EYE_CONDITIONS (4)
    'healthy_eyes',
    'conjunctivitis',
    'eye_discharge',
    'corneal_ulcer',
    
    # EAR_CONDITIONS (4)
    'healthy_ears',
    'ear_infection',
    'ear_mites',
    'hematoma',
    
    # DENTAL_CONDITIONS (4)
    'healthy_teeth',
    'tartar_buildup',
    'gingivitis',
    'broken_tooth',
    
    # RESPIRATORY_CONDITIONS (3)
    'healthy_respiratory',
    'nasal_discharge',
    'labored_breathing',
    
    # GASTROINTESTINAL_CONDITIONS (3)
    'healthy_digestive',
    'vomiting_posture',
    'diarrhea_signs',
    
    # GENERAL (2)
    'healthy_normal',
    'uncertain_other',
]

# Low-confidence classes (require >80% confidence threshold)
LOW_CONFIDENCE_CLASSES = {
    'labored_breathing': 12,  # Original count
    'diarrhea_signs': 12,
    'broken_tooth': 25,
    'healthy_respiratory': 28,
    'healthy_teeth': 33,
    'ear_mites': 34,
}

# Dataset folder mappings (for combined datasets)
DATASET_MAPPINGS = {
    # Cat_Skin_Disease dataset
    'Flea Allergy': 'flea_allergy',
    'Health': 'healthy_skin',
    'Ringworm': 'fungal_infection',
    'Scabies': 'mange',
    
    # Dog_Disease_four_categs
    'Bacterial_dermatosis': 'allergic_dermatitis',
    'Fungal_infections': 'fungal_infection',
    'Healthy': 'healthy_skin',
    'Hypersensitivity_allergic_dermatosis': 'allergic_dermatitis',
    
    # Dog_Skin_Diseases_and_Healthy
    'demodicosis': 'mange',
    'Dermatitis': 'allergic_dermatitis',
    'Fungal_infections': 'fungal_infection',
    'Healthy': 'healthy_skin',
    'Hypersensitivity': 'allergic_dermatitis',
    'ringworm': 'fungal_infection',
}


class EnsembleImageClassifierTrainer:
    """Train ensemble of EfficientNet-B0 and MobileNetV3-Large"""
    
    def __init__(self, data_dir: str = "ml/data/raw"):
        self.data_dir = Path(data_dir)
        self.models_dir = Path("ml/models")
        self.reports_dir = Path("ml/reports")
        self.models_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        self.classes = CLASSES
        self.num_classes = len(self.classes)
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        self.idx_to_class = {idx: cls for cls, idx in self.class_to_idx.items()}
        
        # Low-confidence class thresholds
        self.confidence_thresholds = {}
        for cls in self.classes:
            if cls in LOW_CONFIDENCE_CLASSES:
                self.confidence_thresholds[cls] = 0.80
            else:
                self.confidence_thresholds[cls] = 0.70
        
        # Training data
        self.train_data = None
        self.val_data = None
        self.test_data = None
        self.class_weights = None
        
        # Models
        self.efficientnet_model = None
        self.mobilenet_model = None
        
        # Training history
        self.efficientnet_history = None
        self.mobilenet_history = None
        
        # Statistics
        self.stats = {
            "dataset_size": {},
            "class_distribution": {},
            "training_time": {},
            "model_performance": {}
        }
    
    def map_folder_to_class(self, folder_name: str) -> Optional[str]:
        """Map folder/dataset name to unified class name"""
        folder_lower = folder_name.lower().strip()
        
        # Direct mapping
        if folder_lower in self.class_to_idx:
            return folder_lower
        
        # Dataset mappings
        if folder_name in DATASET_MAPPINGS:
            return DATASET_MAPPINGS[folder_name]
        
        # Fuzzy matching
        mappings = {
            'ear infection': 'ear_infection',
            'ear_infection': 'ear_infection',
            'vomiting': 'vomiting_posture',
            'vomiting_posture': 'vomiting_posture',
            'hot spot': 'hot_spots',
            'hot_spots': 'hot_spots',
            'hotspot': 'hot_spots',
            'conjunctivitis': 'conjunctivitis',
            'eye discharge': 'eye_discharge',
            'eye_discharge': 'eye_discharge',
            'nasal discharge': 'nasal_discharge',
            'nasal_discharge': 'nasal_discharge',
            'tartar': 'tartar_buildup',
            'tartar_buildup': 'tartar_buildup',
            'gingivitis': 'gingivitis',
            'broken tooth': 'broken_tooth',
            'broken_tooth': 'broken_tooth',
            'ear mites': 'ear_mites',
            'ear_mites': 'ear_mites',
            'hematoma': 'hematoma',
            'wound': 'wound_laceration',
            'wound_laceration': 'wound_laceration',
            'laceration': 'wound_laceration',
            'diarrhea': 'diarrhea_signs',
            'diarrhea_signs': 'diarrhea_signs',
            'labored breathing': 'labored_breathing',
            'labored_breathing': 'labored_breathing',
            'healthy': 'healthy_normal',
            'healthy_normal': 'healthy_normal',
            'normal': 'healthy_normal',
            'healthy skin': 'healthy_skin',
            'healthy_skin': 'healthy_skin',
            'healthy eyes': 'healthy_eyes',
            'healthy_eyes': 'healthy_eyes',
            'healthy ears': 'healthy_ears',
            'healthy_ears': 'healthy_ears',
            'healthy teeth': 'healthy_teeth',
            'healthy_teeth': 'healthy_teeth',
            'healthy respiratory': 'healthy_respiratory',
            'healthy_respiratory': 'healthy_respiratory',
            'healthy digestive': 'healthy_digestive',
            'healthy_digestive': 'healthy_digestive',
        }
        
        for key, value in mappings.items():
            if key in folder_lower:
                return value
        
        return None
    
    def load_images_from_directory(self, class_dir: Path, class_name: str) -> List[Tuple[str, int]]:
        """Load images from a directory"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        images = []
        
        if not class_dir.exists():
            return images
        
        # Get all image files
        for ext in image_extensions:
            images.extend(class_dir.glob(f"*{ext}"))
            images.extend(class_dir.glob(f"*{ext.upper()}"))
        
        return [(str(img), self.class_to_idx[class_name]) for img in images]
    
    def collect_all_images(self) -> Tuple[List[str], List[int]]:
        """Collect all images from data directory"""
        print("📂 Collecting images from data directory...")
        
        image_paths = []
        labels = []
        class_counts = defaultdict(int)
        
        # Process individual class folders
        for class_name in self.classes:
            class_dir = self.data_dir / class_name
            if class_dir.exists() and class_dir.is_dir():
                images = self.load_images_from_directory(class_dir, class_name)
                image_paths.extend([img[0] for img in images])
                labels.extend([img[1] for img in images])
                class_counts[class_name] = len(images)
                if len(images) > 0:
                    print(f"  ✅ {class_name:25s}: {len(images):4d} images")
        
        # Process combined datasets
        combined_datasets = [
            ('Cat_Skin_Disease', ['train', 'valid', 'test']),
            ('Dog_Disease_four_categs', [None]),  # Root level
            ('Dog_Skin_Diseases_and_Healthy', ['train', 'valid', 'test']),
        ]
        
        for dataset_name, subdirs in combined_datasets:
            dataset_dir = self.data_dir / dataset_name
            if not dataset_dir.exists():
                continue
            
            print(f"\n  Processing combined dataset: {dataset_name}")
            
            if subdirs == [None]:
                # Root level folders
                for subfolder in dataset_dir.iterdir():
                    if subfolder.is_dir():
                        mapped_class = self.map_folder_to_class(subfolder.name)
                        if mapped_class and mapped_class in self.class_to_idx:
                            images = self.load_images_from_directory(subfolder, mapped_class)
                            image_paths.extend([img[0] for img in images])
                            labels.extend([img[1] for img in images])
                            class_counts[mapped_class] += len(images)
                            print(f"    {subfolder.name:30s} → {mapped_class:25s}: {len(images):4d} images")
            else:
                # Has train/valid/test subdirectories
                for subdir in subdirs:
                    subdir_path = dataset_dir / subdir if subdir else dataset_dir
                    if not subdir_path.exists():
                        continue
                    
                    for class_folder in subdir_path.iterdir():
                        if class_folder.is_dir():
                            mapped_class = self.map_folder_to_class(class_folder.name)
                            if mapped_class and mapped_class in self.class_to_idx:
                                images = self.load_images_from_directory(class_folder, mapped_class)
                                image_paths.extend([img[0] for img in images])
                                labels.extend([img[1] for img in images])
                                class_counts[mapped_class] += len(images)
        
        print(f"\n📊 Total images collected: {len(image_paths)}")
        print(f"   Classes with images: {len([c for c, count in class_counts.items() if count > 0])}")
        
        # Store class distribution
        self.stats["class_distribution"] = dict(class_counts)
        
        # Update classes to only include those with data (maintain order from CLASSES)
        classes_with_data = [cls for cls in self.classes if class_counts.get(cls, 0) > 0]
        if len(classes_with_data) != len(self.classes):
            print(f"\n⚠️  Warning: Only {len(classes_with_data)} out of {len(self.classes)} classes have data")
            print(f"   Updating model to use only classes with data...")
            
            # Create mapping from old indices to new indices
            old_class_to_idx = self.class_to_idx.copy()
            self.classes = classes_with_data
            self.num_classes = len(self.classes)
            self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
            self.idx_to_class = {idx: cls for cls, idx in self.class_to_idx.items()}
            
            # Remap labels to new indices
            label_remap = {old_idx: self.class_to_idx[cls] 
                          for cls, old_idx in old_class_to_idx.items() 
                          if cls in self.class_to_idx}
            labels = [label_remap[label] for label in labels]
            
            print(f"   Updated to {self.num_classes} classes")
        
        return image_paths, labels
    
    def create_data_generators(self, image_paths: List[str], labels: List[int], 
                               subset: str = 'training') -> ImageDataGenerator:
        """Create data generators with augmentation"""
        if subset == 'training':
            datagen = ImageDataGenerator(
                rotation_range=10,
                width_shift_range=0.1,
                height_shift_range=0.1,
                horizontal_flip=True,
                zoom_range=0.1,
                fill_mode='nearest',
                rescale=1./255
            )
        else:
            datagen = ImageDataGenerator(rescale=1./255)
        
        return datagen
    
    def create_efficientnet_model(self) -> Model:
        """Create EfficientNet-B0 model"""
        print("\n🏗️  Creating EfficientNet-B0 model...")
        
        # Base model
        base_model = EfficientNetB0(
            weights='imagenet',
            include_top=False,
            input_shape=(*TRAINING_CONFIG['image_size'], 3)
        )
        
        # Freeze first 80% of layers
        num_layers = len(base_model.layers)
        freeze_until = int(num_layers * 0.8)
        for layer in base_model.layers[:freeze_until]:
            layer.trainable = False
        
        # Custom head
        inputs = keras.Input(shape=(*TRAINING_CONFIG['image_size'], 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(512, activation='relu')(x)
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        model = Model(inputs, outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=TRAINING_CONFIG['learning_rate']),
            loss=TRAINING_CONFIG['loss'],
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=5, name='top_5_accuracy')]
        )
        
        print(f"  ✅ Created EfficientNet-B0 with {model.count_params():,} parameters")
        return model
    
    def create_mobilenet_model(self) -> Model:
        """Create MobileNetV3-Large model"""
        print("\n🏗️  Creating MobileNetV3-Large model...")
        
        # Base model
        base_model = MobileNetV3Large(
            weights='imagenet',
            include_top=False,
            input_shape=(*TRAINING_CONFIG['image_size'], 3)
        )
        
        # Freeze first 80% of layers
        num_layers = len(base_model.layers)
        freeze_until = int(num_layers * 0.8)
        for layer in base_model.layers[:freeze_until]:
            layer.trainable = False
        
        # Custom head
        inputs = keras.Input(shape=(*TRAINING_CONFIG['image_size'], 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.3)(x)
        x = layers.Dense(512, activation='relu')(x)
        x = layers.Dropout(0.3)(x)
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        model = Model(inputs, outputs)
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=TRAINING_CONFIG['learning_rate']),
            loss=TRAINING_CONFIG['loss'],
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=5, name='top_5_accuracy')]
        )
        
        print(f"  ✅ Created MobileNetV3-Large with {model.count_params():,} parameters")
        return model
    
    def prepare_dataset(self, image_paths: List[str], labels: List[int]) -> Tuple:
        """Prepare dataset with stratified split"""
        print("\n📊 Preparing dataset...")
        
        # Convert to numpy arrays
        X = np.array(image_paths)
        y = np.array(labels)
        
        # Stratified split: 70% train, 15% val, 15% test
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
        )
        
        print(f"  Train: {len(X_train)} images")
        print(f"  Validation: {len(X_val)} images")
        print(f"  Test: {len(X_test)} images")
        
        # Calculate class weights
        unique_classes = np.unique(y_train)
        class_weights_array = compute_class_weight(
            'balanced',
            classes=unique_classes,
            y=y_train
        )
        self.class_weights = dict(zip(unique_classes, class_weights_array))
        
        print(f"\n  Class weights calculated (to handle imbalance)")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def create_image_dataframe(self, image_paths: List[str], labels: List[int]) -> pd.DataFrame:
        """Create DataFrame for ImageDataGenerator"""
        df = pd.DataFrame({
            'filename': image_paths,
            'class': [self.idx_to_class[label] for label in labels]
        })
        return df
    
    def train_model(self, model: Model, model_name: str, 
                   train_df: pd.DataFrame, val_df: pd.DataFrame,
                   class_weights: Dict) -> keras.callbacks.History:
        """Train a single model"""
        print(f"\n🚀 Training {model_name}...")
        
        # Create data generators
        train_datagen = self.create_data_generators([], [], subset='training')
        val_datagen = self.create_data_generators([], [], subset='validation')
        
        train_generator = train_datagen.flow_from_dataframe(
            train_df,
            x_col='filename',
            y_col='class',
            target_size=TRAINING_CONFIG['image_size'],
            batch_size=TRAINING_CONFIG['batch_size'],
            class_mode='categorical',
            classes=self.classes,  # Ensure consistent class ordering
            shuffle=True
        )
        
        val_generator = val_datagen.flow_from_dataframe(
            val_df,
            x_col='filename',
            y_col='class',
            target_size=TRAINING_CONFIG['image_size'],
            batch_size=TRAINING_CONFIG['batch_size'],
            class_mode='categorical',
            classes=self.classes,  # Ensure consistent class ordering
            shuffle=False
        )
        
        # Callbacks
        callbacks = [
            EarlyStopping(
                monitor='val_loss',
                patience=TRAINING_CONFIG['early_stopping_patience'],
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1
            ),
            ModelCheckpoint(
                filepath=str(self.models_dir / f"{model_name}_best.h5"),
                monitor='val_loss',
                save_best_only=True,
                verbose=1
            ),
            CSVLogger(
                filename=str(self.reports_dir / f"{model_name}_training.log"),
                append=False
            )
        ]
        
        # Train model
        history = model.fit(
            train_generator,
            epochs=TRAINING_CONFIG['epochs'],
            validation_data=val_generator,
            class_weight=class_weights,
            callbacks=callbacks,
            verbose=1
        )
        
        return history
    
    def evaluate_model(self, model: Model, test_df: pd.DataFrame, model_name: str) -> Dict:
        """Evaluate model and return metrics"""
        print(f"\n📊 Evaluating {model_name}...")
        
        test_datagen = ImageDataGenerator(rescale=1./255)
        test_generator = test_datagen.flow_from_dataframe(
            test_df,
            x_col='filename',
            y_col='class',
            target_size=TRAINING_CONFIG['image_size'],
            batch_size=TRAINING_CONFIG['batch_size'],
            class_mode='categorical',
            classes=self.classes,  # Ensure consistent class ordering
            shuffle=False
        )
        
        # Predictions
        predictions = model.predict(test_generator, verbose=1)
        y_pred = np.argmax(predictions, axis=1)
        y_true = test_generator.classes
        
        # Metrics
        accuracy = np.mean(y_pred == y_true)
        balanced_acc = balanced_accuracy_score(y_true, y_pred)
        
        # Top-5 accuracy
        top5_correct = 0
        for i, true_label in enumerate(y_true):
            top5_preds = np.argsort(predictions[i])[-5:][::-1]
            if true_label in top5_preds:
                top5_correct += 1
        top5_accuracy = top5_correct / len(y_true)
        
        # Per-class metrics
        class_names = [self.idx_to_class[i] for i in range(self.num_classes)]
        report = classification_report(
            y_true, y_pred,
            target_names=class_names,
            output_dict=True,
            zero_division=0
        )
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        
        metrics = {
            'accuracy': accuracy,
            'balanced_accuracy': balanced_acc,
            'top5_accuracy': top5_accuracy,
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
            'predictions': predictions.tolist(),
            'y_true': y_true.tolist(),
            'y_pred': y_pred.tolist()
        }
        
        return metrics
    
    def create_ensemble_predictor(self) -> Dict:
        """Create ensemble configuration"""
        print("\n🔗 Creating ensemble configuration...")
        
        ensemble_config = {
            'models': ['efficientnet_b0_final', 'mobilenetv3_final'],
            'weights': [0.6, 0.4],  # EfficientNet 60%, MobileNet 40%
            'confidence_thresholds': self.confidence_thresholds,
            'low_confidence_classes': list(LOW_CONFIDENCE_CLASSES.keys()),
            'classes': self.classes,
            'class_to_idx': self.class_to_idx,
            'idx_to_class': self.idx_to_class,
            'created_at': datetime.now().isoformat()
        }
        
        return ensemble_config
    
    def save_models_and_configs(self, ensemble_config: Dict):
        """Save models and configuration files"""
        print("\n💾 Saving models and configurations...")
        
        # Save EfficientNet model
        if self.efficientnet_model:
            efficientnet_path = self.models_dir / "efficientnet_b0_final.h5"
            self.efficientnet_model.save(str(efficientnet_path))
            print(f"  ✅ Saved: {efficientnet_path}")
        
        # Save MobileNet model
        if self.mobilenet_model:
            mobilenet_path = self.models_dir / "mobilenetv3_final.h5"
            self.mobilenet_model.save(str(mobilenet_path))
            print(f"  ✅ Saved: {mobilenet_path}")
        
        # Save ensemble config
        ensemble_config_path = self.models_dir / "ensemble_config.json"
        with open(ensemble_config_path, 'w') as f:
            json.dump(ensemble_config, f, indent=2)
        print(f"  ✅ Saved: {ensemble_config_path}")
        
        # Save low-confidence classes
        low_conf_path = self.models_dir / "low_confidence_classes.json"
        low_conf_data = {
            'classes': list(LOW_CONFIDENCE_CLASSES.keys()),
            'original_counts': LOW_CONFIDENCE_CLASSES,
            'confidence_threshold': 0.80,
            'standard_threshold': 0.70
        }
        with open(low_conf_path, 'w') as f:
            json.dump(low_conf_data, f, indent=2)
        print(f"  ✅ Saved: {low_conf_path}")
    
    def generate_reports(self, efficientnet_metrics: Dict, mobilenet_metrics: Dict):
        """Generate comprehensive reports"""
        print("\n📊 Generating reports...")
        
        # HTML Report
        self.generate_html_report(efficientnet_metrics, mobilenet_metrics)
        
        # Confusion Matrix
        self.plot_confusion_matrix(efficientnet_metrics, mobilenet_metrics)
        
        # Per-class Performance CSV
        self.save_per_class_performance(efficientnet_metrics, mobilenet_metrics)
        
        # Training History Plots
        self.plot_training_history()
    
    def generate_html_report(self, efficientnet_metrics: Dict, mobilenet_metrics: Dict):
        """Generate HTML training report"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Image Classifier Training Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        h1, h2 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #4CAF50; color: white; }}
        .metric {{ font-size: 1.2em; margin: 10px 0; }}
        .good {{ color: green; }}
        .warning {{ color: orange; }}
        .bad {{ color: red; }}
    </style>
</head>
<body>
    <h1>🐾 Image Classifier Training Report</h1>
    <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
    
    <h2>Overall Performance</h2>
    <table>
        <tr>
            <th>Model</th>
            <th>Accuracy</th>
            <th>Balanced Accuracy</th>
            <th>Top-5 Accuracy</th>
        </tr>
        <tr>
            <td>EfficientNet-B0</td>
            <td>{efficientnet_metrics['accuracy']:.2%}</td>
            <td>{efficientnet_metrics['balanced_accuracy']:.2%}</td>
            <td>{efficientnet_metrics['top5_accuracy']:.2%}</td>
        </tr>
        <tr>
            <td>MobileNetV3-Large</td>
            <td>{mobilenet_metrics['accuracy']:.2%}</td>
            <td>{mobilenet_metrics['balanced_accuracy']:.2%}</td>
            <td>{mobilenet_metrics['top5_accuracy']:.2%}</td>
        </tr>
    </table>
    
    <h2>Class Distribution</h2>
    <table>
        <tr>
            <th>Class</th>
            <th>Training Images</th>
            <th>Confidence Threshold</th>
        </tr>
"""
        
        for class_name, count in sorted(self.stats["class_distribution"].items(), key=lambda x: x[1], reverse=True):
            threshold = self.confidence_thresholds.get(class_name, 0.70)
            low_conf = "⚠️ LOW" if class_name in LOW_CONFIDENCE_CLASSES else ""
            html_content += f"""
        <tr>
            <td>{class_name}</td>
            <td>{count}</td>
            <td>{threshold:.0%} {low_conf}</td>
        </tr>
"""
        
        html_content += """
    </table>
    
    <h2>Per-Class Performance (EfficientNet-B0)</h2>
    <table>
        <tr>
            <th>Class</th>
            <th>Precision</th>
            <th>Recall</th>
            <th>F1-Score</th>
            <th>Support</th>
        </tr>
"""
        
        report = efficientnet_metrics['classification_report']
        for class_name in self.classes:
            if class_name in report:
                metrics = report[class_name]
                html_content += f"""
        <tr>
            <td>{class_name}</td>
            <td>{metrics.get('precision', 0):.3f}</td>
            <td>{metrics.get('recall', 0):.3f}</td>
            <td>{metrics.get('f1-score', 0):.3f}</td>
            <td>{int(metrics.get('support', 0))}</td>
        </tr>
"""
        
        html_content += """
    </table>
</body>
</html>
"""
        
        report_path = self.reports_dir / "training_report.html"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"  ✅ Saved: {report_path}")
    
    def plot_confusion_matrix(self, efficientnet_metrics: Dict, mobilenet_metrics: Dict):
        """Plot confusion matrices"""
        fig, axes = plt.subplots(1, 2, figsize=(20, 8))
        
        # EfficientNet confusion matrix
        cm_eff = np.array(efficientnet_metrics['confusion_matrix'])
        sns.heatmap(cm_eff, annot=True, fmt='d', cmap='Blues', ax=axes[0],
                   xticklabels=self.classes, yticklabels=self.classes)
        axes[0].set_title('EfficientNet-B0 Confusion Matrix')
        axes[0].set_xlabel('Predicted')
        axes[0].set_ylabel('Actual')
        plt.setp(axes[0].get_xticklabels(), rotation=45, ha='right')
        plt.setp(axes[0].get_yticklabels(), rotation=0)
        
        # MobileNet confusion matrix
        cm_mob = np.array(mobilenet_metrics['confusion_matrix'])
        sns.heatmap(cm_mob, annot=True, fmt='d', cmap='Greens', ax=axes[1],
                   xticklabels=self.classes, yticklabels=self.classes)
        axes[1].set_title('MobileNetV3-Large Confusion Matrix')
        axes[1].set_xlabel('Predicted')
        axes[1].set_ylabel('Actual')
        plt.setp(axes[1].get_xticklabels(), rotation=45, ha='right')
        plt.setp(axes[1].get_yticklabels(), rotation=0)
        
        plt.tight_layout()
        cm_path = self.reports_dir / "confusion_matrix.png"
        plt.savefig(cm_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"  ✅ Saved: {cm_path}")
    
    def plot_training_history(self):
        """Plot training history for both models"""
        if not self.efficientnet_history or not self.mobilenet_history:
            return
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        
        # EfficientNet accuracy
        axes[0, 0].plot(self.efficientnet_history.history['accuracy'], label='Train')
        axes[0, 0].plot(self.efficientnet_history.history['val_accuracy'], label='Val')
        axes[0, 0].set_title('EfficientNet-B0 Accuracy')
        axes[0, 0].set_xlabel('Epoch')
        axes[0, 0].set_ylabel('Accuracy')
        axes[0, 0].legend()
        axes[0, 0].grid(True)
        
        # EfficientNet loss
        axes[0, 1].plot(self.efficientnet_history.history['loss'], label='Train')
        axes[0, 1].plot(self.efficientnet_history.history['val_loss'], label='Val')
        axes[0, 1].set_title('EfficientNet-B0 Loss')
        axes[0, 1].set_xlabel('Epoch')
        axes[0, 1].set_ylabel('Loss')
        axes[0, 1].legend()
        axes[0, 1].grid(True)
        
        # MobileNet accuracy
        axes[1, 0].plot(self.mobilenet_history.history['accuracy'], label='Train')
        axes[1, 0].plot(self.mobilenet_history.history['val_accuracy'], label='Val')
        axes[1, 0].set_title('MobileNetV3-Large Accuracy')
        axes[1, 0].set_xlabel('Epoch')
        axes[1, 0].set_ylabel('Accuracy')
        axes[1, 0].legend()
        axes[1, 0].grid(True)
        
        # MobileNet loss
        axes[1, 1].plot(self.mobilenet_history.history['loss'], label='Train')
        axes[1, 1].plot(self.mobilenet_history.history['val_loss'], label='Val')
        axes[1, 1].set_title('MobileNetV3-Large Loss')
        axes[1, 1].set_xlabel('Epoch')
        axes[1, 1].set_ylabel('Loss')
        axes[1, 1].legend()
        axes[1, 1].grid(True)
        
        plt.tight_layout()
        history_path = self.reports_dir / "training_history.png"
        plt.savefig(history_path, dpi=150, bbox_inches='tight')
        plt.close()
        print(f"  ✅ Saved: {history_path}")
    
    def save_per_class_performance(self, efficientnet_metrics: Dict, mobilenet_metrics: Dict):
        """Save per-class performance to CSV"""
        rows = []
        
        for class_name in self.classes:
            eff_report = efficientnet_metrics['classification_report'].get(class_name, {})
            mob_report = mobilenet_metrics['classification_report'].get(class_name, {})
            
            rows.append({
                'class': class_name,
                'efficientnet_precision': eff_report.get('precision', 0),
                'efficientnet_recall': eff_report.get('recall', 0),
                'efficientnet_f1': eff_report.get('f1-score', 0),
                'mobilenet_precision': mob_report.get('precision', 0),
                'mobilenet_recall': mob_report.get('recall', 0),
                'mobilenet_f1': mob_report.get('f1-score', 0),
                'support': int(eff_report.get('support', 0)),
                'confidence_threshold': self.confidence_thresholds.get(class_name, 0.70),
                'is_low_confidence': class_name in LOW_CONFIDENCE_CLASSES
            })
        
        df = pd.DataFrame(rows)
        csv_path = self.reports_dir / "per_class_performance.csv"
        df.to_csv(csv_path, index=False)
        print(f"  ✅ Saved: {csv_path}")
    
    def train_all(self):
        """Train both models and create ensemble"""
        print("🚀 Starting Ensemble Image Classifier Training")
        print(f"{'='*60}\n")
        
        # Collect images
        image_paths, labels = self.collect_all_images()
        
        if len(image_paths) == 0:
            print("❌ No images found! Please check your data directory.")
            return
        
        # Prepare dataset
        X_train, X_val, X_test, y_train, y_val, y_test = self.prepare_dataset(image_paths, labels)
        
        # Create dataframes
        train_df = self.create_image_dataframe(X_train, y_train)
        val_df = self.create_image_dataframe(X_val, y_val)
        test_df = self.create_image_dataframe(X_test, y_test)
        
        # Train EfficientNet-B0
        self.efficientnet_model = self.create_efficientnet_model()
        self.efficientnet_history = self.train_model(
            self.efficientnet_model, 'efficientnet_b0',
            train_df, val_df, self.class_weights
        )
        
        # Train MobileNetV3-Large
        self.mobilenet_model = self.create_mobilenet_model()
        self.mobilenet_history = self.train_model(
            self.mobilenet_model, 'mobilenetv3',
            train_df, val_df, self.class_weights
        )
        
        # Evaluate both models
        efficientnet_metrics = self.evaluate_model(self.efficientnet_model, test_df, 'EfficientNet-B0')
        mobilenet_metrics = self.evaluate_model(self.mobilenet_model, test_df, 'MobileNetV3-Large')
        
        # Create ensemble config
        ensemble_config = self.create_ensemble_predictor()
        
        # Save models and configs
        self.save_models_and_configs(ensemble_config)
        
        # Generate reports
        self.generate_reports(efficientnet_metrics, mobilenet_metrics)
        
        # Print summary
        print(f"\n{'='*60}")
        print("✅ TRAINING COMPLETE!")
        print(f"{'='*60}")
        print(f"\n📊 Performance Summary:")
        print(f"  EfficientNet-B0 Accuracy: {efficientnet_metrics['accuracy']:.2%}")
        print(f"  MobileNetV3-Large Accuracy: {mobilenet_metrics['accuracy']:.2%}")
        print(f"\n💾 Models saved to: ml/models/")
        print(f"📊 Reports saved to: ml/reports/")


def main():
    parser = argparse.ArgumentParser(
        description="Train ensemble image classifier (EfficientNet-B0 + MobileNetV3-Large)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--data-dir", type=str, default="ml/data/raw",
                       help="Directory containing image class folders")
    
    args = parser.parse_args()
    
    trainer = EnsembleImageClassifierTrainer(data_dir=args.data_dir)
    trainer.train_all()


if __name__ == "__main__":
    main()