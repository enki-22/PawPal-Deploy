import difflib


SYMPTOM_MAPPINGS = {
    # Digestive
    "throwing up": "vomiting",
    "puking": "vomiting",
    "upset stomach": "nausea",
    "loose stool": "diarrhea",
    "runny poop": "diarrhea",
    "not eating": "loss_of_appetite",
    "won't eat": "loss_of_appetite",

    # Respiratory
    "breathing weird": "respiratory_distress",
    "can't breathe": "dyspnea",
    "wheezing": "wheezing",
    "stuffy nose": "nasal_congestion",

    # Behavioral
    "acting weird": "behavioral_change",
    "seems sad": "lethargy",
    "not playing": "lethargy",
    "hiding": "social_withdrawal",

    # Pain/mobility
    "limping": "lameness",
    "won't walk": "reluctance_to_move",
    "yelping": "pain_vocalization",
}


def standardize_symptom(user_text):
    user_text = user_text.lower().strip()
    if user_text in SYMPTOM_MAPPINGS:
        return SYMPTOM_MAPPINGS[user_text]
    close = difflib.get_close_matches(user_text, SYMPTOM_MAPPINGS.keys(), n=1, cutoff=0.8)
    if close:
        return SYMPTOM_MAPPINGS[close[0]]
    return user_text
