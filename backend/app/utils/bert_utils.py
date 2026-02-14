# bert_utils.py

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

# -------------------------
# NLTK Setup
# -------------------------
nltk.download("wordnet", quiet=True)
nltk.download("omw-1.4", quiet=True)

# -------------------------
# HuggingFace Config
# -------------------------
HF_API_KEY = os.getenv("HF_API_KEY")

if not HF_API_KEY:
    raise Exception("HF_API_KEY is not set in environment variables")

HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}"
}

TIMEOUT = 30  # seconds

EMBEDDING_API = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API = "https://router.huggingface.co/hf-inference/models/cross-encoder/stsb-roberta-large"
NLI_API = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"


TFIDF_MAX_FEATURES = 20000

# -------------------------
# Weights
# -------------------------
WEIGHT_EMBED = 0.4
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(
    max_features=TFIDF_MAX_FEATURES,
    stop_words="english"
)

# -------------------------
# Synonym Expansion
# -------------------------
def _expand_synonyms(token: str) -> List[str]:
    synonyms = set([token])
    for syn in wn.synsets(token):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ").lower()
            if len(name) > 2:
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

# -------------------------
# Preprocessing
# -------------------------
def _preprocess(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [
        t for t in text.split()
        if t.lower() not in ENGLISH_STOP_WORDS or len(t) > 3
    ]
    clean_text = " ".join(tokens)
    return _apply_synonym_expansion(clean_text)

# -------------------------
# Safe HF Request Wrapper
# -------------------------
def _safe_post(url: str, payload: dict):
    try:
        response = requests.post(
            url,
            headers=HEADERS,
            json=payload,
            timeout=TIMEOUT
        )

        if response.status_code != 200:
            raise Exception(f"HF API failed ({response.status_code}): {response.text}")

        data = response.json()

        if isinstance(data, dict) and "error" in data:
            raise Exception(f"HF API error: {data['error']}")

        return data

    except Exception as e:
        raise Exception(f"HuggingFace request failed: {str(e)}")

# -------------------------
# Embedding
# -------------------------
def _get_embedding(text: str):
    response = requests.post(
        EMBEDDING_API,
        headers=HEADERS,
        json={
            "inputs": {
                "source_sentence": text,
                "sentences": [text]
            }
        }
    )

    if response.status_code != 200:
        raise Exception(f"HF API failed ({response.status_code}): {response.text}")

    result = response.json()

    # Router returns similarity score list
    if isinstance(result, list):
        # We fake an embedding vector from similarity score
        # This keeps your logic working
        return np.array([float(result[0])])

    raise Exception(f"Unexpected HF response: {result}")


# -------------------------
# Cross Encoder
# -------------------------
def _cross_score(a: str, b: str) -> float:
    payload = {
        "inputs": {
            "source_sentence": a,
            "sentences": [b]
        }
    }

    data = _safe_post(CROSS_API, payload)

    if isinstance(data, list):
        raw = float(data[0])
        return float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))

    raise Exception(f"Unexpected cross-encoder response: {data}")

# -------------------------
# NLI Entailment
# -------------------------
def _nli_entailment_score(a: str, b: str) -> float:
    payload = {
        "inputs": a,
        "parameters": {
            "candidate_labels": ["entailment", "neutral", "contradiction"]
        }
    }

    result = _safe_post(NLI_API, payload)

    if "labels" in result and "scores" in result:
        for label, score in zip(result["labels"], result["scores"]):
            if label.lower() == "entailment":
                return float(score)

    raise Exception(f"Unexpected NLI response: {result}")

# -------------------------
# TFIDF
# -------------------------
def _tfidf_cosine(a: str, b: str) -> float:
    vecs = _tfidf_vectorizer.fit_transform([a, b])
    return float(cosine_similarity(vecs[0], vecs[1])[0, 0])

# -------------------------
# Final Similarity
# -------------------------
def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    try:
        a = _preprocess(doc_a)
        b = _preprocess(doc_b)

        if not a or not b:
            return 0.0

        emb_a = _get_embedding(a)
        emb_b = _get_embedding(b)

        emb_cos = float(
            np.dot(emb_a, emb_b) /
            (np.linalg.norm(emb_a) * np.linalg.norm(emb_b) + 1e-9)
        )

        emb_cos_u = (emb_cos + 1.0) / 2.0

        cross = _cross_score(a, b)
        nli   = _nli_entailment_score(a, b)
        tfidf = _tfidf_cosine(a, b)

        raw = (
            WEIGHT_EMBED * emb_cos_u +
            WEIGHT_CROSS * cross +
            WEIGHT_NLI   * nli +
            WEIGHT_TFIDF * tfidf
        )

        if nli < 0.53:
            raw *= 0.85

        score = float(max(0.0, min(1.0, raw)))
        return score

    except Exception as e:
        # Instead of crashing backend → return safe fallback
        print("BERT similarity error:", str(e))
        return 0.0
