from typing import Optional
import io
import aiofiles
from fastapi import UploadFile
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from docx import Document


# -----------------------------
# Save uploaded file async
# -----------------------------
async def save_upload_file(upload_file: UploadFile, destination: str) -> None:
    async with aiofiles.open(destination, "wb") as out_file:
        while content := await upload_file.read(1024):
            await out_file.write(content)


# -----------------------------
# Extract text from PDF (file path)
# -----------------------------
def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except PdfReadError as e:
        print(f"PDF corrupted or unreadable: {e}")
    except Exception as e:
        print(f"Unexpected PDF extraction error: {e}")
    return text.strip()


# -----------------------------
# Extract text from DOCX (file path)
# -----------------------------
def extract_text_from_docx(file_path: str) -> str:
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"DOCX extraction error: {e}")
    return text.strip()




# -----------------------------
# Generic file extractor (disk)
# -----------------------------
def extract_text(file_path: str, filename: str) -> Optional[str]:
    filename = filename.lower()

    if filename.endswith(".pdf"):
        return extract_text_from_pdf(file_path)

    elif filename.endswith(".docx"):
        return extract_text_from_docx(file_path)

    elif filename.endswith(".txt"):
        try:
            with open(file_path, encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"TXT file read error: {e}")
            return None

    return None


# -----------------------------
# Extract from in-memory bytes
# -----------------------------
def extract_text_from_memory(file_content: bytes, filename: str) -> Optional[str]:
    filename = filename.lower()
    text = ""

    try:
        if filename.endswith(".pdf"):
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() or ""

        elif filename.endswith(".docx"):
            doc_file = io.BytesIO(file_content)
            doc = Document(doc_file)
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif filename.endswith(".txt"):
            return file_content.decode("utf-8")

        else:
            return None

        return text.strip() if text else None

    except PdfReadError as e:
        print(f"PDF corrupted or unreadable: {e}")
        return None

    except Exception as e:
        print(f"Unexpected extraction error: {e}")
        return None
