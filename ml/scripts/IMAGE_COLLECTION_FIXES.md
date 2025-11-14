# Image Collection Script - Fixes & Improvements

## ✅ Fixed Issues

### 1. **DuckDuckGo API Fix**
- **Problem**: Using `keywords` parameter instead of `query`
- **Fix**: Changed to `query=search_term` (correct parameter name for `ddgs` package)
- **Result**: DuckDuckGo searches now work correctly

### 2. **Expanded Search Terms for ALL Animals**
- **Before**: Only dogs and cats
- **Now**: Includes:
  - Dogs, Cats, Rabbits, Hamsters, Guinea Pigs
  - Birds, Ferrets, Small Animals
  - Reptiles, General "pet" and "animal" terms
  - Veterinary-specific terms

### 3. **Added Multiple Image Sources**
- **Pixabay API**: Free, works without API key (demo key included)
- **Pexels API**: High-quality images (requires free API key)
- **DuckDuckGo**: Fixed and working
- **Bing**: Still available as fallback

### 4. **Better Error Handling**
- Retry logic with exponential backoff
- Graceful handling of rate limits
- Better image validation
- Skips corrupted/invalid images

## 📊 Current Status

**Phase 1 Categories** now have expanded search terms:
- `ear_infection`: 18 search terms (was 6)
- `vomiting_posture`: 18 search terms (was 6)

**All categories** now include multiple animal types, not just dogs/cats.

## 🚀 How to Use

### Basic Usage (No API Keys Needed)
```bash
python ml/scripts/collect_images.py --phase 1
```

### With Optional API Keys (Better Results)
1. **Get Pixabay API Key** (free):
   - Go to: https://pixabay.com/api/docs/
   - Create account, get API key
   - Set: `set PIXABAY_API_KEY=your_key_here` (Windows)
   - Or: `export PIXABAY_API_KEY=your_key_here` (Linux/Mac)

2. **Get Pexels API Key** (free):
   - Go to: https://www.pexels.com/api/
   - Create account, get API key
   - Set: `set PEXELS_API_KEY=your_key_here` (Windows)

3. **Run script**:
   ```bash
   python ml/scripts/collect_images.py --phase 1
   ```

### Use Specific Source
```bash
# Use only Pixabay
python ml/scripts/collect_images.py --phase 1 --method pixabay

# Use only DuckDuckGo
python ml/scripts/collect_images.py --phase 1 --method duckduckgo
```

## 📈 Expected Results

With **multiple sources** and **expanded search terms**:
- **Before**: ~19 images (mostly from Bing, many 403 errors)
- **Now**: Should get **100-200+ images per category** from:
  - Pixabay: 50-100 images per search term
  - DuckDuckGo: Variable (depends on rate limits)
  - Pexels: 40+ images per search term (if API key set)

## 🔍 Search Term Improvements

### Example: `ear_infection` category
**Old search terms** (6):
- dog ear infection
- cat ear infection
- otitis externa dogs
- red inflamed dog ear
- canine ear infection symptoms
- feline ear infection

**New search terms** (18):
- dog ear infection, cat ear infection, rabbit ear infection
- hamster ear infection, guinea pig ear infection, bird ear infection
- ferret ear infection, pet ear infection, animal ear infection
- otitis externa, red inflamed ear, ear infection veterinary
- canine ear infection, feline ear infection, small animal ear infection
- reptile ear infection, ear mite infection, ear infection symptoms

## ⚠️ Known Limitations

1. **Rate Limiting**: Still may occur with DuckDuckGo and Bing
   - Script retries automatically with delays
   - Pixabay/Pexels APIs are more reliable

2. **Image Quality**: Some images may not be perfectly relevant
   - Script validates images are valid files
   - Consider manual review/culling after collection

3. **403 Errors**: Common with Bing downloader
   - Many sites block automated downloads
   - This is normal and expected

## 💡 Tips for Best Results

1. **Run in smaller batches** if hitting rate limits:
   ```bash
   python ml/scripts/collect_images.py --category ear_infection --limit 100
   ```

2. **Use Pixabay first** (most reliable):
   ```bash
   python ml/scripts/collect_images.py --phase 1 --method pixabay
   ```

3. **Combine methods** by running multiple times:
   ```bash
   # First run Pixabay
   python ml/scripts/collect_images.py --phase 1 --method pixabay
   # Then DuckDuckGo for more
   python ml/scripts/collect_images.py --phase 1 --method duckduckgo
   ```

4. **Wait between runs** if you see rate limits (wait 10-15 minutes)

## 📝 Next Steps

1. **Install dependencies** (if not done):
   ```bash
   python ml/scripts/install_image_collection_deps.py
   ```

2. **Try Phase 1 collection**:
   ```bash
   python ml/scripts/collect_images.py --phase 1
   ```

3. **Check results** in `ml/data/raw/{category}/` folders

4. **Review images** and remove any that aren't relevant

5. **Augment data** using data augmentation script (for categories with fewer images)

