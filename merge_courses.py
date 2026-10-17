import csv
import re
import os

def clean_val(val):
    if val is None:
        return ""
    v = str(val).strip()
    if v.lower() in ("nan", "none", "null"):
        return ""
    return v

def format_score(val, label):
    v = clean_val(val)
    if not v:
        return ""
    # if it's a number like 4.0 or 4
    try:
        f = float(v)
        if f.is_integer():
            return f"{label}:{int(f)}/5"
        return f"{label}:{f}/5"
    except ValueError:
        return f"{label}:{v}/5"

def merge_courses_csv(csv_path="通識課回覆 的副本 - 工作表1.csv", output_path="campus_knowledge.csv"):
    if not os.path.exists(csv_path):
        print(f"⚠️ 找不到檔案: {csv_path}")
        print(f"請將 '{csv_path}' 放置於專案根目錄後再次執行。")
        return False

    print(f"正在讀取並處理問卷資料: {csv_path} ...")

    # 1. 讀取原始問卷 CSV
    records = []
    with open(csv_path, "r", encoding="utf-8-sig", errors="replace") as f:
        reader = csv.reader(f)
        header = next(reader, None)
        for row in reader:
            if not row:
                continue
            # 取有效前 8 欄
            r = row[:8] + [""] * max(0, 8 - len(row))
            uid, course, teacher, water, sweet, eval_m, recommend, comment = r[:8]
            records.append({
                'id': uid,
                'course': course,
                'teacher': teacher,
                'water': water,
                'sweet': sweet,
                'eval_method': eval_m,
                'recommend': recommend,
                'comment': comment
            })

    # 2. 依「課程名稱 + 授課老師」進行聚合
    course_map = {}

    for r in records:
        c_name = clean_val(r['course'])
        if not c_name:
            continue

        t_raw = clean_val(r['teacher'])
        t_clean = re.sub(r'老師|教授|（歷史系）', '', t_raw).strip()
        uid = clean_val(r['id'])

        # 數值與文字清理
        w = format_score(r['water'], "涼度")
        s = format_score(r['sweet'], "甜度")
        rec = format_score(r['recommend'], "推薦")
        
        eval_method_val = clean_val(r['eval_method'])
        eval_m = f"評量:[{eval_method_val}]" if eval_method_val else ""
        
        comment_val = clean_val(r['comment'])
        comm = f"心得:{comment_val}" if comment_val else ""

        review_parts = [p for p in [w, s, rec, eval_m, comm] if p]
        single_review = f"【編號#{uid}學長姐】({'。'.join(review_parts)})"

        key = (c_name, t_clean)
        if key not in course_map:
            course_map[key] = []
        course_map[key].append(single_review)

    # 3. 轉化為標準 3 欄格式
    new_rows = []
    for (c_name, t_clean), reviews in course_map.items():
        kw = [c_name]
        if t_clean:
            kw.append(t_clean)
        kw.extend(["通識", "選課"])
        # 去重保留順序
        kw_unique = list(dict.fromkeys(kw))
        kw_str = ",".join(kw_unique)

        title = f"通識-{c_name}" + (f" ({t_clean})" if t_clean else "")
        info_str = " ｜ ".join(reviews)

        new_rows.append({"關鍵字": kw_str, "名稱": title, "情報內容": info_str})

    print(f"聚合完成，共彙整 {len(new_rows)} 門獨立課程/教師資料。")

    # 4. 追加至 campus_knowledge.csv
    existing_rows = []
    if os.path.exists(output_path):
        try:
            with open(output_path, "r", encoding="utf-8-sig", errors="replace") as f:
                reader = csv.DictReader(f)
                for r in reader:
                    existing_rows.append({
                        "關鍵字": r.get("關鍵字", ""),
                        "名稱": r.get("名稱", ""),
                        "情報內容": r.get("情報內容", "")
                    })
        except Exception as e:
            print(f"讀取既有 {output_path} 發生異常: {e}")

    merged_rows = existing_rows + new_rows

    with open(output_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["關鍵字", "名稱", "情報內容"])
        writer.writeheader()
        for r in merged_rows:
            writer.writerow(r)

    print(f"✅ 成功聚合並追加 {len(new_rows)} 筆通識課程至 {output_path} (總計 {len(merged_rows)} 筆資料)")
    return True

if __name__ == "__main__":
    merge_courses_csv()
