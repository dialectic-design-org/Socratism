#!/usr/bin/env python3
"""
Interactive helper to scaffold new work entries for the catalog.

Prompts for all metadata defined in models/work.ts and writes a Markdown file
under docs/works with a populated frontmatter block.
"""

from __future__ import annotations

import curses
import re
import sys
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

ROOT = Path(__file__).resolve().parent.parent
WORKS_DIR = ROOT / "docs" / "works"


class Field:
    def __init__(
        self,
        key: str,
        label: str,
        *,
        required: bool = False,
        default: Optional[str] = None,
        transform: Optional[Callable[[str], Any]] = None,
    ) -> None:
        self.key = key
        self.label = label
        self.required = required
        self.default = default
        self.transform = transform

    def prompt(self) -> Any:
        while True:
            suffix: List[str] = []
            if self.required:
                suffix.append("required")
            if self.default is not None:
                suffix.append(f"default: {self.default}")
            prompt_suffix = f" ({', '.join(suffix)})" if suffix else ""
            value = input(f"{self.label}{prompt_suffix}: ").strip()

            if not value:
                if self.default is not None:
                    value = self.default
                elif not self.required:
                    return None
                else:
                    print("This field is required. Please enter a value.")
                    continue

            if self.transform:
                try:
                    value = self.transform(value)
                except ValueError as err:
                    print(f"Invalid value: {err}")
                    continue

            return value


def normalize_slug(raw: str) -> str:
    slug = raw.strip()
    if not slug:
        raise ValueError("slug cannot be empty")
    if not slug.startswith("/"):
        slug = "/" + slug
    if not slug.startswith("/works/"):
        raise ValueError("slug must start with /works/")
    if slug.endswith("/") and slug != "/":
        slug = slug.rstrip("/")
    return slug


def parse_date(raw: str) -> str:
    text = raw.strip().lower()
    today = date.today()

    if text == "today":
        return today.isoformat()

    if text == "tomorrow":
        return (today + timedelta(days=1)).isoformat()

    if text == "yesterday":
        return (today - timedelta(days=1)).isoformat()

    if text == "next week":
        return prompt_next_week_day(today).isoformat()

    if text.startswith("next "):
        weekday_token = text.split(" ", 1)[1]
        try:
            return resolve_next_weekday(today, weekday_token).isoformat()
        except ValueError as err:
            raise ValueError(str(err)) from err

    try:
        parsed = date.fromisoformat(raw)
    except ValueError as err:
        raise ValueError("use ISO format YYYY-MM-DD or keywords like 'today'/'next week'") from err
    return parsed.isoformat()


WEEKDAY_INDICES = {
    "monday": 0,
    "mon": 0,
    "tuesday": 1,
    "tue": 1,
    "tues": 1,
    "wednesday": 2,
    "wed": 2,
    "thursday": 3,
    "thu": 3,
    "thur": 3,
    "thurs": 3,
    "friday": 4,
    "fri": 4,
    "saturday": 5,
    "sat": 5,
    "sunday": 6,
    "sun": 6,
}


def prompt_next_week_day(reference: date) -> date:
    start = reference - timedelta(days=reference.weekday()) + timedelta(days=7)
    while True:
        answer = input("Which day next week? (e.g., Monday): ").strip().lower()
        if not answer:
            print("Please enter a weekday name.")
            continue
        try:
            index = WEEKDAY_INDICES[answer]
        except KeyError:
            print("Unrecognized weekday. Try again (e.g., Monday, Tue, Fri).")
            continue
        return start + timedelta(days=index)


def resolve_next_weekday(reference: date, weekday_token: str) -> date:
    token = weekday_token.strip().lower()
    if token not in WEEKDAY_INDICES:
        raise ValueError("unrecognized weekday after 'next'")
    start_next_week = reference - timedelta(days=reference.weekday()) + timedelta(days=7)
    return start_next_week + timedelta(days=WEEKDAY_INDICES[token])


def generate_slug_from_title(title: Optional[str]) -> str:
    if not title:
        return "/works/untitled_work"
    cleaned = re.sub(r"[^a-z0-9]+", "_", title.lower()).strip("_")
    if not cleaned:
        cleaned = "untitled_work"
    return f"/works/{cleaned}"


def prompt_slug(title: Optional[str]) -> str:
    suggestion = generate_slug_from_title(title)
    print(
        f"Suggested slug: {suggestion}\n"
        "Press Enter to accept, or type a custom slug (must start with /works/)."
    )
    while True:
        value = input("Slug: ").strip()
        if not value:
            value = suggestion
        try:
            return normalize_slug(value)
        except ValueError as err:
            print(f"{err}. Please try again.")


WORK_TYPE_OPTIONS = [
    "digital",
    "physical",
]

WORK_FORMAT_OPTIONS = [
    "Visual digital static",
    "Visual digital animated",
    "Visual digital interactive",
    "Visual audio-reactive",
    "Audio-visual",
    "Visual print poster",
    "Visual print book",
]


def prompt_choice(label: str, options: List[str], *, allow_skip: bool = False) -> Optional[str]:
    selection_options = options[:]
    if allow_skip:
        selection_options = ["[Leave blank]"] + selection_options

    print(f"Use arrow keys to choose a {label}, Enter to confirm.")
    if allow_skip:
        print("Select '[Leave blank]' to skip.")

    def _selector(stdscr: Any) -> Optional[str]:
        curses.curs_set(0)
        stdscr.nodelay(False)
        index = 0
        while True:
            stdscr.erase()
            stdscr.addstr(0, 0, f"Select {label}:")
            for offset, option in enumerate(selection_options):
                line = offset + 2
                if offset == index:
                    stdscr.attron(curses.A_REVERSE)
                    stdscr.addstr(line, 0, option)
                    stdscr.attroff(curses.A_REVERSE)
                else:
                    stdscr.addstr(line, 0, option)
            stdscr.refresh()
            key = stdscr.getch()
            if key in (curses.KEY_UP, ord("k")):
                index = (index - 1) % len(selection_options)
            elif key in (curses.KEY_DOWN, ord("j")):
                index = (index + 1) % len(selection_options)
            elif key in (curses.KEY_ENTER, 10, 13):
                if allow_skip and index == 0:
                    return None
                return selection_options[index]

    try:
        selection = curses.wrapper(_selector)
        if allow_skip and selection == "[Leave blank]":
            return None
        return selection
    except curses.error:
        print("Interactive selection unavailable; please type a value manually.")
    except Exception as err:  # fallback for terminals that cannot init curses
        print(f"Interactive selector failed ({err}). Please type a value manually.")

    # Fallback to manual input
    for idx, option in enumerate(selection_options, start=1):
        print(f"{idx}. {option}")
    while True:
        choice = input(f"Choose {label} number: ").strip()
        if choice.isdigit():
            index = int(choice) - 1
            if 0 <= index < len(selection_options):
                if allow_skip and index == 0:
                    return None
                return selection_options[index]
        print("Invalid selection. Try again.")


def parse_sidebar_position(raw: str) -> int:
    try:
        position = int(raw)
    except ValueError as err:
        raise ValueError("enter an integer") from err
    if position < 0:
        raise ValueError("value must be zero or positive")
    return position


FIELDS: List[Field] = [
    Field("title", "Title", required=True),
    Field("slug", "Slug (e.g., /works/example)", transform=normalize_slug),
    Field("description", "Description", required=True),
    Field("sidebar_position", "Sidebar position", transform=parse_sidebar_position),
    Field("created", "Created (YYYY-MM-DD)", required=True, transform=parse_date),
    Field("issued", "Issued/Published (YYYY-MM-DD)", required=True, transform=parse_date),
    Field("creator", "Creator", required=True),
    Field("contributor", "Contributor"),
    Field("publisher", "Publisher"),
    Field("subject", "Subject"),
    Field("type", "Type"),
    Field("format", "Format"),
    Field("identifier", "Identifier"),
    Field("source", "Source"),
    Field("language", "Language"),
    Field("relation", "Relation"),
    Field("coverage", "Coverage"),
    Field("rights", "Rights"),
    Field("fileSource", "File source", required=True),
    Field("previewSource", "Preview source", required=True),
    Field("staticPreviewSource", "Static preview source", required=True),
]

FRONTMATTER_ORDER = [
    "title",
    "slug",
    "description",
    "sidebar_position",
    "created",
    "issued",
    "creator",
    "contributor",
    "publisher",
    "subject",
    "type",
    "format",
    "identifier",
    "source",
    "language",
    "relation",
    "coverage",
    "rights",
    "fileSource",
    "previewSource",
    "staticPreviewSource",
]


def format_frontmatter_value(value: Any) -> str:
    if isinstance(value, int):
        return str(value)
    text = str(value)
    escaped = text.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def slug_to_path(slug: str) -> Path:
    segments = [segment for segment in slug.strip("/").split("/") if segment]
    if not segments:
        raise ValueError("slug must contain at least one segment")
    if segments[0] == "works":
        segments = segments[1:]
    if not segments:
        raise ValueError("slug must contain a segment after /works/")
    filename_segments = segments[:-1]
    basename = segments[-1]
    target_dir = WORKS_DIR.joinpath(*filename_segments)
    target_dir.mkdir(parents=True, exist_ok=True)
    return target_dir / f"{basename}.md"


def build_frontmatter(metadata: Dict[str, Any]) -> str:
    parts: List[str] = ["---"]
    for key in FRONTMATTER_ORDER:
        value = metadata.get(key)
        if value is None:
            continue
        parts.append(f"{key}: {format_frontmatter_value(value)}")
    parts.append("---")
    return "\n".join(parts)


def main() -> None:
    print("New Work Creator")
    print("================")
    metadata: Dict[str, Any] = {}
    for field in FIELDS:
        if field.transform is parse_date:
            print(
                "Enter a date (YYYY-MM-DD) or use keywords: today, tomorrow, "
                "yesterday, next week (prompts for weekday), next <weekday>."
            )
        if field.key == "slug":
            metadata[field.key] = prompt_slug(metadata.get("title"))
        elif field.key == "type":
            metadata[field.key] = prompt_choice("Type", WORK_TYPE_OPTIONS)
        elif field.key == "format":
            metadata[field.key] = prompt_choice("Format", WORK_FORMAT_OPTIONS, allow_skip=True)
        else:
            metadata[field.key] = field.prompt()

    body_default = f"# {metadata['title']}\n\n{metadata['description']}\n"
    print(
        "\nProvide body content for the Markdown file. "
        "Press Enter to use a default template."
    )
    body = input("Body: ").strip()
    content_body = body if body else body_default

    try:
        target_path = slug_to_path(metadata["slug"])
    except ValueError as err:
        print(f"Failed to determine file path: {err}", file=sys.stderr)
        sys.exit(1)

    if target_path.exists():
        choice = input(f"{target_path} already exists. Overwrite? [y/N]: ").strip().lower()
        if choice not in {"y", "yes"}:
            print("Aborted. No files written.")
            return

    frontmatter = build_frontmatter(metadata)
    target_path.write_text(f"{frontmatter}\n\n{content_body}", encoding="utf-8")
    print(f"Created {target_path.relative_to(ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nAborted by user.")
        sys.exit(1)
