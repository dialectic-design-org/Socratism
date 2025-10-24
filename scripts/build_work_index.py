#!/usr/bin/env python3
"""
Generate a JSON index for all works defined under docs/works.

Skips docs/works/index.md and collects frontmatter metadata for every other
Markdown file (including files in subdirectories). The result is written to
computed/works-index.json relative to the repository root.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

ROOT = Path(__file__).resolve().parent.parent
WORKS_DIR = ROOT / "docs" / "works"
OUTPUT_DIR = ROOT / "computed"
OUTPUT_PATH = OUTPUT_DIR / "works-index.json"


def extract_frontmatter(markdown_path: Path) -> Tuple[Dict[str, Any], int]:
    text = markdown_path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        raise ValueError(f"{markdown_path} is missing frontmatter.")

    lines = text.splitlines()
    if lines[0].strip() != "---":
        raise ValueError(f"{markdown_path} frontmatter must begin with '---'.")

    front_lines: List[str] = []
    end_index = None
    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_index = idx
            break
        front_lines.append(line)

    if end_index is None:
        raise ValueError(f"{markdown_path} frontmatter must end with '---'.")

    data: Dict[str, Any] = {}
    for raw_line in front_lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Unrecognized frontmatter line '{raw_line}' in {markdown_path}.")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError(f"Frontmatter key missing in line '{raw_line}' of {markdown_path}.")
        if value.startswith('"') and value.endswith('"'):
            processed = value[1:-1].replace(r'\"', '"').replace(r"\\", "\\")
        else:
            try:
                processed = int(value)
            except ValueError:
                processed = value
        data[key] = processed

    return data, end_index + 1


def collect_works() -> List[Dict[str, Any]]:
    if not WORKS_DIR.exists():
        raise FileNotFoundError(f"Works directory not found: {WORKS_DIR}")

    entries: List[Dict[str, str]] = []
    for md_path in sorted(WORKS_DIR.rglob("*.md")):
        if md_path.name == "index.md":
            continue
        frontmatter, _ = extract_frontmatter(md_path)
        entry = dict(frontmatter)
        entry["file"] = str(md_path.relative_to(ROOT))
        entries.append(entry)

    return entries


def main() -> None:
    try:
        works = collect_works()
    except Exception as err:
        print(f"Failed to collect works: {err}", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(works, indent=2), encoding="utf-8")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} with {len(works)} entries.")


if __name__ == "__main__":
    main()
