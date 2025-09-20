import os
import argparse
from pathlib import Path

from decouple import config


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download datasets from Kaggle")
    parser.add_argument("--dataset", required=True, help="Kaggle dataset slug, e.g. owner/dataset")
    parser.add_argument("--dest", default=None, help="Destination directory (defaults to ML_DATA_DIR)")
    args = parser.parse_args()

    data_dir = Path(args.dest or config("ML_DATA_DIR", default=str(Path(__file__).resolve().parent / "data")))
    ensure_dir(data_dir)

    # Configure Kaggle credentials via env vars if provided
    kaggle_username = config("KAGGLE_USERNAME", default=None)
    kaggle_key = config("KAGGLE_KEY", default=None)
    if kaggle_username and kaggle_key:
        os.environ["KAGGLE_USERNAME"] = kaggle_username
        os.environ["KAGGLE_KEY"] = kaggle_key

    # Use kaggle CLI via Python API
    try:
        from kaggle.api.kaggle_api_extended import KaggleApi
    except Exception as e:
        raise SystemExit(f"kaggle package not installed. pip install kaggle. Error: {e}")

    api = KaggleApi()
    api.authenticate()

    print(f"Downloading {args.dataset} to {data_dir}...")
    api.dataset_download_files(args.dataset, path=str(data_dir), unzip=True, quiet=False)
    print("Download complete.")


if __name__ == "__main__":
    main()



