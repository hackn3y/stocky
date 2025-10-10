"""
Model loader with fallback to download from GitHub if LFS files are pointers
"""
import os
import joblib
import requests
from pathlib import Path

def download_model_from_github(model_name, save_path):
    """Download model directly from GitHub LFS"""
    # GitHub raw URL for LFS files
    base_url = "https://github.com/hackn3y/stocky/raw/main/backend/models/"
    url = base_url + model_name

    print(f"Downloading {model_name} from GitHub...")
    response = requests.get(url, stream=True)

    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded {model_name} successfully")
        return True
    else:
        print(f"Failed to download {model_name}: {response.status_code}")
        return False

def load_model_safe(model_path):
    """Load model with fallback to GitHub download if LFS pointer detected"""
    try:
        # Try to load the model
        model = joblib.load(model_path)
        print(f"Loaded model from {model_path}")
        return model
    except (KeyError, EOFError, Exception) as e:
        # Check if it's an LFS pointer file
        with open(model_path, 'rb') as f:
            first_bytes = f.read(100)

        # LFS pointer files start with "version https://git-lfs"
        if b'git-lfs' in first_bytes or 'KeyError' in str(e):
            print(f"Detected LFS pointer file or corrupted model: {model_path}")

            # Create backup and download
            backup_path = model_path + '.backup'
            if os.path.exists(model_path):
                os.rename(model_path, backup_path)

            # Download from GitHub
            model_name = os.path.basename(model_path)
            if download_model_from_github(model_name, model_path):
                try:
                    model = joblib.load(model_path)
                    print(f"Successfully loaded downloaded model")

                    # Remove backup
                    if os.path.exists(backup_path):
                        os.remove(backup_path)

                    return model
                except Exception as e2:
                    print(f"Failed to load downloaded model: {e2}")
                    # Restore backup
                    if os.path.exists(backup_path):
                        os.rename(backup_path, model_path)
                    raise
            else:
                # Restore backup if download failed
                if os.path.exists(backup_path):
                    os.rename(backup_path, model_path)
                raise Exception(f"Failed to download model from GitHub")
        else:
            # Not an LFS issue, re-raise original error
            raise

def ensure_models_ready():
    """Ensure all models are ready (download if needed)"""
    models_dir = Path(__file__).parent / 'models'
    model_files = ['spy_model.pkl', 'enhanced_spy_model.pkl', 'optimized_model.pkl']

    for model_file in model_files:
        model_path = models_dir / model_file
        if model_path.exists():
            try:
                # Try to load to verify it's valid
                load_model_safe(str(model_path))
            except Exception as e:
                print(f"Model {model_file} verification failed: {e}")