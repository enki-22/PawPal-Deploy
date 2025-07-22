import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vet_app.settings')
django.setup()

import openai

# Test if API key works
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

try:
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello, this is a test"}]
    )
    print("✅ OpenAI connection successful!")
    print(response.choices[0].message.content)
except Exception as e:
    print(f"❌ Error: {e}")