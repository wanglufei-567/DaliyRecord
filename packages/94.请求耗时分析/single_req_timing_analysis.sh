#!/bin/bash

# =============================================================================
# 请求耗时统计脚本
#
# 功能说明：
# 1. 使用curl命令进行请求
# 2. 统计网络请求的各个时间节点（DNS解析、连接建立、数据传输等）
# 3. 分析文件大小和下载速度
# 4. 生成格式化的性能报告
#
# =============================================================================

echo "🚀 开始测试 Wonderlab JS 文件加载耗时..."
echo ""

# =============================================================================
# 核心功能：执行HTTP请求并收集性能指标
# =============================================================================

# 使用curl执行HTTP请求，同时收集多种性能指标
# -w 参数定义输出格式，包含以下指标：
#   - time_total: 总耗时（从请求开始到完成的总时间）
#   - time_starttransfer: 首字节时间/TTFB（从请求开始到接收到第一个字节的时间）
#   - time_namelookup: DNS解析时间
#   - time_connect: TCP连接建立时间
#   - time_appconnect: SSL/TLS握手时间（HTTPS协议）
#   - size_download: 下载的总字节数
#   - speed_download: 平均下载速度（字节/秒）
#   - http_code: HTTP响应状态码

curl_output=$(curl -w "time_total:%{time_total}|time_starttransfer:%{time_starttransfer}|time_namelookup:%{time_namelookup}|time_connect:%{time_connect}|time_appconnect:%{time_appconnect}|size_download:%{size_download}|speed_download:%{speed_download}|http_code:%{http_code}" \
  'https://www.bi.wonderlab.top/survey-engine/main.js' \
  -H "Accept-Encoding: gzip, deflate, br, zstd" \
  -H 'Accept: */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9,ko;q=0.8,en;q=0.7' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'uIdToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxLVV0TTkxYW1mWkNKdnlmZDJwaWJ6Z3dLQXdoemFFZktEaFp4K3dJdjBDL2IyRlNDQ2tXRGFJZTFVNllqTDJuL3FFbmlzQWR1V1hKRWJVRE5kWEZkN0JBa3MrYlA3N1ZXYm5WYUVOUjFPemsyMFBmNVZqNWlTRGFmSzU3dFpjbzUwVG9nPSIsImF1dG9Mb2dvdXRPbkNsb3NlRW5hYmxlZCI6ZmFsc2UsImlzcyI6Imd1YW5kYXRhLmNvbSIsImV4cCI6MTc1MDc1NDM3NywiaWF0IjoxNzQ5NjM1MjE2LCJpbml0VGltZSI6IjIwMjUtMDYtMTAgMTY6Mzk6MzcuNjUxIiwianRpIjoiZDA0NzM5YmFiNTA4MDQzYzA5YmQ4ZGNjYjBhZmY1ZjM2OTgwMmYxYjVlYzc3YTY3NjJmY2Y1Nzg5MWRhNGQzYTE3Njc1NWRkNmIzNjAwMWExZDg4MzNiMDhhODBhZDQ4OTg5NTdkOWYyMGUxM2E5M2NkM2NlMDk4ZjE5MmNlMDk4Y2RhZTMzMzQzMGIzOWI0ZWY3ZjI3ZjdiODU2MDQxZTJkZDQ5ZmNiNjJlNjVkMDM5YTMyYWI4ZmJiNTQwZWM4ZWJhNjYyM2U1OGFjNTEwYjEyMzc2ZjkwNDEwNzM5ZjRlZDFlM2I2NGJkNjVmNWRjMDAxOTE4NjE3MzE2ZDk4MCIsInB3ZFZlcnNpb24iOjExLjB9.EJo9_yQDGk1OXudRoV3LK3h2leh3e-gn0RXZx6kPgwg; uIdToken.sig=K4i8mKyaY_jIX6dQbAu83Xm75RE' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://www.bi.wonderlab.top/survey-engine/form-data/75a7c454-9d02-46d8-afb8-5e12e17a0c7b?ps=iframe2' \
  -H 'Sec-Fetch-Dest: script' \
  -H 'Sec-Fetch-Mode: no-cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -o /dev/null \
  -s)

# =============================================================================
# 错误处理：检查curl命令是否执行成功
# =============================================================================

# 检查curl的退出状态码
# $? 表示上一个命令的退出状态，0表示成功，非0表示失败
if [ $? -ne 0 ]; then
    echo "❌ 请求失败，请检查网络连接或URL是否正确"
    exit 1
fi

# =============================================================================
# 数据解析：从curl输出中提取各项性能指标
# =============================================================================

# 使用grep和cut命令解析curl的输出字符串
# grep -o 'pattern' : 只输出匹配的部分
# cut -d: -f2 : 以冒号为分隔符，取第二个字段

# 提取总耗时（秒）
time_total=$(echo "$curl_output" | grep -o 'time_total:[^|]*' | cut -d: -f2)

# 提取首字节时间（TTFB - Time To First Byte）
time_starttransfer=$(echo "$curl_output" | grep -o 'time_starttransfer:[^|]*' | cut -d: -f2)

# 提取DNS解析时间
time_namelookup=$(echo "$curl_output" | grep -o 'time_namelookup:[^|]*' | cut -d: -f2)

# 提取TCP连接建立时间
time_connect=$(echo "$curl_output" | grep -o 'time_connect:[^|]*' | cut -d: -f2)

# 提取SSL/TLS握手时间
time_appconnect=$(echo "$curl_output" | grep -o 'time_appconnect:[^|]*' | cut -d: -f2)

# 提取下载字节数
size_download=$(echo "$curl_output" | grep -o 'size_download:[^|]*' | cut -d: -f2)

# 提取下载速度（字节/秒）
speed_download=$(echo "$curl_output" | grep -o 'speed_download:[^|]*' | cut -d: -f2)

# 提取HTTP状态码
http_code=$(echo "$curl_output" | grep -o 'http_code:[^|]*' | cut -d: -f2)

# =============================================================================
# 数据处理：单位转换和格式化
# =============================================================================

# 将字节转换为MB（保留2位小数）
# bc -l : 使用bc计算器进行浮点运算
# 2>/dev/null : 重定向错误输出，避免bc不存在时的错误信息
# || echo "0.00" : 如果bc命令失败，则输出默认值
size_mb=$(echo "scale=2; $size_download / 1024 / 1024" | bc -l 2>/dev/null || echo "0.00")

# 将字节/秒转换为KB/秒（保留2位小数）
speed_kb=$(echo "scale=2; $speed_download / 1024" | bc -l 2>/dev/null || echo "0.00")

# =============================================================================
# 结果输出：生成格式化的性能报告
# =============================================================================

echo "📊 Wonderlab JS 文件加载统计报告"
echo "=================================================="
echo "🕐 总耗时:          ${time_total}s"               # 完整请求的总时间
echo "⚡ 首字节时间(TTFB): ${time_starttransfer}s"      # 服务器响应时间指标
echo "🔍 DNS解析:         ${time_namelookup}s"          # 域名解析耗时
echo "🔌 TCP连接:         ${time_connect}s"            # 网络连接建立耗时
echo "🔒 SSL握手:         ${time_appconnect}s"          # HTTPS安全连接耗时
echo "📦 文件大小:        ${size_download} bytes (${size_mb} MB)"  # 文件大小（原始字节数和MB）
echo "⬇️  下载速度:        ${speed_download} bytes/s (${speed_kb} KB/s)"  # 下载速度（字节/秒和KB/秒）
echo "📱 HTTP状态:        ${http_code}"                # HTTP响应状态码（200=成功）
echo "=================================================="
echo "✅ 测试完成!"

# =============================================================================
# 性能指标说明：
#
# 1. 总耗时 (time_total)：
#    从发起请求到完全下载完成的总时间
#
# 2. 首字节时间 (TTFB - Time To First Byte)：
#    从发起请求到接收到第一个字节的时间，反映服务器处理速度
#
# 3. DNS解析 (time_namelookup)：
#    将域名解析为IP地址的时间
#
# 4. TCP连接 (time_connect)：
#    建立TCP连接的时间
#
# 5. SSL握手 (time_appconnect)：
#    HTTPS协议中SSL/TLS握手的时间
#
# 6. 文件大小：
#    实际下载的文件大小
#
# 7. 下载速度：
#    平均下载速度，可用于评估网络带宽
#
# 8. HTTP状态：
#    200: 成功
#    404: 文件未找到
#    500: 服务器错误
#    其他: 参考HTTP状态码标准
# =============================================================================

