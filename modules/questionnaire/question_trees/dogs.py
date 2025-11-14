DOG_QUESTION_TREE = {
    "entry": {
        "question": "What is your main concern about your dog?",
        "options": [
            {"text": "Digestive issues", "next": "digestive_1"},
            {"text": "Skin/coat problems", "next": "skin_1"},
            {"text": "Breathing problems", "next": "respiratory_1"},
            {"text": "Mobility/pain", "next": "mobility_1"},
            {"text": "Behavioral changes", "next": "behavior_1"},
            {"text": "Other", "next": "other_1"}
        ]
    },
    "digestive_1": {
        "question": "Is your dog vomiting, having diarrhea, or both?",
        "options": [
            {"text": "Vomiting only", "next": "vomit_details", "symptom": "vomiting"},
            {"text": "Diarrhea only", "next": "diarrhea_details", "symptom": "diarrhea"},
            {"text": "Both", "next": "gi_severity", "symptoms": ["vomiting", "diarrhea"]}
        ]
    },
    "vomit_details": {
        "question": "How many times has your dog vomited in the last 24 hours?",
        "options": [
            {"text": "1-2 times", "next": "vomit_content", "severity": "mild"},
            {"text": "3-5 times", "next": "vomit_content", "severity": "moderate"},
            {"text": "More than 5 times", "next": "vomit_content", "severity": "severe"}
        ]
    },
    "vomit_content": {
        "question": "What does the vomit look like?",
        "options": [
            {"text": "Food/bile (yellow)", "next": "appetite_check"},
            {"text": "Clear/foamy", "next": "appetite_check"},
            {"text": "Blood or coffee-ground appearance", "next": "emergency_alert", "flag": "URGENT"}
        ]
    },
}
