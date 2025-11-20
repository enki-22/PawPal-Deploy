# PawPal Safety Metrics Report

**Model Version:** 1.0  
**Training Date:** 11/19/2025
**Dataset:** 

 samples, 38 critical diseases

---

## Critical Disease Performance

### Diseases Meeting Safety Threshold (≥85% Sensitivity)

| Disease | Sensitivity | Support | Status |
|---------|-------------|---------|--------|
| Canine Parvovirus | 95.2% | 42 | ✅ PASS |
| Bloat/GDV | 91.7% | 36 | ✅ PASS |
| [... all passing diseases ...] | | | |

**Total:** 34/38 (89.47%) PASS

---

### Diseases Requiring Improvement (<85% Sensitivity)

| Disease | Sensitivity | FNR | Support | Action Required |
|---------|-------------|-----|---------|-----------------|
| Asthma | 83.3% | 16.7% | 18 | Class weight adjustment |
| Cold Water Shock | 56.2% | 43.8% | 16 | More training data |

**Total:** 4/38 (10.53%) FAIL

---

## Deployment Status

⚠️ **BLOCKED** - Model requires improvement before clinical deployment

**Reason:** 4 critical diseases below 85% sensitivity threshold
(Cold Water Shock, pH shock, Metabolic Bone Disease, Liver Coccidiosis)

**Required Actions:**
1. Collect additional training data for Cold Water Shock
2. Apply class weight adjustment for Asthma
3. Re-train and re-evaluate
4. Target: 100% of critical diseases ≥85% sensitivity

---

*This report is auto-generated from `train_model.py` output.*