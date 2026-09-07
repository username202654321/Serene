import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

MANIFEST = "data/ugs-full-manifest.json"
TARGET = "client/public/games"
FAILURES = "data/ugs-import-failures.json"


def main():
    with open(MANIFEST, encoding="utf-8-sig") as handle:
        manifest = json.load(handle)
    groups = {}
    for item in manifest:
        groups[item["Name"]] = groups.get(item["Name"], 0) + 1
    os.makedirs(TARGET, exist_ok=True)
    failures = []
    imported = []

    def download(item):
        stem = os.path.splitext(item["Name"])[0]
        local_name = f"{stem}__{item['Id'][:8]}.html" if groups[item["Name"]] > 1 else item["Name"]
        path = os.path.join(TARGET, local_name)
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            request = urllib.request.Request(
                f"https://drive.google.com/uc?export=download&id={item['Id']}",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(request, timeout=45) as response:
                content = response.read()
            if not content:
                raise RuntimeError("empty response")
            with open(path, "wb") as handle:
                handle.write(content)
        item["Local"] = local_name
        return item

    with ThreadPoolExecutor(max_workers=16) as executor:
        futures = {executor.submit(download, item): item for item in manifest}
        for index, future in enumerate(as_completed(futures), 1):
            item = futures[future]
            try:
                imported.append(future.result())
            except Exception as error:
                failures.append({"name": item["Name"], "id": item["Id"], "error": str(error)})
            if index % 100 == 0:
                print(f"processed={index} imported={len(imported)} failures={len(failures)}")
    imported.sort(key=lambda item: item["Id"])
    with open(MANIFEST, "w", encoding="utf-8") as handle:
        json.dump(imported, handle, ensure_ascii=False, indent=2)
    with open(FAILURES, "w", encoding="utf-8") as handle:
        json.dump(failures, handle, ensure_ascii=False, indent=2)
    print(f"complete discovered={len(manifest)} imported={len(imported)} local_files={len(os.listdir(TARGET))} failures={len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
