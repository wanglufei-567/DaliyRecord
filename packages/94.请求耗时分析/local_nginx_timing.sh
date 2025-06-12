#!/bin/bash

# 本地 Nginx 服务请求耗时统计脚本

# 配置参数
DEFAULT_HOST="localhost"
DEFAULT_PORT="80"
DEFAULT_PATH="/"

# 获取用户输入或使用默认值
HOST=${1:-$DEFAULT_HOST}
PORT=${2:-$DEFAULT_PORT}
PATH=${3:-$DEFAULT_PATH}
URL="http://${HOST}:${PORT}${PATH}"

echo "🚀 开始测试本地 Nginx 服务耗时..."
echo "📍 测试URL: $URL"
echo ""

# 执行curl请求并获取所有指标
curl_output=$(curl -w "time_total:%{time_total}|time_starttransfer:%{time_starttransfer}|time_namelookup:%{time_namelookup}|time_connect:%{time_connect}|time_appconnect:%{time_appconnect}|size_download:%{size_download}|speed_download:%{speed_download}|http_code:%{http_code}|content_type:%{content_type}" \
  "$URL" \
  -H "Accept-Encoding: gzip, deflate, br" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" \
  -H "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8" \
  -H "Cache-Control: no-cache" \
  -H "Connection: keep-alive" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36" \


  -s)

# 检查curl是否成功执行
if [ $? -ne 0 ]; then
    echo "❌ 请求失败，请检查："
    echo "   1. Nginx服务是否启动"
    echo "   2. 端口是否正确"
    echo "   3. 路径是否存在"
    exit 1
fi

# 解析curl输出
time_total=$(echo "$curl_output" | grep -o 'time_total:[^|]*' | cut -d: -f2)
time_starttransfer=$(echo "$curl_output" | grep -o 'time_starttransfer:[^|]*' | cut -d: -f2)
time_namelookup=$(echo "$curl_output" | grep -o 'time_namelookup:[^|]*' | cut -d: -f2)
time_connect=$(echo "$curl_output" | grep -o 'time_connect:[^|]*' | cut -d: -f2)
time_appconnect=$(echo "$curl_output" | grep -o 'time_appconnect:[^|]*' | cut -d: -f2)
size_download=$(echo "$curl_output" | grep -o 'size_download:[^|]*' | cut -d: -f2)
speed_download=$(echo "$curl_output" | grep -o 'speed_download:[^|]*' | cut -d: -f2)
http_code=$(echo "$curl_output" | grep -o 'http_code:[^|]*' | cut -d: -f2)
content_type=$(echo "$curl_output" | grep -o 'content_type:[^|]*' | cut -d: -f2)

# 单位转换
size_kb=$(echo "scale=2; $size_download / 1024" | bc -l 2>/dev/null || echo "0.00")
speed_mb=$(echo "scale=2; $speed_download / 1024 / 1024" | bc -l 2>/dev/null || echo "0.00")

# 计算各阶段耗时（毫秒）
dns_time=$(echo "scale=3; $time_namelookup * 1000" | bc -l 2>/dev/null || echo "0.000")
connect_time=$(echo "scale=3; ($time_connect - $time_namelookup) * 1000" | bc -l 2>/dev/null || echo "0.000")
ssl_time=$(echo "scale=3; ($time_appconnect - $time_connect) * 1000" | bc -l 2>/dev/null || echo "0.000")
server_time=$(echo "scale=3; ($time_starttransfer - $time_appconnect) * 1000" | bc -l 2>/dev/null || echo "0.000")
transfer_time=$(echo "scale=3; ($time_total - $time_starttransfer) * 1000" | bc -l 2>/dev/null || echo "0.000")

# 输出格式化结果
echo "📊 本地 Nginx 服务性能统计报告"
echo "=================================================="
echo "🌐 请求URL:         $URL"
echo "📱 HTTP状态:        $http_code"
echo "📄 内容类型:        $content_type"
echo "=================================================="
echo "⏱️  时间分析 (详细):"
echo "🔍 DNS解析:         ${dns_time}ms"
echo "🔌 TCP连接:         ${connect_time}ms"
echo "🔒 SSL握手:         ${ssl_time}ms"
echo "⚡ 服务器响应:       ${server_time}ms"
echo "📥 数据传输:        ${transfer_time}ms"
echo "🕐 总耗时:          ${time_total}s"
echo "=================================================="
echo "📦 传输统计:"
echo "📊 文件大小:        ${size_download} bytes (${size_kb} KB)"
echo "⬇️  传输速度:        ${speed_download} bytes/s (${speed_mb} MB/s)"
echo "=================================================="

# 性能评估
total_ms=$(echo "scale=3; $time_total * 1000" | bc -l 2>/dev/null || echo "0.000")
if (( $(echo "$total_ms < 10" | bc -l) )); then
    echo "🚀 性能评级: 优秀 (< 10ms)"
elif (( $(echo "$total_ms < 50" | bc -l) )); then
    echo "✅ 性能评级: 良好 (< 50ms)"
elif (( $(echo "$total_ms < 200" | bc -l) )); then
    echo "⚠️  性能评级: 一般 (< 200ms)"
else
    echo "🐌 性能评级: 需要优化 (> 200ms)"
fi

echo ""
echo "✅ 测试完成!"
echo ""
echo "💡 使用方法:"
echo "   ./local_nginx_timing.sh [host] [port] [path]"
echo "   例如: ./local_nginx_timing.sh localhost 8080 /api/test"

# https://123.207.25.56:8080/survey-engine/main.js
# https://www.bi.wonderlab.top/survey-engine/main.js
# https://123.207.25.56:443/survey-engine/main.js

curl 'https://123.207.25.56:8080/survey-engine/main.js' \
  -H 'Accept: */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9,ko;q=0.8,en;q=0.7' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -b 'uIdToken=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxLWhkYWhnRW5NQituUG1wWkNadXdHUXdqSGRQU1NXUE1uTTFBYWVMN0R5eE95QVJ5dVd2QUlReTB2WGZ0bFVKZC9tRFNUZ293bzZHem5oY1dzOFdHbnFrNlNWWklIR0dTbU5jRktwQnZyWHltZlY4dFpIdzhMcnJiYjVRUEhPbTB2cW4wPSIsImF1dG9Mb2dvdXRPbkNsb3NlRW5hYmxlZCI6ZmFsc2UsImlzcyI6Imd1YW5kYXRhLmNvbSIsImV4cCI6MTc1MDc1NDM3NywiaWF0IjoxNzQ5NzA4MzQwLCJpbml0VGltZSI6IjIwMjUtMDYtMTAgMTY6Mzk6MzcuNjUxIiwianRpIjoiZDA0NzM5YmFiNTA4MDQzYzA5YmQ4ZGNjYjBhZmY1ZjM2OTgwMmYxYjVlYzc3YTY3NjJmY2Y1Nzg5MWRhNGQzYTE3Njc1NWRkNmIzNjAwMWExZDg4MzNiMDhhODBhZDQ4OTg5NTdkOWYyMGUxM2E5M2NkM2NlMDk4ZjE5MmNlMDk4Y2RhZTMzMzQzMGIzOWI0ZWY3ZjI3ZjdiODU2MDQxZTJkZDQ5ZmNiNjJlNjVkMDM5YTMyYWI4ZmJiNTQwZWM4ZWJhNjYyM2U1OGFjNTEwYjEyMzc2ZjkwNDEwNzM5ZjRlZDFlM2I2NGJkNjVmNWRjMDAxOTE4NjE3MzE2ZDk4MCIsInB3ZFZlcnNpb24iOjExLjB9.4E71_Kq5Sn1ocG_-p8WAKWgK8XcCzcUTzycqOeqhA4g; uIdToken.sig=_1d95FByjYAMR_50T-MsKFTcHl8' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://www.bi.wonderlab.top/survey-engine/form-data/75a7c454-9d02-46d8-afb8-5e12e17a0c7b?ps=iframe2' \
  -H 'Sec-Fetch-Dest: script' \
  -H 'Sec-Fetch-Mode: no-cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36' \
  -H 'sec-ch-ua: "Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'Accept-Encoding: gzip, deflate, zstdbr' \
  -w "总耗时 time_total: %{time_total}s 文件大小 size_download:%{size_download} bytes \n" \
  -o /dev/null \
  -s \
  -k
