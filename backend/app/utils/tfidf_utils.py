from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import joblib
import os
import json
from scipy.sparse import vstack
from typing import List, Tuple

# --- CLOUD PERSISTENCE CONFIG ---
# Render's free tier wipes the local 'backend' folder on every restart.
# If you attach a "Blueprint" or "Persistent Disk", it usually mounts at /var/lib/data.
RENDER_PERSISTENT_DIR = "/var/lib/data/tfidf_data"
LOCAL_DATA_DIR = "backend/tfidf_data"

# Choose the persistent path if it exists (Render), otherwise use local (Localhost)
if os.path.exists("/var/lib/data"):
    TFIDF_DATA_DIR = RENDER_PERSISTENT_DIR
else:
    TFIDF_DATA_DIR = LOCAL_DATA_DIR

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
        try:
            vectorizer = joblib.load(vectorizer_path)
            vectors = joblib.load(vectors_path)
            return vectorizer, vectors
        except Exception as e:
            print(f"Error loading TF-IDF data: {e}")
    return None, None

def process_new_submission(
    assignment_id: int, 
    new_document: str
) -> Tuple[bool, float, np.ndarray]:
    """
    Processes a new submission, compares it against existing ones for plagiarism,
    and conditionally updates the stored TF-IDF data.
    """
    PLAGIARISM_THRESHOLD = 0.80 
    
    vectorizer, existing_vectors = load_tfidf_data(assignment_id)
    
    if vectorizer is None:
        # First submission logic
        vectorizer = TfidfVectorizer()
        new_vector = vectorizer.fit_transform([new_document])
        save_tfidf_data(assignment_id, vectorizer, new_vector)
        return False, 0.0, new_vector
    else:
        # Transform using existing vocabulary
        new_vector = vectorizer.transform([new_document])
        
        # Compare against existing vectors
        similarity_scores = cosine_similarity(new_vector, existing_vectors)
        max_similarity = np.max(similarity_scores) if similarity_scores.size > 0 else 0.0
        
        is_plagiarised = max_similarity >= PLAGIARISM_THRESHOLD
        
        # CONDITIONAL LOGIC: Only store if NOT plagiarised
        if not is_plagiarised:
            updated_vectors = vstack([existing_vectors, new_vector])
            _, vectors_path = _get_paths(assignment_id)
            joblib.dump(updated_vectors, vectors_path)

        return is_plagiarised, max_similarity, new_vector

def vector_to_json(vector) -> str:
    """Convert a sparse TF-IDF vector for database storage."""
    return json.dumps(vector.toarray().tolist())