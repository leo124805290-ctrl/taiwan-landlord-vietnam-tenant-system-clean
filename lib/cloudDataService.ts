// 雲端數據服務 - 雲端為主架構
import api from './api';

// 數據類型
export interface CloudProperty {
  id: number;
  name: string;
  address?: string;
  owner_name?: string;
  owner_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface CloudRoom {
  id: number;
  property_id: number;
  name: string;
  status: 'available' | 'occupied' | 'maintenance';
  tenant_name?: string;
  rent?: number;
  deposit?: number;
  check_in_date?: string;
  check_out_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CloudPayment {
  id: number;
  room_id: number;
  type: 'rent' | 'deposit' | 'electricity' | 'water' | 'other';
  amount: number;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
  description?: string;
  created_at: string;
  updated_at: string;
}

// 雲端數據服務
export class CloudDataService {
  private static instance: CloudDataService;
  private localCache: {
    properties: CloudProperty[];
    rooms: CloudRoom[];
    payments: CloudPayment[];
    lastSync: string | null;
  } = {
    properties: [],
    rooms: [],
    payments: [],
    lastSync: null,
  };

  // 單例模式
  static getInstance(): CloudDataService {
    if (!CloudDataService.instance) {
      CloudDataService.instance = new CloudDataService();
    }
    return CloudDataService.instance;
  }

  // 私有構造函數
  private constructor() {
    this.loadLocalCache();
  }

  // 加載本地緩存
  private loadLocalCache(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cloud_data_cache');
      if (saved) {
        try {
          this.localCache = JSON.parse(saved);
        } catch (error) {
          console.error('加載本地緩存失敗:', error);
        }
      }
    }
  }

  // 保存本地緩存
  private saveLocalCache(): void {
    if (typeof window !== 'undefined') {
      try {
        try {
      localStorage.setItem('cloud_data_cache', JSON.stringify(this.localCache));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage 已滿，跳過緩存');
      }
    }
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          console.warn('localStorage 已滿，雲端數據緩存無法保存')
        } else {
          console.error('localStorage 儲存失敗:', e)
        }
      }
    }
  }

  // 檢查是否已登入
  isAuthenticated(): boolean {
    return api.auth.isAuthenticated();
  }

  // 同步所有數據（從雲端下載）
  async syncFromCloud(): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      // 1. 檢查登入狀態
      if (!this.isAuthenticated()) {
        throw new Error('請先登入雲端帳號');
      }

      // 2. 獲取物業列表
      const propertiesResult = await api.property.list();
      if (!propertiesResult.success) {
        throw new Error(`獲取物業失敗: ${propertiesResult.error}`);
      }

      // 3. 更新本地緩存
      this.localCache = {
        properties: Array.isArray(propertiesResult.data) ? propertiesResult.data : [],
        rooms: [], // 暫時為空，需要實現房間 API
        payments: [], // 暫時為空，需要實現付款 API
        lastSync: new Date().toISOString(),
      };

      // 4. 保存緩存
      this.saveLocalCache();

      const stats = {
        properties: (this.localCache.properties || []).length,
        rooms: (this.localCache.rooms || []).length,
        payments: (this.localCache.payments || []).length,
      };

      return {
        success: true,
        message: `同步成功！共同步 ${stats.properties} 個物業`,
        stats,
      };

    } catch (error) {
      return {
        success: false,
        message: `同步失敗: ${error.message}`,
      };
    }
  }

  // 上傳本地數據到雲端（避免重複）
  async uploadToCloud(localData: any): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 檢查登入狀態
      if (!this.isAuthenticated()) {
        throw new Error('請先登入雲端帳號');
      }

      // 2. 先同步現有雲端數據，避免重複
      const syncResult = await this.syncFromCloud();
      if (!syncResult.success) {
        console.warn('同步現有數據失敗，繼續上傳:', syncResult.message);
      }

      // 3. 上傳物業數據（檢查重複）
      const properties = localData.properties || [];
      let uploadedCount = 0;
      let skippedCount = 0;

      for (const property of properties) {
        try {
          // 檢查是否已存在
          const existingProperty = this.localCache.properties.find(p => 
            p.name === property.name || 
            (property.address && p.address === property.address)
          );

          if (existingProperty) {
            console.log(`物業「${property.name}」已存在，跳過`);
            skippedCount++;
            continue;
          }

          // 創建新物業
          const result = await this.createProperty({
            name: property.name || '未命名物業',
            address: property.address,
            owner_name: property.owner_name,
            owner_phone: property.owner_phone,
          });

          if (result.success) {
            uploadedCount++;
          } else {
            console.error(`上傳物業 ${property.name} 失敗:`, result.message);
          }
        } catch (error) {
          console.error(`處理物業 ${property.name} 錯誤:`, error);
        }
      }

      // 4. 再次同步最新數據
      await this.syncFromCloud();

      const totalProcessed = uploadedCount + skippedCount;
      return {
        success: true,
        message: `上傳完成！共處理 ${totalProcessed} 個物業（新增: ${uploadedCount}, 已存在: ${skippedCount}）`,
      };

    } catch (error) {
      return {
        success: false,
        message: `上傳失敗: ${error.message}`,
      };
    }
  }

  // 獲取物業列表
  getProperties(): CloudProperty[] {
    return [...this.localCache.properties];
  }

  // 獲取房間列表（根據物業）
  getRooms(propertyId?: number): CloudRoom[] {
    if (propertyId) {
      return (this.localCache.rooms || []).filter(room => room.property_id === propertyId);
    }
    return [...this.localCache.rooms];
  }

  // 獲取付款記錄
  getPayments(roomId?: number): CloudPayment[] {
    if (roomId) {
      return (this.localCache.payments || []).filter(payment => payment.room_id === roomId);
    }
    return [...this.localCache.payments];
  }

  // 創建物業（檢查重複）
  async createProperty(data: Omit<CloudProperty, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; property?: CloudProperty; message: string }> {
    try {
      // 1. 先檢查是否已存在相同名稱的物業
      const existingProperties = this.localCache.properties;
      const existingProperty = existingProperties.find(p => 
        p.name === data.name || 
        (data.address && p.address === data.address)
      );

      if (existingProperty) {
        return {
          success: true,
          property: existingProperty,
          message: '物業已存在，使用現有物業',
        };
      }

      // 2. 上傳到雲端
      const result = await api.property.create(data);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // 3. 更新本地緩存
      this.localCache.properties.push(result.data.property);
      this.saveLocalCache();

      return {
        success: true,
        property: result.data.property,
        message: '創建物業成功',
      };

    } catch (error) {
      return {
        success: false,
        message: `創建物業失敗: ${error.message}`,
      };
    }
  }

  // 獲取同步狀態
  getSyncStatus() {
    return {
      lastSync: this.localCache.lastSync,
      stats: {
        properties: (this.localCache.properties || []).length,
        rooms: (this.localCache.rooms || []).length,
        payments: (this.localCache.payments || []).length,
      },
      authenticated: this.isAuthenticated(),
    };
  }

  // 清除本地緩存
  clearCache(): void {
    this.localCache = {
      properties: [],
      rooms: [],
      payments: [],
      lastSync: null,
    };
    this.saveLocalCache();
  }

  // 轉換本地數據為雲端格式
  convertLocalToCloud(localData: any): {
    properties: Array<Omit<CloudProperty, 'id' | 'created_at' | 'updated_at'>>;
  } {
    const properties = (localData.properties || []).map((p: any) => ({
      name: p.name || '未命名物業',
      address: p.address,
      owner_name: p.owner_name,
      owner_phone: p.owner_phone,
    }));

    return { properties };
  }
}

// ---------------------------------------------------------------------------
// 新版雲端 API：直接對接後端 Express（/api/...）
// ---------------------------------------------------------------------------

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      (headers as any).Authorization = `Bearer ${token}`;
    }

    const url = `${API_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const text = await res.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        // ignore parse error, treat as plain text
      }
    }

    if (!res.ok) {
      const message = json?.error || json?.message || `HTTP ${res.status}`;
      return { success: false, error: message };
    }

    if (json && json.success === false) {
      return { success: false, error: json.error || json.message || '未知錯誤' };
    }

    const data = json && Object.prototype.hasOwnProperty.call(json, 'data') ? json.data : json;
    return { success: true, data };
  } catch (err: any) {
    console.error('[cloudDataService request] error:', err);
    return { success: false, error: err?.message || '網路錯誤' };
  }
}

// 1. 取得物業列表
export async function getProperties(): Promise<ApiResult<any[]>> {
  return request<any[]>('/properties');
}

// 2. 新增物業
export async function createProperty(
  name: string,
  address?: string,
): Promise<ApiResult<any>> {
  return request<any>('/properties', {
    method: 'POST',
    body: JSON.stringify({ name, address }),
  });
}

// 3. 更新物業
export async function updateProperty(
  id: number,
  name: string,
  address?: string,
): Promise<ApiResult<any>> {
  return request<any>(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, address }),
  });
}

// 4. 刪除物業
export async function deleteProperty(id: number): Promise<ApiResult<null>> {
  return request<null>(`/properties/${id}`, {
    method: 'DELETE',
  });
}

// 5. 取得房間列表（可選物業過濾）
export async function getRooms(propertyId?: number): Promise<ApiResult<any[]>> {
  const params = new URLSearchParams();
  if (propertyId) {
    params.append('property_id', propertyId.toString());
  }
  const qs = params.toString();
  const path = `/rooms${qs ? `?${qs}` : ''}`;
  return request<any[]>(path);
}

// 6. 新增房間
export async function createRoom(data: any): Promise<ApiResult<any>> {
  return request<any>('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 7. 更新房間
export async function updateRoom(id: number, data: any): Promise<ApiResult<any>> {
  return request<any>(`/rooms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// 8. 刪除房間
export async function deleteRoom(id: number): Promise<ApiResult<null>> {
  return request<null>(`/rooms/${id}`, {
    method: 'DELETE',
  });
}

// 9. 鎖定房間
export async function lockRoom(id: number): Promise<ApiResult<null>> {
  return request<null>(`/rooms/${id}/lock`, {
    method: 'POST',
  });
}

// 10. 解鎖房間
export async function unlockRoom(id: number): Promise<ApiResult<null>> {
  return request<null>(`/rooms/${id}/unlock`, {
    method: 'POST',
  });
}

// 導出單例（舊版本地快取仍可使用）
export const cloudData = CloudDataService.getInstance();

// React Hook
export const useCloudData = () => {
  return {
    // 數據
    properties: cloudData.getProperties(),
    rooms: cloudData.getRooms(),
    payments: cloudData.getPayments(),
    
    // 狀態
    syncStatus: cloudData.getSyncStatus(),
    isAuthenticated: cloudData.isAuthenticated(),
    
    // 操作
    syncFromCloud: () => cloudData.syncFromCloud(),
    uploadToCloud: (data: any) => cloudData.uploadToCloud(data),
    createProperty: (data: any) => cloudData.createProperty(data),
    clearCache: () => cloudData.clearCache(),
    convertLocalToCloud: (data: any) => cloudData.convertLocalToCloud(data),
  };
};

export default cloudData;