import subprocess
import datetime

# 获取当前日期时间作为版本号（格式：vYYYY.MM.DD.HHMMSS）
date_str = datetime.datetime.now().strftime('%Y.%m.%d')
time_str = datetime.datetime.now().strftime('%H%M%S')
version = f"v{date_str}.{time_str}"

# 创建新的 tag
subprocess.run(["git", "tag", version], check=True)

# 推送 tag 到远程仓库
subprocess.run(["git", "push", "origin", version], check=True)

# 打印信息确认
print(f"Created and pushed tag: {version}")
