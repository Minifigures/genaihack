from agents.memory.moorcheh_client import MoorchehClient

NAMESPACE = "vigil-providers"


async def search_provider(client: MoorchehClient, provider_name: str) -> list[dict]:
    return await client.search(NAMESPACE, provider_name)


async def update_provider_stats(client: MoorchehClient, provider_data: dict) -> bool:
    await client.create_namespace(NAMESPACE)
    return await client.upload_documents(NAMESPACE, [provider_data])
