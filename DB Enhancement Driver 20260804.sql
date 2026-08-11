-- ============================================================
-- COMPLETE DRIVER MANAGEMENT UPDATE - UAT
-- ============================================================
-- This script includes:
-- 1. Enhanced driver table - Add missing fields
-- 2. Timesheet Management tables
-- 3. Leave Management tables
-- 4. Driver performance metrics
-- 5. Views for reporting
-- 6. Functions and triggers
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ENHANCE driver TABLE
-- ============================================================

-- Add missing columns to driver table
ALTER TABLE driver 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_branch_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS tax_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_medical_exam_date DATE,
ADD COLUMN IF NOT EXISTS next_medical_exam_date DATE,
ADD COLUMN IF NOT EXISTS driver_license_class VARCHAR(50),
ADD COLUMN IF NOT EXISTS license_issue_date DATE,
ADD COLUMN IF NOT EXISTS license_restrictions TEXT,
ADD COLUMN IF NOT EXISTS endorsements TEXT,
ADD COLUMN IF NOT EXISTS driver_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS supervisor_id BIGINT REFERENCES driver(id),
ADD COLUMN IF NOT EXISTS last_trip_date DATE,
ADD COLUMN IF NOT EXISTS last_clock_in TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_clock_out TIMESTAMP,
ADD COLUMN IF NOT EXISTS current_status VARCHAR(20) DEFAULT 'OFF_DUTY';

-- Add comments
COMMENT ON COLUMN driver.date_of_birth IS 'Driver date of birth';
COMMENT ON COLUMN driver.gender IS 'Male, Female, Other';
COMMENT ON COLUMN driver.country IS 'Country of residence';
COMMENT ON COLUMN driver.emergency_contact_name IS 'Name of emergency contact';
COMMENT ON COLUMN driver.emergency_contact_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN driver.current_status IS 'ON_DUTY, OFF_DUTY, ON_LEAVE, ON_BREAK, CLOCKED_IN';

-- ============================================================
-- 2. TIMESHEET MANAGEMENT TABLES
-- ============================================================

-- Timesheet entries table
CREATE TABLE IF NOT EXISTS timesheet_entries (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    total_hours DECIMAL(5,2), -- calculated field
    activity_type VARCHAR(50) NOT NULL, -- DRIVING, REST, LOADING, UNLOADING, MAINTENANCE, TRAINING, OTHER
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, SUBMITTED, APPROVED, REJECTED
    notes TEXT,
    
    -- Punch clock fields
    clock_in_time TIMESTAMP,
    clock_out_time TIMESTAMP,
    break_start_time TIMESTAMP,
    break_end_time TIMESTAMP,
    punch_status VARCHAR(20) DEFAULT 'CLOCKED_OUT', -- CLOCKED_OUT, CLOCKED_IN, ON_BREAK
    punch_location VARCHAR(200),
    punch_latitude DECIMAL(10,8),
    punch_longitude DECIMAL(11,8),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES app_users(id),
    updated_by BIGINT REFERENCES app_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 0
);

-- Create indexes for timesheet_entries
CREATE INDEX IF NOT EXISTS idx_timesheet_driver_date ON timesheet_entries(driver_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_status ON timesheet_entries(status);
CREATE INDEX IF NOT EXISTS idx_timesheet_activity ON timesheet_entries(activity_type);
CREATE INDEX IF NOT EXISTS idx_timesheet_punch_status ON timesheet_entries(punch_status);

-- Timesheet approvals table
CREATE TABLE IF NOT EXISTS timesheet_approvals (
    id BIGSERIAL PRIMARY KEY,
    timesheet_entry_id BIGINT NOT NULL REFERENCES timesheet_entries(id) ON DELETE CASCADE,
    approver_id BIGINT NOT NULL REFERENCES app_users(id),
    status VARCHAR(20) NOT NULL, -- PENDING, APPROVED, REJECTED
    comments TEXT,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_timesheet_approvals_entry ON timesheet_approvals(timesheet_entry_id);

-- Timesheet summary table (for quick reporting)
CREATE TABLE IF NOT EXISTS timesheet_summary (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    total_hours DECIMAL(10,2) DEFAULT 0,
    regular_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    total_breaks_minutes INTEGER DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, week_start, week_end)
);

CREATE INDEX IF NOT EXISTS idx_timesheet_summary_driver ON timesheet_summary(driver_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_summary_week ON timesheet_summary(week_start, week_end);

-- ============================================================
-- 3. LEAVE MANAGEMENT TABLES
-- ============================================================

-- Leave types master table
CREATE TABLE IF NOT EXISTS leave_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    days_per_year INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    color VARCHAR(20) DEFAULT '#4F46E5',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0
);

-- Insert default leave types
INSERT INTO leave_types (name, code, description, days_per_year, is_paid, color) VALUES
('Annual Leave', 'ANNUAL', 'Standard annual leave', 21, TRUE, '#4F46E5'),
('Sick Leave', 'SICK', 'Sick leave with medical certificate', 10, TRUE, '#22C55E'),
('Study Leave', 'STUDY', 'Leave for studies and examinations', 5, TRUE, '#F59E0B'),
('Unpaid Leave', 'UNPAID', 'Unpaid leave', 0, FALSE, '#6B7280'),
('Maternity Leave', 'MATERNITY', 'Maternity leave', 120, TRUE, '#EC4899'),
('Paternity Leave', 'PATERNITY', 'Paternity leave', 10, TRUE, '#3B82F6'),
('Family Responsibility', 'FAMILY', 'Family responsibility leave', 3, TRUE, '#8B5CF6'),
('Compassionate Leave', 'COMPASSIONATE', 'Compassionate leave', 5, TRUE, '#EF4444'),
('Public Holiday', 'PUBLIC_HOLIDAY', 'Public holiday', 0, TRUE, '#10B981')
ON CONFLICT (code) DO NOTHING;

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id) ON DELETE CASCADE,
    leave_type_id BIGINT NOT NULL REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_days INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, CANCELLED
    reason TEXT,
    notes TEXT,
    attachment_url VARCHAR(500),
    
    -- Approval workflow
    approved_by BIGINT REFERENCES app_users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Dates
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES app_users(id),
    updated_by BIGINT REFERENCES app_users(id),
    version INTEGER DEFAULT 0,
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create indexes for leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_driver ON leave_requests(driver_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id) ON DELETE CASCADE,
    leave_type_id BIGINT NOT NULL REFERENCES leave_types(id),
    year INTEGER NOT NULL,
    total_days DECIMAL(10,2) DEFAULT 0,
    used_days DECIMAL(10,2) DEFAULT 0,
    pending_days DECIMAL(10,2) DEFAULT 0,
    remaining_days DECIMAL(10,2) DEFAULT 0,
    carried_over DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, leave_type_id, year)
);

-- Create indexes for leave_balances
CREATE INDEX IF NOT EXISTS idx_leave_balances_driver ON leave_balances(driver_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);

-- Leave audit log table
CREATE TABLE IF NOT EXISTS leave_audit_log (
    id BIGSERIAL PRIMARY KEY,
    leave_request_id BIGINT REFERENCES leave_requests(id),
    driver_id BIGINT NOT NULL REFERENCES driver(id),
    action VARCHAR(50) NOT NULL, -- REQUESTED, APPROVED, REJECTED, CANCELLED, MODIFIED
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    comments TEXT,
    performed_by BIGINT REFERENCES app_users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leave_audit_driver ON leave_audit_log(driver_id);
CREATE INDEX IF NOT EXISTS idx_leave_audit_request ON leave_audit_log(leave_request_id);

-- ============================================================
-- 4. DRIVER PERFORMANCE METRICS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT NOT NULL REFERENCES driver(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY, YEARLY
    
    -- Trip metrics
    total_trips INTEGER DEFAULT 0,
    completed_trips INTEGER DEFAULT 0,
    cancelled_trips INTEGER DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Performance metrics
    on_time_rate DECIMAL(5,2) DEFAULT 0,
    safety_score DECIMAL(5,2) DEFAULT 0,
    efficiency_score DECIMAL(5,2) DEFAULT 0,
    customer_rating DECIMAL(3,2) DEFAULT 0,
    performance_score DECIMAL(5,2) DEFAULT 0,
    
    -- Financial metrics
    total_earnings DECIMAL(10,2) DEFAULT 0,
    avg_earnings_per_trip DECIMAL(10,2) DEFAULT 0,
    fuel_cost DECIMAL(10,2) DEFAULT 0,
    maintenance_cost DECIMAL(10,2) DEFAULT 0,
    
    -- Compliance metrics
    incidents_count INTEGER DEFAULT 0,
    violations_count INTEGER DEFAULT 0,
    compliance_score DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0,
    
    UNIQUE(driver_id, period_start, period_end, period_type)
);

CREATE INDEX IF NOT EXISTS idx_driver_performance_driver ON driver_performance_metrics(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_performance_period ON driver_performance_metrics(period_start, period_end);

-- ============================================================
-- 5. CREATE VIEWS
-- ============================================================

-- Driver timesheet summary view
DROP VIEW IF EXISTS driver_timesheet_summary_view CASCADE;
CREATE OR REPLACE VIEW driver_timesheet_summary_view AS
SELECT 
    d.id as driver_id,
    d.first_name || ' ' || d.last_name as driver_name,
    DATE_TRUNC('week', te.entry_date) as week_start,
    COUNT(te.id) as total_entries,
    SUM(te.total_hours) as total_hours,
    SUM(CASE WHEN te.activity_type = 'DRIVING' THEN te.total_hours ELSE 0 END) as driving_hours,
    SUM(CASE WHEN te.activity_type = 'REST' THEN te.total_hours ELSE 0 END) as rest_hours,
    SUM(CASE WHEN te.activity_type = 'LOADING' THEN te.total_hours ELSE 0 END) as loading_hours,
    SUM(te.break_duration) as total_break_minutes,
    COUNT(CASE WHEN te.status = 'APPROVED' THEN 1 END) as approved_entries,
    COUNT(CASE WHEN te.status = 'PENDING' THEN 1 END) as pending_entries,
    AVG(te.total_hours) as avg_daily_hours
FROM driver d
LEFT JOIN timesheet_entries te ON d.id = te.driver_id AND te.is_active = true
WHERE d.is_active = true
GROUP BY d.id, d.first_name, d.last_name, DATE_TRUNC('week', te.entry_date)
ORDER BY d.id, week_start DESC;

-- Driver leave balance summary view
DROP VIEW IF EXISTS driver_leave_balance_summary CASCADE;
CREATE OR REPLACE VIEW driver_leave_balance_summary AS
SELECT 
    d.id as driver_id,
    d.first_name || ' ' || d.last_name as driver_name,
    lt.name as leave_type,
    lt.code as leave_code,
    lb.year,
    lb.total_days,
    lb.used_days,
    lb.pending_days,
    lb.remaining_days,
    lb.carried_over,
    CASE 
        WHEN lb.remaining_days < 5 THEN 'CRITICAL'
        WHEN lb.remaining_days < 10 THEN 'LOW'
        ELSE 'GOOD'
    END as balance_status
FROM driver d
JOIN leave_balances lb ON d.id = lb.driver_id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE d.is_active = true
ORDER BY d.id, lb.year, lt.id;

-- Driver performance summary view
DROP VIEW IF EXISTS driver_performance_summary CASCADE;
CREATE OR REPLACE VIEW driver_performance_summary AS
SELECT 
    d.id as driver_id,
    d.first_name || ' ' || d.last_name as driver_name,
    d.status as driver_status,
    COUNT(DISTINCT t.id) as total_trips,
    COUNT(DISTINCT CASE WHEN t.status = 'COMPLETED' THEN t.id END) as completed_trips,
    COUNT(DISTINCT CASE WHEN t.status = 'CANCELLED' THEN t.id END) as cancelled_trips,
    COALESCE(SUM(t.total_distance), 0) as total_distance,
    COALESCE(AVG(d.performance_score), 0) as avg_performance_score,
    COALESCE(AVG(d.total_hours_active), 0) as avg_hours_active,
    COALESCE(AVG(d.total_km_travelled), 0) as avg_km_travelled
FROM driver d
LEFT JOIN trips t ON d.id = t.driver_id
WHERE d.is_active = true
GROUP BY d.id, d.first_name, d.last_name, d.status;

-- ============================================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function: Update timesheet total hours
CREATE OR REPLACE FUNCTION update_timesheet_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL THEN
        NEW.total_hours = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600 - (NEW.break_duration / 60.0);
        NEW.total_hours = ROUND(NEW.total_hours, 2);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update leave balance on status change
CREATE OR REPLACE FUNCTION update_leave_balance_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- When leave is approved, update used days
    IF NEW.status = 'APPROVED' AND OLD.status = 'PENDING' THEN
        UPDATE leave_balances 
        SET used_days = used_days + NEW.duration_days,
            pending_days = pending_days - NEW.duration_days,
            remaining_days = total_days - used_days - pending_days,
            updated_at = CURRENT_TIMESTAMP
        WHERE driver_id = NEW.driver_id 
          AND leave_type_id = NEW.leave_type_id 
          AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
    
    -- When leave is rejected, reduce pending days
    IF NEW.status = 'REJECTED' AND OLD.status = 'PENDING' THEN
        UPDATE leave_balances 
        SET pending_days = pending_days - NEW.duration_days,
            remaining_days = total_days - used_days - pending_days,
            updated_at = CURRENT_TIMESTAMP
        WHERE driver_id = NEW.driver_id 
          AND leave_type_id = NEW.leave_type_id 
          AND year = EXTRACT(YEAR FROM NEW.start_date);
    END IF;
    
    -- Log the change
    INSERT INTO leave_audit_log (
        leave_request_id,
        driver_id,
        action,
        old_status,
        new_status,
        performed_by
    )
    VALUES (
        NEW.id,
        NEW.driver_id,
        'STATUS_CHANGE',
        OLD.status,
        NEW.status,
        NEW.updated_by
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-generate leave balances for new driver
CREATE OR REPLACE FUNCTION auto_generate_leave_balances()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO leave_balances (driver_id, leave_type_id, year, total_days, remaining_days)
    SELECT 
        NEW.id, 
        lt.id, 
        EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 
        lt.days_per_year, 
        lt.days_per_year
    FROM leave_types lt
    WHERE lt.is_active = true AND lt.days_per_year > 0;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update driver status on punch
CREATE OR REPLACE FUNCTION update_driver_punch_status(
    p_driver_id BIGINT,
    p_punch_type VARCHAR(20),
    p_location VARCHAR(200),
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8)
)
RETURNS TEXT AS $$
DECLARE
    v_entry_id BIGINT;
    v_current_status VARCHAR(20);
BEGIN
    -- Get current status
    SELECT current_status INTO v_current_status
    FROM driver
    WHERE id = p_driver_id;
    
    -- Handle different punch types
    CASE p_punch_type
        WHEN 'CLOCK_IN' THEN
            -- Create new timesheet entry
            INSERT INTO timesheet_entries (
                driver_id,
                entry_date,
                start_time,
                clock_in_time,
                punch_status,
                punch_location,
                punch_latitude,
                punch_longitude,
                status,
                activity_type,
                created_by
            )
            VALUES (
                p_driver_id,
                CURRENT_DATE,
                CURRENT_TIME,
                CURRENT_TIMESTAMP,
                'CLOCKED_IN',
                p_location,
                p_latitude,
                p_longitude,
                'ACTIVE',
                'DRIVING',
                p_driver_id
            )
            RETURNING id INTO v_entry_id;
            
            -- Update driver status
            UPDATE driver 
            SET current_status = 'CLOCKED_IN',
                last_clock_in = CURRENT_TIMESTAMP
            WHERE id = p_driver_id;
            
            RETURN 'Clocked in successfully';
            
        WHEN 'BREAK_START' THEN
            -- Get current entry
            SELECT id INTO v_entry_id
            FROM timesheet_entries
            WHERE driver_id = p_driver_id
            AND punch_status = 'CLOCKED_IN'
            AND entry_date = CURRENT_DATE
            ORDER BY clock_in_time DESC
            LIMIT 1;
            
            IF v_entry_id IS NOT NULL THEN
                UPDATE timesheet_entries
                SET break_start_time = CURRENT_TIMESTAMP,
                    punch_status = 'ON_BREAK'
                WHERE id = v_entry_id;
                
                UPDATE driver 
                SET current_status = 'ON_BREAK'
                WHERE id = p_driver_id;
                
                RETURN 'Break started';
            ELSE
                RETURN 'No active clock-in found';
            END IF;
            
        WHEN 'BREAK_END' THEN
            -- Get current entry
            SELECT id INTO v_entry_id
            FROM timesheet_entries
            WHERE driver_id = p_driver_id
            AND punch_status = 'ON_BREAK'
            AND entry_date = CURRENT_DATE
            ORDER BY break_start_time DESC
            LIMIT 1;
            
            IF v_entry_id IS NOT NULL THEN
                UPDATE timesheet_entries
                SET break_end_time = CURRENT_TIMESTAMP,
                    punch_status = 'CLOCKED_IN',
                    break_duration = break_duration + EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - break_start_time)) / 60
                WHERE id = v_entry_id;
                
                UPDATE driver 
                SET current_status = 'CLOCKED_IN'
                WHERE id = p_driver_id;
                
                RETURN 'Break ended';
            ELSE
                RETURN 'No active break found';
            END IF;
            
        WHEN 'CLOCK_OUT' THEN
            -- Get current entry
            SELECT id INTO v_entry_id
            FROM timesheet_entries
            WHERE driver_id = p_driver_id
            AND punch_status IN ('CLOCKED_IN', 'ON_BREAK')
            AND entry_date = CURRENT_DATE
            ORDER BY clock_in_time DESC
            LIMIT 1;
            
            IF v_entry_id IS NOT NULL THEN
                UPDATE timesheet_entries
                SET clock_out_time = CURRENT_TIMESTAMP,
                    end_time = CURRENT_TIME,
                    punch_status = 'CLOCKED_OUT',
                    punch_location = p_location,
                    punch_latitude = p_latitude,
                    punch_longitude = p_longitude
                WHERE id = v_entry_id;
                
                UPDATE driver 
                SET current_status = 'OFF_DUTY',
                    last_clock_out = CURRENT_TIMESTAMP
                WHERE id = p_driver_id;
                
                RETURN 'Clocked out successfully';
            ELSE
                RETURN 'No active clock-in found';
            END IF;
            
        ELSE
            RETURN 'Invalid punch type';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. CREATE TRIGGERS
-- ============================================================

-- Trigger: Update timesheet hours
DROP TRIGGER IF EXISTS trigger_update_timesheet_hours ON timesheet_entries;
CREATE TRIGGER trigger_update_timesheet_hours
BEFORE INSERT OR UPDATE ON timesheet_entries
FOR EACH ROW
EXECUTE FUNCTION update_timesheet_hours();

-- Trigger: Update leave balance on status change
DROP TRIGGER IF EXISTS trigger_update_leave_balance ON leave_requests;
CREATE TRIGGER trigger_update_leave_balance
AFTER UPDATE OF status ON leave_requests
FOR EACH ROW
WHEN (NEW.status IN ('APPROVED', 'REJECTED') AND OLD.status = 'PENDING')
EXECUTE FUNCTION update_leave_balance_on_status_change();

-- Trigger: Auto-generate leave balances for new driver
DROP TRIGGER IF EXISTS trigger_auto_generate_leave_balances ON driver;
CREATE TRIGGER trigger_auto_generate_leave_balances
AFTER INSERT ON driver
FOR EACH ROW
EXECUTE FUNCTION auto_generate_leave_balances();

-- ============================================================
-- 8. INITIALIZE LEAVE BALANCES FOR EXISTING driver
-- ============================================================

INSERT INTO leave_balances (driver_id, leave_type_id, year, total_days, remaining_days)
SELECT 
    d.id,
    lt.id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    lt.days_per_year,
    lt.days_per_year
FROM driver d
CROSS JOIN leave_types lt
WHERE d.is_active = true
AND lt.is_active = true
AND lt.days_per_year > 0
AND NOT EXISTS (
    SELECT 1 FROM leave_balances lb 
    WHERE lb.driver_id = d.id 
    AND lb.leave_type_id = lt.id 
    AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
)
ON CONFLICT (driver_id, leave_type_id, year) DO NOTHING;

-- ============================================================
-- 9. VERIFICATION QUERIES
-- ============================================================

-- Check driver new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'driver' 
AND column_name IN ('date_of_birth', 'gender', 'country', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'bank_name', 'bank_account_number', 'bank_branch_code', 'tax_number', 'last_medical_exam_date', 'next_medical_exam_date', 'driver_license_class', 'license_issue_date', 'license_restrictions', 'endorsements', 'driver_photo_url', 'employee_id', 'department', 'supervisor_id', 'last_trip_date', 'last_clock_in', 'last_clock_out', 'current_status');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('timesheet_entries', 'timesheet_approvals', 'timesheet_summary', 'leave_types', 'leave_requests', 'leave_balances', 'leave_audit_log', 'driver_performance_metrics')
AND table_schema = 'public';

-- Check views exist
SELECT viewname 
FROM pg_views 
WHERE viewname IN ('driver_timesheet_summary_view', 'driver_leave_balance_summary', 'driver_performance_summary');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_timesheet_hours', 'trigger_update_leave_balance', 'trigger_auto_generate_leave_balances');

-- Check leave types inserted
SELECT id, name, code, days_per_year, is_paid, color FROM leave_types;

-- Check leave balances created
SELECT COUNT(*) as total_balances, COUNT(DISTINCT driver_id) as driver_with_balances
FROM leave_balances
WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;

COMMIT;

-- ============================================================
-- SCRIPT COMPLETE
-- ============================================================
-- Run this entire script in your UAT database
-- It includes all driver management changes in a single transaction
-- ============================================================