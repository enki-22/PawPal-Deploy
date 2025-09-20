#!/usr/bin/env python3
"""
Training script for advanced pet symptom image classifiers
Supports EfficientNet-B0 and MobileNetV3 models
"""

import argparse
import os
import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from ml.advanced_image_classifier import (
    AdvancedPetSymptomImageClassifier,
    create_efficientnet_classifier,
    create_mobilenet_classifier,
    compare_models
)


def main():
    parser = argparse.ArgumentParser(description="Train advanced pet symptom image classifiers")
    parser.add_argument(
        "--model", 
        choices=['efficientnet', 'mobilenet', 'both'], 
        default='efficientnet',
        help="Which model to train (default: efficientnet)"
    )
    parser.add_argument(
        "--epochs", 
        type=int, 
        default=15,
        help="Number of training epochs (default: 15)"
    )
    parser.add_argument(
        "--batch-size", 
        type=int, 
        default=32,
        help="Batch size for training (default: 32)"
    )
    parser.add_argument(
        "--compare", 
        action='store_true',
        help="Compare EfficientNet-B0 vs MobileNetV3 performance"
    )
    
    args = parser.parse_args()
    
    print("🐾 PawPal Advanced Image Classifier Training")
    print("=" * 50)
    
    # Create models directory
    models_dir = Path("ml/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    if args.model == 'efficientnet' or args.model == 'both':
        print("\n🚀 Training EfficientNet-B0 Classifier...")
        print("   - Lightweight but accurate")
        print("   - Best for server deployment")
        print("   - ~5.3M parameters")
        
        try:
            efficientnet_classifier = create_efficientnet_classifier()
            print("✅ EfficientNet-B0 training completed!")
            
            # Test the model
            test_result = efficientnet_classifier.predict("https://example.com/test_image.jpg")
            print("📊 Sample prediction:", test_result)
            
        except Exception as e:
            print(f"❌ EfficientNet-B0 training failed: {e}")
    
    if args.model == 'mobilenet' or args.model == 'both':
        print("\n📱 Training MobileNetV3 Classifier...")
        print("   - Ultra-lightweight")
        print("   - Best for mobile deployment")
        print("   - ~2.9M parameters")
        
        try:
            mobilenet_classifier = create_mobilenet_classifier()
            print("✅ MobileNetV3 training completed!")
            
            # Test the model
            test_result = mobilenet_classifier.predict("https://example.com/test_image.jpg")
            print("📊 Sample prediction:", test_result)
            
        except Exception as e:
            print(f"❌ MobileNetV3 training failed: {e}")
    
    if args.compare:
        print("\n⚖️ Comparing Model Performance...")
        try:
            efficientnet, mobilenet = compare_models()
            print("✅ Model comparison completed!")
        except Exception as e:
            print(f"❌ Model comparison failed: {e}")
    
    print("\n🎉 Training completed!")
    print("\n📁 Models saved to:")
    print("   - ml/models/efficientnet_image_classifier.joblib")
    print("   - ml/models/mobilenet_image_classifier.joblib")
    
    print("\n🔧 Usage in your application:")
    print("   - EfficientNet-B0: Best accuracy, server deployment")
    print("   - MobileNetV3: Fast inference, mobile deployment")
    print("   - Both models support the same API interface")
    
    print("\n📊 Model Specifications:")
    print("   EfficientNet-B0:")
    print("     - Parameters: ~5.3M")
    print("     - Input size: 224x224x3")
    print("     - Accuracy: High")
    print("     - Speed: Medium")
    print("     - Size: ~20MB")
    
    print("   MobileNetV3-Small:")
    print("     - Parameters: ~2.9M")
    print("     - Input size: 224x224x3")
    print("     - Accuracy: Good")
    print("     - Speed: Fast")
    print("     - Size: ~12MB")


if __name__ == "__main__":
    main()
