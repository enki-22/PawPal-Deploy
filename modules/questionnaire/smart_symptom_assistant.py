from .question_flow import QuestionFlow
from .symptom_standardizer import SymptomStandardizer
from .diagnosis_engine import DiagnosisEngine


class SmartSymptomAssistant:
    def __init__(self, questions=None):
        self.flow = QuestionFlow(questions)
        self.standardizer = SymptomStandardizer()
        self.engine = DiagnosisEngine()

    def start_session(self):
        return self.flow.start()

    def ask_next(self):
        return self.flow.next_question()

    def submit_answer(self, answer):
        self.flow.submit_answer(answer)

    def get_state(self):
        return self.flow.get_state()

    def standardized_answers(self):
        return self.standardizer.standardize(self.flow.answers)

    def train_diagnosis(self, data):
        self.engine.train(data)

    def diagnose(self, top_k=3):
        return self.engine.predict(self.standardized_answers(), top_k=top_k)
