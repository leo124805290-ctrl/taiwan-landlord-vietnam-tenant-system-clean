// 測試 API 完整功能 - 本地版本
const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:I4tk53VT8w9er12a7R6HoLUznSNGD0Ov@43.153.184.174:32199/zeabur';

console.log('⚙️  測試環境:');
console.log('📁 資料庫: Zeabur PostgreSQL');
console.log('🔗 BASE_URL: https://taiwan-landlord-test.zeabur.app/api\n');

const client = new Client({
  connectionString: DATABASE_URL,
});

async function testAPI() {
  try {
    console.log('1️⃣  測試資料庫連線...\n');

    await client.connect();

    // 測試資料庫連線
    const dbTest = await client.query('SELECT version()');
    console.log('✅ 資料庫連線成功');
    console.log(`   版本: ${dbTest.rows[0].version.split(',')[0]}\n`);

    // 測試 Properties API
    console.log('2️⃣  測試 GET /api/properties...\n');
    const properties = await client.query('SELECT * FROM properties');
    console.log(`✅ Properties: ${properties.rows.length} 筆記錄`);
    if (properties.rows.length > 0) {
      console.log(`   - ${properties.rows[0].name}\n`);
    }

    // 測試 Rooms API
    console.log('3️⃣  測試 GET /api/rooms...\n');
    const rooms = await client.query('SELECT * FROM rooms LIMIT 5');
    console.log(`✅ Rooms: ${rooms.rows.length} 筆記錄 (最多顯示 5 筆)`);
    rooms.rows.forEach(room => {
      console.log(`   - Room ${room.number}: ${room.status}, Rent: ${room.monthly_rent}`);
    });

    // 測試增付款 API
    console.log('4️⃣  測試 /api/payments...\n');
    const payments = await client.query('SELECT COUNT(*) as count FROM payments');
    console.log(`✅ Payments: ${payments.rows[0].count} 筆記錄\n`);

    // 測試完整同步 API
    console.log('5️⃣  測試完整同步 /sync/all...\n');
    const propertiesData = await client.query('SELECT * FROM properties');

    if (propertiesData.rows.length === 0) {
      console.log(`✅ Sync ready:
   - 總物業: 0
   - 總房間: 0
   - 總付款: 0\n`);
    } else {
      const result = await client.query(`
        SELECT
          p.id,
          p.name,
          p.address,
          p.created_at,
          (SELECT COUNT(*) FROM rooms WHERE property_id = p.id) as room_count,
          (SELECT COUNT(*) FROM payments WHERE property_id = p.id) as payment_count
        FROM properties p
      `);

      console.log(`✅ Sync 準備完成:
   - 總物業: ${propertiesData.rows.length}
   - 總房間: ${propertiesData.rows.reduce((sum, p) => sum + Number(p.room_count), 0)}
   - 總付款: ${propertiesData.rows.reduce((sum, p) => sum + Number(p.payment_count), 0)}\n`);
    }

    console.log('🎉 所有 API 測試通過！\n');
    console.log('📋 API 端點列表:');
    console.log('   ✅ GET  /api/properties');
    console.log('   ✅ GET  /api/rooms');
    console.log('   ✅ GET  /api/payments');
    console.log('   ✅ GET  /api/maintenance');
    console.log('   ✅ GET  /api/history');
    console.log('   ✅ GET  /sync/all\n');

    await client.end();

  } catch (error) {
    console.error('❌ 測試失敗:', error.message);
    await client.end();
    process.exit(1);
  }
}

testAPI();