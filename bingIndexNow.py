import json
import urllib.request
from pathlib import Path
import datetime

HOST = "madderscientist.netlify.app"
KEY = "6d222551546146f9b4411ade7cfde008"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
BASE_URL = f"https://{HOST}"


def get_urls():
    urls = []
    dist_path = Path("dist")

    if not dist_path.exists():
        print("未找到 dist 文件夹，请先执行构建 (pnpm build)")
        return urls

    # 查找 dist 中所有的 index.html
    for html_file in dist_path.rglob("index.html"):
        rel_path = html_file.relative_to(dist_path).as_posix()
        url_path = rel_path.replace("index.html", "")
        # 需要提交的路径前缀列表
        allowed_prefixes = ["posts/", "everylearn/", "about/"]
        url_path_lower = url_path.lower()
        if any(url_path_lower.startswith(prefix) for prefix in allowed_prefixes):
            # 保证每个 URL 以 / 结尾（除了根路径）
            if url_path != "" and not url_path.endswith("/"):
                url_path = url_path + "/"
            urls.append(f"{BASE_URL}/{url_path}")

    return urls


def main():
    urls = get_urls()
    if not urls:
        print("没有找到要提交的 URL")
        return

    print(f"找到 {len(urls)} 个 URL 准备提交:")
    for u in urls:
        print(f"  - {u}")

    payload = {"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": urls}

    print("\n准备提交以下数据:\n", json.dumps(payload, indent=2))

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.indexnow.org/IndexNow",
        data=data,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )

    try:
        print("\n正在提交...")
        with urllib.request.urlopen(req) as response:
            status_code = response.status
            response_text = response.read().decode("utf-8")
            print(f"响应状态码: {status_code}")
            print("响应内容:", response_text)
            print("提交成功！")

            with open("IndexNow.log", "a", encoding="utf-8") as f:
                f.write(
                    f"[{datetime.datetime.now()}] SUCCESS: 状态码 {status_code}, 响应: {response_text}\n"
                )
    except Exception as e:
        print(f"\n提交出错: {e}")
        with open("IndexNow.log", "a", encoding="utf-8") as f:
            f.write(f"[{datetime.datetime.now()}] ERROR: {e}\n")


if __name__ == "__main__":
    main()
