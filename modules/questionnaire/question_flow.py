from .question_trees import dogs


def load_question_tree(species):
    species = str(species).lower()
    if species == "dog":
        return dogs.DOG_QUESTION_TREE
    return {}


class SymptomQuestionnaire:
    def __init__(self, species):
        self.tree = load_question_tree(species)
        self.current_node = "entry"
        self.collected_symptoms = []
        self.severity_scores = {}
        self.flags = []

    def get_current_question(self):
        node = self.tree[self.current_node]
        return {
            "question": node["question"],
            "options": node["options"],
        }

    def process_answer(self, option_index):
        node = self.tree[self.current_node]
        selected = node["options"][option_index]
        if "symptom" in selected:
            self.collected_symptoms.append(selected["symptom"])
        if "symptoms" in selected:
            self.collected_symptoms.extend(selected["symptoms"])
        if "severity" in selected:
            self.severity_scores[self.current_node] = selected["severity"]
        if "flag" in selected:
            self.flags.append(selected["flag"])
        self.current_node = selected["next"]
        if self.current_node == "complete":
            return self.finalize()
        else:
            return self.get_current_question()

    def finalize(self):
        return {
            "symptoms": self.collected_symptoms,
            "severity": self.severity_scores,
            "flags": self.flags,
            "ready_for_classification": True,
        }
