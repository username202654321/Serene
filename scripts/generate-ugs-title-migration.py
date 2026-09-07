import json
import re
from pathlib import Path
from importlib.machinery import SourceFileLoader

normalizer = SourceFileLoader("normalizer", "scripts/generate-ugs-migration.py").load_module()
manifest = json.loads(Path("data/ugs-full-manifest.json").read_text(encoding="utf-8-sig"))
lines = []
for item in manifest:
    source = f"drive/{item['Id']}/{item['Name']}"
    title = normalizer.title_from_filename(item["Name"])
    value = title.replace("'", "''")
    lines.append(f"update games set title = '{value}' where source_file = '{source.replace(chr(39), chr(39) + chr(39))}';")
lines.append("insert into serene_migrations (id) values ('0007_ugs_title_cleanup') on conflict (id) do nothing;")
Path("migrations/0010_ugs_title_final_cleanup.sql").write_text("\n".join(lines) + "\ninsert into serene_migrations (id) values ('0010_ugs_title_final_cleanup') on conflict (id) do nothing;\n", encoding="utf-8")
print(f"generated title edge cleanup for {len(manifest)} sources")
