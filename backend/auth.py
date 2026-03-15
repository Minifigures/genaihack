import os
import jwt
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://jfgzozoknjkyopgrenzn.supabase.co")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"

jwks_client = jwt.PyJWKClient(JWKS_URL)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_aud": False} # Supabase aud can be 'authenticated' or similar
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
