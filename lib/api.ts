// API 服務層 - 封裝所有後端 Express API 呼叫
// 後端基底 URL：NEXT_PUBLIC_API_URL，例如 https://xxx.zeabur.app/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 獲取 Token 從 localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }
  return null;
};

// 設置 Token 到 localStorage
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    try {
      try {
        localStorage.setItem('auth_token', token);
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          console.warn('localStorage 已滿，無法保存 token');
        }
      }
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage 已滿，無法保存認證 Token');
      } else {
        console.error('localStorage 儲存失敗:', e);
      }
    }
  }
};

// 移除 Token
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('auth_token');
    } catch {
      // ignore
    }
  }
};

// 通用 API 請求函數（統一回傳 { success, data, error }）
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> => {
  try {
    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      (headers as any).Authorization = `Bearer ${token}`;
    }

    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // ignore parse error
      }
    }

    if (!response.ok) {
      const message = json?.error || json?.message || `HTTP ${response.status}`;
      return { success: false, error: message };
    }

    if (json && json.success === false) {
      return { success: false, error: json.error || json.message || '未知錯誤' };
    }

    const data = json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
    return { success: true, data };
  } catch (err: any) {
    console.error('[apiRequest] error:', err);
    return { success: false, error: err?.message || '網路錯誤' };
  }
};

// 用戶認證 API（對應後端 /api/auth/*）
export const authAPI = {
  // 登入
  login: async (data: { username: string; password: string }): Promise<ApiResult<{ token: string }>> => {
    const result = await apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success && result.data?.token) {
      setToken(result.data.token);
    }
    return result;
  },

  // 取得當前登入使用者
  me: async (): Promise<ApiResult<{
    id: number;
    username: string;
    display_name: string;
    role: 'superadmin' | 'staff' | 'readonly';
    language: string;
  }>> => {
    return apiRequest('/auth/me');
  },

  // 登出（僅前端清除 token；後端路由可視需求再補呼叫）
  logout: () => {
    removeToken();
  },

  // 檢查是否已登入
  isAuthenticated: (): boolean => {
    return !!getToken();
  },
};

// 物業管理 API
export const propertyAPI = {
  list: async (): Promise<ApiResult<any[]>> => {
    return apiRequest<any[]>('/properties');
  },

  create: async (data: { name: string; address?: string }): Promise<ApiResult<any>> => {
    return apiRequest<any>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: { name: string; address?: string }): Promise<ApiResult<any>> => {
    return apiRequest<any>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/properties/${id}`, {
      method: 'DELETE',
    });
  },
};

// 房間管理 API
export const roomAPI = {
  list: async (filters?: {
    property_id?: number;
    status?: string;
    floor?: number;
  }): Promise<ApiResult<any[]>> => {
    const params = new URLSearchParams();
    if (filters?.property_id) params.append('property_id', String(filters.property_id));
    if (filters?.status) params.append('status', filters.status);
    if (typeof filters?.floor === 'number') params.append('floor', String(filters.floor));
    const qs = params.toString();
    return apiRequest<any[]>(`/rooms${qs ? `?${qs}` : ''}`);
  },

  create: async (data: any): Promise<ApiResult<any>> => {
    return apiRequest<any>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: any): Promise<ApiResult<any>> => {
    return apiRequest<any>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/rooms/${id}`, {
      method: 'DELETE',
    });
  },

  lock: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/rooms/${id}/lock`, {
      method: 'POST',
    });
  },

  unlock: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/rooms/${id}/unlock`, {
      method: 'POST',
    });
  },
};

// 付款管理 API
export const paymentAPI = {
  list: async (filters?: {
    room_id?: number;
    property_id?: number;
    type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResult<any[]>> => {
    const params = new URLSearchParams();
    if (filters?.room_id) params.append('room_id', String(filters.room_id));
    if (filters?.property_id) params.append('property_id', String(filters.property_id));
    if (filters?.type) params.append('type', filters.type);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);
    const qs = params.toString();
    return apiRequest<any[]>(`/payments${qs ? `?${qs}` : ''}`);
  },

  create: async (data: any): Promise<ApiResult<any>> => {
    return apiRequest<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  remove: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/payments/${id}`, {
      method: 'DELETE',
    });
  },
};

// 入住 / 退租 API（需冪等 key 時傳入 idempotencyKey）
const apiRequestWithIdempotency = async <T>(
  endpoint: string,
  body: object,
  idempotencyKey?: string,
): Promise<ApiResult<T>> => {
  const headers: HeadersInit = {};
  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
};

export const checkinAPI = {
  complete: async (
    data: {
      room_id: number;
      tenant_name: string;
      phone?: string;
      nationality?: string;
      contract_start: string;
      contract_end?: string;
      payment_type: 'full' | 'deposit_only' | 'booking_only';
      initial_meter?: number;
    },
    idempotencyKey?: string,
  ): Promise<ApiResult<{ room_id: number; tenant_id: number; status: string }>> => {
    return apiRequestWithIdempotency<any>('/checkin/complete', data, idempotencyKey);
  },
};

export const checkoutAPI = {
  complete: async (
    data: {
      room_id: number;
      checkout_date: string;
      final_meter: number;
      deposit_action?: 'return' | 'deduct' | 'partial';
      deposit_amount?: number;
      note?: string;
    },
    idempotencyKey?: string,
  ): Promise<ApiResult<{ room_id: number; electric_cost: number }>> => {
    return apiRequestWithIdempotency<any>('/checkout/complete', data, idempotencyKey);
  },
};

// 成本 / 維修 / 歷史 / 設定 / 報表 / 同步
export const costAPI = {
  list: async (filters?: {
    property_id?: number;
    room_id?: number;
    category?: string;
    is_initial?: boolean;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResult<any[]>> => {
    const p = new URLSearchParams();
    if (filters?.property_id) p.append('property_id', String(filters.property_id));
    if (filters?.room_id) p.append('room_id', String(filters.room_id));
    if (filters?.category) p.append('category', filters.category);
    if (typeof filters?.is_initial === 'boolean') p.append('is_initial', String(filters.is_initial));
    if (filters?.date_from) p.append('date_from', filters.date_from);
    if (filters?.date_to) p.append('date_to', filters.date_to);
    const qs = p.toString();
    return apiRequest<any[]>(`/costs${qs ? `?${qs}` : ''}`);
  },

  create: async (data: {
    property_id: number;
    room_id?: number;
    category: string;
    is_initial?: boolean;
    amount: number;
    cost_date?: string;
    note?: string;
  }): Promise<ApiResult<any>> => {
    return apiRequest<any>('/costs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: number, data: Partial<{
    category: string;
    is_initial: boolean;
    amount: number;
    cost_date: string;
    note: string;
  }>): Promise<ApiResult<any>> => {
    return apiRequest<any>(`/costs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  remove: async (id: number): Promise<ApiResult<null>> => {
    return apiRequest<null>(`/costs/${id}`, {
      method: 'DELETE',
    });
  },
};

export const settingsAPI = {
  list: async (): Promise<ApiResult<any[]>> => {
    return apiRequest<any[]>('/settings');
  },

  update: async (key: string, value: string): Promise<ApiResult<any>> => {
    return apiRequest<any>(`/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },
};

export const reportsAPI = {
  summary: async (filters?: { property_id?: number; year?: number; month?: number }): Promise<ApiResult<any>> => {
    const p = new URLSearchParams();
    if (filters?.property_id) p.append('property_id', String(filters.property_id));
    if (filters?.year) p.append('year', String(filters.year));
    if (filters?.month) p.append('month', String(filters.month));
    const qs = p.toString();
    return apiRequest<any>(`/reports/summary${qs ? `?${qs}` : ''}`);
  },

  occupancy: async (property_id?: number): Promise<ApiResult<any>> => {
    const p = new URLSearchParams();
    if (property_id) p.append('property_id', String(property_id));
    const qs = p.toString();
    return apiRequest<any>(`/reports/occupancy${qs ? `?${qs}` : ''}`);
  },

  monthly: async (property_id?: number): Promise<ApiResult<any[]>> => {
    const p = new URLSearchParams();
    if (property_id) p.append('property_id', String(property_id));
    const qs = p.toString();
    return apiRequest<any[]>(`/reports/monthly${qs ? `?${qs}` : ''}`);
  },
};

export const syncAPI = {
  all: async (): Promise<ApiResult<{ properties: any[] }>> => {
    return apiRequest<{ properties: any[] }>('/sync/all');
  },
};

export const tenantAPI = {
  list: async (_filters?: { property_id?: number }): Promise<ApiResult<any[]>> => {
    return { success: true, data: [] };
  },
};

// 數據遷移 API（將 localStorage 數據遷移到後端）
export const migrationAPI = {
  // 遷移物業數據
  migrateProperties: async (properties: any[]) => {
    // 這裡可以實現批量遷移邏輯
    console.log('遷移物業數據:', properties.length);
    // 實際實現會遍歷 properties 並調用 propertyAPI.create
  },

  // 遷移房間數據
  migrateRooms: async (rooms: any[]) => {
    console.log('遷移房間數據:', rooms.length);
    // 待實現
  },

  // 遷移付款記錄
  migratePayments: async (payments: any[]) => {
    console.log('遷移付款記錄:', payments.length);
    // 待實現
  },
};

// 備份管理 API
export const backupAPI = {
  // 獲取所有備份排程
  getSchedules: async () => {
    return apiRequest<{
      success: boolean;
      data: { schedules: any[] };
      message: string;
    }>('/backup/schedules');
  },

  // 獲取單個備份排程
  getSchedule: async (id: number) => {
    return apiRequest<{
      success: boolean;
      data: { schedule: any };
      message: string;
    }>(`/backup/schedules/${id}`);
  },

  // 創建備份排程
  createSchedule: async (data: any) => {
    return apiRequest<{
      success: boolean;
      data: { schedule: any };
      message: string;
    }>('/backup/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新備份排程
  updateSchedule: async (id: number, data: Partial<any>) => {
    return apiRequest<{
      success: boolean;
      data: { schedule: any };
      message: string;
    }>(`/backup/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 刪除備份排程
  deleteSchedule: async (id: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/backup/schedules/${id}`, {
      method: 'DELETE',
    });
  },

  // 獲取備份歷史
  getBackupHistory: async (filters?: {
    scheduleId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.scheduleId) queryParams.append('scheduleId', filters.scheduleId.toString());
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.status) queryParams.append('status', filters.status);
    
    const queryString = queryParams.toString();
    const url = `/backup/history${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      success: boolean;
      data: { history: any[]; count: number };
      message: string;
    }>(url);
  },

  // 手動觸發備份
  triggerBackup: async (scheduleId?: number) => {
    const url = scheduleId ? `/backup/trigger/${scheduleId}` : '/backup/trigger';
    return apiRequest<{
      success: boolean;
      data: { backupId: number };
      message: string;
    }>(url, {
      method: 'POST',
    });
  },

  // 恢復備份
  restoreBackup: async (backupId: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/backup/restore/${backupId}`, {
      method: 'POST',
    });
  },
};

// 版本管理 API
export const versionAPI = {
  // 獲取所有版本
  getVersions: async (filters?: {
    name?: string;
    startDate?: string;
    endDate?: string;
    tags?: string[];
  }) => {
    const queryParams = new URLSearchParams();
    if (filters?.name) queryParams.append('name', filters.name);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.tags) queryParams.append('tags', filters.tags.join(','));
    
    const queryString = queryParams.toString();
    const url = `/versions${queryString ? `?${queryString}` : ''}`;
    
    return apiRequest<{
      success: boolean;
      data: { versions: any[]; count: number };
      message: string;
    }>(url);
  },

  // 獲取單個版本
  getVersion: async (id: number) => {
    return apiRequest<{
      success: boolean;
      data: { version: any };
      message: string;
    }>(`/versions/${id}`);
  },

  // 創建版本
  createVersion: async (data: any) => {
    return apiRequest<{
      success: boolean;
      data: { version: any };
      message: string;
    }>('/versions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 更新版本
  updateVersion: async (id: number, data: Partial<any>) => {
    return apiRequest<{
      success: boolean;
      data: { version: any };
      message: string;
    }>(`/versions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 刪除版本
  deleteVersion: async (id: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/versions/${id}`, {
      method: 'DELETE',
    });
  },

  // 恢復到版本
  restoreVersion: async (id: number) => {
    return apiRequest<{
      success: boolean;
      message: string;
    }>(`/versions/${id}/restore`, {
      method: 'POST',
    });
  },

  // 比較版本
  compareVersions: async (versionId1: number, versionId2: number) => {
    return apiRequest<{
      success: boolean;
      data: { differences: any[] };
      message: string;
    }>(`/versions/compare/${versionId1}/${versionId2}`);
  },

  // 獲取版本統計
  getVersionStats: async () => {
    return apiRequest<{
      success: boolean;
      data: {
        totalVersions: number;
        byMonth: Record<string, number>;
        byCreator: Record<string, number>;
        averageSize: number;
        totalSize: number;
      };
      message: string;
    }>('/versions/stats');
  },
};

// 健康檢查
export const healthAPI = {
  check: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/health`);
      return response.json();
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
};

export default {
  auth: authAPI,
  property: propertyAPI,
  room: roomAPI,
  payment: paymentAPI,
  checkin: checkinAPI,
  checkout: checkoutAPI,
  tenant: tenantAPI,
  sync: syncAPI,
  backup: backupAPI,
  version: versionAPI,
  migration: migrationAPI,
  health: healthAPI,
  getToken,
  setToken,
  removeToken,
};