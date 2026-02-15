import os
import math
import re
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

# Endpoints matching your local models
EMBEDDING_API = "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API     = "https://api-inference.huggingface.co/models/cross-encoder/stsb-roberta-large"
NLI_API       = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

# Weights from your local logic
WEIGHT_EMBED = 0.4
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=20000, stop_words="english")

# --- Helper: API Wrapper with Model Loading Check ---
def _query_hf_api(url, payload):
    response = requests.post(url, headers=HEADERS, json=payload, timeout=40)
    data = response.json()
    
    # HF models "sleep" on free tier. If loading, we must wait or return error.
    if isinstance(data, dict) and "estimated_time" in data:
        raise Exception(f"Model is currently loading on HF. Try again in {data['estimated_time']}s")
    
    if response.status_code != 200:
        raise Exception(f"API Error: {data}")
    return data

# --- Core Components ---

def _get_embedding(text: str):
    # This returns the actual vector for mpnet
    data = _query_hf_api(EMBEDDING_API, {"inputs": text})
    return np.array(data)

def _cross_score(a: str, b: str) -> float:
    # STSB-Roberta returns a regression score
    data = _query_hf_api(CROSS_API, {"inputs": {"source_sentence": a, "sentences": [b]}})
    raw = float(data[0])
    return float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))

def _nli_entailment_score(a: str, b: str) -> float:
    # Mimics your _single(a, b) and _single(b, a) direction check
    def _get_direction(premise, hypothesis):
        payload = {
            "inputs": premise,
            "parameters": {"candidate_labels": ["contradiction", "neutral", "entailment"]}
        }
        res = _query_hf_api(NLI_API, payload)
        # Find index of 'entailment'
        idx = res["labels"].index("entailment")
        return res["scores"][idx]

    e1 = _get_direction(a, b)
    e2 = _get_direction(b, a)
    return float(max(e1, e2))

# --- Preprocessing (Kept exactly as your local version) ---
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
        emb_cos = float(np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b) + 1e-9))
        emb_cos_u = (emb_cos + 1.0) / 2.0

        # 3. Cross-Encoder & NLI
        cross = _cross_score(a, b)
        nli = _nli_entailment_score(a, b)

        # 4. Apply your local weighting logic
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
        print(f"DEBUG: Similarity Error -> {e}")
        return 0.0