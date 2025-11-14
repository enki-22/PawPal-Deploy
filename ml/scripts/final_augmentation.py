"""
Final Data Augmentation Script for Underrepresented Classes
Augments images to reach training targets using medical-safe transforms.

Usage:
    python ml/scripts/final_augmentation.py
    python ml/scripts/final_augmentation.py --base-dir ml/data/raw
"""

import os
import sys
import json
import io
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import argparse
from tqdm import tqdm
import numpy as np
from PIL import Image

# Fix Windows encoding for emojis
if sys.platform == 'win32':
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# cv2 import is optional (only needed if using OpenCV-specific features)
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Try to import albumentations
try:
    import albumentations as A
    ALBUMENTATIONS_AVAILABLE = True
except ImportError:
    ALBUMENTATIONS_AVAILABLE = False
    A = None  # Set to None for type checking
    print("⚠️  albumentations not installed. Install with: pip install albumentations")
    print("   Falling back to basic augmentation...")

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))


class MedicalImageAugmenter:
    """Augment medical/pet health images with safe transforms"""
    
    def __init__(self, base_dir: str = "ml/data/raw"):
        self.base_dir = Path(base_dir)
        
        # Class targets and current counts
        self.class_configs = {
            # TIER 1 (Target 400-500) - Critical gaps
            "ear_infection": {
                "current": 90,
                "target": 500,
                "tier": 1
            },
            "vomiting_posture": {
                "current": 72,
                "target": 500,
                "tier": 1
            },
            # TIER 2 (Target 250-300)
            "wound_laceration": {
                "current": 72,
                "target": 288,
                "tier": 2
            },
            "healthy_eyes": {
                "current": 185,
                "target": 277,
                "tier": 2
            },
            "gingivitis": {
                "current": 115,
                "target": 287,
                "tier": 2
            },
            "nasal_discharge": {
                "current": 75,
                "target": 300,
                "tier": 2
            },
            "tartar_buildup": {
                "current": 92,
                "target": 276,
                "tier": 2
            },
            "healthy_normal": {
                "current": 208,
                "target": 300,
                "tier": 2
            },
            "hot_spots": {
                "current": 133,
                "target": 300,
                "tier": 2
            },
            # TIER 3 (Target 100-200)
            "conjunctivitis": {
                "current": 78,
                "target": 100,
                "tier": 3
            },
            "healthy_ears": {
                "current": 48,
                "target": 192,
                "tier": 3
            },
            "ear_mites": {
                "current": 34,
                "target": 170,
                "tier": 3
            },
            "hematoma": {
                "current": 43,
                "target": 172,
                "tier": 3
            },
            "healthy_teeth": {
                "current": 33,
                "target": 165,
                "tier": 3
            },
            "broken_tooth": {
                "current": 25,
                "target": 175,
                "tier": 3
            },
            "healthy_respiratory": {
                "current": 28,
                "target": 168,
                "tier": 3
            },
            "labored_breathing": {
                "current": 12,
                "target": 168,
                "tier": 3
            },
            "healthy_digestive": {
                "current": 50,
                "target": 200,
                "tier": 3
            },
            "diarrhea_signs": {
                "current": 12,
                "target": 168,
                "tier": 3
            }
        }
        
        # Classes that need LOW_IMAGE_CONFIDENCE flag
        self.low_confidence_classes = {
            "healthy_digestive",
            "diarrhea_signs",
            "healthy_respiratory",
            "labored_breathing"
        }
        
        # Initialize transforms
        self._init_transforms()
        
        # Metadata tracking
        from datetime import datetime
        self.metadata = {
            "augmentation_date": datetime.now().isoformat(),
            "base_directory": str(self.base_dir),
            "classes": {},
            "total_augmented": 0,
            "total_final": 0
        }
    
    def _init_transforms(self):
        """Initialize augmentation transforms"""
        if ALBUMENTATIONS_AVAILABLE:
            # Moderate augmentation for classes with 50+ images
            # Using compatible transforms for albumentations 2.0+
            self.moderate_transform = A.Compose([
                A.HorizontalFlip(p=0.5),
                A.Rotate(limit=15, p=0.5),
                A.RandomBrightnessContrast(
                    brightness_limit=0.2,
                    contrast_limit=0.15,
                    p=0.5
                ),
                # Removed GaussNoise - API changed, using simpler transforms
                A.RandomScale(scale_limit=0.1, p=0.4),
                A.GaussianBlur(blur_limit=3, p=0.2),  # Alternative to noise
            ])
            
            # Aggressive augmentation for classes with <50 images
            self.aggressive_transform = A.Compose([
                A.HorizontalFlip(p=0.5),
                A.Rotate(limit=20, p=0.6),
                A.RandomBrightnessContrast(
                    brightness_limit=0.25,
                    contrast_limit=0.2,
                    p=0.6
                ),
                # Removed GaussNoise - API changed
                A.RandomScale(scale_limit=0.15, p=0.5),
                A.GaussianBlur(blur_limit=5, p=0.3),  # Alternative to noise
                # CoarseDropout removed - API changed significantly in albumentations 2.0
                # Using GridDistortion and other transforms instead
                A.GridDistortion(p=0.3),
            ])
        else:
            # Fallback to basic PIL transforms
            self.moderate_transform = None
            self.aggressive_transform = None
            print("⚠️  Using basic PIL augmentation (install albumentations for better results)")
    
    def _get_image_files(self, class_dir: Path) -> List[Path]:
        """Get all image files from a class directory"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(class_dir.glob(f"*{ext}"))
            image_files.extend(class_dir.glob(f"*{ext.upper()}"))
        
        # Filter out already augmented images
        image_files = [f for f in image_files if '_aug' not in f.stem]
        
        return sorted(image_files)
    
    def _load_image(self, image_path: Path) -> np.ndarray:
        """Load image as numpy array"""
        try:
            # Try PIL first
            img = Image.open(image_path)
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img_array = np.array(img)
            return img_array
        except Exception as e:
            print(f"  ⚠️  Error loading {image_path.name}: {e}")
            return None
    
    def _save_image(self, image_array: np.ndarray, output_path: Path):
        """Save image array to file"""
        try:
            img = Image.fromarray(image_array.astype('uint8'))
            img.save(output_path, quality=95)
            return True
        except Exception as e:
            print(f"  ⚠️  Error saving {output_path.name}: {e}")
            return False
    
    def _augment_with_albumentations(self, image_array: np.ndarray, transform: A.Compose) -> np.ndarray:
        """Augment image using Albumentations"""
        augmented = transform(image=image_array)
        return augmented['image']
    
    def _augment_basic(self, image_array: np.ndarray, aggressive: bool = False) -> np.ndarray:
        """Basic augmentation using PIL/OpenCV (fallback)"""
        from PIL import Image, ImageEnhance
        import random
        
        img = Image.fromarray(image_array)
        
        # Horizontal flip
        if random.random() < 0.5:
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
        
        # Rotation
        if aggressive:
            angle = random.uniform(-20, 20)
        else:
            angle = random.uniform(-15, 15)
        img = img.rotate(angle, expand=False, fillcolor=(255, 255, 255))
        
        # Brightness/Contrast
        if random.random() < 0.5:
            enhancer = ImageEnhance.Brightness(img)
            factor = random.uniform(0.8, 1.2) if not aggressive else random.uniform(0.75, 1.25)
            img = enhancer.enhance(factor)
        
        if random.random() < 0.5:
            enhancer = ImageEnhance.Contrast(img)
            factor = random.uniform(0.85, 1.15) if not aggressive else random.uniform(0.8, 1.2)
            img = enhancer.enhance(factor)
        
        return np.array(img)
    
    def augment_class(self, class_name: str, config: Dict) -> Dict:
        """Augment images for a specific class"""
        current_count = config["current"]
        target_count = config["target"]
        tier = config["tier"]
        
        class_dir = self.base_dir / class_name
        
        if not class_dir.exists():
            print(f"⚠️  Directory not found: {class_dir}")
            return {
                "class": class_name,
                "before": 0,
                "augmented": 0,
                "after": 0,
                "target": target_count,
                "strategy": "none",
                "low_confidence": class_name in self.low_confidence_classes,
                "status": "skipped - directory not found"
            }
        
        # Get existing images
        image_files = self._get_image_files(class_dir)
        actual_count = len(image_files)
        
        # Update with actual count if different
        if actual_count != current_count:
            print(f"  📊 Actual count ({actual_count}) differs from config ({current_count}), using actual count")
            current_count = actual_count
        
        if current_count == 0:
            print(f"⚠️  No images found for {class_name}")
            return {
                "class": class_name,
                "before": 0,
                "augmented": 0,
                "after": 0,
                "target": target_count,
                "strategy": "none",
                "low_confidence": class_name in self.low_confidence_classes,
                "status": "skipped - no images"
            }
        
        if current_count >= target_count:
            print(f"✅ {class_name}: Already at target ({current_count}/{target_count})")
            # Determine strategy for metadata (even though we didn't augment)
            use_aggressive = current_count < 50
            return {
                "class": class_name,
                "before": current_count,
                "augmented": 0,
                "after": current_count,
                "target": target_count,
                "strategy": "aggressive" if use_aggressive else "moderate",
                "low_confidence": class_name in self.low_confidence_classes,
                "status": "already at target"
            }
        
        # Calculate how many to generate
        needed = target_count - current_count
        
        # Determine augmentation strategy
        use_aggressive = current_count < 50
        transform = self.aggressive_transform if use_aggressive else self.moderate_transform
        
        print(f"\n{'='*60}")
        print(f"📦 Augmenting: {class_name}")
        print(f"   Current: {current_count} images")
        print(f"   Target: {target_count} images")
        print(f"   Needed: {needed} images")
        print(f"   Strategy: {'Aggressive' if use_aggressive else 'Moderate'}")
        print(f"{'='*60}")
        
        augmented_count = 0
        aug_number = 1
        
        # Calculate how many augmentations per original image
        augs_per_image = max(1, needed // current_count)
        remaining_needed = needed
        
        # Progress bar
        with tqdm(total=needed, desc=f"  Augmenting {class_name}") as pbar:
            for image_file in image_files:
                if remaining_needed <= 0:
                    break
                
                # Load image
                image_array = self._load_image(image_file)
                if image_array is None:
                    continue
                
                # Generate augmentations for this image
                augs_for_this_image = min(augs_per_image, remaining_needed)
                
                for i in range(augs_for_this_image):
                    if remaining_needed <= 0:
                        break
                    
                    # Apply augmentation
                    if ALBUMENTATIONS_AVAILABLE and transform is not None:
                        try:
                            augmented_array = self._augment_with_albumentations(image_array, transform)
                        except Exception as e:
                            print(f"  ⚠️  Albumentations error, using basic: {e}")
                            augmented_array = self._augment_basic(image_array, use_aggressive)
                    else:
                        augmented_array = self._augment_basic(image_array, use_aggressive)
                    
                    # Save augmented image
                    base_name = image_file.stem
                    output_name = f"{base_name}_aug{aug_number}.jpg"
                    output_path = class_dir / output_name
                    
                    if self._save_image(augmented_array, output_path):
                        augmented_count += 1
                        remaining_needed -= 1
                        aug_number += 1
                        pbar.update(1)
                    
                    # If we still need more, generate additional variations
                    if remaining_needed > 0 and i == augs_for_this_image - 1:
                        # Generate one more with different seed
                        if ALBUMENTATIONS_AVAILABLE and transform is not None:
                            try:
                                augmented_array = self._augment_with_albumentations(image_array, transform)
                            except:
                                augmented_array = self._augment_basic(image_array, use_aggressive)
                        else:
                            augmented_array = self._augment_basic(image_array, use_aggressive)
                        
                        output_name = f"{base_name}_aug{aug_number}.jpg"
                        output_path = class_dir / output_name
                        
                        if self._save_image(augmented_array, output_path):
                            augmented_count += 1
                            remaining_needed -= 1
                            aug_number += 1
                            pbar.update(1)
        
        # Final count - count ALL images including augmented ones
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}
        all_images = []
        for ext in image_extensions:
            all_images.extend(class_dir.glob(f"*{ext}"))
            all_images.extend(class_dir.glob(f"*{ext.upper()}"))
        final_count = len(all_images)
        
        # Check if we need to generate more (in case some failed)
        if final_count < target_count and remaining_needed > 0:
            print(f"  ⚠️  Still need {remaining_needed} more images, generating additional...")
            # Generate more from random images
            for _ in range(min(remaining_needed, current_count * 2)):
                if remaining_needed <= 0:
                    break
                
                # Pick random image
                import random
                image_file = random.choice(image_files)
                image_array = self._load_image(image_file)
                if image_array is None:
                    continue
                
                # Augment
                if ALBUMENTATIONS_AVAILABLE and transform is not None:
                    try:
                        augmented_array = self._augment_with_albumentations(image_array, transform)
                    except:
                        augmented_array = self._augment_basic(image_array, use_aggressive)
                else:
                    augmented_array = self._augment_basic(image_array, use_aggressive)
                
                output_name = f"{image_file.stem}_aug{aug_number}.jpg"
                output_path = class_dir / output_name
                
                if self._save_image(augmented_array, output_path):
                    augmented_count += 1
                    remaining_needed -= 1
                    aug_number += 1
        
        # Recalculate final count - count ALL images including augmented ones
        all_images = []
        for ext in image_extensions:
            all_images.extend(class_dir.glob(f"*{ext}"))
            all_images.extend(class_dir.glob(f"*{ext.upper()}"))
        final_count = len(all_images)
        
        result = {
            "class": class_name,
            "before": current_count,
            "augmented": augmented_count,
            "after": final_count,
            "target": target_count,
            "strategy": "aggressive" if use_aggressive else "moderate",
            "low_confidence": class_name in self.low_confidence_classes,
            "status": "completed"
        }
        
        if final_count < target_count:
            result["status"] = f"partial - {final_count}/{target_count}"
            result["remaining"] = target_count - final_count
        
        return result
    
    def augment_all(self) -> Dict:
        """Augment all classes"""
        print("🚀 Starting Final Data Augmentation")
        print(f"   Base directory: {self.base_dir}")
        print(f"   Classes to augment: {len(self.class_configs)}")
        
        results = {}
        
        for class_name, config in self.class_configs.items():
            result = self.augment_class(class_name, config)
            results[class_name] = result
            
            # Update metadata
            self.metadata["classes"][class_name] = {
                "before": result["before"],
                "augmented": result["augmented"],
                "after": result["after"],
                "target": result["target"],
                "strategy": result["strategy"],
                "low_confidence": result.get("low_confidence", False)
            }
        
        # Calculate totals
        self.metadata["total_augmented"] = sum(r["augmented"] for r in results.values())
        self.metadata["total_final"] = sum(r["after"] for r in results.values())
        
        return results
    
    def print_report(self, results: Dict):
        """Print final augmentation report"""
        print(f"\n{'='*60}")
        print("📊 FINAL AUGMENTATION REPORT")
        print(f"{'='*60}\n")
        
        # Group by tier
        tier1_results = {k: v for k, v in results.items() if self.class_configs[k]["tier"] == 1}
        tier2_results = {k: v for k, v in results.items() if self.class_configs[k]["tier"] == 2}
        tier3_results = {k: v for k, v in results.items() if self.class_configs[k]["tier"] == 3}
        
        if tier1_results:
            print("TIER 1 (Target 400-500):")
            print("-" * 60)
            for class_name, result in tier1_results.items():
                status_icon = "✅" if result["after"] >= result["target"] else "⚠️"
                low_conf = " [LOW_CONFIDENCE]" if result.get("low_confidence") else ""
                print(f"{status_icon} {class_name:25s} | {result['before']:4d} → {result['after']:4d} / {result['target']:4d} | +{result['augmented']:4d}{low_conf}")
            print()
        
        print("TIER 2 (Target 250-300):")
        print("-" * 60)
        for class_name, result in tier2_results.items():
            status_icon = "✅" if result["after"] >= result["target"] else "⚠️"
            low_conf = " [LOW_CONFIDENCE]" if result.get("low_confidence") else ""
            print(f"{status_icon} {class_name:25s} | {result['before']:4d} → {result['after']:4d} / {result['target']:4d} | +{result['augmented']:4d}{low_conf}")
        
        print(f"\nTIER 3 (Target 100-200):")
        print("-" * 60)
        for class_name, result in tier3_results.items():
            status_icon = "✅" if result["after"] >= result["target"] else "⚠️"
            low_conf = " [LOW_CONFIDENCE]" if result.get("low_confidence") else ""
            print(f"{status_icon} {class_name:25s} | {result['before']:4d} → {result['after']:4d} / {result['target']:4d} | +{result['augmented']:4d}{low_conf}")
        
        print(f"\n{'='*60}")
        print("SUMMARY:")
        print(f"  Total images before: {sum(r['before'] for r in results.values())}")
        print(f"  Total images augmented: {self.metadata['total_augmented']}")
        print(f"  Total images after: {self.metadata['total_final']}")
        print(f"  Total target: {sum(r['target'] for r in results.values())}")
        print(f"{'='*60}\n")
        
        # Save metadata
        metadata_path = self.base_dir / "augmentation_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(self.metadata, f, indent=2)
        print(f"💾 Metadata saved to: {metadata_path}")
        
        # Classes with low confidence flag
        low_conf_classes = [k for k, v in results.items() if v.get("low_confidence")]
        if low_conf_classes:
            print(f"\n⚠️  LOW_IMAGE_CONFIDENCE classes: {', '.join(low_conf_classes)}")
            print("   These classes should be marked in your training pipeline.")


def main():
    parser = argparse.ArgumentParser(
        description="Final data augmentation for underrepresented classes",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--base-dir", type=str, default="ml/data/raw",
                       help="Base directory containing class folders (default: ml/data/raw)")
    parser.add_argument("--class-name", type=str, dest="class_name",
                       help="Augment specific class only")
    
    args = parser.parse_args()
    
    augmenter = MedicalImageAugmenter(base_dir=args.base_dir)
    
    if args.class_name:
        if args.class_name not in augmenter.class_configs:
            print(f"❌ Unknown class: {args.class_name}")
            print(f"   Available classes: {', '.join(augmenter.class_configs.keys())}")
            return
        
        config = augmenter.class_configs[args.class_name]
        result = augmenter.augment_class(args.class_name, config)
        results = {args.class_name: result}
        # Update metadata for single class run
        augmenter.metadata["classes"][args.class_name] = {
            "before": result["before"],
            "augmented": result["augmented"],
            "after": result["after"],
            "target": result["target"],
            "strategy": result["strategy"],
            "low_confidence": result.get("low_confidence", False)
        }
        augmenter.metadata["total_augmented"] = result["augmented"]
        augmenter.metadata["total_final"] = result["after"]
    else:
        results = augmenter.augment_all()
    
    augmenter.print_report(results)


if __name__ == "__main__":
    main()
