import os
import sys

from dotenv import load_dotenv

# let the tests import main.py from the folder above, and use the settings in .env
BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)
load_dotenv(os.path.join(BACKEND, ".env"))