#!/usr/bin/env node

/**
 * Taiwan Landlord - Vietnam Tenant System
 * Function Diagnostics Script
 * 
 * 此腳本會檢查核心功能的運作狀態
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 台湾房东越南租客管理系统 - 功能診斷腳本')
console.log('='.repeat(60))

// 設置路徑
const projectRoot = path.dirname(__filename)
const componentsDir = path.join(projectRoot, 'components')
const contextsDir = path.join(projectRoot, 'contexts')
const libDir = path.join(projectRoot, 'lib')

// 檢查項目結構
console.log('\n📁 檢查專案結構...')

const requiredDirectories = [
  { path: componentsDir, name: 'components' },
  { path: contextsDir, name: 'contexts' },
  { path: libDir, name: 'lib' },
]

let missingDirs = []
requiredDirectories.forEach(({ path: dirPath, name }) => {
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${name}/`)
  } else {
    console.log(`❌ ${name}/ (遺失)`)
    missingDirs.push(name)
  }
})

// 檢查關鍵檔案
console.log('\n📄 檢查關鍵檔案...')

const requiredFiles = [
  'package.json',
  'next.config.js',
  'contexts/AppContext.tsx',
  'components/Rooms.tsx',
  'components/Payments.tsx',
  'components/Maintenance.tsx',
  'components/CostManagement.tsx',
  'lib/types.ts',
  'lib/utils.ts',
  'lib/translations.ts',
]

let missingFiles = []
requiredFiles.forEach(file => {
  const filePath = path.join(projectRoot, file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`)
  } else {
    console.log(`❌ ${file} (遺失)`)
    missingFiles.push(file)
  }
})

// 檢查功能代碼模式

console.log('\n🔍 檢查核心功能代碼...')

// 1. 硬編碼密碼檢查
console.log('\n🔒 檢查硬編碼密碼...')
const roomsFilePath = path.join(projectRoot, 'components/Rooms.tsx')
if (fs.existsSync(roomsFilePath)) {
  const roomsContent = fs.readFileSync(roomsFilePath, 'utf8')
  if (roomsContent.includes("password !== '123456'")) {
    console.log('⚠️  警告: 發現硬編碼密碼 (123456)')
    console.log('   位置: components/Rooms.tsx (新增房間功能)')
    console.log('   建議: 使用登入權限或詢問管理員')
  } else {
    console.log('✅ 無硬編碼密碼')
  }
}

// 2. API 狀態同步錯誤處理檢查
console.log('\n🔄 檢查 API 狀態同步錯誤處理...')
const syncErrorPattern = /console\.error.*狀態同步/
if (roomsContent.match(syncErrorPattern)) {
  console.log('⚠️  發現簡單的錯誤會錄: console.error("狀態同步失敗")')
  console.log('   建議: 增加重試機制和使用者反饋')
} else {
  console.log('✅ API 狀態同步錯誤處理良好')
}

// 3. 登入功能檢查
console.log('\n🔐 檢查登入功能...')

const hasLogin = fs.existsSync(path.join(contextsDir, 'AppContext.tsx')) &&
                 fs.readFileSync(contextsDir, 'utf8').includes('login')

const hasHomeTab = fs.existsSync(roomsFilePath) &&
                   fs.readFileSync(roomsFilePath, 'utf8').includes('report')

const hasProperty = fs.readFileSync(contextsDir, 'utf8').includes('currentProperty')

console.log('✅ 登入功能已實作使用, AppContext.tsx 中有 `currentProperty` (替代', '✅ 登入相關代碼已實作', '⚠️  可能缺乏完整登入流程')[Number(Boolean(hasLogin && hasHomeTab && hasProperty))]
console.log('✅ 物業選擇功能完整 (有 `currentProperty`)', '缺', '✅ 存在')[Number(Boolean(hasProperty))]

// 4. 狀態自動轉換邏輯檢查
console.log('\n⏰ 檢查房間狀態自動轉換...')
const autoCheckInPattern = /useEffect.*checkIn.*toISOString.*split\('T'\)\[0\]/
const todayComparison = /checkInDate <= today/
if (autoCheckInPattern.test(roomsContent) && todayComparison.test(roomsContent)) {
  console.log('⚠️  發現房間狀態自動轉換邏輯')
  console.log('   設定: 待入住 → 已出租 (已結清)')
  console.log('   設定: 待入住 → 提醒已到期 (未結清)')
  console.log('   建議: 使用 date-fns 標準化日期，增加邊緣情況處理')
} else {
  console.log('✅ 房間狀態自動轉換邏輯正常')
}

// 5. 電費計算檢查
console.log('\n⚡ 檢查電費計算功能...')
const electricityRatePattern = /electricityRate/
const calculateElectricityPattern = /usage.*cm.*pm/
if (electricityRatePattern.test(roomsContent) && calculateElectricityPattern.test(roomsContent)) {
  console.log('✅ 電費計算功能完整')
} else {
  console.log('❌ 電費計算功能缺失')
}

// 6. 租金管理檢查
console.log('\n💰 檢查租金管理功能...')
const paymentsPath = path.join(projectRoot, 'components/Payments.tsx')
let paymentsContent = ''
if (fs.existsSync(paymentsPath)) {
  paymentsContent = fs.readFileSync(paymentsPath, 'utf8')
}

const pendingStatus = /s === 'pending'/g
const paidStatus = /s === 'paid'/g
const collectedPayments = collectedPayments.match(paidStatus) || []
const pendingPayments = pendingPayments.match(pendingStatus) || []

if (paymentsContent && (paymentsContent.match(pendingStatus) || paymentsContent.match(paidStatus))) {
  console.log('✅ 租金管理功能實作完整')
  console.log('   - 待收款項', '已收款項')

// 檢查收款方式
const bulkPayment = paymentsContent.includes('批量收款')
const editPayment = paymentsContent.includes('editingPayment')
if (bulkPayment && editPayment) {
  console.log('   ✅ 支援批量收款')
  console.log('   ✅ 支援修改付款記錄')
} else {
  console.log('   ⚠️  缺少批量收款或編輯功能')
}

} else {
  console.log('❌ 租金管理功能缺失')
}

// 7. 維修管理檢查
console.log('\n🔧 檢查維修管理功能...')
const maintenancePath = path.join(projectRoot, 'components/Maintenance.tsx')
let maintenanceContent = ''
if (fs.existsSync(maintenancePath)) {
  maintenanceContent = fs.readFileSync(maintenancePath, 'utf8')
}

if (maintenanceContent) {
  const categories = ['repair', 'renovation']
  const hasCategory = categories.some(cat => maintenanceContent.includes(cat))
  const statusWorkflow = maintenanceContent.match(/pending.*assigned.*in-progress.*completed/g)

  if (hasCategory && statusWorkflow) {
    console.log('✅ 維修管理功能完整')
    console.log('   ✅ 支援維修類別:', categories.join(', '))
    console.log('   ✅ 狀態流程完整')

    // 計算成本統計
    const totalCostPattern = /totalMaintenanceCost|totalRenovationCost/g
    const costMatch = maintenanceContent.match(totalCostPattern)
    if (costMatch) {
      console.log('   ✅ 支援成本統計')
    }
  } else {
    console.log('⚠️  維修管理功能可能不完整')
  }
} else {
  console.log('❌ 維修管理功能缺失')
}

// 8. 成本管理檢查
console.log('\n📊 檢查成本管理功能...')
const costPath = path.join(projectRoot, 'components/CostManagement.tsx')
if (fs.existsSync(costPath)) {
  const costContent = fs.readFileSync(costPath, 'utf8')
  const addExpense = costContent.includes('新增支出')
  const expenseCategories = costContent.includes('支出類別')

  if (addExpense && expenseCategories) {
    console.log('✅ 成本管理功能完整')
    console.log('   ✅ 支援新增支出')
    console.log('   ✅ 支援支出類別')
  } else {
    console.log('⚠️  成本管理功能可能不完整')
  }
} else {
  console.log('❌ 成本管理功能缺失或命名不同')
}

// 9. 视图模式检查
console.log('\n🎨 检查视图模式支持...')
const tableType = roomsContent.includes('viewMode === \'table\'')
const cardType = roomsContent.includes('viewMode === \'card\'')
const listType = roomsContent.includes('viewMode === \'list\'')

if (tableType && cardType && listType) {
  console.log('✅ 三种视图模式均已实现')
  console.log('   - 表格视图')
  console.log('   - 卡片视图')
  console.log('   - 列表视图')
} else {
  console.log('⚠️  视图模式实现不完整')
  console.log('   表格视图:', tableType ? '✅' : '❌')
  console.log('   卡片视图:', cardType ? '✅' : '❌')
  console.log('   列表视图:', listType ? '✅' : '❌')
}

// 10. 状态过滤
console.log('\n🔲 检查状态过滤功能...')
const filterStatus = roomsContent.includes('filterStatus')
const filterRoom = roomsContent.includes('filterRoom')
const statusName = roomsContent.match(/case 'all':.*case 'available':.*case 'occupied':/g)
const filterLogic = roomsContent.match(/if.*filterStatus.*!==.*'all'/g)

if (filterStatus && filterRoom && statusName && filterLogic) {
  console.log('✅ 状态过滤功能完整')
  console.log('   - 按状态过滤', '按房间过滤', '所有相关逻辑', '✅')[Number(Boolean(filterStatus && filterRoom && statusName && filterLogic))]
} else {
  console.log('⚠️  状态过滤功能可能不完整')
}

// 11. 搜索功能
console.log('\n🔍 检查搜索功能...')
const searchQuery = roomsContent.includes('searchQuery')
const setSearchQuery = roomsContent.includes('setSearchQuery')
const filterBySearch = roomsContent.match(/includes.*searchQuery/)

if (searchQuery && setSearchQuery && filterBySearch) {
  console.log('✅ 搜索功能完整')
  console.log('   - 支持按房号', '支持按租客姓名', '支持按电话号码')
} else {
  console.log('⚠️  搜索功能可能不完整')
}

// 检查最近变更
console.log('\n📝 检查最近变更...')
const gitLogPath = path.join(projectRoot, '.git', 'logs', 'HEAD')
if (fs.existsSync(gitLogPath)) {
  try {
    const gitLog = fs.readFileSync(gitLogPath, 'utf8')
    const commits = gitLog.split('\n').filter(line => line.trim()).slice(-10)
    console.log('最近的 10 个提交:')
    console.log('-')
    commits.forEach((commit, index) => {
      const commitInfo = commit.split('\t')
      if (commitInfo.length >= 2) {
        const shortHash = commitInfo[0].substring(0, 7)
        const message = commitInfo[1].trim()
        console.log(`  ${index + 1}. ${shortHash}: ${message.length > 50 ? message.substring(0, 50) + '...' : message}`)
      }
    })
  } catch (e) {
    console.log('⚠️  无法读取 Git 日志')
  }
} else {
  console.log('⚠️  未找到 Git 日志')
}

// 总结
console.log('\n' + '='.repeat(60))
console.log('📊 总结和修复建议:')
if (missingDirs.length === 0 && missingFiles.length === 0) {
  console.log('✅ 所有必需的目录和文件都存在')
} else {
  console.log('❌ 以下项目缺失:')
  if (missingDirs.length > 0) console.log('   - 目录:', missingDirs.join(', '))
  if (missingFiles.length > 0) console.log('   - 文件:', missingFiles.join(', '))
}

console.log('\n⚠️  修复建议:')
console.log('1. 硬编码密码 (123456) - 使用登录授权或咨询管理员')
console.log('2. API 同步错误处理 - 增加重试和用户反馈')
console.log('3. 测试 web_fetch/curl 与本地开发服务器 / firebase 或页面响应的对比')

console.log('\n💡 下一步:')
console.log('- 在本地运行: npm run dev')
console.log('- 访问 http://localhost:3000 测试功能')
console.log('- 检查浏览器控制台是否有错误')
console.log('- 使用浏览器登录后进行全面的财务和房间功能测试')

console.log('\n' + '='.repeat(60))