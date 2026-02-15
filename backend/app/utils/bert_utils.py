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

# Endpoints
EMBEDDING_API = "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-mpnet-base-v2"
CROSS_API     = "https://router.huggingface.co/hf-inference/models/cross-encoder/stsb-roberta-large"
NLI_API       = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli"

# Weights
WEIGHT_EMBED = 0.4
WEIGHT_CROSS = 0.35
WEIGHT_NLI   = 0.15
WEIGHT_TFIDF = 0.10

_tfidf_vectorizer = TfidfVectorizer(max_features=20000, stop_words="english")

# --- Helper: API Wrapper ---
def _query_hf_api(url, payload, retries=3):
    # TRUNCATION: BERT models only handle ~512 tokens. 
    # Sending 3000+ chars often causes 400 errors on the free tier.
    if "inputs" in payload:
        if isinstance(payload["inputs"], dict):
            payload["inputs"]["source_sentence"] = payload["inputs"]["source_sentence"][:1500]
            payload["inputs"]["sentences"] = [s[:1500] for s in payload["inputs"]["sentences"]]
        else:
            payload["inputs"] = payload["inputs"][:1500]

    for i in range(retries):
        try:
            # Increased timeout for long academic texts
            response = requests.post(url, headers=HEADERS, json=payload, timeout=60)
            
            if response.status_code == 503: # Model loading
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
        # Handle cases where API returns nested lists
        arr = np.array(data)
        return arr.flatten()
    return None

def _cross_score(a: str, b: str) -> float:
    payload = {
        "inputs": {
            "source_sentence": a,
            "sentences": [b]
        }
    }
    data = _query_hf_api(CROSS_API, payload)
    if not data or not isinstance(data, list): return 0.0
    
    try:
        raw = float(data[0])
        return float(max(0.0, min(1.0, (math.tanh(raw) + 1) / 2)))
    except:
        return 0.0

def _nli_entailment_score(a: str, b: str) -> float:
    def _get_direction(premise, hypothesis):
        payload = {
            "inputs": premise,
            "parameters": {"candidate_labels": ["contradiction", "neutral", "entailment"]}
        }
        res = _query_hf_api(NLI_API, payload)
        if not res or "labels" not in res: return 0.0
        try:
            idx = res["labels"].index("entailment")
            return res["scores"][idx]
        except: return 0.0

    e1 = _get_direction(a, b)
    e2 = _get_direction(b, a)
    return float(max(e1, e2))

# --- Preprocessing ---
def _expand_synonyms(token: str) -> List[str]:
    # Limited expansion to prevent text bloating
    synonyms = set([token])
    for syn in wn.synsets(token):
        for lemma in syn.lemmas():
            name = lemma.name().replace("_", " ").lower()
            if name.isalpha() and name != token:
                synonyms.add(name)
                if len(synonyms) > 3: break # Cap synonyms
        if len(synonyms) > 3: break
    return list(synonyms)

def _apply_synonym_expansion(text: str) -> str:
    words = text.split()
    expanded = []
    for w in words[:400]: # Only expand first 400 words to save API space
        syns = _expand_synonyms(w.lower())
        expanded.append(w)
        if len(syns) > 1:
            expanded.extend(syns[1:2]) # Add only 1 synonym
    return " ".join(expanded)

def _preprocess(text: str) -> str:
    if not text: return ""
    # Remove code blocks and extra whitespace
    text = re.sub(r"```[\s\S]*?```", " ", text)
    text = re.sub(r'\s+', ' ', text).strip()
    # Basic cleaning
    tokens = [t for t in text.split() if t.lower() not in ENGLISH_STOP_WORDS or len(t) > 3]
    return _apply_synonym_expansion(" ".join(tokens))

# --- Main Logic ---
def compute_bert_similarity(doc_a: str, doc_b: str) -> float:
    try:
        a = _preprocess(doc_a)
        b = _preprocess(doc_b)

        if not a or not b: return 0.0

        # 1. TF-IDF (Local - Always works)
        vecs = _tfidf_vectorizer.fit_transform([a, b])
        tfidf = float(cosine_similarity(vecs[0], vecs[1])[0, 0])

        # 2. Embedding Cosine
        emb_a = _get_embedding(a)
        emb_b = _get_embedding(b)
        
        emb_cos_u = 0.5 # Default middle ground if API fails
        if emb_a is not None and emb_b is not None:
            dot = np.dot(emb_a, emb_b)
            norm = (np.linalg.norm(emb_a) * np.linalg.norm(emb_b)) + 1e-9
            emb_cos_u = (float(dot / norm) + 1.0) / 2.0

        # 3. Cross-Encoder & NLI
        cross = _cross_score(a, b)
        nli = _nli_entailment_score(a, b)

        # 4. Weighting
        w = [WEIGHT_EMBED, WEIGHT_CROSS, WEIGHT_NLI, WEIGHT_TFIDF]
        
        # Dynamic adjustment based on quality
        if emb_cos_u > 0.8 and cross > 0.8:
            w[0] += 0.05
            w[1] += 0.05

        final_score = (w[0]*emb_cos_u) + (w[1]*cross) + (w[2]*nli) + (w[3]*tfidf)
        
        # Log results for debugging in Render
        print(f"SCORES -> TFIDF: {tfidf:.2f}, EMB: {emb_cos_u:.2f}, CROSS: {cross:.2f}, NLI: {nli:.2f}")

        return float(max(0.0, min(1.0, final_score)))

    except Exception as e:
        print(f"DEBUG: Final Logic Error -> {e}")
        return 0.0