"""
Install required dependencies for image collection
Run this first: python ml/scripts/install_image_collection_deps.py
"""

import subprocess
import sys

def install_package(package):
    """Install a package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        print(f"✅ Installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def main():
    print("📦 Installing image collection dependencies...\n")
    
    packages = [
        "ddgs",  # Updated DuckDuckGo search (free, no API key needed)
        "bing-image-downloader",  # Alternative method
        "requests",  # Usually already installed
        "Pillow",  # Usually already installed
        "tqdm",  # Usually already installed
    ]
    
    success_count = 0
    for package in packages:
        if install_package(package):
            success_count += 1
    
    print(f"\n✅ Installed {success_count}/{len(packages)} packages")
    print("\n📝 Next steps:")
    print("   1. Run: python ml/scripts/collect_images.py --phase 1")
    print("   2. Or collect specific category: python ml/scripts/collect_images.py --category ear_infection")
    print("\n⚠️  Note: Some rate limiting may occur. The script will retry automatically.")
    print("   If you see many 403 errors, try running in smaller batches or wait a few minutes.")
    print("\n💡 Optional API Keys (for better results):")
    print("   - Pixabay: Get free API key at https://pixabay.com/api/docs/")
    print("   - Pexels: Get free API key at https://www.pexels.com/api/")
    print("   Set them as environment variables: PIXABAY_API_KEY, PEXELS_API_KEY")


if __name__ == "__main__":
    main()
