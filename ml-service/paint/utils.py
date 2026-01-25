import os

def to_public_url(abs_path: str, base_dir: str) -> str:
    rel = os.path.relpath(abs_path, base_dir).replace("\\", "/")
    return f"/static/{rel}"
