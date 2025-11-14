from .question_flow import QuestionFlow
from .symptom_standardizer import SymptomStandardizer
from .similar_case_retriever import SimilarCaseRetriever
from .diagnosis_engine import DiagnosisEngine


class SmartSymptomAssistant:
    def __init__(self, questions=None):
        self.flow = QuestionFlow(questions)
        self.standardizer = SymptomStandardizer()
        self.retriever = SimilarCaseRetriever()
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

    def fit_cases(self, cases):
        self.retriever.fit(cases)

    def train_diagnosis(self, data):
        self.engine.train(data)

    def get_similar_cases(self, k=3):
        return self.retriever.retrieve_top_k(self.standardized_answers(), k=k)

    def diagnose(self, top_k=3):
        return self.engine.predict(self.standardized_answers(), top_k=top_k)
