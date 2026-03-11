# 🔍 部署驗證清單

## 📋 測試步驟總覽

```
✅ 登入驗證
✅ 路由重定向檢查
✅ 物業列表功能
✅ 物業詳情功能
✅ CRUD 操作功能
✅ 雲端連線狀態
✅ 環境變數檢查
```

---

## 1️⃣ 登入驗證

### **測試步驟：**
```
1. 訪問：https://taiwan-landlord-vietnam-tenant-syst.vercel.app/login
2. 輸入帳號：admin
3. 輸入密碼：Admin1234
4. 點擊登入按鈕
```

### **驗證結果：**
```
✅ 成功：畫面自動跳轉到 /dashboard，而不是 "/"
✅ 失敗：顯示錯誤訊息
❌ 如果失敗：檢查瀏覽器 Console（F12）有沒有錯誤訊息
```

### **Console 檢查：**
```
打開開發者工具（F12），在 Console 標籤頁檢查：
❌ 有錯誤，例如：404 Not Found
✅ 沒有錯誤
```

---

## 2️⃣ 路由重定向檢查

### **測試步驟：**
```
1. 成功登入後
2. 觀察網址列
3. 按 F5 重新整理
```

### **驗證結果：**
```
✅ 正常：網址顯示 https://taiwan-landlord-vietnam-tenant-syst.vercel.app/dashboard
✅ 正常：重新整理後仍在 /dashboard
❌ 問題：網址變成 http://localhost:3000（在其他環境）
```

---

## 3️⃣ 物業列表功能

### **測試步驟：**
```
1. 確認在 /dashboard 頁面
2. 檢查是否顯示「所有物業列表」
3. 看看每個物業卡片是否正確顯示資訊
```

### **資訊檢查清單：**
```
✅ 每個物業卡片顯示：
   - 物業名稱（名稱 + Emoj）
   - 地址資訊
   - 選擇物業按鈕

✅ 如果沒有物業，是否顯示：
   - 空狀態圖示（🏢）
   - 空狀態文字
   - 建立第一個物業的按鈕
```

### **控制台檢查：**
```
打開 F12 Console，檢查：

✅ 沒有錯誤
✅ 看到 API 回傳成功（如果有顯示網路請求）

❌ 如果有 404 錯誤檢查：
   - NEXT_PUBLIC_API_URL 是否正確設定
   - 後端是否正常運行
```

---

## 4️⃣ 物業詳情功能

### **測試步驟：**
```
1. 在 Dashboard 物業列表
2. 點擊「選擇」某個物業
3. 跳轉到 /properties/[id] 頁面
4. 檢查內容是否正確
```

### **頁面內容檢查：**
```
✅ 顯示：
   - 頂部有「← 回到 Dashboard」按鈕
   - 物業名稱（大字體）
   - 地址資訊
   - 房間數量標籤

✅ 如果有房間：
   - 房間列表正常顯示
   - 每個房間卡片顯示：
     * 房間號碼（#room_number）
     * 樓層資訊（如果有的話）
     * 租金金額
     * 狀態標籤（空置/已租）

❌ 如果有空置警告或錯誤：
   - 按照提示操作
   - 告訴我錯誤訊息
```

---

## 5️⃣ CRUD 操作功能

### **5.1 新增物業**

#### **測試步驟：**
```
1. 在 Dashboard 頁面
2. 點擊「新增物業」按鈕
3. 填寫物業資訊：
   - 物業名稱（必填）
   - 地址（選填）
4. 點擊「新增物件」
```

#### **驗證結果：**
```
✅ 成功：
   - 揚示文字（新增成功）
   - 自動跳轉到新物業詳情頁
   - 資料庫有新資料

✅ 如果失敗（有錯誤）：顯示錯誤訊息

❌ 常見問題與解法：
```

### **測試清單：**
```
□ 填寫正確的物業名稱（必填）
□ 網路連線正常
□ 後端 API 可存取
□ 環境變數設定正確
□ Console 沒有錯誤
```

---

### **5.2 查看房間列表**

#### **測試步驟：**
```
1. 在物業詳情頁
2. 等待房間列表載入
3. 檢查房間數量
```

#### **驗證結果：**
```
✅ 正常：顯示所有房間
✅ 正常：房間資訊正確
❌ 問題：房間列表為空或有錯誤
```

---

### **5.3 後續操作（Payment, Cost等）**

#### **測試步驟：**
```
1. 在 Dashboard 點擊快速操作
2. 嘗試建立收款或支出
3. 重新整理頁面確認資料已存入
```

---

## 6️⃣ 雲端連線狀態

### **測試步驟：**
```
1. 打開頁面（F12 或網頁右上角）
2. 找到「雲端連線狀態」或「健康指標」
3. 檢查其狀態標籤
```

### **狀態說明：**
```
✅ 正常狀態：
   - 顯示綠色或藍色的「OK」或「Healthy」
   - 或顯示「Connected」

❌ 問題狀態：
   - 顯示紅色的「Connection Failed」或「Error」
   - 顯示網址和錯誤訊息
```

### **如果連線失敗：**
```
1. 檢查 Console 錯誤訊息
2. 確認環境變數設定正確
3. 檢查插槓選（DB_URL）並送出重試
*/
```

---

## 7️⃣ 環境變數檢查

### **前線檢查（開發時）：**
```
1. 在專案目錄：taiwan-landlord-vietnam-tenant-system
2. 確認以下檔案存在且有設定：
```

#### **.env.local：**
```bash
NEXT_PUBLIC_API_URL=https://taiwan-landlord-vietnam-tenant-system.zeabur.app/api
NEXT_PUBLIC_APP_NAME=台灣房東越南租客管理系統
NEXT_PUBLIC_APP_DESCRIPTION=專為台灣房東管理越南租客設計的管理平台
NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE=true
NEXT_PUBLIC_ENABLE_DEMO_DATA=false
```

#### **Vercel 控制台檢查：**
```
1. 登入 https://vercel.com
2. 選擇專案
3. Settings → Environment Variables
4. 確認以下變數已設定：

✅ NEXT_PUBLIC_API_URL
✅ NEXT_PUBLIC_APP_NAME
✅ NEXT_PUBLIC_APP_DESCRIPTION
✅ NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE
✅ NEXT_PUBLIC_ENABLE_DEMO_DATA
✅ DATABASE_URL

5. 確認所有選項都打開（Production + Preview）
```

### **測試指令：**
```bash
# 本地測試（如果有 .env.local）
npm run dev
# 訪問 http://localhost:3000

# 或在專案裡執行
env | grep NEXT_PUBLIC_
```

---

## 🚨 緊急排查流程

### **問題 1：登入後跳到 franchise/

```
原因：登入頁面 router.push('/')
解法：需要改成 router.push('/dashboard') 或 router.replace('/dashboard')
```

### **問題 2：顯示「Cloud Connection Failed」**

```
檢查項目：
□ night - Database URL 是否正確
□ shop-api - NEXT_PUBLIC_API_URL 是否正確
□ backend - 後端是否運行中
□ frontend - 前端是否部署完成

建議操作：
□ 重新定義環境變數到 Vercel
□ 檢查 Console 錯誤訊息
□ 測試 API: curl -X POST https://<API>/api/auth/login ...
```

### **問題 3：物業列表為空**

```
可能原因：
□ 資料庫沒有資料
□ API 調用失敗（404/500）
□ 環境變數設定錯誤

檢查步驟：
□ 確認後端 API 正常
□ 確認資料庫連線正常
□ 檢查前端 Console 錯誤
□ 手動測試：curl -X GET <API_URL>/api/properties
```

---

## 📝 測試報告模板

```
測試人員：_________
測試時間：_________

【登入測試】
□ 成功跳轉到 /dashboard
□ 失敗：原因_________

【路由測試】
□ 網址序列：成功/失敗

【物業列表】
□ 顯示所有物業：是/否
□ 物業資訊完整：是/否
□ 空狀態顯示：是/否

【物業詳情】
□ 房間列表正常：是/否
□ 點擊跳轉正常：是/否

【新增操作】
□ 建立功能正常：是/否
□ 載入後通過檢核

【連線狀態】
□ 雲端連線：OK/Failed
□ 健康指標：正常/異常

【Console 錯誤】
□ 有錯誤：處理中
□ 無錯誤：✅

【Emoji】📁
□ 物業完整：✅
□ 資料庫同步：✅
□ 預覽完整

任何問題或錯誤訊息：___________________
```

---

## 💡 快速檢查清單（30秒）

```
□ 登入成功跳轉到 /dashboard
□ 物業列表顯示正確
□ 沒有 Console 錯誤
□ 連線狀態顯示 OK
□ 網址沒有 localhost
```

---

## 📞 需要協助時

提供以下資訊，我會立即幫忙：

```
1. Console 錯誤訊息（F12 → Console）
2. 網址列的 URL
3. 哪個步驟失敗
4. 錯誤截圖
```

---

## ✅ 最後確認

部署完成後，請確認這 5 個核心功能：

```
1. ✅ 登入跳轉到 /dashboard
2. ✅ 物業列表顯示
3. ✅ 物業詳情正確
4. ✅ 新增功能正常
5. ✅ 連線狀態 OK
```

如果前 5 個都 OK，就代表部署成功了！🎉