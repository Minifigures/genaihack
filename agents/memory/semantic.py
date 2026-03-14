from agents.memory.moorcheh_client import MoorchehClient

NAMESPACE = "vigil-knowledge"


async def search_coverage(client: MoorchehClient, query: str) -> list[dict]:
    return await client.search(NAMESPACE, query)


async def get_coverage_answer(client: MoorchehClient, query: str) -> str:
    return await client.get_generative_answer(NAMESPACE, query)


async def upload_knowledge(client: MoorchehClient, documents: list[dict]) -> bool:
    await client.create_namespace(NAMESPACE)
    return await client.upload_documents(NAMESPACE, documents)
