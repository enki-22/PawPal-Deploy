import os
import numpy as np
import pandas as pd
from PIL import Image
import requests
from io import BytesIO
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import StandardScaler
import cv2
from pathlib import Path


class PetSymptomImageClassifier:
    """Image classifier for pet symptoms using computer vision features"""
    
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.classes = ['skin_irritation', 'eye_problem', 'ear_infection', 'dental_issue', 'normal']
        
    def extract_features(self, image_path):
        """Extract visual features from pet symptom images"""
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
            
            # Convert to numpy array
            img_array = np.array(image)
            
            # Extract color features
            color_features = self._extract_color_features(img_array)
            
            # Extract texture features
            texture_features = self._extract_texture_features(img_array)
            
            # Extract shape features
            shape_features = self._extract_shape_features(img_array)
            
            # Combine all features
            features = np.concatenate([color_features, texture_features, shape_features])
            
            return features
            
        except Exception as e:
            print(f"Error extracting features: {e}")
            # Return zero features if extraction fails
            return np.zeros(50)  # Default feature size
    
    def _extract_color_features(self, img_array):
        """Extract color-based features"""
        # Convert to different color spaces
        hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(img_array, cv2.COLOR_RGB2LAB)
        
        # Calculate color statistics
        features = []
        
        for channel in [img_array[:,:,0], img_array[:,:,1], img_array[:,:,2]]:  # RGB
            features.extend([
                np.mean(channel),
                np.std(channel),
                np.median(channel),
                np.percentile(channel, 25),
                np.percentile(channel, 75)
            ])
        
        # HSV features
        for channel in [hsv[:,:,0], hsv[:,:,1], hsv[:,:,2]]:
            features.extend([
                np.mean(channel),
                np.std(channel)
            ])
        
        return np.array(features)
    
    def _extract_texture_features(self, img_array):
        """Extract texture features using simple methods"""
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        features = []
        
        # Calculate texture using Laplacian variance
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        features.append(laplacian_var)
        
        # Calculate local binary pattern-like features
        features.append(np.std(gray))
        features.append(np.mean(np.abs(np.diff(gray.flatten()))))
        
        # Edge density
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size
        features.append(edge_density)
        
        return np.array(features)
    
    def _extract_shape_features(self, img_array):
        """Extract basic shape features"""
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        features = []
        
        # Image dimensions and aspect ratio
        height, width = gray.shape
        features.extend([height, width, width/height])
        
        # Brightness distribution
        features.append(np.mean(gray))
        features.append(np.std(gray))
        
        # Contrast
        features.append(np.max(gray) - np.min(gray))
        
        return np.array(features)
    
    def train(self, data_dir):
        """Train the image classifier with sample data"""
        print("Training image classifier...")
        
        # Create synthetic training data for demonstration
        # In production, you'd have real labeled images
        X_train = []
        y_train = []
        
        # Generate synthetic features for each class
        for i, class_name in enumerate(self.classes):
            for _ in range(20):  # 20 samples per class
                # Generate random features that simulate real image features
                features = np.random.normal(i * 10, 5, 50)  # Different means for each class
                X_train.append(features)
                y_train.append(class_name)
        
        X_train = np.array(X_train)
        y_train = np.array(y_train)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        # Train Random Forest
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        print("Image classifier training completed!")
        return self.model
    
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
            # Extract features
            features = self.extract_features(image_path)
            features_scaled = self.scaler.transform([features])
            
            # Get prediction probabilities
            probabilities = self.model.predict_proba(features_scaled)[0]
            
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
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'classes': self.classes,
            'feature_names': self.feature_names
        }
        joblib.dump(model_data, model_path)
        print(f"Image classifier saved to {model_path}")
    
    def load_model(self, model_path):
        """Load a trained model"""
        try:
            model_data = joblib.load(model_path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.classes = model_data['classes']
            self.feature_names = model_data['feature_names']
            print(f"Image classifier loaded from {model_path}")
        except Exception as e:
            print(f"Error loading model: {e}")


def create_image_classifier():
    """Create and train an image classifier"""
    classifier = PetSymptomImageClassifier()
    
    # Train with synthetic data (replace with real data in production)
    classifier.train("ml/data/images")
    
    # Save the model
    model_path = "ml/models/image_classifier.joblib"
    classifier.save_model(model_path)
    
    return classifier


if __name__ == "__main__":
    # Create and train image classifier
    classifier = create_image_classifier()
    
    # Test with a sample image (you can replace with real image path)
    test_result = classifier.predict("https://example.com/pet_image.jpg")
    print("Sample prediction:", test_result)
