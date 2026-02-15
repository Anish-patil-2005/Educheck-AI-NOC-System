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

# Endpoints - Verified for Router redirection
EMBEDDING_API = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API     = "https://router.huggingface.co/hf-inference/models/cross-encoder/stsb-roberta-large"
NLI_API       = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

# Weights
WEIGHT_EMBED = 0.40
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=20000, stop_words="english")

# --- Helper: API Wrapper ---
def _query_hf_api(url, payload, retries=3):
    # TRUNCATION: Mandatory for the free Inference API to avoid 400 Payload Too Large
    if "inputs" in payload:
        if isinstance(payload["inputs"], dict):
            # For dict inputs, truncate both specific keys
            for key in ["text", "source_sentence", "premise"]:
                if key in payload["inputs"]:
                    payload["inputs"][key] = payload["inputs"][key][:800]
            for key in ["text_pair", "sentences", "hypothesis"]:
                if key in payload["inputs"]:
                    if isinstance(payload["inputs"][key], list):
                        payload["inputs"][key] = [s[:800] for s in payload["inputs"][key]]
                    else:
                        payload["inputs"][key] = payload["inputs"][key][:800]
        elif isinstance(payload["inputs"], str):
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
        # Flatten because the API sometimes returns [[values]]
        return np.array(data).flatten()
    return None

def _cross_score(a: str, b: str) -> float:
    # VERIFIED: This model (stsb-roberta-large) uses the 'text-classification' schema on the Router
    payload = {
        "inputs": {
            "text": a,
            "text_pair": b
        }
    }
    data = _query_hf_api(CROSS_API, payload)
    
    # Fallback to Sentence Similarity format if Classification fails
    if not data or (isinstance(data, dict) and "error" in data):
        payload = {"inputs": {"source_sentence": a, "sentences": [b]}}
        data = _query_hf_api(CROSS_API, payload)

    if not data: return 0.0
    
    try:
        if isinstance(data, list) and len(data) > 0:
            item = data[0]
            # Handle list of dicts: [{'label': 'LABEL_1', 'score': 0.85}]
            if isinstance(item, dict):
                return float(item.get('score', 0.0))
            # Handle simple list of floats: [0.85]
            return float(item)
        return 0.0
    except Exception as e:
        print(f"DEBUG: Cross Score Parse Error -> {e}")
        return 0.0

def _nli_entailment_score(a: str, b: str) -> float:
    # VERIFIED: Use 'zero-shot-classification' format to avoid 404/400 errors
    def _get_direction(premise, hypothesis):
        payload = {
            "inputs": premise,
            "parameters": {"candidate_labels": ["entailment", "neutral", "contradiction"]}
        }
        res = _query_hf_api(NLI_API, payload)
        
        if res and isinstance(res, dict) and "labels" in res:
            try:
                idx = res["labels"].index("entailment")
                return float(res["scores"][idx])
            except: return 0.0
        return 0.0

    e1 = _get_direction(a, b)
    e2 = _get_direction(b, a)
    return float(max(e1, e2))

# --- Preprocessing ---
def _preprocess(text: str) -> str:
    if not text: return ""
    text = re.sub(r"```[\s\S]*?```", " ", text) # Remove code
    text = re.sub(r'\s+', ' ', text).strip()
    # Light cleaning to keep semantic meaning intact for BERT
    return text

# --- Main Logic ---
def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    try:
        # Preprocess lightly
        a, b = _preprocess(doc_a), _preprocess(doc_b)
        if not a or not b: return 0.0

        # 1. TF-IDF (Local)
        vecs = _tfidf_vectorizer.fit_transform([a, b])
        tfidf = float(cosine_similarity(vecs[0], vecs[1])[0, 0])

        # 2. Embedding (API)
        emb_a, emb_b = _get_embedding(a), _get_embedding(b)
        emb_score = 0.5 # Neutral fallback
        if emb_a is not None and emb_b is not None:
            dot = np.dot(emb_a, emb_b)
            norm = (np.linalg.norm(emb_a) * np.linalg.norm(emb_b)) + 1e-9
            emb_score = (float(dot / norm) + 1.0) / 2.0

        # 3. Cross-Encoder & NLI (API)
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