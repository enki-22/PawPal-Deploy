import os
import numpy as np
import pandas as pd
from PIL import Image
import requests
from io import BytesIO
import joblib
import cv2
from pathlib import Path
import tensorflow as tf
import tensorflow_hub as hub
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import EfficientNetB0, MobileNetV3Small
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import warnings
warnings.filterwarnings('ignore')

# Suppress TensorFlow warnings
tf.get_logger().setLevel('ERROR')


class AdvancedPetSymptomImageClassifier:
    """Advanced image classifier using EfficientNet-B0 and MobileNetV3 for pet symptoms"""
    
    def __init__(self, model_type='efficientnet'):
        """
        Initialize the classifier
        
        Args:
            model_type: 'efficientnet' or 'mobilenet' - which base model to use
        """
        self.model_type = model_type
        self.model = None
        self.classes = ['skin_irritation', 'eye_problem', 'ear_infection', 'dental_issue', 'normal']
        self.input_size = (224, 224)  # Standard size for both models
        self.num_classes = len(self.classes)
        
    def create_model(self):
        """Create the neural network model"""
        if self.model_type == 'efficientnet':
            # EfficientNet-B0: Lightweight but accurate
            base_model = EfficientNetB0(
                weights='imagenet',
                include_top=False,
                input_shape=(*self.input_size, 3)
            )
        else:
            # MobileNetV3-Small: Ultra-lightweight for mobile deployment
            base_model = MobileNetV3Small(
                weights='imagenet',
                include_top=False,
                input_shape=(*self.input_size, 3)
            )
        
        # Freeze base model layers initially
        base_model.trainable = False
        
        # Add custom classification head
        inputs = tf.keras.Input(shape=(*self.input_size, 3))
        x = base_model(inputs, training=False)
        x = layers.GlobalAveragePooling2D()(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(128, activation='relu')(x)
        x = layers.Dropout(0.2)(x)
        outputs = layers.Dense(self.num_classes, activation='softmax')(x)
        
        self.model = Model(inputs, outputs)
        
        # Compile model
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        print(f"Created {self.model_type.upper()} model with {self.model.count_params():,} parameters")
        return self.model
    
    def preprocess_image(self, image_path):
        """Preprocess image for model input"""
        try:
            # Load image
            if image_path.startswith('http'):
                response = requests.get(image_path)
                image = Image.open(BytesIO(response.content))
            else:
                image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size
            image = image.resize(self.input_size)
            
            # Convert to numpy array and normalize
            image_array = np.array(image) / 255.0
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
            
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            # Return a blank image if preprocessing fails
            return np.zeros((1, *self.input_size, 3))
    
    def create_synthetic_dataset(self, num_samples_per_class=50):
        """Create synthetic training data for demonstration"""
        print("Creating synthetic dataset for training...")
        
        # Create directories for synthetic data
        data_dir = Path("ml/data/synthetic_images")
        data_dir.mkdir(parents=True, exist_ok=True)
        
        for class_name in self.classes:
            class_dir = data_dir / class_name
            class_dir.mkdir(exist_ok=True)
        
        # Generate synthetic images (in real implementation, you'd use real pet images)
        X_train = []
        y_train = []
        
        for i, class_name in enumerate(self.classes):
            for j in range(num_samples_per_class):
                # Create synthetic image data
                # In production, replace this with real pet symptom images
                synthetic_image = self._generate_synthetic_image(class_name, i)
                X_train.append(synthetic_image)
                y_train.append(i)
        
        X_train = np.array(X_train)
        y_train = np.array(y_train)
        
        # Convert to categorical
        y_train_categorical = tf.keras.utils.to_categorical(y_train, self.num_classes)
        
        return X_train, y_train_categorical
    
    def _generate_synthetic_image(self, class_name, class_index):
        """Generate synthetic image data for training"""
        # Create base image with class-specific characteristics
        base_image = np.random.rand(*self.input_size, 3)
        
        # Add class-specific patterns
        if class_name == 'skin_irritation':
            # Add red patches
            base_image[50:100, 50:150, 0] += 0.3  # Red channel
        elif class_name == 'eye_problem':
            # Add eye-like patterns
            base_image[80:120, 80:140, :] += 0.2
        elif class_name == 'ear_infection':
            # Add ear-like patterns
            base_image[60:140, 20:60, :] += 0.2
        elif class_name == 'dental_issue':
            # Add mouth-like patterns
            base_image[140:180, 80:140, :] += 0.2
        
        # Normalize
        base_image = np.clip(base_image, 0, 1)
        return base_image
    
    def train(self, data_dir=None, epochs=10, batch_size=32):
        """Train the model"""
        print(f"Training {self.model_type.upper()} model...")
        
        # Create model if not exists
        if self.model is None:
            self.create_model()
        
        # Generate synthetic data (replace with real data in production)
        X_train, y_train = self.create_synthetic_dataset()
        
        # Split data
        X_train_split, X_val_split, y_train_split, y_val_split = train_test_split(
            X_train, y_train, test_size=0.2, random_state=42
        )
        
        # Data augmentation
        datagen = ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2
        )
        
        # Training callbacks
        callbacks = [
            tf.keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=3,
                restore_best_weights=True
            ),
            tf.keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=2,
                min_lr=1e-7
            )
        ]
        
        # Train model
        history = self.model.fit(
            datagen.flow(X_train_split, y_train_split, batch_size=batch_size),
            steps_per_epoch=len(X_train_split) // batch_size,
            epochs=epochs,
            validation_data=(X_val_split, y_val_split),
            callbacks=callbacks,
            verbose=1
        )
        
        # Fine-tuning: Unfreeze some layers
        if self.model_type == 'efficientnet':
            # Unfreeze top layers for fine-tuning
            for layer in self.model.layers[-10:]:
                if hasattr(layer, 'trainable'):
                    layer.trainable = True
            
            # Recompile with lower learning rate
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            # Fine-tune for a few more epochs
            self.model.fit(
                X_train_split, y_train_split,
                epochs=5,
                validation_data=(X_val_split, y_val_split),
                verbose=1
            )
        
        print("Training completed!")
        return history
    
    def predict(self, image_path):
        """Predict symptom type from image"""
        if self.model is None:
            # Return mock predictions if model not trained
            return {
                'skin_irritation': 0.3,
                'eye_problem': 0.2,
                'ear_infection': 0.1,
                'dental_issue': 0.1,
                'normal': 0.3
            }
        
        try:
            # Preprocess image
            image_array = self.preprocess_image(image_path)
            
            # Get prediction probabilities
            predictions = self.model.predict(image_array, verbose=0)
            probabilities = predictions[0]
            
            # Create result dictionary
            result = {}
            for i, class_name in enumerate(self.classes):
                result[class_name] = float(probabilities[i])
            
            return result
            
        except Exception as e:
            print(f"Error in prediction: {e}")
            # Return default probabilities
            return {
                'skin_irritation': 0.2,
                'eye_problem': 0.2,
                'ear_infection': 0.2,
                'dental_issue': 0.2,
                'normal': 0.2
            }
    
    def save_model(self, model_path):
        """Save the trained model"""
        if self.model is None:
            print("No model to save!")
            return
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(model_path), exist_ok=True)
        
        # Save TensorFlow model
        tf_model_path = model_path.replace('.joblib', '_tf')
        self.model.save(tf_model_path)
        
        # Save metadata
        metadata = {
            'model_type': self.model_type,
            'classes': self.classes,
            'input_size': self.input_size,
            'num_classes': self.num_classes,
            'tf_model_path': tf_model_path
        }
        
        joblib.dump(metadata, model_path)
        print(f"Model saved to {model_path}")
        print(f"TensorFlow model saved to {tf_model_path}")
    
    def load_model(self, model_path):
        """Load a trained model"""
        try:
            # Load metadata
            metadata = joblib.load(model_path)
            self.model_type = metadata['model_type']
            self.classes = metadata['classes']
            self.input_size = metadata['input_size']
            self.num_classes = metadata['num_classes']
            
            # Load TensorFlow model
            tf_model_path = metadata['tf_model_path']
            self.model = tf.keras.models.load_model(tf_model_path)
            
            print(f"Model loaded from {model_path}")
            print(f"Model type: {self.model_type.upper()}")
            print(f"Classes: {self.classes}")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None


def create_efficientnet_classifier():
    """Create and train an EfficientNet-B0 classifier"""
    print("Creating EfficientNet-B0 classifier...")
    classifier = AdvancedPetSymptomImageClassifier(model_type='efficientnet')
    
    # Train the model
    classifier.train(epochs=15)
    
    # Save the model
    model_path = "ml/models/efficientnet_image_classifier.joblib"
    classifier.save_model(model_path)
    
    return classifier


def create_mobilenet_classifier():
    """Create and train a MobileNetV3 classifier"""
    print("Creating MobileNetV3 classifier...")
    classifier = AdvancedPetSymptomImageClassifier(model_type='mobilenet')
    
    # Train the model
    classifier.train(epochs=15)
    
    # Save the model
    model_path = "ml/models/mobilenet_image_classifier.joblib"
    classifier.save_model(model_path)
    
    return classifier


def compare_models():
    """Compare EfficientNet-B0 vs MobileNetV3 performance"""
    print("Comparing EfficientNet-B0 vs MobileNetV3...")
    
    # Create both models
    efficientnet = create_efficientnet_classifier()
    mobilenet = create_mobilenet_classifier()
    
    # Test with sample image
    test_image = "https://example.com/pet_image.jpg"
    
    print("\nEfficientNet-B0 Predictions:")
    eff_predictions = efficientnet.predict(test_image)
    for class_name, prob in eff_predictions.items():
        print(f"  {class_name}: {prob:.3f}")
    
    print("\nMobileNetV3 Predictions:")
    mob_predictions = mobilenet.predict(test_image)
    for class_name, prob in mob_predictions.items():
        print(f"  {class_name}: {prob:.3f}")
    
    return efficientnet, mobilenet


if __name__ == "__main__":
    # Create EfficientNet-B0 classifier (recommended for accuracy)
    efficientnet_classifier = create_efficientnet_classifier()
    
    # Test with sample image
    test_result = efficientnet_classifier.predict("https://example.com/pet_image.jpg")
    print("EfficientNet-B0 Sample prediction:", test_result)
    
    # Uncomment to create MobileNetV3 classifier (recommended for mobile)
    # mobilenet_classifier = create_mobilenet_classifier()
    
    # Uncomment to compare both models
    # compare_models()
