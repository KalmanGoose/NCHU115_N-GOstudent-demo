-- ==============================================================================
-- 國立中興大學 (NCHU) 新生美食地圖 - Supabase 資料庫綱要 (Database Schema)
-- ==============================================================================
-- 
-- 【使用方式】
-- 1. 登入 Supabase Dashboard (https://supabase.com)，建立一個新專案 (如: nchu-food-db)。
-- 2. 在左側選單點選「SQL Editor」->「New query」。
-- 3. 將本檔案全部內容複製並貼入，點擊右下角「Run」執行。
-- 4. 執行完畢後，即可獲得完整的 stores (店家表) 與 reports (學生回報表)，
--    並已自動配置好 Row Level Security (RLS) 安全存取權限！
-- ==============================================================================

-- 啟用 UUID 擴充套件 (若需要)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 建立店家主表 (stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT '生活圈實體擴充',
    street TEXT NOT NULL,
    walk_minutes INTEGER DEFAULT 5,
    transport_tip TEXT,
    category TEXT DEFAULT '特色美食',
    budget_tier TEXT DEFAULT '百元有找 (<100元)',
    avg_price TEXT DEFAULT '80',
    rating NUMERIC(3, 1) DEFAULT 4.5,
    review_count INTEGER DEFAULT 100,
    hours TEXT,
    address TEXT,
    photo_url TEXT,
    maps_url TEXT,
    content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. 建立問題與幽靈店家回報表 (reports)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    store_id TEXT,
    store_name TEXT NOT NULL,
    issue_type TEXT NOT NULL,
    details TEXT,
    reporter TEXT DEFAULT '興大熱心同學',
    status TEXT DEFAULT 'pending', -- 'pending', 'delist', 'rejected', 'resolved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. 建立索引提升查詢與篩選效能
CREATE INDEX IF NOT EXISTS idx_stores_street ON public.stores(street);
CREATE INDEX IF NOT EXISTS idx_stores_category ON public.stores(category);
CREATE INDEX IF NOT EXISTS idx_stores_is_active ON public.stores(is_active);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- 4. 啟用 Row Level Security (RLS) 保護資料安全
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有人 (包括未登入的學生訪客) 都可以讀取 active 的店家
CREATE POLICY "Public Read Active Stores" 
ON public.stores FOR SELECT 
USING (is_active = TRUE OR auth.role() = 'authenticated');

-- 策略 2: 所有人 (學生訪客) 都可以提交回報，但不能修改或刪除別人的回報
CREATE POLICY "Public Insert Reports" 
ON public.reports FOR INSERT 
WITH CHECK (TRUE);

-- 策略 3: 管理員 (登入者或具備 service_role) 擁有完整讀寫權限
CREATE POLICY "Admin Full Access Stores" 
ON public.stores FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Admin Full Access Reports" 
ON public.reports FOR ALL 
USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- 5. 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS set_stores_timestamp ON public.stores;
CREATE TRIGGER set_stores_timestamp
BEFORE UPDATE ON public.stores
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- ==============================================================================
-- 恭喜！資料庫綱要設置完成。
-- ==============================================================================
