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

# Updated to the new Router endpoints
EMBEDDING_API = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API     = "https://router.huggingface.co/hf-inference/models/cross-encoder/stsb-roberta-large"
NLI_API       = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

# Weights
WEIGHT_EMBED = 0.4
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=20000, stop_words="english")

# --- Helper: API Wrapper with Model Loading Check ---
def _query_hf_api(url, payload, retries=3):
    for i in range(retries):
        try:
            response = requests.post(url, headers=HEADERS, json=payload, timeout=40)
            data = response.json()
            
            # 1. Handle "Model is loading"
            if isinstance(data, dict) and "estimated_time" in data:
                wait_time = min(data['estimated_time'], 20)
                print(f"Model loading... waiting {wait_time}s")
                time.sleep(wait_time)
                continue
            
            # 2. Handle HTTP Errors
            if response.status_code != 200:
                print(f"DEBUG: API Error Code {response.status_code} -> {data}")
                return None
            
            return data
            
        except Exception as e:
            print(f"Request attempt {i+1} failed: {e}")
            time.sleep(2)
    return None

# --- Core Components ---

def _get_embedding(text: str):
    # Standard format for Feature Extraction models
    data = _query_hf_api(EMBEDDING_API, {"inputs": text})
    return np.array(data) if data else None

def _cross_score(a: str, b: str) -> float:
    # FIXED: Structure for Sentence Similarity (Router requirement)
    payload = {
        "inputs": {
            "source_sentence": a,
            "sentences": [b]
        }
    }
    data = _query_hf_api(CROSS_API, payload)
    if not data or not isinstance(data, list): return 0.0
    
    raw = float(data[0])
    # Normalize score
    return float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))

def _nli_entailment_score(a: str, b: str) -> float:
    # FIXED: Structure for Zero-Shot Classification
    def _get_direction(premise, hypothesis):
        payload = {
            "inputs": premise,
            "parameters": {"candidate_labels": ["contradiction", "neutral", "entailment"]}
        }
        res = _query_hf_api(NLI_API, payload)
        if not res or "labels" not in res: return 0.0
        
        idx = res["labels"].index("entailment")
        return res["scores"][idx]

    e1 = _get_direction(a, b)
    e2 = _get_direction(b, a)
    return float(max(e1, e2))

# --- Preprocessing ---
def _expand_synonyms(token: str) -> List[str]:
    synonyms = set([token])
    for syn in wn.synsets(token):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ").lower()
            if len(name) > 2 and name.isalpha():
                synonyms.add(name)
    return list(synonyms)

def _apply_synonym_expansion(text: str) -> str:
    words = text.split()
    expanded = []
    for w in words:
        syns = _expand_synonyms(w.lower())
        expanded.append(w)
        if len(syns) > 1:
            expanded.extend(syns[:2])
    return " ".join(expanded)

def _preprocess(text: str) -> str:
    if not text: return ""
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = [t for t in text.split() if t.lower() not in ENGLISH_STOP_WORDS or len(t) > 3]
    return _apply_synonym_expansion(" ".join(tokens))

# --- Main Logic ---
def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    try:
        a = _preprocess(doc_a)
        b = _preprocess(doc_b)

        if not a or not b:
            return 0.0

        # 1. TF-IDF
        vecs = _tfidf_vectorizer.fit_transform([a, b])
        tfidf = float(cosine_similarity(vecs[0], vecs[1])[0, 0])

        # 2. Embedding Cosine
        emb_a, emb_b = _get_embedding(a), _get_embedding(b)
        if emb_a is None or emb_b is None:
            emb_cos_u = 0.0
        else:
            emb_cos = float(np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b) + 1e-9))
            emb_cos_u = (emb_cos + 1.0) / 2.0

        # 3. Cross-Encoder & NLI
        cross = _cross_score(a, b)
        nli = _nli_entailment_score(a, b)

        # 4. Weighting Logic
        weights = [WEIGHT_EMBED, WEIGHT_CROSS, WEIGHT_NLI, WEIGHT_TFIDF]
        
        if emb_cos_u > 0.75 and cross > 0.75 and nli > 0.5 and tfidf > 0.15:
            weights[0] += 0.05
            weights[1] += 0.05
            weights[2] += 0.02

        if tfidf < 0.12:
            weights[3], weights[0], weights[1] = 0.0, weights[0]-0.1, weights[1]-0.1

        raw = weights[0]*emb_cos_u + weights[1]*cross + weights[2]*nli + weights[3]*tfidf
        
        if nli < 0.53:
            raw *= 0.85

        return float(max(0.0, min(1.0, raw)))

    except Exception as e:
        print(f"DEBUG: Final Logic Error -> {e}")
        return 0.0