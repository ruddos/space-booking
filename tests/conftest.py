import sys
from pathlib import Path
import pytest

# Добавляем backend в sys.path для импорта модулей
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
