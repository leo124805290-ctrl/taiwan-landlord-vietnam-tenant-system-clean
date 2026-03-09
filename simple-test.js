// 簡單功能測試腳本
const { Client } = require('pg');
const client = new Client({
  host: '43.153.184.174',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function test() {
  try {
    await client.connect();
    console.log('✅ 資料庫連線成功\n');

    // 快速測試
    const tests = [
      { title: '物業資料', fn: () => client.query('SELECT COUNT(*) as count FROM properties') },
      { title: '房間資料', fn: () => client.query('SELECT COUNT(*) as count FROM rooms') },
      { title: '租客資料', fn: () => client.query('SELECT COUNT(*) as count FROM tenants') },
      { title: '收費資料', fn: () => client.query('SELECT COUNT(*) as count FROM payments') }
    ];

    for (const test of tests) {
      try {
        const result = await test.fn();
        console.log('✅ ', test.title + ':', result.rows[0].count, '筆');
      } catch (err) {
        console.log('❌ ', test.title + ' FAIL:', err.message);
      }
    }

    // 統計金額
    try {
      const revenue = await client.query('SELECT COALESCE(SUM(CAST(amount AS DECIMAL(10,2))), 0) as total FROM payments');
      console.log('📊 累計收費:', 'NT$' + parseFloat(revenue.rows[0].total).toLocaleString());
    } catch (err) {
      console.log('📊 收費統計 ERROR:', err.message);
    }

    await client.end();
  } catch (error) {
    console.log('❌ 資料庫連線失敗:', error.message);
  }
}

test();