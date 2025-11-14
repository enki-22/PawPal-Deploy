"""
Install dependencies for data augmentation
Compatible with TensorFlow 2.15/2.20 (requires numpy < 2.0.0)
"""

import subprocess
import sys
import os
import io
from pathlib import Path

# Fix Windows encoding for emojis
if sys.platform == 'win32':
    # Set stdout to UTF-8
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def install_package(package, constraint_file=None):
    """Install a package using pip"""
    try:
        cmd = [sys.executable, "-m", "pip", "install", package]
        if constraint_file:
            cmd.extend(["--constraint", constraint_file])
        subprocess.check_call(cmd)
        print(f"✅ Installed {package}")
        return True
    except subprocess.CalledProcessError:
        print(f"❌ Failed to install {package}")
        return False

def main():
    print("📦 Installing augmentation dependencies (TensorFlow-compatible)...\n")
    print("⚠️  Note: This will ensure compatibility with TensorFlow 2.15/2.20\n")
    
    # Create constraints file to prevent numpy upgrade
    constraints_file = Path(__file__).parent / "constraints.txt"
    with open(constraints_file, 'w') as f:
        f.write("numpy<2.0.0,>=1.23.5\n")
        f.write("opencv-python-headless<4.10.0,>=4.9.0.80\n")
    
    try:
        # Step 1: Uninstall problematic packages first
        print("Step 1: Cleaning up incompatible packages...")
        packages_to_remove = ["opencv-python-headless", "albumentations", "albucore"]
        for pkg in packages_to_remove:
            try:
                subprocess.check_call(
                    [sys.executable, "-m", "pip", "uninstall", pkg, "-y"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                print(f"  ✅ Removed {pkg}")
            except:
                pass
        
        # Step 2: Install compatible numpy FIRST
        print("\nStep 2: Installing compatible numpy (1.x for TensorFlow)...")
        install_package("numpy<2.0.0,>=1.23.5")
        
        # Step 3: Install compatible opencv-python-headless
        # We need >=4.9.0.80 for albucore, but <4.10.0 for numpy 1.x compatibility
        print("\nStep 3: Installing compatible opencv-python-headless...")
        # Try to install a specific version that works with numpy 1.x
        # Version 4.9.0.80 should work, or we can try 4.9.1.x
        try:
            install_package("opencv-python-headless==4.9.0.80", str(constraints_file))
        except:
            # Fallback: try version range
            print("  ⚠️  Trying version range...")
            install_package("opencv-python-headless>=4.9.0.80,<4.10.0", str(constraints_file))
        
        # Step 4: Install albumentations dependencies manually
        print("\nStep 4: Installing albumentations dependencies...")
        albu_deps = [
            "scipy>=1.10.0",
            "PyYAML",
            "pydantic>=2.9.2",
        ]
        for dep in albu_deps:
            install_package(dep)
        
        # Step 5: Install albumentations with constraints to prevent numpy upgrade
        print("\nStep 5: Installing albumentations (with constraints)...")
        try:
            install_package("albumentations", str(constraints_file))
        except:
            # Fallback: install older version that doesn't require latest albucore
            print("  ⚠️  Trying older albumentations version...")
            install_package("albumentations<1.4.0", str(constraints_file))
        
        # Step 6: Install other packages
        print("\nStep 6: Installing other packages...")
        for package in ["Pillow", "tqdm"]:
            install_package(package)
        
        print(f"\n{'='*60}")
        print("✅ Installation complete!")
        print(f"{'='*60}")
        print("\n⚠️  IMPORTANT: Verify TensorFlow compatibility:")
        print("   python -c \"import tensorflow as tf; import numpy as np; print(f'✅ TF: {tf.__version__}, NumPy: {np.__version__}')\"")
        print("\n📝 Next steps:")
        print("   1. Run: python ml/scripts/final_augmentation.py")
        print("   2. Or augment specific class: python ml/scripts/final_augmentation.py --class-name wound_laceration")
        print("\n💡 Note: Some dependency warnings may appear, but TensorFlow should work correctly.")
    
    finally:
        # Clean up constraints file
        if constraints_file.exists():
            constraints_file.unlink()


if __name__ == "__main__":
    main()