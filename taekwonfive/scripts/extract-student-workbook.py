"""Read the supplied workbook into a local JSON intermediate; never edit it."""
import datetime
import hashlib
import json
from pathlib import Path
import sys

import openpyxl

sys.stdout.reconfigure(encoding="utf-8")
source = Path(sys.argv[1])
destination = Path(sys.argv[2])
workbook = openpyxl.load_workbook(source, data_only=False)
populated = [sheet for sheet in workbook if any(cell.value is not None for row in sheet for cell in row)]
if len(populated) != 1:
    raise ValueError("Expected one populated worksheet.")
sheet = populated[0]
headers = [cell.value for cell in sheet[1]]
expected = ["id", "name", "birth_date", "school", "gender", "grade", "poom", "guardian_name", "notes", "created_at", "무슨 요일인지"]
if headers != expected:
    raise ValueError("Unexpected workbook headers.")
rows = []
for cells in sheet.iter_rows(min_row=2):
    if all(cell.value is None for cell in cells):
        continue
    if any(cell.data_type == "f" for cell in cells):
        raise ValueError(f"Formula found at row {cells[0].row}.")
    row = dict(zip(headers, [cell.value for cell in cells]))
    row["source_row"] = cells[0].row
    rows.append(row)
destination.parent.mkdir(parents=True, exist_ok=True)
destination.write_text(json.dumps({
    "source": str(source.resolve()),
    "sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "sheet": sheet.title,
    "rows": rows,
}, ensure_ascii=False, indent=2, default=lambda value: value.isoformat() if isinstance(value, (datetime.date, datetime.datetime)) else str(value)), encoding="utf-8")
print(json.dumps({"rows": len(rows), "missing_ids": [row["source_row"] for row in rows if not row["id"]], "missing_names": [row["source_row"] for row in rows if not row["name"]]}, ensure_ascii=False))
