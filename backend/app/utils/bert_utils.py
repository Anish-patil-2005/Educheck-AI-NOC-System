import os
import math
import re
import time
import numpy as np
import requests
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from nltk.corpus import wordnet as wn
import nltk
from dotenv import load_dotenv

load_dotenv()

# --- NLTK Setup ---
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

# --- HuggingFace Config ---
HF_API_KEY = os.getenv("HF_API_KEY")
HEADERS = {"Authorization": f"Bearer {HF_API_KEY}"}

# Endpoints - Aligned to 2026 Router specs
EMBEDDING_API = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API     = "https://router.huggingface.co/hf-inference/models/cross-encoder/stsb-roberta-large"
NLI_API       = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

# Aligned Weights for balanced grading
WEIGHT_EMBED = 0.40
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=20000, stop_words="english")

# --- Helper: API Wrapper ---
def _query_hf_api(url, payload, retries=3):
    # TRUNCATION: Mandatory logic to ensure the specific Task schemas are maintained
    if "inputs" in payload and isinstance(payload["inputs"], dict):
        # Truncate source_sentence for Similarity/Cross task
        if "source_sentence" in payload["inputs"]:
            payload["inputs"]["source_sentence"] = str(payload["inputs"]["source_sentence"])[:800]
        # Truncate sentences LIST for Similarity task
        if "sentences" in payload["inputs"] and isinstance(payload["inputs"]["sentences"], list):
            payload["inputs"]["sentences"] = [str(s)[:800] for s in payload["inputs"]["sentences"]]
        # Truncate standard classification/NLI text
        if "text" in payload["inputs"]:
            payload["inputs"]["text"] = str(payload["inputs"]["text"])[:800]
        if "premise" in payload["inputs"]:
            payload["inputs"]["premise"] = str(payload["inputs"]["premise"])[:800]
    elif "inputs" in payload and isinstance(payload["inputs"], str):
        payload["inputs"] = payload["inputs"][:800]

    for i in range(retries):
        try:
            response = requests.post(url, headers=HEADERS, json=payload, timeout=60)
            
            if response.status_code == 503:
                data = response.json()
                wait_time = min(data.get('estimated_time', 20), 20)
                print(f"Model loading... waiting {wait_time}s")
                time.sleep(wait_time)
                continue
            
            if response.status_code != 200:
                print(f"DEBUG: API Error {response.status_code} -> {response.text}")
                return None
            
            return response.json()
            
        except Exception as e:
            print(f"Attempt {i+1} failed: {e}")
            time.sleep(2)
    return None

# --- Core Components ---

def _get_embedding(text: str):
    data = _query_hf_api(EMBEDDING_API, {"inputs": text})
    if data and isinstance(data, list):
        # Flatten handles both [[v1, v2]] and [v1, v2] return styles
        return np.array(data).flatten()
    return None

def _cross_score(a: str, b: str) -> float:
    # RESEARCHED: This exact structure satisfies the 'sentences' positional argument error
    payload = {
        "inputs": {
            "source_sentence": a[:800],
            "sentences": [b[:800]]
        }
    }
    
    data = _query_hf_api(CROSS_API, payload)
    if not data: return 0.0

    try:
        # RESEARCHED: Handles both a direct float list [0.85] and list of dicts
        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            if isinstance(item, dict):
                return float(item.get('score', 0.0))
            return float(item)
        return 0.0
    except Exception as e:
        print(f"DEBUG: Cross Parse Error -> {e}")
        return 0.0

def _nli_entailment_score(a: str, b: str) -> float:
    def _get_direction(p, h):
        # RESEARCHED: BART-MNLI requires parameters to trigger zero-shot-classification
        payload = {
            "inputs": p[:800],
            "parameters": {"candidate_labels": ["entailment", "neutral", "contradiction"]}
        }
        res = _query_hf_api(NLI_API, payload)
        if not res: return 0.0

        try:
            # RESEARCHED: Your logs show a LIST of dicts: [{'label': 'entailment', 'score': 0.52}, ...]
            if isinstance(res, list):
                for item in res:
                    if item.get('label') == 'entailment':
                        return float(item.get('score', 0.0))
            
            # Standard dictionary response fallback
            if isinstance(res, dict) and "labels" in res:
                idx = res["labels"].index("entailment")
                return float(res["scores"][idx])
            return 0.0
        except Exception as e:
            print(f"DEBUG: NLI Parse Error -> {e}")
            return 0.0

    return float(max(_get_direction(a, b), _get_direction(b, a)))

# --- Preprocessing ---
def _preprocess(text: str) -> str:
    if not text: return ""
    text = re.sub(r"```[\s\S]*?```", " ", text) # Remove code
    text = re.sub(r'\s+', ' ', text).strip()
    return text

# --- Main Logic ---
def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    try:
        a, b = _preprocess(doc_a), _preprocess(doc_b)
        if not a or not b: return 0.0

        # 1. TF-IDF (Always works locally)
        vecs = _tfidf_vectorizer.fit_transform([a, b])
        tfidf = float(cosine_similarity(vecs[0], vecs[1])[0, 0])

        # 2. Embedding (API)
        emb_a, emb_b = _get_embedding(a), _get_embedding(b)
        emb_score = 0.5 
        if emb_a is not None and emb_b is not None:
            dot = np.dot(emb_a, emb_b)
            norm = (np.linalg.norm(emb_a) * np.linalg.norm(emb_b)) + 1e-9
            emb_score = (float(dot / norm) + 1.0) / 2.0

        # 3. Cross-Encoder & NLI (API) - The fixed logic
        cross_score = _cross_score(a, b)
        nli_score = _nli_entailment_score(a, b)

        # 4. Final Weighted Calculation
        final = (WEIGHT_EMBED * emb_score) + \
                (WEIGHT_CROSS * cross_score) + \
                (WEIGHT_NLI   * nli_score) + \
                (WEIGHT_TFIDF * tfidf)
        
        print(f"SCORES -> TFIDF: {tfidf:.2f}, EMB: {emb_score:.2f}, CROSS: {cross_score:.2f}, NLI: {nli_score:.2f}")

        return float(max(0.0, min(1.0, final)))

    except Exception as e:
        print(f"DEBUG: Critical Logic Error -> {e}")
        return 0.0