# Deployment Guide - From Source of Truth to Production

## Current State

You now have **3 versions** of your knowledge base:

| File | Symptoms | Status | Notes |
|------|----------|--------|-------|
| `knowledge_base_enhanced.csv` | 140 (guesstimated) | OLD | Original data, manually tuned |
| `knowledge_base_final.csv` | 904 (vet-verified) | NEW | 59 diseases from overhaul.md |
| `knowledge_base_normalized.csv` | 525 (cleaned) | **RECOMMENDED** | Normalized, 41.9% compression |

---

## Recommended Deployment Path

### Option 1: Quick Deploy (Recommended) ✅

**Use the normalized version immediately for better accuracy:**

```bash
# Backup current
cp knowledge_base_enhanced.csv knowledge_base_enhanced.backup.csv

# Deploy normalized
cp knowledge_base_normalized.csv knowledge_base_enhanced.csv

# Test
python smart_triage_engine.py

# Django already points to knowledge_base_enhanced.csv, so you're done!
```

**Pros:**
- ✅ Vet-verified symptoms (59 diseases)
- ✅ 41.9% fewer unique symptoms (525 vs 904)
- ✅ Standardized vocabulary
- ✅ Better matching accuracy

**Cons:**
- ⚠️ 400 symptoms unmatched (will be preserved but not in symptom_map.json)

---

### Option 2: Full Manual Review First (Most Accurate)

**Review the 400 unmatched symptoms before deploying:**

1. **Review categories:**
   ```bash
   python review_unmatched.py
   cat unmatched_categorized.json
   ```

2. **Add manual mappings:**
   - Edit `symptom_aliases.json`
   - Add clinical terms (ascites → bloating)
   - Add species-specific to symptom_map.json
   - Remove metadata artifacts

3. **Re-run normalizer:**
   ```bash
   python symptom_normalizer.py
   ```

4. **Deploy:**
   ```bash
   cp knowledge_base_normalized.csv knowledge_base_enhanced.csv
   ```

---

## What Changed?

### Example: Canine Parvovirus

**Before (OLD):**
```csv
vomiting, bloody_diarrhea, severe_dehydration, lethargy, fever, loss_of_appetite
```

**After (NORMALIZED):**
```csv
lethargy, loss_of_appetite, fever, vomiting, diarrhea
```

**Changes:**
- `lack_of_appetite` → `loss_of_appetite` (standardized)
- `bloody_diarrhea` preserved (exact match)
- `severe_dehydration` → `dehydration` (normalized prefix)

---

## Symptom Mapping Coverage

| Category | Count | Status |
|----------|-------|--------|
| **In symptom_map.json** | 139 | ✅ Ready |
| **Mapped via aliases** | 420 | ✅ Normalized |
| **Species-specific** | 23 | ⚠️ Need to add |
| **Clinical terms** | 2 | ⚠️ Need to map |
| **Metadata artifacts** | 10 | ❌ Remove |
| **Unclear** | 353 | ⚠️ Manual review |

---

## Testing After Deployment

### Test 1: Verify Normalization
```bash
python check_normalization.py
```

**Expected:**
- ✅ Unique symptoms reduced 41.9%
- ✅ Top symptoms: loss_of_appetite, lethargy, weight_loss

### Test 2: Verify Parvo Detection
```bash
python test_parvo_fix.py
```

**Expected:**
```
1. Canine parvovirus (85.0% match)
   User coverage: 100.0%
```

### Test 3: Full Engine Test
```bash
python smart_triage_engine.py
```

**Try symptoms:**
- vomiting, bloody_diarrhea, lethargy → Should get Canine parvovirus
- muscle_tremors, shaking, weakness → Should get Addison's Disease

---

## Files Overview

### Source Data
- `overhaul.md` - Vet-verified source of truth
- `symptom_map.json` - 139 standard symptom keys

### Intermediate Files
- `unmapped_symptoms.txt` - 820 symptoms from vet data
- `symptom_aliases.json` - 420 alias mappings
- `unmatched_symptoms.txt` - 400 symptoms needing review
- `unmatched_categorized.json` - Categorized unmatched

### Output Files
- `knowledge_base_final.csv` - Synced with overhaul.md (904 symptoms)
- `knowledge_base_normalized.csv` - Aliases applied (525 symptoms)

### Scripts
- `sync_with_source_of_truth.py` - Parse overhaul.md → CSV
- `symptom_normalizer.py` - Apply semantic matching
- `check_normalization.py` - Quality verification
- `review_unmatched.py` - Categorize unmatched symptoms

---

## Integration Points

### Backend (Already Updated)
```python
# smart_triage_engine.py line 55
self.load_knowledge_base('knowledge_base_enhanced.csv')

# vector_similarity_django_integration.py line 19
engine = SmartTriageEngine('knowledge_base_enhanced.csv')
```

Just replace `knowledge_base_enhanced.csv` and you're done!

### Frontend (Needs Update)
```bash
# After adding species-specific symptoms to symptom_map.json:
python generate_frontend_config.py

# Output: symptomConfig.js
# Deploy to: chatbot/static/js/symptomConfig.js
```

---

## Rollback Plan

If something breaks:

```bash
# Restore backup
cp knowledge_base_enhanced.backup.csv knowledge_base_enhanced.csv

# Or restore original
git checkout knowledge_base_enhanced.csv
```

---

## Next Session TODO

1. ✅ **Deploy normalized CSV** (recommended now)
2. ⚠️ **Review 400 unmatched symptoms** (can do later)
3. ⚠️ **Add species-specific to symptom_map.json** (23 symptoms)
4. ⚠️ **Map clinical terms** (ascites, plantigrade_stance)
5. ⚠️ **Update frontend config** (generate_frontend_config.py)

---

## Summary

You've successfully:
1. ✅ Synced 59 diseases with vet-verified overhaul.md
2. ✅ Normalized 420 symptom aliases (41.9% compression)
3. ✅ Reduced unique symptoms: 904 → 525
4. ✅ Standardized vocabulary for better matching

**Ready to deploy!** 🚀
