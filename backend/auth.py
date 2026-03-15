import os
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

logger = structlog.get_logger()
security = HTTPBearer(auto_error=False)

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip("'\"")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else None

_jwks_client = None

def _get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(JWKS_URL)
    return _jwks_client

DEMO_USER = {"sub": "STU-001", "email": "demo@vigil.app", "role": "authenticated"}


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    demo_mode = os.environ.get("DEMO_MODE", "false").lower() == "true"

    if demo_mode:
        return DEMO_USER

    # If no SUPABASE_URL configured, allow request (development mode)
    if not SUPABASE_URL:
        logger.warning("auth_disabled_no_jwks_url", message="No SUPABASE_URL configured, allowing request")
        return DEMO_USER

    if credentials is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        signing_key = _get_jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_aud": False},
        )
        return payload
    except jwt.PyJWKClientError as e:
        logger.error("jwt_jwks_error", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.DecodeError as e:
        logger.error("jwt_decode_error", error=str(e))
        raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.error("jwt_auth_error", error=str(e))
        raise HTTPException(status_code=401, detail="Authentication failed")
