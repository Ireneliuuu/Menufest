#!/bin/bash

# 完整版食材插入腳本
# 用戶 ID: f9d8631f-d491-4bf8-92c0-69e4bce5f730

set -e  # 遇到錯誤時停止

echo "=== 食材插入腳本 ==="
echo "用戶 ID: f9d8631f-d491-4bf8-92c0-69e4bce5f730"
echo ""

# 檢查 jq 是否安裝
if ! command -v jq &> /dev/null; then
    echo "❌ 需要安裝 jq 來處理 JSON 回應"
    echo "請運行: brew install jq (macOS) 或 apt-get install jq (Ubuntu)"
    exit 1
fi

# 檢查後端是否運行
echo "檢查後端服務..."
if ! curl -s http://localhost:8080/auth/login > /dev/null; then
    echo "❌ 後端服務未運行，請先啟動後端服務"
    echo "運行: cd backend && npm start"
    exit 1
fi
echo "✅ 後端服務正常"

# 登入獲取 token
echo ""
echo "正在登入獲取 JWT token..."

# 嘗試不同的登入方式
LOGIN_RESPONSE=""
if curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "Claire@example.com", "password": "my-very-strong-password"}' > /tmp/login_response.json; then
    LOGIN_RESPONSE=$(cat /tmp/login_response.json)
else
    echo "❌ 登入請求失敗"
    exit 1
fi

# 提取 token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ 登入失敗，無法獲取 token"
    echo "回應: $LOGIN_RESPONSE"
    echo ""
    echo "請檢查："
    echo "1. 用戶是否存在 (email: Claire@example.com)"
    echo "2. 密碼是否正確 (password: my-very-strong-password)"
    echo "3. 後端服務是否正常運行"
    exit 1
fi

echo "✅ 登入成功，Token: ${TOKEN:0:20}..."

# 定義食材列表
declare -a ingredients=(
    "石斑魚:500:克:2025-10-30"
    "洋葱:2:個:2025-11-01"
    "香菇:200:克:2025-11-01"
    "茼蒿:300:克:2025-10-30"
    "高麗菜:1:個:2025-10-30"
    "番茄:4:個:2025-11-01"
    "雞蛋:12:個:2025-11-01"
    "豆腐:2:個:2025-10-30"
    "橄欖:150:克:2025-11-01"
    "優格:500:毫升:2025-10-30"
    "味噌:200:克:2025-11-01"
    "鮭魚:400:克:2025-10-30"
    "九層塔:50:克:2025-10-30"
    "雞腿:4:個:2025-11-01"
    "泡菜:300:克:2025-11-01"
    "豬絞肉:300:克:2025-11-01"
    "檸檬:3:個:2025-11-01"
    "大腸:500:克:2025-10-30"

    # 新增20種，更新後
    "牛番茄:3:個:2025-11-01"
    "紅蘿蔔:2:根:2025-11-01"
    "馬鈴薯:4:個:2025-11-01"
    "青蔥:1:把:2025-10-30"
    "蒜頭:8:瓣:2025-11-01"
    "薑:50:克:2025-11-01"
    "蛤蜊:400:克:2025-10-30"
    "鮮奶:1:瓶:2025-11-01"
    "奶油:100:克:2025-11-01"
    "義大利麵:500:克:2026-03-01"
    "米:1:公斤:2026-05-01"
    "豆漿:900:毫升:2025-10-30"
    "小黃瓜:3:條:2025-10-30"
    "菠菜:200:克:2025-10-30"
    "玉米:2:條:2025-11-01"
    "紅椒:1:個:2025-11-01"
    "可可粉:50:克:2026-01-05"
    "麵粉:1:公斤:2026-04-15"
    "燕麥片:600:克:2026-06-01"
    "起司片:10:個:2025-11-01"
)


echo ""
echo "開始插入 ${#ingredients[@]} 個食材..."

success_count=0
error_count=0

# 插入每個食材
for ingredient in "${ingredients[@]}"; do
    IFS=':' read -r name quantity unit expiry <<< "$ingredient"
    
    # 單位轉換：後端只接受「個/克/毫升」
    converted_unit="$unit"
    converted_quantity="$quantity"
    
    case "$unit" in
        "根"|"把"|"瓣"|"條"|"片")
            converted_unit="個"
            ;;
        "瓶")
            converted_unit="毫升"
            ;;
        "公斤")
            converted_unit="克"
            converted_quantity=$((quantity * 1000))
            ;;
    esac
    
    echo -n "插入: $name ($converted_quantity $converted_unit, 過期: $expiry) ... "
    
    # 發送插入請求
    RESPONSE=$(curl -s -X POST http://localhost:8080/ingredients \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $TOKEN" \
        -d "{
            \"ingredient_name\": \"$name\",
            \"quantity\": $converted_quantity,
            \"unit\": \"$converted_unit\",
            \"expiry_date\": \"$expiry\"
        }")
    
    # 檢查回應：後端回傳的是 .id 不是 .ingredient_id，或檢查是否有 .error
    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        echo "❌ 失敗"
        echo "   錯誤: $RESPONSE"
        ((error_count++))
    elif echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1 || echo "$RESPONSE" | jq -e '.name' > /dev/null 2>&1; then
        echo "✅ 成功"
        ((success_count++))
    else
        echo "❌ 失敗"
        echo "   錯誤: $RESPONSE"
        ((error_count++))
    fi
    
    # 避免請求過於頻繁
    sleep 0.2
done

echo ""
echo "=== 插入結果 ==="
echo "✅ 成功: $success_count 個"
echo "❌ 失敗: $error_count 個"
echo "總計: ${#ingredients[@]} 個"

if [ $success_count -gt 0 ]; then
    echo ""
    echo "顯示已插入的食材:"
    curl -s -X GET http://localhost:8080/ingredients \
        -H "Authorization: Bearer $TOKEN" | jq '.[] | {
            name: .ingredient_name, 
            quantity: .quantity, 
            unit: .unit, 
            expiry: .expiry_date,
            id: .ingredient_id
        }'
fi

# 清理臨時文件
rm -f /tmp/login_response.json

echo ""
echo "✅ 腳本執行完成！"
