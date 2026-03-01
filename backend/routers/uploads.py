
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import secrets
import shutil
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Uploads"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/image/")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida")
    
    # Generar un nombre seguro
    extension = os.path.splitext(file.filename)[1]
    safe_filename = secrets.token_hex(10) + extension
    file_path = UPLOAD_DIR / safe_filename

    # Guardar en disco
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        file.file.close()

    # Devolvemos la URL local a la que se puede acceder
    return {"url": f"/uploads/{safe_filename}"}

