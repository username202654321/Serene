import json
import re
from pathlib import Path

MANIFEST = Path("data/ugs-full-manifest.json")
OUTPUT = Path("migrations/0006_ugs_full_import.sql")
KNOWN = {
    "lol": "LoL", "nes": "NES", "snes": "SNES", "gba": "GBA", "gbc": "GBC",
    "rpg": "RPG", "fps": "FPS", "mmorpg": "MMORPG", "io": ".io", "ai": "AI",
}
TOKENS = [
    "energizedemerald", "tiltandtumble", "crystalshards", "superstar", "supermario",
    "mariobros", "marioparty", "mariokart", "mariotennis", "pokemon", "kirby",
    "zelda", "metroid", "sonic", "streetfighter", "mortalcombat", "spacecadet",
    "fire red", "leaf green", "randomized", "emerald", "sapphire", "gold", "silver",
    "advance", "saga", "tennis", "soccer", "basketball", "football", "racing",
    "pinball", "shooter", "shooting", "puzzle", "adventure", "defender", "arcade",
    "classic", "collection", "editor", "online", "night", "fantasy", "brazil", "japan",
]

def title_from_filename(name):
    stem = re.sub(r"\.html$", "", name, flags=re.I)
    stem = re.sub(r"^cl(?=\d|[A-Za-z])", "", stem, flags=re.I)
    stem = re.sub(r"\s*\([^)]*\)$", "", stem)
    stem = re.sub(r"\s+v\d+(?:\.\d+)*$", "", stem, flags=re.I)
    stem = stem.replace("&", " and ")
    stem = re.sub(r"[_-]+", " ", stem)
    stem = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", stem)
    for token in sorted(TOKENS, key=len, reverse=True):
        if " " not in token:
            stem = re.sub(rf"(?i)(?<![A-Za-z])({re.escape(token)})(?![A-Za-z])", r" \1 ", stem)
            stem = re.sub(rf"(?i)({re.escape(token)})(?=[A-Za-z])", r"\1 ", stem)
            stem = re.sub(rf"(?i)([A-Za-z])({re.escape(token)})", r"\1 \2", stem)
    stem = re.sub(r"(?<=\d)(?=[A-Za-z])", " ", stem)
    stem = re.sub(r"(?<=[A-Za-z])(?=\d)", " ", stem)
    stem = re.sub(r"(?i)\b(\d)\s+d\b", r"\1D", stem)
    stem = re.sub(r"(?i)\bspacecadet\b", "space cadet", stem)
    stem = re.sub(r"(?i)\btiltandtumble\b", "tilt and tumble", stem)
    stem = re.sub(r"(?i)\b3dash\b", "3Dash", stem)
    stem = re.sub(r"(?i)\b3\s+d\s+pinball\s+space\s+cadet\b", "3D Pinball: Space Cadet", stem)
    stem = re.sub(r"(?i)\b3d\s+pinball\s+space\s+cadet\b", "3D Pinball: Space Cadet", stem)
    stem = re.sub(r"(?i)\b3\s+dash\b", "3Dash", stem)
    stem = re.sub(r"\s+", " ", stem).strip()
    words = []
    for word in stem.split():
        lower = word.lower()
        if lower in KNOWN:
            words.append(KNOWN[lower])
        elif re.fullmatch(r"\d+d", lower):
            words.append(lower.upper())
        elif re.fullmatch(r"\d+v\d+", lower):
            words.append(lower)
        elif word.isupper() or any(ch.isdigit() for ch in word):
            words.append(word)
        else:
            words.append(word[:1].upper() + word[1:].lower())
    title = " ".join(words) or "Untitled Game"
    title = re.sub(r"\b(And|Of|The)\b", lambda match: match.group(1).lower(), title)
    return title[:1].upper() + title[1:]

def sql(value):
    return "'" + value.replace("'", "''") + "'"

def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8-sig"))
    lines = [
        "alter table games add column if not exists source_file text;",
        "create unique index if not exists games_source_file_idx on games(source_file) where source_file is not null;",
    ]
    for item in manifest:
        source = f"drive/{item['Id']}/{item['Name']}"
        local = "/games/" + item["Local"].replace(" ", "%20")
        title = title_from_filename(item["Name"])
        lines.append(
            f"update games set source_file = {sql(source)} where source_file = {sql(item['Name'])};"
        )
        lines.append(
            "insert into games (title, description, url, embed_source, source_file, category, tags, developer, version, status) "
            f"select {sql(title)}, '', {sql(local)}, {sql(local)}, {sql(source)}, 'Imported', '[\"imported\"]'::jsonb, '', '1.0.0', 'published' "
            f"where not exists (select 1 from games where source_file = {sql(source)});"
        )
    lines.append("insert into serene_migrations (id) values ('0006_ugs_full_import') on conflict (id) do nothing;")
    OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"generated {OUTPUT} for {len(manifest)} sources")

if __name__ == "__main__":
    main()
