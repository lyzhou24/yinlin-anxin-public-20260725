import csv
import json
from pathlib import Path

MEDICINE_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = MEDICINE_DIR / "data" / "source" / "医保药品编码"
TASK_FILE = MEDICINE_DIR / "data" / "source" / "首批药品任务清单.csv"
OUT_FILE = MEDICINE_DIR / "data" / "results" / "医保编码匹配结果.json"

if not TASK_FILE.exists():
    raise FileNotFoundError(
        f"缺少任务清单：{TASK_FILE}。请先按模板准备首批药品任务清单，再运行本脚本。"
    )

with TASK_FILE.open("r", encoding="utf-8-sig", newline="") as f:
    targets = list(csv.DictReader(f))

target_names = [row["通用名称"].strip() for row in targets]
exact = {name: [] for name in target_names}
alias_matches = {name: [] for name in target_names}
fuzzy = {name: [] for name in target_names}

STANDARD_ALIASES = {
    "二甲双胍片": ["盐酸二甲双胍片"],
    "西格列汀片": ["磷酸西格列汀片"],
}

def normalize(value):
    return (value or "").replace(" ", "").strip()

def stem(name):
    suffixes = ["缓释胶囊", "缓释片", "控释片", "肠溶胶囊", "肠溶片", "咀嚼片", "颗粒", "胶囊", "片"]
    for suffix in suffixes:
        if name.endswith(suffix):
            return name[: -len(suffix)]
    return name

source_files = sorted(SOURCE_DIR.glob("*.csv"))
total_rows = 0
for source_file in source_files:
    with source_file.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_rows += 1
            registered = normalize(row.get("zcmc"))
            for name in target_names:
                n = normalize(name)
                if registered == n:
                    item = dict(row)
                    item["source_file"] = source_file.name
                    exact[name].append(item)
                elif registered in [normalize(x) for x in STANDARD_ALIASES.get(name, [])]:
                    item = dict(row)
                    item["source_file"] = source_file.name
                    alias_matches[name].append(item)
                elif not exact[name] and len(stem(n)) >= 3 and stem(n) in registered:
                    item = dict(row)
                    item["source_file"] = source_file.name
                    if len(fuzzy[name]) < 100:
                        fuzzy[name].append(item)

summary = []
all_matches = []
candidate_rows = []
for task in targets:
    name = task["通用名称"].strip()
    matches = exact[name]
    aliases = alias_matches[name]
    candidates = [] if (matches or aliases) else fuzzy[name]
    status = "精确命中" if matches else ("标准盐型名称命中" if aliases else ("仅疑似命中" if candidates else "未命中"))
    summary.append({
        "序号": int(task["序号"]),
        "通用名称": name,
        "药品类别": task["药品类别"],
        "优先级": task["优先级"],
        "匹配状态": status,
        "精确记录数": len(matches),
        "盐型名称记录数": len(aliases),
        "疑似记录数": len(candidates),
        "备注": task.get("备注", ""),
    })
    for row in matches:
        all_matches.append({"目标序号": int(task["序号"]), "目标通用名称": name, **row})
    for row in aliases:
        all_matches.append({"目标序号": int(task["序号"]), "目标通用名称": name, **row})
    for row in candidates:
        candidate_rows.append({"目标序号": int(task["序号"]), "目标通用名称": name, **row})

result = {
    "metadata": {
        "source_dir": str(SOURCE_DIR),
        "source_file_count": len(source_files),
        "source_row_count": total_rows,
        "target_count": len(targets),
        "exact_target_count": sum(1 for x in summary if x["匹配状态"] == "精确命中"),
        "alias_target_count": sum(1 for x in summary if x["匹配状态"] == "标准盐型名称命中"),
        "candidate_target_count": sum(1 for x in summary if x["匹配状态"] == "仅疑似命中"),
        "missing_target_count": sum(1 for x in summary if x["匹配状态"] == "未命中"),
        "integrated_record_count": len(all_matches),
    },
    "summary": summary,
    "matches": all_matches,
    "candidates": candidate_rows,
}

OUT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(result["metadata"], ensure_ascii=False))
for row in summary:
    print(f'{row["序号"]:>2} {row["通用名称"]}: {row["匹配状态"]} / {row["精确记录数"] + row["盐型名称记录数"]}')
