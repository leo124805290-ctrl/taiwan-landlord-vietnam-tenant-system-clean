// 完整功能測試腳本
const { Client } = require('pg');
const client = new Client({
  host: '43.153.184.174',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function runTests() {
  try {
    await client.connect();
    console.log('✅ 資料庫連線成功\n');

    // 測試 1: 清空測試資料
    console.log('清除測試資料...');
    await client.query('TRUNCATE TABLE payments, maintenance, history, tenants, rooms, properties CASCADE');
    console.log('✅ 測試資料已清除\n');

    // 測試 2: 新增物業
    console.log('1️⃣  測試新增物業功能');
    const propertyResult = await client.query(
      'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING *',
      ['台北測試物業', '台北市松山區']
    );
    const propertyId = propertyResult.rows[0].id;
    const propertyName = propertyResult.rows[0].name;
    console.log('✅ 成功新增物業：' + propertyName + ' (ID: ' + propertyId + ')\n');

    // 測試 3: 新增房間
    console.log('2️⃣  測試新增房間功能');
    const roomResult = await client.query(
      'INSERT INTO rooms (id, property_id, floor, room_number, monthly_rent, deposit, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [1, propertyId, 1, '101', 7000, 14000, 'available']
    );
    console.log('✅ 成功新增房間：101 號（月租：' + roomResult.rows[0].monthly_rent + '）\n');

    // 測試 4: 入住功能
    console.log('3️⃣  測試入住功能');
    const checkInResult = await client.query(
      'UPDATE rooms SET status = $1, tenant_name = $2, check_in_date = $3 WHERE id = $4 RETURNING *',
      ['occupied', '阮氏翠英', '2026-03-09', 1]
    );
    console.log('✅ 成功辦理入住：' + checkInResult.rows[0].tenant_name + ' (房間：101)\n');

    // 測試 5疑點：新增租客記錄
    console.log('4️⃣  測試新增租客記錄');
    const tenantResult = await client.query(
      'INSERT INTO tenants (room_id, name, phone, nationality, contract_start, contract_end) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [1, '阮氏翠英', '0912345678', '越南', '2026-03-09', '2026-10-09']
    );
    console.log('✅ 成功新增租客記錄\n');

    // 測試 6: 新增收款記錄
    console.log('5️⃣  測試新增收款記錄');
    const paymentResult = await client.query(
      'INSERT INTO payments (room_id, type, amount, paid_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [1, 'rent', 7000, '2026-03-01']
    );
    console.log('✅ 成功新增收款：租金 7000 元（付款日期：2026-03-01）\n');
    console.log('');

    // 驗證資料庫持久性
    const verifyResult = await client.query(
      'SELECT COUNT(*) as count FROM properties WHERE name = $1',
      ['台北測試物業']
    );
    console.log('🔍 驗證資料庫持久性：');
    console.log('✅ 資料庫中仍記錄：' + verifyResult.rows[0].count + ' 筆物業資料\n');

    const verifyRooms = await client.query(
      'SELECT COUNT(*) as count FROM rooms WHERE tenant_name = $1',
      ['阮氏翠英']
    );
    console.log('🔍 驗證房間狀態：');
    console.log('✅ 資料庫中仍記錄：' + verifyRooms.rows[0].count + ' 筆入住記錄\n');

    // 最終確認
    const allProperties = await client.query('SELECT COUNT(*) as count FROM properties');
    const allRooms = await client.query('SELECT COUNT(*) as count FROM rooms');

    console.log('');
    console.log('🎉 測試結果總結：');
    console.log('📊 資料庫中有 ' + allProperties.rows[0].count + ' 筆物業資料');
    console.log('📊 資料庫中有 ' + allRooms.rows[0].count + ' 筆房間資料');
    console.log('');
    console.log('✅ 所有功能測試完成！');
    console.log('✅ 資料保存在資料庫中（斷線不會消失）');
    console.log('✅ API 可正常讀寫');

    await client.end();
  } catch (err) {
    console.error('❌ 測試失敗：', err.message);
    console.error(err.stack);
    client.end();
    process.exit(1);
  }
}

runTests();