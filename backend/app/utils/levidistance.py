import re
import numpy as np
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ===================================================================
# Core Preprocessing
# ===================================================================

def _preprocess_and_tokenize(text: str) -> List[str]:
    """
    Cleans text from PDF/assignment sources.
    Removes boilerplate, headers, code, and artifacts, then tokenizes.
    """
    if not text:
        return []

    # --- Stage 0: Normalize PDF noise ---
    text = re.sub(r'\u200b|\ufeff|\xad', '', text)     # invisible chars, soft hyphens
    text = re.sub(r'-\s*\n', '', text)                 # hyphenated line breaks
    text = re.sub(r'\n+', '\n', text)                  # normalize multiple newlines

    # --- Stage 1: Remove boilerplate (flexible) ---
    boilerplate_patterns = [
        r'\bname\s*:.*',
        r'\bclass\s*:.*',
        r'\broll\s*no\s*:.*',
        r'\bbatch\s*:.*',
        r'\btitle\s*:.*',
        r'\baim\s*:.*',
        r'\btheory\s*:.*',
        r'\bconclusion\s*:.*',
        r'\boutput\s*:.*',
        r'\bcode\s*:.*',
        r'\bassignment\s*\d+:.*',
        r'\bstep\s*\d+:.*',
        r'\bknowledge\s*base.*'
    ]
    for pat in boilerplate_patterns:
        text = re.sub(pat, ' ', text, flags=re.IGNORECASE)

    # --- Stage 2: Remove code blocks broadly ---
    text = re.sub(r'```.*?```', ' ', text, flags=re.DOTALL)   # fenced code
    text = re.sub(r'(?s)(#include|import|public|class|def|int main).*?\}', ' ', text)  # loose match

    # --- Stage 3: Cleanup ---
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', ' ', text)       # keep only alphanumeric
    text = re.sub(r'\s+', ' ', text).strip()       # normalize whitespace

    return text.split()



# ===================================================================
# TF-IDF Cosine Similarity (Robust)
# ===================================================================

def calculate_tfidf_similarity(text1: str, text2: str) -> float:
    """
    Calculates similarity using TF-IDF cosine similarity (robust to noise).
    """
    tokens1 = " ".join(_preprocess_and_tokenize(text1))
    tokens2 = " ".join(_preprocess_and_tokenize(text2))

    if not tokens1 or not tokens2:
        return 0.0

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([tokens1, tokens2])
    return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]


