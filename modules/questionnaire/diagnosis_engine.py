from collections import Counter

# Placeholder RF import
try:  # pragma: no cover - optional dependency
    from sklearn.ensemble import RandomForestClassifier  # type: ignore
    rf_available = True
except Exception:  # pragma: no cover
    rf_available = False

# Placeholder trained model (empty)
rf_model = RandomForestClassifier() if rf_available else None

# Example condition profiles (for fallback)
CONDITION_PROFILES = {
    "gastroenteritis": {
        "common": ["vomiting", "diarrhea", "lethargy", "loss_of_appetite"],
        "pathognomonic": [],
        "conflicting": [],
    },
    "foreign_body_ingestion": {
        "common": ["vomiting", "abdominal_pain", "loss_of_appetite"],
        "pathognomonic": ["inability_to_keep_food_down"],
        "conflicting": [],
    },
    "pancreatitis": {
        "common": ["vomiting", "abdominal_pain", "lethargy", "loss_of_appetite"],
        "pathognomonic": [],
        "conflicting": [],
    },
    # Add more placeholder conditions
}

# Example urgency mapping
CONDITION_URGENCY = {
 


def get_matching_symptoms(user_symptoms, condition):
    profile = CONDITION_PROFILES.get(condition, {})
    common = profile.get("common", [])
    return list(set(user_symptoms) & set(common))


def get_typical_symptoms(condition):
    profile = CONDITION_PROFILES.get(condition, {})
    return set(profile.get("common", []))


def get_condition_urgency(condition):
    return CONDITION_URGENCY.get(condition, "Medium")


def calculate_diagnostic_confidence(symptoms, condition):
    """Return 0-95% confidence score"""
    typical = CONDITION_PROFILES.get(condition, {}).get("common", [])
    pathognomonic = CONDITION_PROFILES.get(condition, {}).get("pathognomonic", [])
    conflicting = CONDITION_PROFILES.get(condition, {}).get("conflicting", [])

    matching = len(set(symptoms) & set(typical))
    total_common = len(typical)

    base_conf = (matching / total_common) * 100 if total_common else 0

    if any(s in symptoms for s in pathognomonic):
        base_conf = min(base_conf + 20, 95)

    for conflict in conflicting:
        if conflict in symptoms:
            base_conf -= 15

    return max(0, min(base_conf, 95))


def get_differential_diagnosis(symptoms, top_k=3):
    """
    Returns top_k possible conditions, sorted by probability/confidence.
    Uses RF if trained; otherwise, uses frequency-based heuristic.
    """
    differentials = []

    if rf_available and rf_model is not None and hasattr(rf_model, "classes_"):
        # Placeholder vectorization
        symptom_vector = [1] * len(symptoms)  # For demo only
        try:
            probabilities = rf_model.predict_proba([symptom_vector])
            top_indices = (-probabilities[0]).argsort()[:top_k]

            for idx in top_indices:
                condition = rf_model.classes_[idx]
                probability = float(probabilities[0][idx])
                if probability > 0.1:
                    differentials.append({
                        "condition": condition,
                        "probability": probability,
                        "matching_symptoms": get_matching_symptoms(symptoms, condition),
                        "additional_symptoms_to_check": get_typical_symptoms(condition) - set(symptoms),
                        "urgency": get_condition_urgency(condition),
                    })
        except Exception:
            # Fallback to heuristic below
            pass
    if not differentials:
        # Fallback: frequency-based scoring
        for condition, profile in CONDITION_PROFILES.items():
            common = profile.get("common", [])
            if not common:
                continue
            score = len(set(symptoms) & set(common))
            if score > 0:
                differentials.append({
                    "condition": condition,
                    "probability": score / len(common),
                    "matching_symptoms": get_matching_symptoms(symptoms, condition),
                    "additional_symptoms_to_check": get_typical_symptoms(condition) - set(symptoms),
                    "urgency": get_condition_urgency(condition),
                })
        # Sort by descending probability
        differentials.sort(key=lambda x: x["probability"], reverse=True)
        differentials = differentials[:top_k]

    return differentials


def get_differential_diagnosis_with_confidence(symptoms, top_k=3):
    """
    Returns top_k conditions with:
    - Probability/confidence
    - Matching symptoms
    - Additional symptoms to check
    - Urgency level
    """
    differentials = []

    if rf_available and rf_model is not None and hasattr(rf_model, "classes_"):
        symptom_vector = [1] * len(symptoms)  # placeholder vectorization
        try:
            probabilities = rf_model.predict_proba([symptom_vector])
            top_indices = (-probabilities[0]).argsort()[:top_k]
            for idx in top_indices:
                condition = rf_model.classes_[idx]
                prob = float(probabilities[0][idx])
                if prob > 0.1:
                    conf = calculate_diagnostic_confidence(symptoms, condition)
                    differentials.append({
                        "condition": condition,
                        "probability": prob,
                        "confidence": conf,
                        "matching_symptoms": get_matching_symptoms(symptoms, condition),
                        "additional_symptoms_to_check": get_typical_symptoms(condition) - set(symptoms),
                        "urgency": get_condition_urgency(condition),
                    })
        except Exception:
            pass
    if not differentials:
        for condition, profile in CONDITION_PROFILES.items():
            common = profile.get("common", [])
            if not common:
                continue
            score = len(set(symptoms) & set(common))
            if score > 0:
                conf = calculate_diagnostic_confidence(symptoms, condition)
                differentials.append({
                    "condition": condition,
                    "probability": score / len(common),
                    "confidence": conf,
                    "matching_symptoms": get_matching_symptoms(symptoms, condition),
                    "additional_symptoms_to_check": get_typical_symptoms(condition) - set(symptoms),
                    "urgency": get_condition_urgency(condition),
                })
        differentials.sort(key=lambda x: x["confidence"], reverse=True)
        differentials = differentials[:top_k]

    return differentials


def display_differential(differentials):
    output = "🔍 Differential Diagnosis:\n\n"
    for i, d in enumerate(differentials, 1):
        name = str(d.get("condition", "")).replace("_", " ").capitalize()
        output += f"{i}. {name} ({d.get('confidence', 0):.0f}% confidence)\n"
        matching = ", ".join(d.get("matching_symptoms", []))
        output += f"   ✓ Matching: {matching}\n"
        addl = d.get("additional_symptoms_to_check", set())
        if addl:
            output += f"   ? Also check for: {', '.join(addl)}\n"
        output += f"   ⚠️ Urgency: {d.get('urgency', 'Medium')}\n\n"
    return output


class DiagnosisEngine:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42) if rf_available else None
        self.feature_keys = []
        self.rules = {}

    def _to_feature_vector(self, item):
        return [float(item.get(k, 0)) for k in self.feature_keys]

    def train(self, data):
        records = list(data or [])
        if not records:
            self.feature_keys = []
            self.rules = {}
            return
        keys = sorted({k for d in records for k in d.keys() if k != "diagnosis"})
        self.feature_keys = keys
        X = [self._to_feature_vector(d) for d in records]
        y = [str(d.get("diagnosis", "unknown")) for d in records]
        if self.model is not None and X and y:
            try:
                self.model.fit(X, y)
            except Exception:
                self.model = None
        if self.model is None:
            counts = {}
            for diag in y:
                counts[diag] = counts.get(diag, 0) + 1
            self.rules = counts

    def predict(self, symptoms, top_k=3):
        x = self._to_feature_vector(symptoms or {}) if self.feature_keys else []
        if self.model is not None and x:
            try:
                if hasattr(self.model, "predict_proba"):
                    probs = self.model.predict_proba([x])[0]
                    classes = list(self.model.classes_)
                    ranked = sorted(zip(classes, probs), key=lambda t: t[1], reverse=True)[: max(1, int(top_k))]
                    return [{"diagnosis": str(d), "prob": float(p)} for d, p in ranked]
                pred = self.model.predict([x])[0]
                return [{"diagnosis": str(pred), "prob": 1.0}]
            except Exception:
                pass
        ranked = sorted((self.rules or {}).items(), key=lambda t: t[1], reverse=True)[: max(1, int(top_k))]
        return [{"diagnosis": str(d), "prob": float(c)} for d, c in ranked]
