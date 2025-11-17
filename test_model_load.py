"""Test if the retrained model can be loaded without errors"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
django.setup()

# Now test model loading
from chatbot.views import load_pawpal_lightgbm

try:
    print("=" * 60)
    print("TESTING MODEL LOADING")
    print("=" * 60)
    
    model, preprocessor, label_encoder, metadata = load_pawpal_lightgbm()
    
    print("✅ SUCCESS! Model loaded without errors")
    print(f"\n✓ Model type: {type(model)}")
    print(f"✓ Preprocessor type: {type(preprocessor)}")
    print(f"✓ Label encoder type: {type(label_encoder)}")
    print(f"✓ Number of diseases: {len(label_encoder.classes_)}")
    print(f"✓ Metadata diseases: {len(metadata)}")
    
    print("\n" + "=" * 60)
    print("🎉 The _ravel_column issue is FIXED!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    print(f"\nError type: {type(e).__name__}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
