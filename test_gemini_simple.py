#!/usr/bin/env python
"""
Simple standalone script to test your Gemini API key
Run this from your project root: python test_gemini_simple.py

Make sure to activate your virtual environment first!
"""
import os
from pathlib import Path
from decouple import config

def test_api_key():
    print("=" * 60)
    print("Testing Gemini API Key")
    print("=" * 60)
    
    # Try to load from .env
    env_path = Path(__file__).parent / '.env'
    
    if not env_path.exists():
        print(f"ERROR: .env file not found at {env_path}")
        print("\nSolution:")
        print("   1. Create a .env file in your project root")
        print("   2. Add: GEMINI_API_KEY=your-key-here")
        return False
    
    print(f"Found .env file at: {env_path}")
    
    # Load API key
    try:
        api_key = config('GEMINI_API_KEY', default='')
    except Exception as e:
        print(f"❌ ERROR loading from .env: {e}")
        return False
    
    if not api_key:
        print("ERROR: GEMINI_API_KEY not found in .env file")
        print("\nSolution:")
        print("   1. Open your .env file")
        print("   2. Add this line: GEMINI_API_KEY=your-key-here")
        print("   3. Get a key from: https://aistudio.google.com/app/apikey")
        return False
    
    # Check if empty
    api_key_clean = api_key.strip()
    if not api_key_clean:
        print("ERROR: GEMINI_API_KEY is empty in .env file")
        print("\nSolution:")
        print("   Check your .env file - the key value is empty")
        return False
    
    # Show key info (masked)
    print(f"OK: API Key found (length: {len(api_key_clean)})")
    print(f"   Preview: {api_key_clean[:10]}...{api_key_clean[-4:]}")
    
    if api_key != api_key_clean:
        print("WARNING: Key has leading/trailing whitespace")
        print("   (This will be automatically trimmed)")
    
    # Test the key
    print("\nTesting API key with Google Gemini...")
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key_clean)
        
        # Try to list models
        print("   -> Listing available models...")
        models = list(genai.list_models())
        print(f"   OK: Found {len(models)} models")
        
        # Try a simple generation - find a working model
        print("   -> Testing model generation...")
        # Find a model that supports generateContent
        working_model = None
        for m in models:
            if 'generateContent' in m.supported_generation_methods:
                # Prefer gemini models
                if 'gemini' in m.name.lower():
                    working_model = m.name
                    break
        
        if not working_model:
            # Fallback to first model with generateContent
            for m in models:
                if 'generateContent' in m.supported_generation_methods:
                    working_model = m.name
                    break
        
        if not working_model:
            print("   ERROR: No models found that support generateContent")
            return False
        
        print(f"   Using model: {working_model}")
        model = genai.GenerativeModel(working_model)
        response = model.generate_content("Say 'Hello' if you can read this.")
        
        if response and hasattr(response, 'text'):
            print(f"   OK: Model responded: {response.text[:50]}...")
            print("\n" + "=" * 60)
            print("SUCCESS! Your API key is working correctly!")
            print("=" * 60)
            print("\nIf your chatbot still doesn't work:")
            print("   1. Make sure your Django server is restarted")
            print("   2. Check the server console for errors")
            return True
        else:
            print("   ERROR: Model did not return text")
            return False
            
    except ImportError:
        print("   ERROR: google-generativeai package not installed")
        print("\nSolution:")
        print("   Install it with: pip install google-generativeai")
        return False
    except Exception as e:
        error_str = str(e)
        print(f"   ERROR: {error_str}")
        
        print("\n" + "=" * 60)
        print("API KEY TEST FAILED")
        print("=" * 60)
        
        if '403' in error_str or 'permission' in error_str.lower() or 'forbidden' in error_str.lower():
            print("\nIssue: API key is INVALID or has been REVOKED")
            print("\nSolutions:")
            print("   1. Get a NEW API key from: https://aistudio.google.com/app/apikey")
            print("   2. Make sure you copied the ENTIRE key")
            print("   3. Update your .env file with the new key:")
            print("      GEMINI_API_KEY=your-new-key-here")
            print("   4. Make sure there are NO QUOTES around the key")
            print("   5. Make sure there are NO SPACES before/after the =")
            print("   6. Restart your Django server")
        elif 'quota' in error_str.lower() or '429' in error_str:
            print("\nIssue: API quota exceeded")
            print("\nSolutions:")
            print("   1. Wait a few minutes and try again")
            print("   2. Check your Google Cloud billing account")
        elif 'invalid' in error_str.lower():
            print("\nIssue: API key format is invalid")
            print("\nSolutions:")
            print("   1. Check your .env file format:")
            print("      WRONG: GEMINI_API_KEY=\"AIzaSy...\"  (has quotes)")
            print("      WRONG: GEMINI_API_KEY = AIzaSy...  (has spaces)")
            print("      CORRECT: GEMINI_API_KEY=AIzaSy...    (correct)")
            print("   2. Get a fresh key from: https://aistudio.google.com/app/apikey")
        else:
            print(f"\nIssue: {error_str}")
            print("\nGeneral solutions:")
            print("   1. Verify your internet connection")
            print("   2. Get a new key from: https://aistudio.google.com/app/apikey")
        
        return False

if __name__ == '__main__':
    import sys
    success = test_api_key()
    sys.exit(0 if success else 1)

