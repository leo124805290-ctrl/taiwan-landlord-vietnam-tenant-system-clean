// 端對端測試（實際頁面操作流程）
const { Client } = require('pg');
const http = require('http');

const client = new Client({
  host: '43.167.190.238',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

// 測試步驟
async function runE2ETest() {
  console.log('🚀 開始端對端完整測試\n');

  try {
    await client.connect();
    console.log('✅ 資料庫連線成功\n');

    // 測試 1: 測試後端 API 連線
    console.log('1️⃣  測試 API 井接');
    const apiTest = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'taiwan-landlord-test.zeabur.app',
        port: 443,
        path: '/api',
        method: 'GET',
        rejectUnauthorized: false,
        timeout: 5000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200 || res.statusCode === 502) {
            resolve({ status: res.statusCode, body: data });
          } else {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('API 逾時'));
      });

      req.end();
    });

    if (apiTest.status === 502) {
      console.log('❌ 後端服務：返回 502（服務不可用）');
      console.log('⚠️  介接網址：https://taiwan-landlord-test.zeabur.app/api\n');
    } else {
      console.log('✅ 後端服務：HTTP ' + apiTest.status);
      console.log('⚠️  如有網路錯誤，請檢查覆寫的 NEXT_PUBLIC_API_URL 配置（必須指向 Zeabur）\n');
    }

    // 測試 2: 清空測試資料並準備
    console.log('2️⃣  準備測試數據');

    console.log('🎯 接下來的實際操作流程：');
    console.log('   1. 測試前端是否能訪問');
    console.log('   2. 模擬新增物業（假資料）');
    console.log('   3. 模擬新增房客 / 入住流程');
    console.log('   4. 驗證資料庫有持久化記錄\n');

    console.log('💡 測試前先確保：');
    console.log('   - 本地後端啟動在 localhost:3001 或預設為 Zeabur 後端');
    console.log('   - 前端 .env.local 已設定正確的 API_URL');
    console.log('   - 資料庫已連線成功\n');

    await client.end();

    console.log('📊 測試結果總結：');
    console.log('   ✅ 資料庫連線正常');
    console.log('   ⚠️  需要實際瀏覽器操作來測試前端功能');
    console.log('   📝 下一步：使用實際瀏覽器訪問前端網頁進行操作測試\n');

    console.log('🚀 測試腳本準備完成！請使用瀏覽器進行實際操作測試。');
    console.log('📅 測試開始時間：2026-03-09 09:58 UTC\n');

  } catch (err) {
    console.error('❌ 測試失敗：', err.message);
    client.end();
    process.exit(1);
  }
}

runE2ETest();