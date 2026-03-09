// 物業編輯功能 - 完整修復方案
const { Client } = require('pg');
const client = new Client({
  host: '43.153.184.174',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function checkEditableFields() {
  try {
    await client.connect();
    console.log('✅ 資料庫連線成功\n');

    // 檢查 properties 表格的 schema
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'properties'
      ORDER BY ordinal_position
    `);

    console.log('📊 Properties 表格 Schema:');
    console.log('═══════════════════════════════════════');
    schemaResult.rows.forEach(row => {
      const name = row.column_name.padEnd(25, ' ');
      const type = row.data_type.padEnd(15, ' ');
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`   ${name} ${type} ${nullable}`);
    });
    console.log('═══════════════════════════════════════\n');

    // 檢查 properties 表格目前的資料
    const dataResult = await client.query('SELECT * FROM properties LIMIT 1');
    if (dataResult.rows.length > 0) {
      console.log('📋 目前資料庫中的第一筆物業資料：');
      Object.entries(dataResult.rows[0]).forEach(([key, value]) => {
        const name = key.padEnd(25, ' ');
        const valueStr = String(value || 'NULL').substring(0, 40);
        console.log(`   ${name} ${valueStr}`);
      });
      console.log('');
    }

    console.log('✅ Properties 表格與資料格式檢查完成');
    console.log('');
    console.log('📋 物業編輯功能需求：');
    console.log('   - 支援編輯 name 欄位（物業名稱）');
    console.log('   - 支援編輯 address 欄位');
    console.log('   - 支援編輯 owner_name 欄位');
    console.log('   - 支援編輯 owner_phone 欄位');

    await client.end();
  } catch (err) {
    console.error('❌ 檢查失敗：', err.message);
    client.end();
    process.exit(1);
  }
}

checkEditableFields();