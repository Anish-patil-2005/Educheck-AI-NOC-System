from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import joblib
import os
import json
from scipy.sparse import vstack
from typing import List, Tuple

# Directory to store the persistent TF-IDF models
TFIDF_DATA_DIR = "backend/tfidf_data"
os.makedirs(TFIDF_DATA_DIR, exist_ok=True)

def _get_paths(assignment_id: int) -> Tuple[str, str]:
    """Generates the file paths for a given assignment's vectorizer and vectors."""
    vectorizer_path = os.path.join(TFIDF_DATA_DIR, f"vectorizer_{assignment_id}.joblib")
    vectors_path = os.path.join(TFIDF_DATA_DIR, f"vectors_{assignment_id}.joblib")
    return vectorizer_path, vectors_path

def save_tfidf_data(assignment_id: int, vectorizer, vectors):
    """Saves the vectorizer and TF-IDF vectors for an assignment."""
    vectorizer_path, vectors_path = _get_paths(assignment_id)
    joblib.dump(vectorizer, vectorizer_path)
    joblib.dump(vectors, vectors_path)

def load_tfidf_data(assignment_id: int):
    """Loads the vectorizer and TF-IDF vectors for an assignment."""
    vectorizer_path, vectors_path = _get_paths(assignment_id)
    if os.path.exists(vectorizer_path) and os.path.exists(vectors_path):
        vectorizer = joblib.load(vectorizer_path)
        vectors = joblib.load(vectors_path)
        return vectorizer, vectors
    return None, None

def process_new_submission(
    assignment_id: int, 
    new_document: str
) -> Tuple[bool, float, np.ndarray]:
    """
    Processes a new submission, compares it against existing ones for plagiarism,
    and conditionally updates the stored TF-IDF data.
    """
    PLAGIARISM_THRESHOLD = 0.80 # Using your 80% threshold
    
    vectorizer, existing_vectors = load_tfidf_data(assignment_id)
    
    if vectorizer is None:
        # This is the first submission for this assignment.
        vectorizer = TfidfVectorizer()
        new_vector = vectorizer.fit_transform([new_document])
        # Since it's the first, it can't be plagiarised. Save it as the baseline.
        save_tfidf_data(assignment_id, vectorizer, new_vector)
        return False, 0.0, new_vector
    else:
        # An existing vocabulary exists, use it to transform the new document.
        new_vector = vectorizer.transform([new_document])
        
        # Calculate similarity against all previous submissions.
        similarity_scores = cosine_similarity(new_vector, existing_vectors)
        max_similarity = np.max(similarity_scores) if similarity_scores.size > 0 else 0.0
        
        is_plagiarised = max_similarity >= PLAGIARISM_THRESHOLD
        
        # --- NEW: Conditional Logic ---
        # Only add the new vector to the map if it is NOT plagiarised.
        if not is_plagiarised:
            updated_vectors = vstack([existing_vectors, new_vector])
            # The vectorizer itself doesn't need to be retrained, so we just save the updated vectors.
            # We only save the vectorizer when it's first created.
            _, vectors_path = _get_paths(assignment_id)
            joblib.dump(updated_vectors, vectors_path)

        return is_plagiarised, max_similarity, new_vector

def vector_to_json(vector) -> str:
    """Convert a sparse TF-IDF vector for database storage."""
    # This can be made more efficient for sparse vectors, but works for now.
    return json.dumps(vector.toarray().tolist())