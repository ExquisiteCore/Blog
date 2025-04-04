import subprocess
import datetime
import sys

# 获取当前日期时间作为版本号（格式：vYYYY.MM.DD.HHMMSS）
date_str = datetime.datetime.now().strftime('%Y.%m.%d')
time_str = datetime.datetime.now().strftime('%H%M%S')
version = f"v{date_str}.{time_str}"

try:
    # 检查当前 Git 状态，确保工作区没有未提交的更改
    status = subprocess.run(["git", "status", "--porcelain"], check=True, stdout=subprocess.PIPE, text=True)
    if status.stdout.strip():
        print("There are uncommitted changes. Please commit them before creating a release.")
        sys.exit(1)

    # 创建新的 tag
    print(f"Creating tag: {version}")
    subprocess.run(["git", "tag", version], check=True)

    # 推送 tag 到远程仓库
    print(f"Pushing tag {version} to remote...")
    subprocess.run(["git", "push", "origin", version], check=True)

    # 打印信息确认
    print(f"Created and pushed tag: {version}")

except subprocess.CalledProcessError as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
