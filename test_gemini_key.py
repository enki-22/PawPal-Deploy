#!/usr/bin/env python
"""
Simple script to test your Gemini API key
Run this from your project root: python test_gemini_key.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
django.setup()

from django.conf import settings
import google.generativeai as genai

def test_api_key():
    print("=" * 60)
    print("🔑 Testing Gemini API Key")
    print("=" * 60)
    
    # Check if key exists
    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in settings")
        print("\n📝 Solution:")
        print("   1. Open your .env file (in the project root)")
        print("   2. Add: GEMINI_API_KEY=your-key-here")
        print("   3. Get a key from: https://aistudio.google.com/app/apikey")
        return False
    
    # Check if empty
    api_key_clean = api_key.strip()
    if not api_key_clean:
        print("❌ ERROR: GEMINI_API_KEY is empty")
        print("\n📝 Solution:")
        print("   Check your .env file - the key value is empty or only whitespace")
        return False
    
    # Show key info (masked)
    print(f"✅ API Key found (length: {len(api_key_clean)})")
    print(f"   Preview: {api_key_clean[:10]}...{api_key_clean[-4:]}")
    
    if api_key != api_key_clean:
        print("⚠️  WARNING: Key has leading/trailing whitespace (will be trimmed)")
    
    # Test the key
    print("\n🧪 Testing API key with Google Gemini...")
    try:
        genai.configure(api_key=api_key_clean)
        
        # Try to list models
        print("   → Listing available models...")
        models = list(genai.list_models())
        print(f"   ✅ Found {len(models)} models")
        
        # Try a simple generation
        print("   → Testing model generation...")
        model = genai.GenerativeModel('models/gemini-1.5-flash')
        response = model.generate_content("Say 'Hello' if you can read this.")
        
        if response and hasattr(response, 'text'):
            print(f"   ✅ Model responded: {response.text[:50]}...")
            print("\n" + "=" * 60)
            print("✅ SUCCESS! Your API key is working correctly!")
            print("=" * 60)
            return True
        else:
            print("   ❌ Model did not return text")
            return False
            
    except Exception as e:
        error_str = str(e)
        print(f"   ❌ Error: {error_str}")
        
        print("\n" + "=" * 60)
        print("❌ API KEY TEST FAILED")
        print("=" * 60)
        
        if '403' in error_str or 'permission' in error_str.lower() or 'forbidden' in error_str.lower():
            print("\n🔍 Issue: API key is invalid or has been revoked")
            print("\n📝 Solutions:")
            print("   1. Get a NEW API key from: https://aistudio.google.com/app/apikey")
            print("   2. Make sure you copied the ENTIRE key (no spaces, no quotes)")
            print("   3. Update your .env file:")
            print("      GEMINI_API_KEY=your-new-key-here")
            print("   4. Restart your Django server")
        elif 'quota' in error_str.lower() or '429' in error_str:
            print("\n🔍 Issue: API quota exceeded")
            print("\n📝 Solutions:")
            print("   1. Wait a few minutes and try again")
            print("   2. Check your Google Cloud billing account")
            print("   3. Upgrade your API plan if needed")
        elif 'invalid' in error_str.lower():
            print("\n🔍 Issue: API key format is invalid")
            print("\n📝 Solutions:")
            print("   1. Check your .env file - remove any quotes or extra spaces")
            print("   2. Make sure the key starts with 'AI'")
            print("   3. Get a fresh key from: https://aistudio.google.com/app/apikey")
        else:
            print(f"\n🔍 Issue: {error_str}")
            print("\n📝 General solutions:")
            print("   1. Verify your internet connection")
            print("   2. Check if Gemini API is available in your region")
            print("   3. Get a new key from: https://aistudio.google.com/app/apikey")
        
        return False

if __name__ == '__main__':
    success = test_api_key()
    sys.exit(0 if success else 1)

