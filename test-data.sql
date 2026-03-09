-- 初始化測試資料 - 台灣房東越南租客管理系統

-- 插入測試物業
INSERT INTO properties (name, address) VALUES
('台北松山南海路分公司', '台北市松山區南海路'),
('新北板橋中和分公司', '新北市板橋區中和路'),
('高雄左營分公司', '高雄市左營區就業白頭');

-- 獲取剛才建立的 properties ID（剛才是 4筆，最後一筆的 ID 是 4）
-- 獲取測試房間（leaking 2筆記錄）
INSERT INTO rooms (id, property_id, floor, room_number, monthly_rent, deposit, status, tenant_name, current_meter, previous_meter, created_at) VALUES
(161, 4, 1, '101', 7000, 14000, 'occupied', '出租 999', 150, 50, NOW() - INTERVAL '30 days'),
(162, 4, 1, '102', 7000, 14000, 'occupied', '出租 222', 200, 100, NOW() - INTERVAL '30 days'),
(163, 4, 2, '201', 8500, 17000, 'available', NULL, 0, 0, NOW());

-- 插入測試租客
INSERT INTO tenants (room_id, name, phone, nationality, contract_start, contract_end, created_at) VALUES
(161, '阮氏翠英', '0912345678', '越南', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 months', NOW()),
(162, '陳文龍', '0987654321', '越南', CURRENT_DATE, CURRENT_DATE + INTERVAL '4 months', NOW()),
(163, '黃氏香蓮', '0923334455', '越南', NULL, NULL, NOW());

-- 插入測試收款記錄
INSERT INTO payments (room_id, type, amount, paid_date, note, created_at) VALUES
(161, 'rent', 7000, CURRENT_DATE - INTERVAL '30 days', '扣 11月租金', NOW()),
(161, 'electricity', 15, CURRENT_DATE - INTERVAL '30 days', '扣 10月電費', NOW()),
(162, 'rent', 7000, CURRENT_DATE - INTERVAL '30 days', '扣 11月租金', NOW()),
(163, 'deposit', 17000, CURRENT_DATE - INTERVAL '1 year', '第一次入住', NOW());

-- 插入測試歷史記錄
INSERT INTO history (room_id, property_id, action, description, amount, created_at) VALUES
(161, 4, '入住', '出租 999:11/02 至 06/02', 0, CURRENT_DATE),
(161, 4, '押金實收', '17000 代金`, 17000, CURRENT_DATE - INTERVAL '1 year'),
(162, 4, 退房', '出租 222:10/02 至 02/02', 0, CURRENT_DATE - INTERVAL '1 month'),
(163, 4, '入住', ‘出租 黃氏香蓮:01/02 至 07/02', 0, CURRENT_DATE);

-- 插入測試維修記錄
INSERT INTO maintenance (room_id, property_id, title, description, status, cost, created_at) VALUES
(163, 4, '水龍頭故障', '廚房水龍頭無法關水', 'completed', 15, NOW() - INTERVAL '7 days'),
(161, 4, '冷氣維持', '冷氣需要加冷氣', 'pending', 30, NOW() - INTERVAL '15 days');

-- 插入測試成本記錄
INSERT INTO costs (property_id, date, category, sub_category, amount, note, created_at) VALUES
(4, CURRENT_DATE, 'general', '水電', 1500, '11月水電費', NOW()),
(4, CURRENT_DATE - INTERVAL '5 days', 'maintenance', '維修材料費', 15, '水龍頭零件', NOW());

-- 驗證測試資料
SELECT * FROM properties;
SELECT * FROM rooms;
SELECT * FROM tenants;
SELECT * FROM payments;
SELECT * FROM history;
SELECT * FROM maintenance;
SELECT * FROM costs;