from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AI Services
    google_api_key: str = ""
    oss_endpoint: str = ""
    moorcheh_api_key: str = ""
    huggingface_endpoint: str = ""
    huggingface_api_key: str = ""
    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"

    # Database (Supabase PostgreSQL)
    database_url: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""

    # App Config
    demo_mode: bool = True
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000"]
    enable_watsonx: bool = True
    enable_reflection: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}
