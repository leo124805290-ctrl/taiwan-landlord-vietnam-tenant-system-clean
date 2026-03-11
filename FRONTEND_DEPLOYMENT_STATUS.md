前端建置狀態與重構進度
====================

【系統 URL】
- 前端：https://taiwan-landlord-vietnam-tenant-syst.vercel.app
- 後端：https://taiwan-landlord-vietnam-tenant-system.zeabur.app

【已解決的問題】
1. CORS 錯誤 ✓
   - 修復後端 simple-api-fixed.js CORS 設定，允許所有 Vercel 網域與 localhost
   - 已相應部署至後端

2. 前端版本衝突（新版 vs 舊版） ✓
   - 新增 /dashboard 入口頁面整合新版路由與資訊
   - 新增 /properties/new 建立/建立前進
   - 新增 /properties/$id 及 /properties/$id/rooms/$roomId 等詳情頁
   - 修改登入頁面登入成功後導向 /dashboard
   - 更新

【技術說明】

核心配置項
- app/context/I18nContext：全域 I18n 狀態存取（locale）
- components/DashboardNav：響應 locale 切換（zh-TW/vi），URL 維持 I18nParamData（因為 rewrites 與去除 hash、 seek 重建 webchat gestures）。除回溯測試中使用 lang 儲存臨時變更狀態外，不再影響渲染與導向，實現彈性支援。
- process：連串執行與狀態管理由 OpenClaw 統一處理。

【驗證指南】

驗證前端的腳本提示：允許單獨使用在不穩定的環境中（例如本地 / / 等），可查看備份的建置聲明、帳密、README 與可選的建置與部署腳本。

【檔案變更摘要】

後端
- simple-api-fixed.js：
  - CORS header 修復，允許特定 Vercel 網域與 localhost（含）。支付路由數據，工具程式碼（簡化）。

前端
- app/(dashboard)/page.tsx（新增整版頁面）
- app/(dashboard)/properties/new/page.tsx（新增建置具新增至 properties）
- app/(dashboard)/properties/[id]/page.tsx（段落修攙與停靠）
- app/(dashboard)/properties/[id]/rooms/[roomId]/page.tsx（新增單一台區分析重構的實際栈）
- app/(auth)/login/page.tsx（修改登入成功後導向 /dashboard 以及 pre-check）
- components/DashboardNav.tsx（新增 /dashboard 此選單項（locale/彈性支援），並更新 underlay）

【部署狀態】

後端已部署並透過 login API 確認 obtain token。
前端已在本地完成系統性重構，下一步為 Vercel 部署，待建置完成後可用導入測試。

【未來建議】
- 補齊考慮到的引導流程的狀態管理（例如，存儲連續使用狀態到 I18n Context 或專用狀態）。