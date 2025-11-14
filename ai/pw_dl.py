import subprocess
import sys
import os

python = sys.executable

cmd = [python, "-m", "playwright", "install", "chromium"]

print("Running:", " ".join(cmd))
p = subprocess.Popen(cmd)
p.wait()
