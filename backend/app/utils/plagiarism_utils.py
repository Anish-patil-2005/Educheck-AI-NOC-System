import re
import json
from typing import List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.metrics.pairwise import cosine_similarity

# ===================================================================
# Core Algorithm Functions
# ===================================================================

def _preprocess_and_tokenize(text: str) -> List[str]:
    """
    Cleans text using a robust, multi-stage pipeline to remove all boilerplate,
    code, and formatting, returning a list of core content words.
    """
    if not text:
        return []

    cleaned_text = text

    # --- Stage 1: Aggressive Boilerplate and Header Removal ---
    # This removes any line starting with a keyword, followed by a colon.
    header_patterns = [
        r'^\s*name\s*:.*?\n', r'^\s*class\s*:.*?\n', r'^\s*roll\s*no\s*:.*?\n',
        r'^\s*batch\s*:.*?\n', r'^\s*title\s*:.*?\n', r'^\s*aim\s*:.*?\n',
        r'^\s*theory\s*:.*?\n', r'^\s*conclusion\s*:.*?\n', r'^\s*output\s*:.*?\n',
        r'^\s*algorithm\s*steps:.*?\n', r'^\s*example\s*and\s*algorithm:.*?\n',
        r'^\s*code\s*:.*?\n', r'^\s*assignment\s*\d+:.*?\n', r'^\s*step\s*\d+:.*?\n',
        r'^\s*knowledge\s*base\s*\(kb\):.*?\n'
    ]
    for pattern in header_patterns:
        cleaned_text = re.sub(pattern, ' ', cleaned_text, flags=re.IGNORECASE | re.MULTILINE)

    # --- Stage 2: Comprehensive Code Block Removal ---
    # This pattern is designed to find common Java/C++/Python style code blocks.
    code_pattern = re.compile(
        r'(?:public|private|protected|static|#include|using namespace|import)[\s\S]*?(?:\}|\;)\s*$',
        re.MULTILINE
    )
    cleaned_text = re.sub(code_pattern, ' ', cleaned_text)

    # --- Stage 3: Remove List Markers and Special Characters ---
    # This removes o, ●, 1., etc., and other non-essential symbols.
    list_marker_pattern = r'^\s*([o●\d]\.|\d\)|[A-Za-z]\)|\*|-|→|)\s*'
    cleaned_text = re.sub(list_marker_pattern, '', cleaned_text, flags=re.MULTILINE)
    
    # --- Stage 4: Final Cleanup ---
    cleaned_text = cleaned_text.lower()
    cleaned_text = re.sub(r'[^\w\s]', ' ', cleaned_text)  # Replace punctuation with space
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text).strip()
    
    # --- Stage 5: Stop Word Removal ---
    tokens = cleaned_text.split()
    return [word for word in tokens if word not in ENGLISH_STOP_WORDS]

# ===================================================================
# Main Public Function
# ===================================================================

def calculate_tfidf_similarity(text1: str, text2: str) -> float:
    """
    Calculates a plagiarism score based on keyword similarity using TF-IDF.
    """
    # 1. Preprocess both texts to get a clean list of important keywords
    tokens1 = _preprocess_and_tokenize(text1)
    tokens2 = _preprocess_and_tokenize(text2)

    if not tokens1 or not tokens2:
        return 0.0

    # 2. Re-join the clean tokens into documents for the vectorizer
    doc1 = " ".join(tokens1)
    doc2 = " ".join(tokens2)
    
    try:
        # 3. Create a TF-IDF vectorizer and transform the documents
        #    This creates a shared "vocabulary map" for accurate comparison.
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform([doc1, doc2])
        
        # 4. Calculate and return the cosine similarity between the two vectors
        return cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    except ValueError:
        # This can happen if documents contain only stop words and become empty
        return 0.0

# ===================================================================

# ===================================================================
