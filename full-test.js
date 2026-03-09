// 完整功能測試流程
const { Client } = require('pg');
const client = new Client({
  host: '43.153.184.174',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function runFullTest() {
  try {
    await client.connect();
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🧪 完整功能測試流程');
    console.log('═══════════════════════════════════════');
    console.log('');

    // 測試 1: 試著新增一個新的房間相關記錄
    console.log('【測試 1: 試著新增一個新的房間記錄】');
    const testCount = await client.query('SELECT MAX(id) as maxId FROM rooms');
    const newRoomId = (parseInt(testCount.rows[0].maxId) || 100) + 1;

    try {
      await client.query(
        'INSERT INTO rooms (id, property_id, floor, room_number, monthly_rent, deposit, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [newRoomId, 1, '1', '200', 7000, 14000, 'vacant']
      );
      console.log('✅ 新增測試房間成功：', newRoomId);
    } catch (err) {
      console.log('⚠️  新增房間試試失敗（可能已存在）：', err.message);
    }
    console.log('');

    // 測試 2: 加入一筆測試收費記錄
    console.log('【測試 2: 加入一筆測試收費記錄】');
    try {
      await client.query(
        'INSERT INTO payments (room_id, type, amount, paid_date) VALUES ($1, $2, $3, $4)',
        [newRoomId, 'rent', 7000, '2026-03-10']
      );
      console.log('✅ 新增測試收費記錄成功：', newRoomId, '號房間', 7000);
    } catch (err) {
      console.log('⚠️  新增收費記錄失敗：', err.message);
    }
    console.log('');

    // 測試 3: 查看最終狀態
    console.log('【測試 3: 查看目前資料庫狀態】');

    const testProperties = await client.query('SELECT COUNT(*) as count FROM properties');
    const testRooms = await client.query('SELECT COUNT(*) as count FROM rooms');
    const testCharges = await client.query('SELECT COUNT(*) as count FROM payments');

    console.log('📊 資料庫統計：');
    console.log('   - 物業：' + testProperties.rows[0].count + ' 筆');
    console.log('   - 房間：' + testRooms.rows[0].count + ' 筆');
    console.log('   - 收費：' + testCharges.rows[0].count + ' 筆');
    console.log('');

    // 查看具體資料
    console.log('📋 最新的房間資料：');
    const sampleRooms = await client.query('SELECT id, property_id, room_number, monthly_rent, deposit, status FROM rooms ORDER BY id DESC LIMIT 3');
    sampleRooms.rows.slice(0, 2).forEach((room, idx) => {
      console.log(`   ${idx + 1}. 房間 ${room.room_number}（租金：$${room.monthly_rent}, 押金：$${room.deposit}, 狀態：${room.status}）`);
    });
    console.log('');

    console.log('═' + '═'.repeat(50));
    console.log('✅ 所有測試完成！');
    console.log('═' + '═'.repeat(50));
    console.log('');

    await client.end();
  } catch (error) {
    console.error('❌ 測試失敗：', error.message);
    await client.end();
  }
}

runFullTest();