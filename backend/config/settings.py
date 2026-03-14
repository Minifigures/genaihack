from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # AI Services
    google_api_key: str = ""
    moorcheh_api_key: str = ""
    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"

    # Snowflake
    snowflake_account: str = ""
    snowflake_user: str = ""
    snowflake_password: str = ""
    snowflake_database: str = "VIGIL"
    snowflake_schema: str = "PUBLIC"
    snowflake_warehouse: str = "COMPUTE_WH"
    snowflake_role: str = "ACCOUNTADMIN"

    # App Config
    demo_mode: bool = True
    log_level: str = "INFO"
    cors_origins: list[str] = ["http://localhost:3000"]
    enable_watsonx: bool = True
    enable_reflection: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
