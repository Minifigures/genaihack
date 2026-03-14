import structlog
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()


class MoorchehClient:
    """Wrapper around the Moorcheh SDK for memory operations."""

    def __init__(self) -> None:
        self.api_key = settings.moorcheh_api_key
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not self.api_key:
                logger.warning("moorcheh_no_key", message="No Moorcheh API key configured")
                return None
            try:
                from moorcheh import Moorcheh
                self._client = Moorcheh(api_key=self.api_key)
            except ImportError:
                logger.warning("moorcheh_not_installed")
                return None
        return self._client

    async def create_namespace(self, namespace: str) -> bool:
        client = self._get_client()
        if client is None:
            return False
        try:
            client.create_namespace(namespace)
            return True
        except Exception as e:
            logger.error("moorcheh_create_namespace_error", namespace=namespace, error=str(e))
            return False

    async def upload_documents(self, namespace: str, documents: list[dict]) -> bool:
        client = self._get_client()
        if client is None:
            return False
        try:
            client.upload_documents(namespace, documents)
            return True
        except Exception as e:
            logger.error("moorcheh_upload_error", namespace=namespace, error=str(e))
            return False

    async def search(self, namespace: str, query: str, top_k: int = 5) -> list[dict]:
        client = self._get_client()
        if client is None:
            return []
        try:
            results = client.search(namespace, query, top_k=top_k)
            return results
        except Exception as e:
            logger.error("moorcheh_search_error", namespace=namespace, error=str(e))
            return []

    async def get_generative_answer(self, namespace: str, query: str) -> str:
        client = self._get_client()
        if client is None:
            return ""
        try:
            answer = client.get_generative_answer(namespace, query)
            return answer
        except Exception as e:
            logger.error("moorcheh_generative_error", namespace=namespace, error=str(e))
            return ""
