
// rebuild: 2026-03-09
/**
 * Zeabur 後端 API - 完整重構版
 * 專案：taiwan-landlord-vietnam-tenant-system
 * Base URL: https://taiwan-landlord-test.zeabur.app/api
 */

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://root:Qyd36iUVa7s0O2c5XpDz9fGYZr814TxW@43.167.190.238:32048/zeabur';

// PostgreSQL 連線
const { Client } = require('pg');

// 建立 PostgreSQL 連線
const db = new Client({
  connectionString: DATABASE_URL,
});

// 確保連線
db.connect()
  .catch(err => {
    console.error('❌ 資料庫連線失敗:', err.message);
    process.exit(1);
  });

/**
 * 通用回應格式
 */
function successResponse(data) {
  return {
    success: true,
    data: data,
    timestamp: new Date().toISOString()
  };
}

function errorResponse(error, message) {
  return {
    success: false,
    error: {
      code: error.code || 'UNKNOWN_ERROR',
      message: message || error.message || '未知錯誤'
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 中間件：CORS
 */
function cors(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}

/**
 * 中間件：錯誤處理
 */
function errorHandler(err, req, res, next) {
  console.error('❌ API 錯誤:', err);
  return res.status(500).json(errorResponse(err, '伺服器錯誤'));
}

/**
 * API 路由
 */

// ==================== 房源管理 ====================

/**
 * GET /api/properties - 獲取所有房源含房間
 */
async function getProperties(req, res) {
  try {
    const result = await db.query(`
      SELECT
        p.id,
        p.name,
        p.address,
        p.created_at,
        (SELECT COUNT(*) FROM rooms WHERE property_id = p.id) as room_count,
        (SELECT COUNT(*) FROM payments WHERE property_id = p.id) as payment_count
      FROM properties p
      ORDER BY p.name
    `);

    // 加入房間詳細資料
    const propertiesWithRooms = await Promise.all(
      result.rows.map(async (property) => {
        const roomsResult = await db.query('SELECT * FROM rooms WHERE property_id = $1 ORDER BY floor, room_number', [property.id]);
        const paymentsResult = await db.query('SELECT * FROM payments WHERE property_id = $1', [property.id]);

        return {
          ...property,
          rooms: roomsResult.rows,
          payments: paymentsResult.rows
        };
      })
    );

    return res.json(successResponse(propertiesWithRooms));
  } catch (error) {
    console.error('❌ 獲取房源失敗:', error);
    return res.status(500).json(errorResponse(error, '獲取房源失敗'));
  }
}

/**
 * POST /api/properties - 新增房源
 */
async function createProperty(req, res) {
  try {
    const { name, address } = req.body;

    if (!name) {
      return res.status(400).json(errorResponse(null, '房源名稱為必填'));
    }

    const result = await db.query(
      'INSERT INTO properties (name, address) VALUES ($1, $2) RETURNING *',
      [name, address || '']
    );

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 新增房源失敗:', error);
    return res.status(500).json(errorResponse(error, '新增房源失敗'));
  }
}

/**
 * PUT /api/properties/:id - 更新房源
 */
async function updateProperty(req, res) {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const result = await db.query(
      'UPDATE properties SET name = $1, address = $2 WHERE id = $3 RETURNING *',
      [name, address || '', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse(null, '房源不存在'));
    }

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 更新房源失敗:', error);
    return res.status(500).json(errorResponse(error, '更新房源失敗'));
  }
}

/**
 * DELETE /api/properties/:id - 刪除房源
 */
async function deleteProperty(req, res) {
  try {
    const { id } = req.params;

    result = await db.query('DELETE FROM properties WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json(errorResponse(null, '房源不存在'));
    }

    return res.json(successResponse({ message: '刪除成功', id }));
  } catch (error) {
    console.error('❌ 刪除房源失敗:', error);
    return res.status(500).json(errorResponse(error, '刪除房源失敗'));
  }
}

// ==================== 房間管理 ====================

/**
 * GET /api/rooms - 所有房間
 */
async function getRooms(req, res) {
  try {
    const result = await db.query('SELECT * FROM rooms ORDER BY property_id, floor, room_number');
    return res.json(successResponse(result.rows));
  } catch (error) {
    console.error('❌ 獲取房間列表失敗:', error);
    return res.status(500).json(errorResponse(error, '獲取房間列表失敗'));
  }
}

/**
 * POST /api/rooms - 新增房間
 */
async function createRoom(req, res) {
  try {
    const {
      property_id,
      floor,
      room_number,
      monthly_rent,
      deposit,
      status = 'vacant'
    } = req.body;

    const result = await db.query(
      `INSERT INTO rooms (property_id, floor, room_number, monthly_rent, deposit, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [property_id, floor, room_number, monthly_rent, deposit, status]
    );

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 新增房間失敗:', error);
    return res.status(500).json(errorResponse(error, '新增房間失敗'));
  }
}

/**
 * PUT /api/rooms/:id - 更新房間
 */
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { property_id, floor, room_number, monthly_rent, deposit, status, tenant_name, check_in_date, check_out_date } = req.body;

    const result = await db.query(
      `UPDATE rooms
       SET property_id = $1, floor = $2, room_number = $3, monthly_rent = $4,
           deposit = $5, status = $6, tenant_name = $7,
           check_in_date = $8, check_out_date = $9
       WHERE id = $10
       RETURNING *`,
      [property_id, floor, room_number, monthly_rent, deposit, status, tenant_name, check_in_date, check_out_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse(null, '房間不存在'));
    }

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 更新房間失敗:', error);
    return res.status(500).json(errorResponse(error, '更新房間失敗'));
  }
}

/**
 * DELETE /api/rooms/:id - 刪除房間
 */
async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM rooms WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json(errorResponse(null, '房間不存在'));
    }

    return res.json(successResponse({ message: '刪除成功', id }));
  } catch (error) {
    console.error('❌ 刪除房間失敗:', error);
    return res.status(500).json(errorResponse(error, '刪除房間失敗'));
  }
}

// ==================== 入住/退房 ====================

/**
 * POST /api/checkin/complete - 入住
 */
async function completeCheckin(req, res) {
  try {
    const { room_id, tenant_name, tenant_phone, contract_start, contract_end } = req.body;

    // 檢查房間是否存在
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json(errorResponse(null, '房間不存在'));
    }

    const room = roomResult.rows[0];

    // 更新房間狀態
    await db.query(
      `UPDATE rooms
       SET status = 'occupied',
           tenant_name = $1,
           check_in_date = $2,
           check_out_date = $3
       WHERE id = $4`,
      [tenant_name, contract_start, contract_end, room_id]
    );

    // 建立租客記錄
    await db.query(
      `INSERT INTO tenants (room_id, name, phone, check_in_date, check_out_date, contract_start, contract_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [room_id, tenant_name, tenant_phone, contract_start, contract_end, contract_start, contract_end]
    );

    // 記錄歷史
    await db.query(
      `INSERT INTO history (room_id, property_id, action, description, amount)
       VALUES ($1, $2, '入住', $3, $4)`,
      [room_id, room.property_id, `租客 ${tenant_name} 入住`, `入住期間: ${contract_start} 至 ${contract_end}`, 0]
    );

    return res.json(successResponse({ message: '入住完成' }));
  } catch (error) {
    console.error('❌ 入住失敗:', error);
    return res.status(500).json(errorResponse(error, '入住失敗'));
  }
}

/**
 * POST /api/checkout/complete - 退房
 */
async function completeCheckout(req, res) {
  try {
    const { room_id } = req.body;

    // 檢查房間是否存在
    const roomResult = await db.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    if (roomResult.rows.length === 0) {
      return res.status(404).json(errorResponse(null, '房間不存在'));
    }

    const room = roomResult.rows[0];
    const tenant_name = room.tenant_name;

    // 更新房間狀態
    await db.query(
      `UPDATE rooms
       SET status = 'vacant',
           tenant_name = NULL,
           check_in_date = NULL,
           check_out_date = NULL
       WHERE id = $1`,
      [room_id]
    );

    // 記錄歷史
    await db.query(
      `INSERT INTO history (room_id, property_id, action, description, amount)
       VALUES ($1, $2, '退房', $3, $4)`,
      [room_id, room.property_id, `租客 ${tenant_name} 退房`, '結束租期', 0]
    );

    return res.json(successResponse({ message: '退房完成' }));
  } catch (error) {
    console.error('❌ 退房失敗:', error);
    return res.status(500).json(errorResponse(error, '退房失敗'));
  }
}

// ==================== 收款 ====================

/**
 * GET /api/payments - 所有收款記錄
 */
async function getPayments(req, res) {
  try {
    const result = await db.query('SELECT * FROM payments ORDER BY created_at DESC');
    return res.json(successResponse(result.rows));
  } catch (error) {
    console.error('❌ 獲取收款記錄失敗:', error);
    return res.status(500).json(errorResponse(error, '獲取收款記錄失敗'));
  }
}

/**
 * POST /api/payments - 新增收款記錄
 */
async function createPayment(req, res) {
  try {
    const { room_id, property_id, type, amount, paid_date, note } = req.body;

    if (!room_id || !type || !amount || !paid_date) {
      return res.status(400).json(errorResponse(null, '缺少必填欄位: room_id, type, amount, paid_date'));
    }

    const result = await db.query(
      `INSERT INTO payments (room_id, property_id, type, amount, paid_date, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [room_id, property_id, type, amount, paid_date, note || '']
    );

    // 記錄歷史
    await db.query(
      `INSERT INTO history (room_id, property_id, action, description, amount)
       VALUES ($1, $2, '收款', $3, $4)`,
      [room_id, property_id || result.rows[0].property_id, `${type}: ${amount}`, `收款日期: ${paid_date}`, amount]
    );

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 新增收款記錄失敗:', error);
    return res.status(500).json(errorResponse(error, '新增收款記錄失敗'));
  }
}

// ==================== 維修 ====================

/**
 * GET /api/maintenance - 所有維修記錄
 */
async function getMaintenance(req, res) {
  try {
    const result = await db.query('SELECT * FROM maintenance ORDER BY created_at DESC');
    return res.json(successResponse(result.rows));
  } catch (error) {
    console.error('❌ 獲取維修記錄失敗:', error);
    return res.status(500).json(errorResponse(error, '獲取維修記錄失敗'));
  }
}

/**
 * POST /api/maintenance - 新增維修記錄
 */
async function createMaintenance(req, res) {
  try {
    const { room_id, property_id, title, description, cost = 0 } = req.body;

    const result = await db.query(
      `INSERT INTO maintenance (room_id, property_id, title, description, cost)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [room_id, property_id, title, description, cost]
    );

    return res.json(successResponse(result.rows[0]));
  } catch (error) {
    console.error('❌ 新增維修記錄失敗:', error);
    return res.status(500).json(errorResponse(error, '新增維修記錄失敗'));
  }
}

// ==================== 歷史記錄 ====================

/**
 * GET /api/history - 所有歷史記錄
 */
async function getHistory(req, res) {
  try {
    const result = await db.query('SELECT * FROM history ORDER BY created_at DESC LIMIT 100');
    return res.json(successResponse(result.rows));
  } catch (error) {
    console.error('❌ 獲取歷史記錄失敗:', error);
    return res.status(500).json(errorResponse(error, '獲取歷史記錄失敗'));
  }
}

// ==================== 同步 ====================

/**
 * GET /sync/all - 完整同步資料結構
 */
async function syncAll(req, res) {
  try {
    // 獲取所有房源
    const propertiesResult = await db.query('SELECT * FROM properties ORDER BY name');

    // 為每個房源加入房間、付款、歷史、維修
    const propertiesWithDetails = await Promise.all(
      propertiesResult.rows.map(async (property) => {
        const roomsResult = await db.query('SELECT * FROM rooms WHERE property_id = $1', [property.id]);
        const paymentsResult = await db.query('SELECT * FROM payments WHERE property_id = $1', [property.id]);
        const historyResult = await db.query('SELECT * FROM history WHERE property_id = $1 ORDER BY created_at DESC LIMIT 50', [property.id]);
        const maintenanceResult = await db.query('SELECT * FROM maintenance WHERE property_id = $1 ORDER BY created_at DESC', [property.id]);

        return {
          id: property.id,
          name: property.name,
          address: property.address,
          created_at: property.created_at,
          rooms: roomsResult.rows,
          payments: paymentsResult.rows,
          history: historyResult.rows,
          maintenance: maintenanceResult.rows
        };
      })
    );

    return res.json(successResponse({
      properties: propertiesWithDetails,
      total_properties: propertiesResult.rows.length
    }));
  } catch (error) {
    console.error('❌ 同步資料失敗:', error);
    return res.status(500).json(errorResponse(error, '同步資料失敗'));
  }
}

/**
 * 處理 API 請求
 */
function handleRequest(req, res) {
  console.log(`\n📝 ${req.method} ${req.path}`);

  // 根據路徑路由
  const path = req.path;

  if (path.match(/^\/api\/properties(\?|$)/)) {
    switch (req.method) {
      case 'GET':
        return getProperties(req, res);
      case 'POST':
        return createProperty(req, res);
      case 'PUT':
        return updateProperty(req, res);
      case 'DELETE':
        return deleteProperty(req, res);
      default:
        return res.status(405).json(errorResponse(null, '方法不允許'));
    }
  }
  else if (path.match(/^\/api\/rooms(\?|$)/)) {
    switch (req.method) {
      case 'GET':
        return getRooms(req, res);
      case 'POST':
        return createRoom(req, res);
      case 'PUT':
        return updateRoom(req, res);
      case 'DELETE':
        return deleteRoom(req, res);
      default:
        return res.status(405).json(errorResponse(null, '方法不允許'));
    }
  }
  else if (path.match(/^\/api\/checkin\/complete/)) {
    if (req.method !== 'POST') {
      return res.status(405).json(errorResponse(null, '方法不允許'));
    }
    return completeCheckin(req, res);
  }
  else if (path.match(/^\/api\/checkout\/complete/)) {
    if (req.method !== 'POST') {
      return res.status(405).json(errorResponse(null, '方法不允許'));
    }
    return completeCheckout(req, res);
  }
  else if (path.match(/^\/api\/payments(\?|$)/)) {
    switch (req.method) {
      case 'GET':
        return getPayments(req, res);
      case 'POST':
        return createPayment(req, res);
      default:
        return res.status(405).json(errorResponse(null, '方法不允許'));
    }
  }
  else if (path.match(/^\/api\/maintenance(\?|$)/)) {
    switch (req.method) {
      case 'GET':
        return getMaintenance(req, res);
      case 'POST':
        return createMaintenance(req, res);
      default:
        return res.status(405).json(errorResponse(null, '方法不允許'));
    }
  }
  else if (path === '/api/history') {
    if (req.method !== 'GET') {
      return res.status(405).json(errorResponse(null, '方法不允許'));
    }
    return getHistory(req, res);
  }
  else if (path === '/sync/all') {
    if (req.method !== 'GET') {
      return res.status(405).json(errorResponse(null, '方法不允許'));
    }
    return syncAll(req, res);
  }
  else {
    return res.status(404).json(errorResponse(null, 'API 端點不存在'));
  }
}

// 創建 HTTP 伺服器
const { createServer } = require('http');

const server = createServer((req, res) => {
  // 主要 API 路由
  const apiPrefix = /^\/api\//;
  const syncPrefix = /^\/sync\//;

  if (apiPrefix.test(req.path) || syncPrefix.test(req.path)) {
    // 錯誤處理
    res.on('error', (err) => {
      console.error('❌ 回應錯誤:', err);
    });

    // 處理請求
    handleRequest(req, res);
  } else {
    res.status(404).json(errorResponse(null, 'API 端點不存在'));
  }
});

// 錯誤處理
server.on('error', (err) => {
  console.error('❌ 伺服器錯誤:', err);
});

// 啟動伺服器
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`\n✅ Zeabur API Server 執行中`);
  console.log(`📡 Port: ${port}`);
  console.log(`🔗 URL: https://taiwan-landlord-test.zeabur.app/api`);
  console.log(`💾 Database: ${DATABASE_URL.match(/:[^/:]+@/)[0]}***`);
  console.log(`✨ API Routes:`);
  console.log(`   - /api/properties (GET, POST, PUT, DELETE)`);
  console.log(`   - /api/rooms (GET, POST, PUT, DELETE)`);
  console.log(`   - /api/checkin/complete (POST)`);
  console.log(`   - /api/checkout/complete (POST)`);
  console.log(`   - /api/payments (GET, POST)`);
  console.log(`   - /api/maintenance (GET, POST)`);
  console.log(`   - /api/history (GET)`);
  console.log(`   - /sync/all (GET)\n`);
});