from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .case_database import CASE_DATABASE


def vectorize_case(symptoms, all_symptoms_list):
    """Convert list of symptoms into binary vector"""
    vector = np.zeros(len(all_symptoms_list))
    for i, symptom in enumerate(all_symptoms_list):
        if symptom in symptoms:
            vector[i] = 1
    return vector


def find_similar_cases(current_symptoms, species, top_k=5):
    """Return top_k most similar cases based on cosine similarity"""
    relevant_cases = [c for c in CASE_DATABASE if c["species"] == species]

    # All unique symptoms in the dataset
    all_symptoms = list(set(s for c in relevant_cases for s in c["symptoms"]))

    current_vector = vectorize_case(current_symptoms, all_symptoms)

    similarities = []
    for case in relevant_cases:
        case_vector = vectorize_case(case["symptoms"], all_symptoms)
        similarity = cosine_similarity([current_vector], [case_vector])[0][0]
        similarities.append((case, similarity))

    # Sort descending by similarity
    similarities.sort(key=lambda x: x[1], reverse=True)

    # Return top_k cases above similarity threshold (0.3)
    return [case for case, sim in similarities[:top_k] if sim > 0.3]


class SimilarCaseRetriever:
    """Compatibility wrapper around find_similar_cases for existing imports."""

    def __init__(self, species="dog"):
        self.species = species

    def retrieve_top_k(self, symptoms, k=3):
        return find_similar_cases(list(symptoms or []), self.species, top_k=k)
