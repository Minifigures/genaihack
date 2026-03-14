import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
from agents.perception.normalizer import get_category


class TestGetCategory:
    def test_diagnostic(self):
        assert get_category("01201") == "diagnostic"

    def test_preventive(self):
        assert get_category("11101") == "preventive"

    def test_restorative(self):
        assert get_category("21111") == "restorative"

    def test_endodontic(self):
        assert get_category("33211") == "endodontic"

    def test_periodontic(self):
        assert get_category("43421") == "periodontic"

    def test_oral_surgery(self):
        assert get_category("71101") == "oral_surgery"

    def test_invalid_code(self):
        assert get_category("abc") == "unknown"

    def test_empty_code(self):
        assert get_category("") == "unknown"

    def test_short_code(self):
        assert get_category("111") == "unknown"
