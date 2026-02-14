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

# Download once
nltk.download('wordnet', quiet=True)
nltk.download('omw-1.4', quiet=True)

# -------------------------
# HuggingFace Config
# -------------------------
HF_API_KEY = os.getenv("HF_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {HF_API_KEY}"
}

EMBEDDING_API = "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API = "https://api-inference.huggingface.co/models/cross-encoder/stsb-roberta-large"
NLI_API = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

TFIDF_MAX_FEATURES = 20000

# Base weights
WEIGHT_EMBED = 0.4
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, stop_words="english")

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
# Preprocess
# -------------------------
def _preprocess(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = [t for t in text.split() if t.lower() not in ENGLISH_STOP_WORDS or len(t) > 3]
    clean_text = " ".join(tokens)
    return _apply_synonym_expansion(clean_text)

# -------------------------
# HuggingFace Calls
# -------------------------

def _get_embedding(text: str):
    response = requests.post(
        EMBEDDING_API,
        headers=HEADERS,
        json={"inputs": text}
    )

    if response.status_code != 200:
        raise Exception(f"HF Embedding API failed: {response.text}")

    data = response.json()

    # HF sometimes wraps embeddings inside list
    if isinstance(data, dict) and "error" in data:
        raise Exception(f"HF Embedding error: {data['error']}")

    if isinstance(data, list):
        return np.array(data)

    raise Exception(f"Unexpected HF response format: {data}")

def _cross_score(a: str, b: str):
    payload = {
        "inputs": {
            "source_sentence": a,
            "sentences": [b]
        }
    }

    response = requests.post(CROSS_API, headers=HEADERS, json=payload)
    raw = float(response.json()[0])

    score = float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))
    return score

def _nli_entailment_score(a: str, b: str):
    payload = {
        "inputs": a,
        "parameters": {
            "candidate_labels": ["entailment", "neutral", "contradiction"]
        }
    }

    response = requests.post(NLI_API, headers=HEADERS, json=payload)
    result = response.json()

    # Extract entailment score
    for label, score in zip(result["labels"], result["scores"]):
        if label.lower() == "entailment":
            return float(score)

    return 0.0

def _tfidf_cosine(a: str, b: str):
    vecs = _tfidf_vectorizer.fit_transform([a, b])
    return float(cosine_similarity(vecs[0], vecs[1])[0, 0])

# -------------------------
# Final Similarity
# -------------------------

def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    a = _preprocess(doc_a)
    b = _preprocess(doc_b)

    if not a or not b:
        return 0.0

    # Embeddings
    emb_a = _get_embedding(a)
    emb_b = _get_embedding(b)

    emb_cos = float(np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b) + 1e-9))
    emb_cos_u = (emb_cos + 1.0) / 2.0

    cross = _cross_score(a, b)
    nli = _nli_entailment_score(a, b)
    tfidf = _tfidf_cosine(a, b)

    weights = [WEIGHT_EMBED, WEIGHT_CROSS, WEIGHT_NLI, WEIGHT_TFIDF]

    raw = weights[0]*emb_cos_u + weights[1]*cross + weights[2]*nli + weights[3]*tfidf

    if nli < 0.53:
        raw *= 0.85

    score = float(max(0.0, min(1.0, raw)))
    return score







# for local host
# # bert_utils.py
# import math
# import re
# import numpy as np
# import torch
# from typing import List
# from sentence_transformers import SentenceTransformer, util, CrossEncoder
# from transformers import AutoTokenizer, AutoModelForSequenceClassification
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
# from nltk.corpus import wordnet as wn   # NEW
# import nltk                             # NEW


# # Ensure WordNet is available
# nltk.download('wordnet', quiet=True)
# nltk.download('omw-1.4', quiet=True)

# # -------------------------
# # Config
# # -------------------------
# EMBEDDING_MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"
# CROSS_ENCODER_NAME = "cross-encoder/stsb-roberta-large"   # regression model
# NLI_MODEL_NAME = "facebook/bart-large-mnli"
# DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
# TFIDF_MAX_FEATURES = 20000

# # Base weights
# WEIGHT_EMBED = 0.4
# WEIGHT_CROSS = 0.35
# WEIGHT_NLI   = 0.15
# WEIGHT_TFIDF = 0.10

# # -------------------------
# # Load models
# # -------------------------
# print(f"Using device: {DEVICE}")

# _embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=DEVICE)
# _cross_encoder = CrossEncoder(
#     CROSS_ENCODER_NAME,
#     device=DEVICE,
#     tokenizer_args={"use_fast": False}
# )
# _nli_tokenizer   = AutoTokenizer.from_pretrained(NLI_MODEL_NAME)
# _nli_model       = AutoModelForSequenceClassification.from_pretrained(NLI_MODEL_NAME).to(DEVICE)
# _tfidf_vectorizer = TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, stop_words="english")

# # -------------------------
# # Synonym Expansion (WordNet)
# # -------------------------
# def _expand_synonyms(token: str) -> List[str]:
#     """Expand a single token with WordNet synonyms (basic nouns/verbs/adjectives)."""
#     synonyms = set([token])
#     for syn in wn.synsets(token):
#         for lemma in syn.lemmas():
#             name = lemma.name().replace("_", " ").lower()
#             if len(name) > 2 and name.isalpha():
#                 synonyms.add(name)
#     return list(synonyms)

# def _apply_synonym_expansion(text: str) -> str:
#     """Expand text by adding common synonyms inline to help semantic models."""
#     words = text.split()
#     expanded = []
#     for w in words:
#         syns = _expand_synonyms(w.lower())
#         if len(syns) > 1:
#             # Take top 2 synonyms + original
#             expanded.append(w)
#             expanded.extend(syns[:2])
#         else:
#             expanded.append(w)
#     return " ".join(expanded)

# # -------------------------
# # Preprocessing
# # -------------------------
# def _preprocess(text: str) -> str:
#     if not text:
#         return ""
#     text = re.sub(r"```[\s\S]*?```", " ", text)   # code blocks
#     text = re.sub(r"~~~[\s\S]*?~~~", " ", text)
#     text = re.sub(r"(?m)^(?:\s{4,}.*\n?)+", " ", text)  # indented code
#     text = re.sub(r'\s+', ' ', text).strip()
#     tokens = [t for t in text.split() if t.lower() not in ENGLISH_STOP_WORDS or len(t) > 3]
#     clean_text = " ".join(tokens)
#     # Add synonym expansion
#     expanded_text = _apply_synonym_expansion(clean_text)
#     return expanded_text

# # -------------------------
# # Components
# # -------------------------
# def _get_embedding(text: str) -> np.ndarray:
#     if not text:
#         return np.zeros((_embedding_model.get_sentence_embedding_dimension(),), dtype=np.float32)
#     emb = _embedding_model.encode([text], convert_to_numpy=True, normalize_embeddings=True)[0]
#     return emb.astype(np.float32)

# def _tfidf_cosine(a: str, b: str) -> float:
#     if not a or not b:
#         return 0.0
#     vecs = _tfidf_vectorizer.fit_transform([a, b])
#     return float(cosine_similarity(vecs[0], vecs[1])[0, 0])

# def _cross_score(a: str, b: str) -> float:
#     if not a or not b:
#         return 0.0
#     raw = float(_cross_encoder.predict([(a, b)])[0])
#     # Normalize regression output to 0..1 using tanh scaling
#     score = float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))
#     return score

# def _nli_entailment_score(a: str, b: str) -> float:
#     if not a or not b:
#         return 0.0
#     def _single(prem, hyp) -> float:
#         enc = _nli_tokenizer(prem, hyp, return_tensors="pt", truncation=True, max_length=512).to(DEVICE)
#         with torch.no_grad():
#             logits = _nli_model(**enc).logits
#         probs = torch.softmax(logits, dim=-1).cpu().numpy()[0]
#         return float(probs[2])  # entailment
#     e1 = _single(a, b)
#     e2 = _single(b, a)
#     return float(max(e1, e2))  # take max direction

# # -------------------------
# # Final similarity
# # -------------------------
# def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
#     a = _preprocess(doc_a)
#     b = _preprocess(doc_b)

#     if not a or not b:
#         return 0.0

#     # Embedding cosine
#     emb_a, emb_b = _get_embedding(a), _get_embedding(b)
#     emb_cos = float(np.dot(emb_a, emb_b) / (np.linalg.norm(emb_a) * np.linalg.norm(emb_b) + 1e-9))
#     emb_cos_u = (emb_cos + 1.0) / 2.0

#     # Other scores
#     cross = _cross_score(a, b)
#     nli   = _nli_entailment_score(a, b)
#     tfidf = _tfidf_cosine(a, b)

#     # Start with base weights
#     weights = [WEIGHT_EMBED, WEIGHT_CROSS, WEIGHT_NLI, WEIGHT_TFIDF]

#     # If cross + embed agree strongly, boost them
#     if emb_cos_u > 0.75 and cross > 0.75 and nli > 0.5 and tfidf > 0.15: 
#         weights[0] += 0.05
#         weights[1] += 0.05
#         weights[2] += 0.02
        

#     print("nli:", nli)
#     # If TF-IDF overlap is very low → limit effect
#     if tfidf < 0.12:
#         weights[3] = 0.0
#         weights[0] -= 0.1
#         weights[1] -= 0.1

#     if emb_cos_u > 0.8 and cross > 0.75 and nli >= 0.8 and tfidf > 0.35: 
#         weights[0] += 0.01
#         weights[1] += 0.01


#     raw = weights[0]*emb_cos_u + weights[1]*cross + weights[2]*nli + weights[3]*tfidf
#     print(f"Debug Scores: Emb={emb_cos_u:.3f}, Cross={cross:.3f}, NLI={nli:.3f}, TFIDF={tfidf:.3f} => Raw={raw:.3f}")
#     # Penalty if NLI says "no entailment"
#     if nli < 0.53:
#         raw *= 0.85

#     score = float(max(0.0, min(1.0, raw)))
#     return score






