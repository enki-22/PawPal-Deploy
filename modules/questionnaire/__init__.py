from .question_flow import SymptomQuestionnaire, load_question_tree
from .symptom_standardizer import standardize_symptom

# Backwards compatibility with previously added orchestrator
try:
    from .smart_symptom_assistant import SmartSymptomAssistant
except Exception:  # pragma: no cover
    SmartSymptomAssistant = None  # type: ignore

__all__ = [
    "SymptomQuestionnaire",
    "load_question_tree",
    "standardize_symptom",
    "SmartSymptomAssistant",
]
