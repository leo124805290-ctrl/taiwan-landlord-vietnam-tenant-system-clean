// 現有功能測試腳本
const { Client } = require('pg');
const client = new Client({
  host: '43.167.190.238',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function testCurrentFunctionality() {
  try {
    await client.connect();
    console.log('═════════════════════════════════════');
    console.log('🔍 測試現有功能');
    console.log('═════════════════════════════════════');
    console.log('');

    // 測試 1: 物業管理
    console.log('【測試 1: 物業管理】');
    const properties = await client.query('SELECT * FROM properties ORDER BY created_at DESC LIMIT 5');
    console.log('✅ 資料庫中有', properties.rows.length, '筆物業資料');

    if (properties.rows.length > 0) {
      console.log('   展示最新 3 筆：');
      properties.rows.slice(0, 3).forEach((prop, index) => {
        const roomCount = await client.query('SELECT COUNT(*) as count FROM rooms WHERE property_id = $1', [prop.id]);
        const paymentCount = await param.protocol.query('SELECT COUNT(*) as count FROM charges WHERE room_id IN (SELECT id FROM rooms WHERE property_id = $1)', [prop.id]);
        console.log(`   ${index + 1}. ${prop.name} (${prop.address})`);
        console.log(`      房間數: ${roomCount.rows[0]?.count || 0} | 繳費單數: ${paymentCount.rows[0]?.count || 0}`);
      });
    } else {
      console.log('   ⚠️  資料庫中沒有物業資料');
    }
    console.log('');

    // 測試 2: 房間管理
    console.log('【測試 2: 房間管理】');
    const rooms = await client.query('SELECT * FROM rooms ORDER BY created_at DESC LIMIT 5');
    console.log('✅ 資料庫中有', rooms.rows.length, '筆房間資料');

    if (rooms.rows.length > 0) {
      console.log('   最新 3 筆房間：');
      rooms.rows.slice(0, 3).forEach((room, index) => {
        const tenant = await client.query('SELECT * FROM tenants WHERE room_id = $1', [room.id]);
        console.log(`   ${index + 1}. 房間 ${room.room_number} (${room.status})`);
        if (tenant.rows.length > 0) {
          console.log(`      → 租客: ${tenant.rows[0].name} (${tenant.rows[0].nationality})`);
        }
      });
    } else {
      console.log('   ⚠️  資料庫中沒有房間資料');
    }
    console.log('');

    // 測試 3: 租客管理
    console.log('【測試 3: 租客管理】');
    const tenants = await client.query('SELECT * FROM tenants ORDER BY created_at DESC LIMIT 5');
    console.log('✅ 資料庫中有', tenants.rows.length, '筆租客資料');

    if (tenants.rows.length > 0) {
      console.log('   最新 3 筆租客：');
      tenants.rows.slice(0, 3).forEach((tenant, index) => {
        const room = await client.query('SELECT room_number, property_id FROM rooms WHERE id = $1', [tenant.room_id]);
        if (room.rows.length > 0) {
          const property = await client.query('SELECT name FROM properties WHERE id = $1', [room.rows[0].property_id]);
          console.log(`   ${index + 1}. ${tenant.name} (${tenant.nationality})`);
          console.log(`      → 房間: ${room.rows[0].room_number} (${property.rows[0]?.name || '未知'})`);
        }
      });
    } else {
      console.log('   ⚠️  資料庫中沒有租客資料');
    }
    console.log('');

    // 測試 4: 收費管理
    console.log('【測試 4: 收費管理】');
    const charges = await client.query('SELECT * FROM payments ORDER BY created_at DESC LIMIT 5');
    console.log('✅ 資料庫中有', charges.rows.length, '筆收費資料');

    if (charges.rows.length > 0) {
      const totalAmount = charges.rows.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
      console.log('   最新 3 筆收費：');
      charges.rows.slice(0, 3).forEach((charge, index) => {
        const room = await client.query('SELECT room_number FROM rooms WHERE id = $1', [charge.room_id]);
        console.log(`   ${index + 1}. 房間 ${room.rows[0]?.room_number || '未知'} - ${charge.type} ${charge.amount}`);
      });
      console.log(`   📊 累計金額: NT$${totalAmount.toLocaleString()}`);
    } else {
      console.log('   ⚠️  資料庫中沒有收費資料');
    }
    console.log('');

    // 測試 5: 電費記帳
    console.log('【測試 5: 電費記帳】');
    const electricityCharges = await client.query("SELECT * FROM charges WHERE type LIKE '%電%' ORDER BY created_at DESC LIMIT 5");
    console.log('✅ 資料庫中有', electricityCharges.rows.length, '筆電費記帳');

    if (electricityCharges.rows.length > 0) {
      const totalElectricity = electricityCharges.rows.reduce((sum, charge) => sum + parseFloat(charge.amount || 0), 0);
      console.log('   累計電費金額: NT$' + totalElectricity.toLocaleString());
    } else {
      console.log('   ⚠️  資料庫中沒有電費記帳');
    }
    console.log('');

    // 測試 6: API Server 健康
    console.log('【測試 6: API Server 健康】');
    const apiHealth = await fetch('https://taiwan-landlord-test.zeabur.app/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (apiHealth.ok) {
      console.log('✅ API Server 正常運行（HTTP ' + apiHealth.status + '）');
    } else {
      console.log('❌ API Server 回傳錯誤（HTTP ' + apiHealth.status + '）');
    }
    console.log('');

    console.log('═════════════════════════════════════');
    console.log('🎉 測試完成！');
    console.log('═════════════════════════════════════');

    await client.end();
    return true;
  } catch (error) {
    console.error('❌ 測試過程發生錯誤：', error.message);
    await client.end();
    return false;
  }
}

console.log('');
testCurrentFunctionality();