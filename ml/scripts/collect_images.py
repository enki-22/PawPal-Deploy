"""
Automated Image Collection Script for Pet Health Categories
Downloads images from multiple sources and organizes them by class.

Usage:
    python ml/scripts/collect_images.py --phase 1
    python ml/scripts/collect_images.py --category ear_infection --limit 500
    python ml/scripts/collect_images.py --all
"""

import os
import sys
import time
import requests
from pathlib import Path
from typing import List, Dict, Optional
from urllib.parse import urlparse
import hashlib
from PIL import Image
from io import BytesIO
from tqdm import tqdm
import argparse

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent.parent))

# Try to import image download libraries
try:
    from bing_image_downloader import downloader as bing_downloader
    BING_AVAILABLE = True
except ImportError:
    BING_AVAILABLE = False
    print("⚠️  bing-image-downloader not installed. Install with: pip install bing-image-downloader")

try:
    from google_images_download import google_images_download
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False
    print("⚠️  google-images-download not installed. Install with: pip install google-images-download")

# Try DuckDuckGo (no API key needed) - updated package name
try:
    from ddgs import DDGS
    DUCKDUCKGO_AVAILABLE = True
except ImportError:
    try:
        # Fallback to old package name
        from duckduckgo_search import DDGS
        DUCKDUCKGO_AVAILABLE = True
    except ImportError:
        DUCKDUCKGO_AVAILABLE = False
        print("⚠️  ddgs not installed. Install with: pip install ddgs")

# Try Pexels API (free, high quality)
try:
    from pexels_api import API as PexelsAPI
    PEXELS_AVAILABLE = True
except ImportError:
    PEXELS_AVAILABLE = False

# Try Unsplash API (free, high quality)
try:
    import unsplash
    UNSPLASH_AVAILABLE = True
except ImportError:
    UNSPLASH_AVAILABLE = False

# Try Pixabay API (free)
try:
    import pixabay
    PIXABAY_AVAILABLE = True
except ImportError:
    PIXABAY_AVAILABLE = False


class ImageCollector:
    """Automated image collector for pet health categories"""
    
    def __init__(self, base_dir: str = "ml/data/raw"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        
        # Image categories and their search terms
        self.categories = {
            # PHASE 1: CRITICAL GAPS (ZERO images)
            "ear_infection": {
                "limit": 500,
                "search_terms": [
                    # All animals - comprehensive search
                    "dog ear infection", "cat ear infection", "rabbit ear infection",
                    "hamster ear infection", "guinea pig ear infection", "bird ear infection",
                    "ferret ear infection", "pet ear infection", "animal ear infection",
                    "otitis externa", "red inflamed ear", "ear infection veterinary",
                    "canine ear infection", "feline ear infection", "small animal ear infection",
                    "reptile ear infection", "ear mite infection", "ear infection symptoms"
                ],
                "priority": 1
            },
            "vomiting_posture": {
                "limit": 500,
                "search_terms": [
                    # All animals - comprehensive search
                    "dog vomiting", "cat vomiting", "rabbit vomiting",
                    "hamster vomiting", "guinea pig vomiting", "bird vomiting",
                    "ferret vomiting", "pet vomiting", "animal vomiting",
                    "pet nausea posture", "throwing up", "vomiting veterinary",
                    "canine vomiting", "feline vomiting", "small animal vomiting",
                    "vomiting posture", "pet digestive upset", "animal nausea"
                ],
                "priority": 1
            },
            # PHASE 2: HIGH PRIORITY
            "hot_spots": {
                "limit": 300,
                "search_terms": [
                    "dog hot spots", "cat hot spots", "pet hot spots",
                    "acute moist dermatitis", "pyotraumatic dermatitis",
                    "skin lesions", "canine hot spots", "feline hot spots",
                    "pet skin infection", "animal skin lesions", "pet dermatitis",
                    "small animal skin lesions", "rabbit skin infection"
                ],
                "priority": 2
            },
            "healthy_normal": {
                "limit": 300,
                "search_terms": [
                    "healthy dog", "healthy cat", "healthy rabbit",
                    "healthy hamster", "healthy guinea pig", "healthy bird",
                    "healthy ferret", "normal pet", "pet health check",
                    "happy healthy pet", "healthy pet photo", "normal animal",
                    "healthy small animal", "pet wellness check"
                ],
                "priority": 2
            },
            "conjunctivitis": {
                "limit": 100,
                "search_terms": [
                    "dog pink eye", "cat conjunctivitis", "rabbit conjunctivitis",
                    "pet eye infection", "canine conjunctivitis", "feline conjunctivitis",
                    "red eyes", "pet eye disease", "animal conjunctivitis",
                    "small animal eye infection", "bird eye infection"
                ],
                "priority": 2
            },
            # PHASE 3: MEDIUM PRIORITY
            "wound_laceration": {
                "limit": 400,
                "search_terms": [
                    "dog wound", "cat wound", "rabbit wound",
                    "pet cut injury", "animal wound", "pet laceration",
                    "dog injury", "cat injury", "canine wound",
                    "feline wound", "small animal wound", "pet injury",
                    "animal cut", "pet scratch", "veterinary wound"
                ],
                "priority": 3
            },
            "healthy_eyes": {
                "limit": 300,
                "search_terms": [
                    "healthy dog eyes", "normal cat eyes", "healthy rabbit eyes",
                    "clear pet eyes", "healthy canine eyes", "healthy feline eyes",
                    "normal pet eyes", "healthy bird eyes", "clear animal eyes",
                    "healthy small animal eyes", "normal pet vision"
                ],
                "priority": 3
            },
            "gingivitis": {
                "limit": 300,
                "search_terms": [
                    "dog gingivitis", "cat gum disease", "rabbit dental disease",
                    "pet dental disease", "red swollen gums", "canine gingivitis",
                    "feline gingivitis", "pet gum inflammation", "animal dental disease",
                    "small animal gingivitis", "pet oral health", "veterinary dental"
                ],
                "priority": 3
            },
            "tartar_buildup": {
                "limit": 300,
                "search_terms": [
                    "dog tartar", "cat dental tartar", "rabbit tartar",
                    "pet tooth plaque", "calculus dog teeth", "dental tartar",
                    "pet dental calculus", "animal tartar", "pet plaque buildup",
                    "small animal tartar", "pet dental care", "veterinary tartar"
                ],
                "priority": 3
            },
            "nasal_discharge": {
                "limit": 300,
                "search_terms": [
                    "dog nasal discharge", "cat runny nose", "rabbit nasal discharge",
                    "pet respiratory discharge", "canine nasal discharge",
                    "feline nasal discharge", "pet runny nose", "animal nasal discharge",
                    "small animal respiratory", "pet sneezing", "veterinary respiratory"
                ],
                "priority": 3
            },
            # PHASE 4: LOWER PRIORITY (collect 100-150, augment later)
            "healthy_ears": {
                "limit": 100,
                "search_terms": [
                    "healthy dog ears", "normal cat ears", "healthy rabbit ears",
                    "clean pet ears", "healthy animal ears", "normal pet ears",
                    "healthy small animal ears", "clean animal ears"
                ],
                "priority": 4
            },
            "ear_mites": {
                "limit": 100,
                "search_terms": [
                    "dog ear mites", "cat ear mites", "rabbit ear mites",
                    "pet ear mites", "canine ear mites", "feline ear mites",
                    "animal ear mites", "small animal ear mites", "pet ear parasite"
                ],
                "priority": 4
            },
            "hematoma": {
                "limit": 100,
                "search_terms": [
                    "dog ear hematoma", "cat ear hematoma", "rabbit ear hematoma",
                    "pet ear hematoma", "swollen ear", "animal ear hematoma",
                    "pet ear swelling", "veterinary hematoma"
                ],
                "priority": 4
            },
            "healthy_teeth": {
                "limit": 100,
                "search_terms": [
                    "healthy dog teeth", "normal cat teeth", "healthy rabbit teeth",
                    "clean pet teeth", "healthy animal teeth", "normal pet teeth",
                    "healthy small animal teeth", "pet dental health"
                ],
                "priority": 4
            },
            "broken_tooth": {
                "limit": 100,
                "search_terms": [
                    "dog broken tooth", "cat broken tooth", "rabbit broken tooth",
                    "pet dental fracture", "animal broken tooth", "pet tooth injury",
                    "small animal dental fracture", "veterinary dental fracture"
                ],
                "priority": 4
            },
            "healthy_respiratory": {
                "limit": 100,
                "search_terms": [
                    "healthy dog breathing", "normal cat breathing", "healthy rabbit breathing",
                    "healthy pet respiratory", "normal animal breathing", "healthy pet breathing",
                    "healthy small animal breathing", "normal respiratory"
                ],
                "priority": 4
            },
            "labored_breathing": {
                "limit": 100,
                "search_terms": [
                    "dog labored breathing", "cat labored breathing", "rabbit labored breathing",
                    "pet breathing difficulty", "animal labored breathing", "pet respiratory distress",
                    "small animal breathing difficulty", "veterinary respiratory distress"
                ],
                "priority": 4
            },
            "healthy_digestive": {
                "limit": 100,
                "search_terms": [
                    "healthy dog", "healthy cat", "healthy rabbit",
                    "normal pet digestive", "healthy pet digestion", "normal animal digestive",
                    "healthy small animal digestive", "pet digestive health"
                ],
                "priority": 4
            },
            "diarrhea_signs": {
                "limit": 100,
                "search_terms": [
                    "dog diarrhea", "cat diarrhea", "rabbit diarrhea",
                    "pet diarrhea symptoms", "animal diarrhea", "pet digestive upset",
                    "small animal diarrhea", "veterinary diarrhea"
                ],
                "priority": 4
            },
            "uncertain_other": {
                "limit": 100,
                "search_terms": [
                    "pet health concern", "animal illness", "pet symptoms",
                    "animal disease", "pet health problem", "veterinary concern",
                    "pet health issue", "animal health concern"
                ],
                "priority": 4
            }
        }
        
        # Track downloaded images to avoid duplicates
        self.downloaded_hashes = set()
        
        # Load API keys from environment if available
        self.pexels_api_key = os.getenv('PEXELS_API_KEY', None)
        self.pixabay_api_key = os.getenv('PIXABAY_API_KEY', None)
        self.unsplash_api_key = os.getenv('UNSPLASH_API_KEY', None)
        
    def get_category_dir(self, category: str) -> Path:
        """Get directory path for a category"""
        category_dir = self.base_dir / category
        category_dir.mkdir(parents=True, exist_ok=True)
        return category_dir
    
    def calculate_image_hash(self, image_data: bytes) -> str:
        """Calculate hash of image data to detect duplicates"""
        return hashlib.md5(image_data).hexdigest()
    
    def is_valid_image(self, image_data: bytes) -> bool:
        """Validate image can be opened and is valid"""
        try:
            img = Image.open(BytesIO(image_data))
            img.verify()
            return True
        except Exception:
            return False
    
    def download_image(self, url: str, timeout: int = 15) -> Optional[bytes]:
        """Download image from URL with better error handling"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.google.com/',
            }
            
            # Skip if URL looks suspicious
            if not url or not url.startswith(('http://', 'https://')):
                return None
            
            response = requests.get(url, headers=headers, timeout=timeout, stream=True, allow_redirects=True)
            
            # Don't raise on 403/404 - just skip
            if response.status_code in [403, 404]:
                return None
            
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '').lower()
            if not content_type.startswith('image/'):
                return None
            
            image_data = response.content
            
            # Skip if too small (likely not a real image)
            if len(image_data) < 1000:
                return None
            
            # Validate image
            if not self.is_valid_image(image_data):
                return None
            
            return image_data
        except requests.exceptions.Timeout:
            return None
        except requests.exceptions.RequestException:
            return None
        except Exception:
            return None
    
    def save_image(self, image_data: bytes, category: str, filename: str) -> bool:
        """Save image to category directory"""
        # Check for duplicates
        image_hash = self.calculate_image_hash(image_data)
        if image_hash in self.downloaded_hashes:
            return False
        
        # Save image
        category_dir = self.get_category_dir(category)
        filepath = category_dir / filename
        
        try:
            with open(filepath, 'wb') as f:
                f.write(image_data)
            self.downloaded_hashes.add(image_hash)
            return True
        except Exception as e:
            print(f"Error saving image: {e}")
            return False
    
    def collect_with_duckduckgo(self, category: str, search_terms: List[str], limit: int) -> int:
        """Collect images using DuckDuckGo (no API key needed)"""
        if not DUCKDUCKGO_AVAILABLE:
            return 0
        
        print(f"\n🔍 Using DuckDuckGo for {category}...")
        downloaded = 0
        category_dir = self.get_category_dir(category)
        existing_count = len(list(category_dir.glob("*.jpg"))) + len(list(category_dir.glob("*.png")))
        
        if existing_count >= limit:
            print(f"  ✅ Already have {existing_count} images, skipping...")
            return 0
        
        max_retries = 3
        retry_delay = 10  # seconds to wait on rate limit
        
        for attempt in range(max_retries):
            try:
                with DDGS() as ddgs:
                    for search_term in search_terms:
                        if downloaded >= limit:
                            break
                        
                        print(f"  Searching: {search_term}")
                        try:
                            # Fixed: ddgs package uses 'query' parameter, not 'keywords'
                            results = list(ddgs.images(
                                query=search_term,
                                max_results=min(limit * 2, 80),  # Increased results
                                safesearch='moderate'
                            ))
                        except Exception as search_error:
                            if "403" in str(search_error) or "Ratelimit" in str(search_error):
                                print(f"  ⚠️  Rate limited. Waiting {retry_delay} seconds...")
                                time.sleep(retry_delay)
                                retry_delay *= 2  # Exponential backoff
                                continue
                            else:
                                print(f"  ⚠️  Search error: {search_error}")
                                continue
                        
                        successful_downloads = 0
                        for idx, result in enumerate(tqdm(results, desc=f"  Downloading {search_term[:30]}", leave=False)):
                            if downloaded >= limit:
                                break
                            
                            url = result.get('image')
                            if not url:
                                continue
                            
                            image_data = self.download_image(url)
                            if image_data:
                                filename = f"{category}_{len(self.downloaded_hashes)}.jpg"
                                if self.save_image(image_data, category, filename):
                                    downloaded += 1
                                    successful_downloads += 1
                            
                            # Longer rate limiting to avoid 403 errors
                            time.sleep(1.5)  # Increased from 0.5 to 1.5 seconds
                        
                        print(f"  Downloaded {successful_downloads} images from '{search_term}' (Total: {downloaded})")
                        
                        # Delay between search terms
                        time.sleep(3)
                    
                    # Success - break retry loop
                    break
                    
            except Exception as e:
                error_str = str(e)
                if "403" in error_str or "Ratelimit" in error_str:
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        print(f"  ⚠️  Rate limited (attempt {attempt + 1}/{max_retries}). Waiting {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                    else:
                        print(f"  ⚠️  Rate limited after {max_retries} attempts. Skipping DuckDuckGo for now.")
                        break
                else:
                    print(f"  ⚠️  Error with DuckDuckGo: {e}")
                    break
        
        return downloaded
    
    def collect_with_bing(self, category: str, search_terms: List[str], limit: int) -> int:
        """Collect images using Bing Image Downloader"""
        if not BING_AVAILABLE:
            return 0
        
        print(f"\n🔍 Using Bing Image Downloader for {category}...")
        downloaded = 0
        
        try:
            # Use the first search term as primary
            primary_term = search_terms[0]
            temp_dir = self.base_dir / f"_temp_{category}"
            
            # Download to temp directory with error handling
            try:
                bing_downloader.download(
                    primary_term,
                    limit=min(limit, 100),  # Limit to avoid too many downloads at once
                    output_dir=str(temp_dir),
                    adult_filter_off=False,
                    force_replace=False,
                    timeout=120,  # Increased timeout
                    verbose=False
                )
            except KeyboardInterrupt:
                print(f"  ⚠️  Download interrupted by user")
                raise
            except Exception as download_error:
                # Many sites block automated downloads - this is expected
                error_str = str(download_error)
                if "403" in error_str or "Forbidden" in error_str:
                    print(f"  ⚠️  Some images blocked (403 Forbidden) - this is normal for automated downloads")
                    print(f"  💡 Tip: Bing downloader may hit rate limits. Consider using smaller batches or manual collection.")
                else:
                    print(f"  ⚠️  Bing downloader error: {download_error}")
                
                # Try to recover any partially downloaded images
                temp_category_dir = temp_dir / primary_term
                if temp_category_dir.exists():
                    print(f"  📦 Attempting to recover any downloaded images...")
            
            # Move images to category directory
            temp_category_dir = temp_dir / primary_term
            if temp_category_dir.exists():
                category_dir = self.get_category_dir(category)
                
                recovered = 0
                for img_file in temp_category_dir.glob("*"):
                    if img_file.is_file():
                        try:
                            # Read and validate
                            with open(img_file, 'rb') as f:
                                image_data = f.read()
                            
                            if self.save_image(image_data, category, img_file.name):
                                downloaded += 1
                                recovered += 1
                            
                            # Remove temp file
                            img_file.unlink()
                        except Exception as e:
                            # Skip corrupted files
                            continue
                
                if recovered > 0:
                    print(f"  ✅ Recovered {recovered} images")
                
                # Clean up temp directories
                try:
                    if temp_category_dir.exists():
                        temp_category_dir.rmdir()
                    if temp_dir.exists():
                        temp_dir.rmdir()
                except:
                    pass  # Ignore cleanup errors
            
        except KeyboardInterrupt:
            print(f"  ⚠️  Interrupted by user")
            raise
        except Exception as e:
            print(f"  ⚠️  Error with Bing: {e}")
        
        return downloaded
    
    def collect_with_pixabay(self, category: str, search_terms: List[str], limit: int) -> int:
        """Collect images using Pixabay API (free, works without key but better with key)"""
        print(f"\n🔍 Using Pixabay API for {category}...")
        downloaded = 0
        
        # Pixabay API endpoint (works without key but limited)
        api_key = self.pixabay_api_key or "9656065-a4094594c34c9aca8d78bca09"  # Free demo key
        
        try:
            for search_term in search_terms[:5]:  # Limit searches
                if downloaded >= limit:
                    break
                
                print(f"  Searching Pixabay: {search_term}")
                try:
                    # Pixabay API call
                    url = f"https://pixabay.com/api/?key={api_key}&q={search_term}&image_type=photo&safesearch=true&per_page=50"
                    response = requests.get(url, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    photos = data.get('hits', [])
                    
                    for photo in tqdm(photos, desc=f"  Downloading from Pixabay", leave=False):
                        if downloaded >= limit:
                            break
                        
                        # Get large image URL
                        img_url = photo.get('largeImageURL') or photo.get('webformatURL')
                        if img_url:
                            image_data = self.download_image(img_url)
                            if image_data:
                                filename = f"{category}_pixabay_{len(self.downloaded_hashes)}.jpg"
                                if self.save_image(image_data, category, filename):
                                    downloaded += 1
                        
                        time.sleep(0.5)
                    
                    print(f"  Downloaded {downloaded} images from Pixabay")
                    time.sleep(2)  # Rate limiting
                    
                except Exception as e:
                    print(f"  ⚠️  Pixabay search error: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            print(f"  ⚠️  Pixabay API error: {e}")
        
        return downloaded
    
    def collect_with_pexels(self, category: str, search_terms: List[str], limit: int) -> int:
        """Collect images using Pexels API (free, high quality)"""
        if not self.pexels_api_key:
            return 0
        
        print(f"\n🔍 Using Pexels API for {category}...")
        downloaded = 0
        
        try:
            for search_term in search_terms[:3]:  # Limit searches
                if downloaded >= limit:
                    break
                
                print(f"  Searching Pexels: {search_term}")
                try:
                    # Pexels API call
                    url = f"https://api.pexels.com/v1/search"
                    headers = {"Authorization": self.pexels_api_key}
                    params = {"query": search_term, "per_page": 40, "page": 1}
                    
                    response = requests.get(url, headers=headers, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    photos = data.get('photos', [])
                    
                    for photo in tqdm(photos, desc=f"  Downloading from Pexels", leave=False):
                        if downloaded >= limit:
                            break
                        
                        # Get large image URL
                        img_url = photo.get('src', {}).get('large') or photo.get('src', {}).get('original')
                        if img_url:
                            image_data = self.download_image(img_url)
                            if image_data:
                                filename = f"{category}_pexels_{len(self.downloaded_hashes)}.jpg"
                                if self.save_image(image_data, category, filename):
                                    downloaded += 1
                        
                        time.sleep(0.5)
                    
                    print(f"  Downloaded {downloaded} images from Pexels")
                    time.sleep(2)  # Rate limiting
                    
                except Exception as e:
                    print(f"  ⚠️  Pexels search error: {e}")
                    time.sleep(5)
                    
        except Exception as e:
            print(f"  ⚠️  Pexels API error: {e}")
        
        return downloaded
    
    def collect_category(self, category: str, use_methods: List[str] = None) -> Dict[str, int]:
        """Collect images for a specific category"""
        if category not in self.categories:
            print(f"❌ Unknown category: {category}")
            return {}
        
        config = self.categories[category]
        search_terms = config["search_terms"]
        limit = config["limit"]
        
        category_dir = self.get_category_dir(category)
        existing_count = len(list(category_dir.glob("*.jpg"))) + len(list(category_dir.glob("*.png")))
        
        print(f"\n{'='*60}")
        print(f"📦 Category: {category}")
        print(f"   Target: {limit} images")
        print(f"   Existing: {existing_count} images")
        print(f"   Needed: {max(0, limit - existing_count)} images")
        print(f"{'='*60}")
        
        if existing_count >= limit:
            print(f"✅ Already have enough images ({existing_count}/{limit})")
            return {"existing": existing_count, "downloaded": 0}
        
        if use_methods is None:
            # Auto-select best available method
            use_methods = []
            if DUCKDUCKGO_AVAILABLE:
                use_methods.append("duckduckgo")
            if self.pixabay_api_key or True:  # Pixabay works without key too
                use_methods.append("pixabay")
            if self.pexels_api_key:
                use_methods.append("pexels")
            if BING_AVAILABLE:
                use_methods.append("bing")
        
        total_downloaded = 0
        
        for method in use_methods:
            if total_downloaded >= (limit - existing_count):
                break
            
            remaining = limit - existing_count - total_downloaded
            
            if method == "duckduckgo":
                count = self.collect_with_duckduckgo(category, search_terms, remaining)
                total_downloaded += count
            elif method == "bing":
                count = self.collect_with_bing(category, search_terms, remaining)
                total_downloaded += count
            elif method == "pixabay":
                count = self.collect_with_pixabay(category, search_terms, remaining)
                total_downloaded += count
            elif method == "pexels":
                count = self.collect_with_pexels(category, search_terms, remaining)
                total_downloaded += count
        
        final_count = len(list(category_dir.glob("*.jpg"))) + len(list(category_dir.glob("*.png")))
        
        return {
            "existing": existing_count,
            "downloaded": total_downloaded,
            "final": final_count,
            "target": limit
        }
    
    def collect_phase(self, phase: int) -> Dict[str, Dict]:
        """Collect images for a specific phase"""
        phase_categories = {
            1: ["ear_infection", "vomiting_posture"],
            2: ["hot_spots", "healthy_normal", "conjunctivitis"],
            3: ["wound_laceration", "healthy_eyes", "gingivitis", "tartar_buildup", "nasal_discharge"],
            4: ["healthy_ears", "ear_mites", "hematoma", "healthy_teeth", "broken_tooth",
                "healthy_respiratory", "labored_breathing", "healthy_digestive", "diarrhea_signs", "uncertain_other"]
        }
        
        if phase not in phase_categories:
            print(f"❌ Unknown phase: {phase}")
            return {}
        
        categories = phase_categories[phase]
        results = {}
        
        print(f"\n🚀 Starting Phase {phase} collection...")
        print(f"   Categories: {', '.join(categories)}")
        
        for category in categories:
            results[category] = self.collect_category(category)
            time.sleep(2)  # Brief pause between categories
        
        return results
    
    def collect_all(self) -> Dict[str, Dict]:
        """Collect images for all categories"""
        results = {}
        
        # Sort by priority
        sorted_categories = sorted(
            self.categories.items(),
            key=lambda x: (x[1]["priority"], x[0])
        )
        
        print(f"\n🚀 Starting collection for ALL categories...")
        print(f"   Total categories: {len(sorted_categories)}")
        
        for category, config in sorted_categories:
            results[category] = self.collect_category(category)
            time.sleep(2)  # Brief pause between categories
        
        return results
    
    def print_summary(self, results: Dict[str, Dict]):
        """Print collection summary"""
        print(f"\n{'='*60}")
        print("📊 COLLECTION SUMMARY")
        print(f"{'='*60}")
        
        total_existing = 0
        total_downloaded = 0
        total_target = 0
        
        for category, stats in results.items():
            existing = stats.get("existing", 0)
            downloaded = stats.get("downloaded", 0)
            final = stats.get("final", existing + downloaded)
            target = stats.get("target", 0)
            
            total_existing += existing
            total_downloaded += downloaded
            total_target += target
            
            status = "✅" if final >= target else "⚠️"
            print(f"{status} {category:25s} | {final:4d}/{target:4d} | +{downloaded:4d}")
        
        print(f"{'='*60}")
        print(f"Total: {total_existing + total_downloaded}/{total_target} images")
        print(f"  Existing: {total_existing}")
        print(f"  Downloaded: {total_downloaded}")
        print(f"  Remaining: {max(0, total_target - total_existing - total_downloaded)}")
        print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(
        description="Automated image collection for pet health categories",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Collect Phase 1 (critical gaps)
  python ml/scripts/collect_images.py --phase 1
  
  # Collect specific category
  python ml/scripts/collect_images.py --category ear_infection --limit 500
  
  # Collect all categories
  python ml/scripts/collect_images.py --all
  
  # Use specific method
  python ml/scripts/collect_images.py --phase 1 --method duckduckgo
        """
    )
    
    parser.add_argument("--phase", type=int, choices=[1, 2, 3, 4],
                       help="Collect images for a specific phase")
    parser.add_argument("--category", type=str,
                       help="Collect images for a specific category")
    parser.add_argument("--all", action="store_true",
                       help="Collect images for all categories")
    parser.add_argument("--limit", type=int,
                       help="Override limit for category (only works with --category)")
    parser.add_argument("--method", type=str, choices=["duckduckgo", "bing", "pixabay", "pexels"],
                       help="Use specific download method")
    parser.add_argument("--base-dir", type=str, default="ml/data/raw",
                       help="Base directory for images (default: ml/data/raw)")
    
    args = parser.parse_args()
    
    if not any([args.phase, args.category, args.all]):
        parser.print_help()
        return
    
    collector = ImageCollector(base_dir=args.base_dir)
    
    methods = [args.method] if args.method else None
    
    if args.category:
        if args.limit:
            collector.categories[args.category]["limit"] = args.limit
        results = {args.category: collector.collect_category(args.category, use_methods=methods)}
    elif args.phase:
        results = collector.collect_phase(args.phase)
    elif args.all:
        results = collector.collect_all()
    
    collector.print_summary(results)


if __name__ == "__main__":
    main()
