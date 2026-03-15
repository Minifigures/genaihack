"""Scrape dental clinic data near UofT using Firecrawl API."""

import json
import structlog
from typing import Optional

from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

# Static fallback data (used when Firecrawl is unavailable or for demo)
STATIC_CLINICS = [
    {
        "name": "UofT Health & Wellness Centre",
        "address": "214 College St, Toronto, ON M5T 2Z9",
        "phone": "(416) 978-8030",
        "hours": "Mon-Fri 9am-5pm",
        "distance": "On campus",
        "rating": 4.5,
        "ohip": True,
        "uhip": True,
        "specialties": ["General", "Mental Health", "Dental Referrals"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Harbord Dental Centre",
        "address": "376 Harbord St, Toronto, ON M6G 1H8",
        "phone": "(416) 923-3434",
        "hours": "Mon-Sat 9am-6pm",
        "distance": "0.5 km",
        "rating": 4.3,
        "ohip": False,
        "uhip": True,
        "specialties": ["General Dentistry", "Cleanings", "Fillings", "Crowns"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Bloor West Dental Group",
        "address": "2339 Bloor St W, Toronto, ON M6S 1P1",
        "phone": "(416) 762-2312",
        "hours": "Mon-Fri 8am-7pm, Sat 9am-4pm",
        "distance": "1.2 km",
        "rating": 4.6,
        "ohip": False,
        "uhip": True,
        "specialties": ["General Dentistry", "Orthodontics", "Oral Surgery"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "College Spadina Health Centre",
        "address": "720 Spadina Ave #200, Toronto, ON M5S 2T9",
        "phone": "(416) 323-9772",
        "hours": "Mon-Fri 9am-5pm",
        "distance": "0.3 km",
        "rating": 4.1,
        "ohip": True,
        "uhip": True,
        "specialties": ["Walk-in", "General Practice", "Lab Work"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Kensington Health",
        "address": "25 Brunswick Ave, Toronto, ON M5S 2L9",
        "phone": "(416) 967-1500",
        "hours": "Mon-Fri 8:30am-4:30pm",
        "distance": "0.8 km",
        "rating": 4.4,
        "ohip": True,
        "uhip": True,
        "specialties": ["Physiotherapy", "Mental Health", "Dental"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Smile Zone Dental",
        "address": "181 University Ave #200, Toronto, ON M5H 3M7",
        "phone": "(416) 361-9333",
        "hours": "Mon-Sat 8am-8pm",
        "distance": "1.5 km",
        "rating": 4.7,
        "ohip": False,
        "uhip": True,
        "specialties": ["General Dentistry", "Cosmetic", "Emergency"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Annex Paramedical Clinic",
        "address": "460 Bloor St W, Toronto, ON M5S 1X8",
        "phone": "(416) 966-1204",
        "hours": "Mon-Fri 10am-7pm, Sat 10am-3pm",
        "distance": "0.6 km",
        "rating": 4.2,
        "ohip": True,
        "uhip": True,
        "specialties": ["Physiotherapy", "Chiropractic", "Massage Therapy", "Acupuncture"],
        "accepting": True,
        "source": "static",
    },
    {
        "name": "Bathurst-College Medical Centre",
        "address": "340 College St #500, Toronto, ON M5T 3A9",
        "phone": "(416) 920-3535",
        "hours": "Mon-Fri 9am-6pm",
        "distance": "0.4 km",
        "rating": 4.0,
        "ohip": True,
        "uhip": False,
        "specialties": ["Family Medicine", "Dermatology", "Pharmacy"],
        "accepting": False,
        "source": "static",
    },
]

# Cache for scraped results
_scraped_cache: Optional[list[dict]] = None


def _parse_scraped_clinics(markdown: str) -> list[dict]:
    """Parse clinic data from Firecrawl markdown output."""
    clinics = []
    lines = markdown.split("\n")
    current: dict = {}

    for line in lines:
        line = line.strip()
        if not line:
            if current.get("name"):
                clinics.append(current)
                current = {}
            continue

        # Try to detect clinic names (typically bold or heading)
        if line.startswith("#") or line.startswith("**"):
            if current.get("name"):
                clinics.append(current)
            name = line.lstrip("#* ").rstrip("* ")
            current = {
                "name": name,
                "address": "",
                "phone": "",
                "hours": "",
                "distance": "",
                "rating": 4.0,
                "ohip": False,
                "uhip": False,
                "specialties": [],
                "accepting": True,
                "source": "firecrawl",
            }
        elif current:
            lower = line.lower()
            if any(kw in lower for kw in ["address", "location"]) or "toronto" in lower:
                current["address"] = line.split(":", 1)[-1].strip() if ":" in line else line
            elif any(kw in lower for kw in ["phone", "tel", "call"]):
                current["phone"] = line.split(":", 1)[-1].strip() if ":" in line else line
            elif any(kw in lower for kw in ["hour", "open", "mon", "tue"]):
                current["hours"] = line.split(":", 1)[-1].strip() if ":" in line else line
            elif "ohip" in lower:
                current["ohip"] = "yes" in lower or "accept" in lower
            elif "uhip" in lower:
                current["uhip"] = "yes" in lower or "accept" in lower
            elif any(kw in lower for kw in ["dental", "orthodon", "surgery", "cleaning"]):
                if not current["specialties"]:
                    current["specialties"] = [s.strip() for s in line.split(",") if s.strip()]

    if current.get("name"):
        clinics.append(current)

    return clinics


async def scrape_clinics() -> list[dict]:
    """Scrape clinic data using Firecrawl, with static fallback."""
    global _scraped_cache

    if _scraped_cache is not None:
        return _scraped_cache

    api_key = settings.firecrawl_api_key
    if not api_key:
        logger.info("clinic_scraper_no_key", message="No Firecrawl API key, using static data")
        return STATIC_CLINICS

    try:
        from firecrawl import FirecrawlApp

        app = FirecrawlApp(api_key=api_key)

        # Scrape the UofT student dental resources page
        result = app.scrape(
            "https://studentlife.utoronto.ca/task/find-a-health-professional/",
            formats=["markdown"],
        )

        markdown = getattr(result, "markdown", "") or (result.get("markdown", "") if isinstance(result, dict) else "")
        if not markdown:
            logger.warning("clinic_scraper_empty", message="Firecrawl returned empty markdown")
            return STATIC_CLINICS

        scraped = _parse_scraped_clinics(markdown)
        logger.info("clinic_scraper_success", count=len(scraped))

        if len(scraped) < 3:
            # Not enough data scraped, merge with static
            logger.info("clinic_scraper_supplementing", scraped=len(scraped), static=len(STATIC_CLINICS))
            # Add static clinics that aren't duplicates
            scraped_names = {c["name"].lower() for c in scraped}
            for static in STATIC_CLINICS:
                if static["name"].lower() not in scraped_names:
                    scraped.append(static)

        _scraped_cache = scraped
        return scraped

    except Exception as e:
        logger.error("clinic_scraper_error", error=str(e))
        return STATIC_CLINICS
