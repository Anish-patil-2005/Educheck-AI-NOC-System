from typing import Optional
from pypdf import PdfReader
from docx import Document
import aiofiles
from fastapi import UploadFile

async def save_upload_file(upload_file: UploadFile, destination: str) -> None:
    async with aiofiles.open(destination, "wb") as out_file:
        while content := await upload_file.read(1024):  # read in chunks asynchronously
            await out_file.write(content)

def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""
    except Exception as e:
        print(f"PDF text extraction error: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    text = ""
    try:
        doc = Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"DOCX text extraction error: {e}")
    return text

def extract_text(file_path: str, filename: str) -> Optional[str]:
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_path)
    elif filename.lower().endswith(".docx"):
        return extract_text_from_docx(file_path)
    elif filename.lower().endswith(".txt"):
        try:
            with open(file_path, encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"TXT file read error: {e}")
            return None
    else:
        # Unsupported file type for automatic extraction
        return None


# In app/utils/file_utils.py
import io
from PyPDF2 import PdfReader
import docx

# In app/utils/file_utils.py
import io
from PyPDF2 import PdfReader, errors as PyPDF2Errors # Import the specific error
import docx

def extract_text_from_memory(file_content: bytes, filename: str) -> str | None:
    """
    Extracts text from a file's byte content in memory with robust error handling.
    """
    text = ""
    try:
        if filename.lower().endswith(".pdf"):
            pdf_file = io.BytesIO(file_content)
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                text += page.extract_text() or "" # Ensure it adds an empty string if a page has no text
        
        elif filename.lower().endswith(".docx"):
            doc_file = io.BytesIO(file_content)
            doc = docx.Document(doc_file)
            for para in doc.paragraphs:
                text += para.text + "\n"
        
        else:
            # If the file type is not supported, return None
            return None

        return text.strip() if text else None

    except PyPDF2Errors.PdfReadError as e:
        # NEW: Log the specific PDF error
        print(f"ERROR: Could not read PDF file '{filename}'. It may be corrupted. Details: {e}")
        return None
    except Exception as e:
        # NEW: Log any other unexpected errors during extraction
        print(f"ERROR: An unexpected error occurred during text extraction for '{filename}': {e}")
        return None