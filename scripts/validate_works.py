#!/usr/bin/env python3
"""
Validate work Markdown frontmatter against the schema used by create_work.py.

Iterates over docs/works (skipping index.md), checks for missing or invalid
fields, and interactively prompts to resolve issues or map unknown fields.
Writes updated Markdown files when corrections are made.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from typing import Any, Dict, List, Optional, Tuple

from scripts.create_work import (
    FIELDS as CREATE_FIELDS,
    FRONTMATTER_ORDER,
    WORK_FORMAT_OPTIONS,
    WORK_TYPE_OPTIONS,
    format_frontmatter_value,
    normalize_slug,
    parse_date,
    parse_sidebar_position,
)

WORKS_DIR = ROOT / "docs" / "works"

FIELD_MAP = {field.key: field for field in CREATE_FIELDS}
REQUIRED_FIELDS = {field.key for field in CREATE_FIELDS if field.required} | {"slug"}
INT_FIELDS = {"sidebar_position"}
DATE_FIELDS = {"created", "issued"}


def read_frontmatter(markdown_path: Path) -> Tuple[Dict[str, Any], List[str]]:
    text = markdown_path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError(f"{markdown_path} missing frontmatter start marker '---'.")

    data_lines: List[str] = []
    end_idx = None
    for idx, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            end_idx = idx
            break
        data_lines.append(line)

    if end_idx is None:
        raise ValueError(f"{markdown_path} missing frontmatter end marker '---'.")

    metadata: Dict[str, Any] = {}
    for raw in data_lines:
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"Malformed frontmatter line '{raw}' in {markdown_path}.")
        key, value = line.split(":", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            raise ValueError(f"Empty frontmatter key in line '{raw}' ({markdown_path}).")
        if value.startswith('"') and value.endswith('"'):
            processed = value[1:-1].replace(r'\"', '"').replace(r"\\", "\\")
        else:
            processed = value
        metadata[key] = processed

    body_lines = lines[end_idx + 1 :]
    return metadata, body_lines


def prompt_choice(label: str, options: List[str], allow_blank: bool = False) -> Optional[str]:
    print(f"{label}:")
    for idx, option in enumerate(options, start=1):
        print(f"  {idx}. {option}")
    if allow_blank:
        print("  0. Leave blank")

    while True:
        raw = input("Select option number: ").strip()
        if allow_blank and raw == "0":
            return None
        if raw.isdigit():
            idx = int(raw)
            if 1 <= idx <= len(options):
                return options[idx - 1]
        print("Invalid selection, please try again.")


def prompt_value(key: str) -> Any:
    if key == "slug":
        suggestion = input("Suggested slug missing. Enter slug (must start with /works/): ").strip()
        return normalize_slug(suggestion)
    if key in DATE_FIELDS:
        while True:
            value = input(f"{key} (YYYY-MM-DD or keywords like 'today'): ").strip()
            try:
                return parse_date(value)
            except ValueError as err:
                print(f"Invalid date: {err}")
    if key in INT_FIELDS:
        while True:
            value = input(f"{key} (integer): ").strip()
            try:
                return parse_sidebar_position(value)
            except ValueError as err:
                print(f"Invalid number: {err}")
    if key == "type":
        return prompt_choice("Select Type", WORK_TYPE_OPTIONS)
    if key == "format":
        return prompt_choice("Select Format", WORK_FORMAT_OPTIONS, allow_blank=True)
    field = FIELD_MAP[key]
    while True:
        value = input(f"{field.label}: ").strip()
        if value or field.required:
            return value
        print("Value required.")


def normalize_value(key: str, value: Any) -> Any:
    if value is None or value == "":
        return None
    if key in DATE_FIELDS:
        return parse_date(str(value))
    if key in INT_FIELDS:
        return parse_sidebar_position(str(value))
    if key == "slug":
        return normalize_slug(str(value))
    if key == "type":
        normalized = str(value)
        if normalized not in WORK_TYPE_OPTIONS:
            raise ValueError(f"Type must be one of {', '.join(WORK_TYPE_OPTIONS)}")
        return normalized
    if key == "format":
        normalized = str(value)
        if normalized and normalized not in WORK_FORMAT_OPTIONS:
            raise ValueError(f"Format must be one of {', '.join(WORK_FORMAT_OPTIONS)}")
        return normalized or None
    return str(value)


def handle_unknown_fields(metadata: Dict[str, Any]) -> bool:
    changed = False
    unknown_keys = [key for key in metadata if key not in FIELD_MAP]
    for key in unknown_keys:
        print(f"Unrecognized field '{key}'.")
        print("Known fields:", ", ".join(FIELD_MAP.keys()))
        target = input("Map this field to a known field (leave blank to keep as-is, 'delete' to remove): ").strip()
        if not target:
            continue
        if target.lower() == "delete":
            metadata.pop(key)
            changed = True
            continue
        if target not in FIELD_MAP:
            print("Invalid target field; keeping original key.")
            continue
        if target in metadata:
            print(f"Target field '{target}' already present; skipping mapping.")
            continue
        metadata[target] = metadata.pop(key)
        changed = True
    return changed


def validate_metadata(metadata: Dict[str, Any], path: Path) -> Dict[str, Any]:
    updated = dict(metadata)
    changed = handle_unknown_fields(updated)

    for key in REQUIRED_FIELDS:
        if not updated.get(key):
            print(f"Missing required field '{key}' in {path}.")
            updated[key] = prompt_value(key)
            changed = True

    for key, raw_value in list(updated.items()):
        if key not in FIELD_MAP:
            continue
        while True:
            try:
                normalized = normalize_value(key, raw_value)
            except ValueError as err:
                print(f"Invalid value for '{key}' ({raw_value}): {err}")
                raw_value = prompt_value(key)
                changed = True
                continue
            else:
                break
        if normalized is None:
            if key in REQUIRED_FIELDS:
                print(f"Field '{key}' cannot be empty.")
                raw_value = prompt_value(key)
                changed = True
                continue
            if key in updated:
                updated.pop(key)
                changed = True
        else:
            if normalized != raw_value:
                updated[key] = normalized
                changed = True

    return updated if changed else metadata


def write_markdown(path: Path, metadata: Dict[str, Any], body_lines: List[str]) -> None:
    frontmatter_lines: List[str] = ["---"]
    for key in FRONTMATTER_ORDER:
        if key in metadata:
            frontmatter_lines.append(f"{key}: {format_frontmatter_value(metadata[key])}")
    for key in metadata:
        if key not in FRONTMATTER_ORDER:
            frontmatter_lines.append(f"{key}: {format_frontmatter_value(metadata[key])}")
    frontmatter_lines.append("---")

    content = "\n".join(frontmatter_lines + [""] + body_lines)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def main() -> None:
    if not WORKS_DIR.exists():
        print(f"Works directory not found: {WORKS_DIR}", file=sys.stderr)
        sys.exit(1)

    markdown_files = sorted(WORKS_DIR.rglob("*.md"))
    processed = 0

    for md_path in markdown_files:
        if md_path.name == "index.md":
            continue
        print(f"\nChecking {md_path.relative_to(ROOT)}")
        try:
            metadata, body_lines = read_frontmatter(md_path)
        except ValueError as err:
            print(f"Error: {err}")
            continue
        updated = validate_metadata(metadata, md_path)
        if updated != metadata:
            write_markdown(md_path, updated, body_lines)
            print("Updated file.")
        else:
            print("No changes needed.")
        processed += 1

    print(f"\nProcessed {processed} work files.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAborted by user.")
