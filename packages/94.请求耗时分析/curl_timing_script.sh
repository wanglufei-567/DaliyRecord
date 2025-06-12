#!/bin/bash

# curl请求耗时统计脚本
# 用法: ./curl_timing_script.sh [URL] [可选的curl参数]

# 检查参数
if [ $# -eq 0 ]; then
    echo "❌ 错误: 请提供URL参数"
    echo "用法: $0 <URL> [可选的curl参数]"
    echo "示例: $0 'https://example.com/api' -H 'Authorization: Bearer token'"
    exit 1
fi

URL="$1"
shift  # 移除第一个参数(URL)，剩余参数作为curl的额外选项

# 创建临时格式文件
TEMP_FORMAT_FILE=$(mktemp)
cat > "$TEMP_FORMAT_FILE" << 'EOF'

==================================================
📊 CURL 请求耗时统计报告
==================================================
🌐 请求URL: %{url_effective}
📦 HTTP状态码: %{http_code}
📊 响应大小: %{size_download} bytes (%.2f MB)

⏱️  详细时间分析:
--------------------------------------------------
🔍 DNS解析时间:      %{time_namelookup}s
🔌 TCP连接时间:      %{time_connect}s
🔒 SSL握手时间:      %{time_appconnect}s
📤 传输准备时间:     %{time_pretransfer}s
🔄 重定向时间:       %{time_redirect}s
⚡ 首字节时间(TTFB): %{time_starttransfer}s
🏁 总耗时:          %{time_total}s

📈 传输性能:
--------------------------------------------------
⬇️  下载速度:        %{speed_download} bytes/s (%.2f KB/s)
⬆️  上传速度:        %{speed_upload} bytes/s

🔗 连接信息:
--------------------------------------------------
🌍 远程IP:          %{remote_ip}:%{remote_port}
📍 本地IP:          %{local_ip}:%{local_port}

==================================================
EOF

echo "🚀 开始执行curl请求..."
echo "📍 目标URL: $URL"
echo ""

# 执行curl请求并统计时间
curl -w "@$TEMP_FORMAT_FILE" \
     -o /dev/null \
     -s \
     "$URL" \
     "$@" | awk -v size_mb=$(curl -s -I "$URL" "$@" | grep -i content-length | awk '{print $2}' | tr -d '\r' | awk '{printf "%.2f", $1/1024/1024}') '
{
    gsub(/%\{size_download\} bytes \(%.2f MB\)/, sprintf("%s bytes (%.2f MB)", $0, size_mb))
    gsub(/%.2f KB\/s/, sprintf("%.2f KB/s", speed_download/1024))
    print
}'

# 检查curl命令的退出状态
CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ 请求完成成功!"
else
    echo ""
    echo "❌ 请求失败! 退出码: $CURL_EXIT_CODE"
fi

# 清理临时文件
rm -f "$TEMP_FORMAT_FILE"

echo ""
echo "💡 提示: 如果需要查看响应内容，请移除 '-o /dev/null' 参数"
