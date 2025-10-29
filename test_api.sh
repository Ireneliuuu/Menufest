#!/bin/bash

# Menufest API 測試腳本 - 發送 curl 請求

API_BASE_URL="http://127.0.0.1:8081"

# 生成用戶ID
generate_user_id() {
    if command -v uuidgen >/dev/null 2>&1; then
        uuidgen
    else
        date +%s | sha256sum | head -c 32
    fi
}

# 發送 curl 請求
send_curl() {
    local endpoint=$1
    local json_file=$2
    local user_id=$3
    
    # 替換 user_id 並發送請求
    sed "s/\"user_id\": \"\"/\"user_id\": \"${user_id}\"/g" "$json_file" | \
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d @- \
        "${API_BASE_URL}${endpoint}"
}

# 主函數
main() {
    local api_type=$1
    local user_id=${2:-$(generate_user_id)}
    
    case $api_type in
        select)
            send_curl "/select_react" "select_agent_request.json" "$user_id"
            ;;
        planner)
            send_curl "/plan_menu" "planner_agent_request.json" "$user_id"
            ;;
        full)
            send_curl "/full_pipeline" "full_pipeline_request.json" "$user_id"
            ;;
        all)
            echo "=== SELECTOR API ==="
            send_curl "/select_react" "select_agent_request.json" "$user_id"
            echo -e "\n=== PLANNER API ==="
            send_curl "/plan_menu" "planner_agent_request.json" "$user_id"
            echo -e "\n=== FULL PIPELINE API ==="
            send_curl "/full_pipeline" "full_pipeline_request.json" "$user_id"
            ;;
        *)
            echo "用法: $0 [select|planner|full|all] [user_id]"
            exit 1
            ;;
    esac
}

main "$@"
