import tensorflow as tf
import numpy as np
from PIL import Image
import logging
from django.conf import settings
import os
import joblib

logger = logging.getLogger(__name__)

class PetSymptomImageClassifier:
    def __init__(self):
        self.efficientnet_model = None
        self.mobilenet_model = None
        self.classes = [
            'healthy_pet',
            'skin_condition', 
            'eye_infection',
            'ear_infection',
            'dental_issues',
            'wound_injury'
        ]
        self.load_models()
    
    def load_models(self):
        """Load trained models"""
        models_dir = os.path.join(os.path.dirname(__file__), 'models')
        
        # Try to load EfficientNet model
        efficientnet_path = os.path.join(models_dir, 'efficientnet_classifier.joblib')
        if os.path.exists(efficientnet_path):
            try:
                metadata = joblib.load(efficientnet_path)
                
                # Load TensorFlow model from path (Keras 3.x format)
                tf_model_path = metadata.get('tf_model_path')
                if tf_model_path:
                    # Handle both .keras extension and directory format
                    if not os.path.exists(tf_model_path) and not os.path.isdir(tf_model_path):
                        # Try .keras extension if path doesn't exist
                        if os.path.exists(tf_model_path + '.keras'):
                            tf_model_path = tf_model_path + '.keras'
                        else:
                            logger.warning(f"⚠️ TensorFlow model file not found at: {tf_model_path}")
                            tf_model_path = None
                    
                    if tf_model_path and (os.path.exists(tf_model_path) or os.path.isdir(tf_model_path)):
                        self.efficientnet_model = tf.keras.models.load_model(tf_model_path)
                        self.classes = metadata.get('classes', self.classes)
                        logger.info("✅ EfficientNet model loaded successfully")
                    elif tf_model_path:
                        logger.warning(f"⚠️ TensorFlow model file not found at: {tf_model_path}")
                else:
                    logger.warning("⚠️ EfficientNet metadata missing 'tf_model_path' key")
                    
            except Exception as e:
                logger.error(f"❌ Error loading EfficientNet model: {str(e)}")
        
        # Try to load MobileNet model
        mobilenet_path = os.path.join(models_dir, 'mobilenet_classifier.joblib')
        if os.path.exists(mobilenet_path):
            try:
                metadata = joblib.load(mobilenet_path)
                
                # Load TensorFlow model from path (Keras 3.x format)
                tf_model_path = metadata.get('tf_model_path')
                if tf_model_path:
                    # Handle both .keras extension and directory format
                    if not os.path.exists(tf_model_path) and not os.path.isdir(tf_model_path):
                        # Try .keras extension if path doesn't exist
                        if os.path.exists(tf_model_path + '.keras'):
                            tf_model_path = tf_model_path + '.keras'
                        else:
                            logger.warning(f"⚠️ TensorFlow model file not found at: {tf_model_path}")
                            tf_model_path = None
                    
                    if tf_model_path and (os.path.exists(tf_model_path) or os.path.isdir(tf_model_path)):
                        self.mobilenet_model = tf.keras.models.load_model(tf_model_path)
                        logger.info("✅ MobileNet model loaded successfully")
                    elif tf_model_path:
                        logger.warning(f"⚠️ TensorFlow model file not found at: {tf_model_path}")
                else:
                    logger.warning("⚠️ MobileNet metadata missing 'tf_model_path' key")
                    
            except Exception as e:
                logger.error(f"❌ Error loading MobileNet model: {str(e)}")
        
        if not self.efficientnet_model and not self.mobilenet_model:
            logger.warning("⚠️ No trained models found. Run training script to create new models.")
    
    def preprocess_image(self, image_path, target_size=(224, 224)):
        """Preprocess image for model input"""
        try:
            # Open and resize image
            if isinstance(image_path, str):
                if image_path.startswith('http'):
                    # Handle URL
                    import requests
                    from io import BytesIO
                    response = requests.get(image_path)
                    image = Image.open(BytesIO(response.content))
                else:
                    # Handle file path
                    image = Image.open(image_path)
            else:
                # Handle file object
                image = Image.open(image_path)
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image
            image = image.resize(target_size)
            
            # Convert to numpy array and normalize
            img_array = np.array(image)
            img_array = np.expand_dims(img_array, axis=0)
            img_array = img_array.astype(np.float32) / 255.0
            
            return img_array
            
        except Exception as e:
            logger.error(f"❌ Error preprocessing image: {str(e)}")
            return None
    
    def predict_with_efficientnet(self, image_path):
        """Predict using EfficientNet model"""
        if not self.efficientnet_model:
            return None
            
        try:
            processed_image = self.preprocess_image(image_path)
            if processed_image is None:
                return None
            
            predictions = self.efficientnet_model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
            
            # Create result dictionary
            results = {}
            for i, class_name in enumerate(self.classes):
                results[class_name] = float(probabilities[i])
            
            return results
            
        except Exception as e:
            logger.error(f"❌ EfficientNet prediction error: {str(e)}")
            return None
    
    def predict_with_mobilenet(self, image_path):
        """Predict using MobileNet model"""
        if not self.mobilenet_model:
            return None
            
        try:
            processed_image = self.preprocess_image(image_path)
            if processed_image is None:
                return None
            
            predictions = self.mobilenet_model.predict(processed_image, verbose=0)
            probabilities = predictions[0]
            
            # Create result dictionary
            results = {}
            for i, class_name in enumerate(self.classes):
                results[class_name] = float(probabilities[i])
            
            return results
            
        except Exception as e:
            logger.error(f"❌ MobileNet prediction error: {str(e)}")
            return None
    
    def analyze_symptom_image(self, image_path, pet_species='dog'):
        """Analyze uploaded pet image for symptoms using best available model"""
        try:
            # Try EfficientNet first (usually more accurate)
            efficientnet_results = self.predict_with_efficientnet(image_path)
            mobilenet_results = self.predict_with_mobilenet(image_path)
            
            # Use EfficientNet if available, otherwise MobileNet
            if efficientnet_results:
                primary_results = efficientnet_results
                model_used = "EfficientNet-B0"
                backup_results = mobilenet_results
            elif mobilenet_results:
                primary_results = mobilenet_results
                model_used = "MobileNetV3Large"
                backup_results = None
            else:
                return self._get_fallback_analysis()
            
            # Find top prediction
            top_condition = max(primary_results.items(), key=lambda x: x[1])
            confidence_score = top_condition[1]
            detected_condition = top_condition[0]
            
            # Get top 3 predictions
            sorted_predictions = sorted(primary_results.items(), key=lambda x: x[1], reverse=True)[:3]
            
            analysis_result = {
                'analysis_successful': True,
                'model_used': model_used,
                'confidence_score': round(confidence_score, 3),
                'detected_condition': detected_condition,
                'top_predictions': [
                    {
                        'condition': condition,
                        'confidence': round(confidence, 3),
                        'percentage': round(confidence * 100, 1)
                    }
                    for condition, confidence in sorted_predictions
                ],
                'all_probabilities': primary_results,
                'species_context': pet_species,
                'recommendations': self._get_recommendations(detected_condition),
                'urgency_level': self._determine_urgency(detected_condition, confidence_score),
                'backup_model_results': backup_results
            }
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"❌ Image analysis error: {str(e)}")
            return self._get_fallback_analysis()
    
    def _determine_urgency(self, condition, confidence):
        """Determine urgency level based on condition and confidence"""
        urgent_conditions = ['eye_infection', 'wound_injury']
        moderate_conditions = ['skin_condition', 'ear_infection', 'dental_issues']
        
        if condition in urgent_conditions and confidence > 0.7:
            return 'immediate'
        elif condition in urgent_conditions or (condition in moderate_conditions and confidence > 0.8):
            return 'soon'
        elif condition == 'healthy_pet' and confidence > 0.6:
            return 'routine'
        else:
            return 'monitor'
    
    def _get_recommendations(self, condition):
        """Get recommendations based on detected condition"""
        recommendations = {
            'healthy_pet': [
                'Continue regular care routine',
                'Monitor for any changes',
                'Maintain regular vet checkups'
            ],
            'skin_condition': [
                'Keep affected area clean and dry',
                'Avoid harsh chemicals or perfumes',
                'Monitor for worsening symptoms',
                'Consider antihistamines if allergic reaction'
            ],
            'eye_infection': [
                'Clean gently with warm water',
                'Avoid touching or rubbing the eye',
                'Keep pet from scratching the area',
                'Seek veterinary care if discharge persists'
            ],
            'ear_infection': [
                'Keep ears dry and clean',
                'Check for unusual odor or discharge',
                'Avoid inserting anything into the ear canal',
                'Monitor for head shaking or scratching'
            ],
            'dental_issues': [
                'Maintain regular dental hygiene',
                'Provide dental chews or toys',
                'Monitor eating habits',
                'Schedule dental cleaning if needed'
            ],
            'wound_injury': [
                'Clean wound gently with saline solution',
                'Apply pressure if bleeding',
                'Keep pet from licking the wound',
                'Seek immediate veterinary care for deep wounds'
            ]
        }
        
        return recommendations.get(condition, [
            'Monitor pet closely',
            'Document any changes',
            'Consult with veterinarian if concerned'
        ])
    
    def _get_fallback_analysis(self):
        """Fallback analysis when models fail"""
        return {
            'analysis_successful': False,
            'model_used': 'fallback',
            'confidence_score': 0.0,
            'detected_condition': 'unable_to_analyze',
            'error_message': 'Unable to analyze image. Models not loaded or image processing failed.',
            'recommendations': [
                'Ensure image is clear and well-lit',
                'Try taking photo from different angle',
                'Check if image file is corrupted',
                'Contact support if problem persists'
            ],
            'urgency_level': 'unknown'
        }

# Create global instance
image_classifier = PetSymptomImageClassifier()

# Function for backward compatibility
def analyze_pet_image(image_path, pet_species='dog'):
    """Analyze pet image - main function called by Django views"""
    return image_classifier.analyze_symptom_image(image_path, pet_species)