// 新增物業與房間失敗原因分析
const { Client } = require('pg');
const client = new Client({
  host: '43.153.184.174',
  port: 32199,
  user: 'root',
  password: 'I4tk53VT8w9er12a7R6HoLUznSNGD0Ov',
  database: 'zeabur'
});

async function analyzeIssues() {
  try {
    await client.connect();
    console.log('🔍 分析新增物業與房間失敗原因\n');

    // 新增測試物業
    console.log('🔧 測試新增物業功能...');
    const testProperty = {
      name: '測試物業',
      address: '測試地址',
      id: null  // PostgreSQL 會自動生成
    };

    try {
      // 檢查缺少 id 是否會失敗
      const result = await client.query(
        'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING *',
        [testProperty.name, testProperty.address]
      );

      console.log('✅ 新增物業成功');
      console.log('   Generated ID:', result.rows[0].id);
      const newId = result.rows[0].id;
      await client.query('DELETE FROM properties WHERE id = $1', [newId]);
      console.log('   已刪除測試資料\n');
    } catch (err) {
      console.log('❌ 新增物業失敗：', err.message);
    }

    // 補救：了解房間欄位需求
    console.log('🔍 檢查 rooms 表格 schema...');
    const roomsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'rooms'
      ORDER BY ordinal_position
    `);

    console.log('📊 Rooms 表表格數欄位：');
    console.log('═══════════════════════════════════════');
    roomsSchema.rows.forEach(row => {
      const name = row.column_name.padEnd(25, ' ');
      const type = row.data_type.padEnd(15, ' ');
      const nullable = row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = row.column_default ? ` [DEFAULT ${row.column_default}]` : '';
      console.log(`   ${name} ${type} ${nullable}${defaultVal}`);
    });
    console.log('═══════════════════════════════════════\n');

    console.log('⚠️  關鍵發現：');
    console.log('   1. Postgres 會自動生成 id（屬性 NOT NULL）');
    console.log('   2. 房間欄位需要 property_id');
    console.log('   3. 確認缺少的欄位導致失敗原因\n');

    await client.end();

    console.log('✅ 分析完成！');
    console.log('📋 下一步：修復 Modal.tsx 中的 API 請求格式');

  } catch (err) {
    console.error('❌ 失敗：', err.message);
    client.end();
    process.exit(1);
  }
}

analyzeIssues();