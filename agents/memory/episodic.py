from agents.memory.moorcheh_client import MoorchehClient

NAMESPACE_PREFIX = "vigil-episodic"


def get_namespace(student_id: str) -> str:
    return f"{NAMESPACE_PREFIX}-{student_id}"


async def store_claim(client: MoorchehClient, student_id: str, claim_data: dict) -> bool:
    namespace = get_namespace(student_id)
    await client.create_namespace(namespace)
    return await client.upload_documents(namespace, [claim_data])


async def get_claim_history(client: MoorchehClient, student_id: str, query: str = "recent claims") -> list[dict]:
    namespace = get_namespace(student_id)
    return await client.search(namespace, query)
