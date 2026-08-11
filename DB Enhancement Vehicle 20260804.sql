-- ============================================================
-- COMPLETE VEHICLE FUEL MANAGEMENT UPDATE - UAT
-- ============================================================
-- This script includes all fixes and enhancements for:
-- 1. vehicle table - Add fuel columns
-- 2. Fuel slip table - Enhance with tracking columns
-- 3. Fuel source table - Add contact details
-- 4. New fuel tracking tables
-- 5. Views for reporting
-- 6. Functions and triggers
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ENHANCE vehicle TABLE
-- ============================================================

-- Add fuel-related columns to vehicle table
ALTER TABLE vehicle 
ADD COLUMN IF NOT EXISTS fuel_capacity DECIMAL(10,2) DEFAULT 400,
ADD COLUMN IF NOT EXISTS current_fuel_level DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS virtual_consumption DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_tank_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS fuel_tank_type VARCHAR(50) DEFAULT 'SINGLE',
ADD COLUMN IF NOT EXISTS last_fuel_update TIMESTAMP;

-- Add comments for documentation
COMMENT ON COLUMN vehicle.fuel_capacity IS 'Total fuel tank capacity in liters';
COMMENT ON COLUMN vehicle.current_fuel_level IS 'Current fuel level in liters';
COMMENT ON COLUMN vehicle.virtual_consumption IS 'System calculated virtual consumption';
COMMENT ON COLUMN vehicle.fuel_tank_count IS 'Number of fuel tanks';
COMMENT ON COLUMN vehicle.fuel_tank_type IS 'Type of fuel tank configuration';
COMMENT ON COLUMN vehicle.last_fuel_update IS 'Last time fuel level was updated';

-- ============================================================
-- 2. ENHANCE FUEL SLIP TABLE
-- ============================================================

-- Add columns to fuel_slip table
ALTER TABLE fuel_slip 
ADD COLUMN IF NOT EXISTS virtual_consumption DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS user_consumption DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_full_tank BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS previous_odometer DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS distance_travelled DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS fuel_efficiency DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tank_fill_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS consumption_calculated DECIMAL(10,2);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_fuel_slip_full_tank ON fuel_slip(is_full_tank);
CREATE INDEX IF NOT EXISTS idx_fuel_slip_odometer ON fuel_slip(odometer_reading);

-- Add comments
COMMENT ON COLUMN fuel_slip.virtual_consumption IS 'System calculated consumption based on refills';
COMMENT ON COLUMN fuel_slip.user_consumption IS 'User set consumption value';
COMMENT ON COLUMN fuel_slip.is_full_tank IS 'Indicates if tank was filled to full capacity';
COMMENT ON COLUMN fuel_slip.tank_fill_percentage IS 'Percentage of tank filled';
COMMENT ON COLUMN fuel_slip.consumption_calculated IS 'Calculated consumption L/100km from this refill';

-- ============================================================
-- 3. ENHANCE FUEL SOURCE TABLE
-- ============================================================

ALTER TABLE fuel_source 
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel',
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(200),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_preferred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS average_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_fuel_source_preferred ON fuel_source(is_preferred);

-- ============================================================
-- 4. CREATE NEW FUEL TRACKING TABLES
-- ============================================================

-- Vehicle fuel summary table
CREATE TABLE IF NOT EXISTS vehicle_fuel_summary (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    total_refills INTEGER DEFAULT 0,
    total_quantity DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    avg_cost_per_liter DECIMAL(10,2) DEFAULT 0,
    avg_consumption DECIMAL(10,2) DEFAULT 0,
    virtual_consumption DECIMAL(10,2) DEFAULT 0,
    user_consumption DECIMAL(10,2) DEFAULT 0,
    total_distance DECIMAL(10,2) DEFAULT 0,
    start_odometer DECIMAL(10,2) DEFAULT 0,
    end_odometer DECIMAL(10,2) DEFAULT 0,
    fuel_efficiency DECIMAL(10,2) DEFAULT 0,
    cost_per_km DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0,
    UNIQUE(vehicle_id, period_start, period_end, period_type)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_summary_vehicle ON vehicle_fuel_summary(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_summary_period ON vehicle_fuel_summary(period_start, period_end);

-- Vehicle fuel status table
CREATE TABLE IF NOT EXISTS vehicle_fuel_status (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    tank_number INTEGER DEFAULT 1,
    current_level DECIMAL(10,2) DEFAULT 0,
    capacity DECIMAL(10,2) DEFAULT 0,
    last_refill_date DATE,
    last_refill_odometer DECIMAL(10,2),
    estimated_range DECIMAL(10,2) DEFAULT 0,
    percentage_full DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'NORMAL',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 0,
    UNIQUE(vehicle_id, tank_number)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_status_vehicle ON vehicle_fuel_status(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fuel_status_status ON vehicle_fuel_status(status);

-- Vehicle consumption settings table
CREATE TABLE IF NOT EXISTS vehicle_consumption_settings (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    user_avg_consumption DECIMAL(10,2),
    user_tank_capacity DECIMAL(10,2),
    system_avg_consumption DECIMAL(10,2),
    system_tank_capacity DECIMAL(10,2),
    virtual_consumption DECIMAL(10,2),
    preferred_consumption_type VARCHAR(20) DEFAULT 'USER',
    auto_update_enabled BOOLEAN DEFAULT TRUE,
    low_fuel_threshold DECIMAL(5,2) DEFAULT 25,
    critical_fuel_threshold DECIMAL(5,2) DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES app_users(id),
    updated_by BIGINT REFERENCES app_users(id),
    version INTEGER DEFAULT 0,
    UNIQUE(vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_consumption_settings_vehicle ON vehicle_consumption_settings(vehicle_id);

-- Fuel consumption audit table
CREATE TABLE IF NOT EXISTS fuel_consumption_audit (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicle(id) ON DELETE CASCADE,
    fuel_slip_id BIGINT REFERENCES fuel_slip(id),
    action VARCHAR(50) NOT NULL,
    previous_consumption DECIMAL(10,2),
    previous_fuel_level DECIMAL(10,2),
    previous_odometer DECIMAL(10,2),
    new_consumption DECIMAL(10,2),
    new_fuel_level DECIMAL(10,2),
    new_odometer DECIMAL(10,2),
    quantity_added DECIMAL(10,2),
    distance_travelled DECIMAL(10,2),
    consumption_calculated DECIMAL(10,2),
    notes TEXT,
    performed_by BIGINT REFERENCES app_users(id),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fuel_consumption_audit_vehicle ON fuel_consumption_audit(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_consumption_audit_fuel_slip ON fuel_consumption_audit(fuel_slip_id);

-- ============================================================
-- 5. CREATE VIEWS
-- ============================================================

-- Vehicle fuel status view
DROP VIEW IF EXISTS vehicle_fuel_status_view CASCADE;
CREATE OR REPLACE VIEW vehicle_fuel_status_view AS
SELECT 
    v.id as vehicle_id,
    v.registration_number,
    v.make || ' ' || v.model as vehicle_name,
    COALESCE(vfs.current_level, v.current_fuel_level, 0) as current_level,
    COALESCE(vfs.capacity, v.fuel_capacity, 400) as capacity,
    CASE 
        WHEN COALESCE(vfs.capacity, v.fuel_capacity, 400) > 0 
        THEN (COALESCE(vfs.current_level, v.current_fuel_level, 0) / COALESCE(vfs.capacity, v.fuel_capacity, 400)) * 100
        ELSE 0
    END as percentage_full,
    COALESCE(vfs.estimated_range, 0) as estimated_range,
    COALESCE(vfs.status, 
        CASE 
            WHEN COALESCE(vfs.current_level, v.current_fuel_level, 0) / NULLIF(COALESCE(vfs.capacity, v.fuel_capacity, 400), 0) * 100 < 10 THEN 'CRITICAL'
            WHEN COALESCE(vfs.current_level, v.current_fuel_level, 0) / NULLIF(COALESCE(vfs.capacity, v.fuel_capacity, 400), 0) * 100 < 25 THEN 'LOW'
            ELSE 'NORMAL'
        END
    ) as fuel_status,
    vfs.last_refill_date,
    vfs.updated_at as last_updated,
    vcs.user_avg_consumption,
    vcs.system_avg_consumption,
    vcs.virtual_consumption,
    vcs.low_fuel_threshold,
    vcs.critical_fuel_threshold,
    v.fuel_capacity,
    v.current_fuel_level,
    v.virtual_consumption as vehicle_virtual_consumption
FROM vehicle v
LEFT JOIN vehicle_fuel_status vfs ON v.id = vfs.vehicle_id AND vfs.tank_number = 1
LEFT JOIN vehicle_consumption_settings vcs ON v.id = vcs.vehicle_id
WHERE v.is_active = true;

-- Vehicle fuel consumption view
DROP VIEW IF EXISTS vehicle_fuel_consumption_view CASCADE;
CREATE OR REPLACE VIEW vehicle_fuel_consumption_view AS
SELECT 
    v.id as vehicle_id,
    v.registration_number,
    v.make || ' ' || v.model as vehicle_name,
    DATE_TRUNC('month', fs.transaction_date) as month,
    COUNT(fs.id) as refill_count,
    SUM(fs.quantity) as total_fuel_liters,
    SUM(fs.total_amount) as total_cost,
    AVG(fs.total_amount / NULLIF(fs.quantity, 0)) as avg_cost_per_liter,
    CASE 
        WHEN MAX(fs.odometer_reading) - MIN(fs.odometer_reading) > 0 
        THEN (SUM(fs.quantity) / NULLIF(MAX(fs.odometer_reading) - MIN(fs.odometer_reading), 0)) * 100
        ELSE 0
    END as calculated_consumption,
    AVG(v.avg_consumption) as user_consumption,
    AVG(CASE WHEN fs.is_full_tank = true AND fs.previous_odometer IS NOT NULL AND fs.previous_odometer > 0 THEN 
        (fs.quantity / NULLIF(fs.odometer_reading - fs.previous_odometer, 0)) * 100 
        ELSE NULL END) as virtual_consumption,
    MAX(fs.odometer_reading) - MIN(fs.odometer_reading) as monthly_distance,
    COUNT(DISTINCT fs.driver_id) as unique_drivers,
    AVG(fs.fuel_efficiency) as avg_fuel_efficiency
FROM vehicle v
LEFT JOIN fuel_slip fs ON v.id = fs.vehicle_id
WHERE fs.finalized = true
AND fs.vehicle_id IS NOT NULL
GROUP BY v.id, v.registration_number, v.make, v.model, DATE_TRUNC('month', fs.transaction_date)
ORDER BY v.id, month DESC;

-- Vehicle fuel summary view
DROP VIEW IF EXISTS vehicle_fuel_summary_view CASCADE;
CREATE OR REPLACE VIEW vehicle_fuel_summary_view AS
SELECT 
    v.id as vehicle_id,
    v.registration_number,
    v.make || ' ' || v.model as vehicle_name,
    COUNT(fs.id) as total_refills,
    SUM(fs.quantity) as total_liters,
    SUM(fs.total_amount) as total_cost,
    AVG(fs.total_amount / NULLIF(fs.quantity, 0)) as avg_cost_per_liter,
    SUM(CASE WHEN DATE_TRUNC('month', fs.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN fs.quantity ELSE 0 END) as current_month_liters,
    SUM(CASE WHEN DATE_TRUNC('month', fs.transaction_date) = DATE_TRUNC('month', CURRENT_DATE) 
        THEN fs.total_amount ELSE 0 END) as current_month_cost,
    SUM(CASE WHEN DATE_TRUNC('month', fs.transaction_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        THEN fs.quantity ELSE 0 END) as last_month_liters,
    AVG(v.avg_consumption) as user_avg_consumption,
    AVG(v.virtual_consumption) as virtual_consumption,
    MAX(fs.odometer_reading) as current_odometer,
    v.fuel_capacity,
    COALESCE(v.current_fuel_level, 0) as current_fuel_level,
    CASE 
        WHEN v.fuel_capacity > 0 
        THEN (COALESCE(v.current_fuel_level, 0) / v.fuel_capacity) * 100
        ELSE 0
    END as fuel_percentage
FROM vehicle v
LEFT JOIN fuel_slip fs ON v.id = fs.vehicle_id AND fs.finalized = true
WHERE v.is_active = true
GROUP BY v.id, v.registration_number, v.make, v.model, v.fuel_capacity, v.current_fuel_level
ORDER BY v.id;

-- ============================================================
-- 6. CREATE FUNCTIONS AND TRIGGERS
-- ============================================================

-- Function: Update vehicle fuel status
CREATE OR REPLACE FUNCTION update_vehicle_fuel_status()
RETURNS TRIGGER AS $$
DECLARE
    tank_capacity DECIMAL(10,2);
BEGIN
    SELECT COALESCE(fuel_capacity, 400) INTO tank_capacity
    FROM vehicle 
    WHERE id = NEW.vehicle_id;
    
    UPDATE vehicle 
    SET 
        current_fuel_level = COALESCE(current_fuel_level, 0) + NEW.quantity,
        last_fuel_update = CURRENT_TIMESTAMP
    WHERE id = NEW.vehicle_id;
    
    INSERT INTO vehicle_fuel_status (
        vehicle_id, 
        current_level, 
        capacity, 
        last_refill_date, 
        last_refill_odometer,
        percentage_full,
        status,
        updated_at
    )
    VALUES (
        NEW.vehicle_id,
        NEW.quantity,
        tank_capacity,
        NEW.transaction_date,
        NEW.odometer_reading,
        (NEW.quantity / NULLIF(tank_capacity, 0)) * 100,
        CASE 
            WHEN NEW.quantity / NULLIF(tank_capacity, 0) * 100 < 10 THEN 'CRITICAL'
            WHEN NEW.quantity / NULLIF(tank_capacity, 0) * 100 < 25 THEN 'LOW'
            ELSE 'NORMAL'
        END,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (vehicle_id, tank_number) 
    DO UPDATE SET
        current_level = vehicle_fuel_status.current_level + NEW.quantity,
        last_refill_date = NEW.transaction_date,
        last_refill_odometer = NEW.odometer_reading,
        percentage_full = (vehicle_fuel_status.current_level + NEW.quantity) / NULLIF(tank_capacity, 0) * 100,
        status = CASE 
            WHEN (vehicle_fuel_status.current_level + NEW.quantity) / NULLIF(tank_capacity, 0) * 100 < 10 THEN 'CRITICAL'
            WHEN (vehicle_fuel_status.current_level + NEW.quantity) / NULLIF(tank_capacity, 0) * 100 < 25 THEN 'LOW'
            ELSE 'NORMAL'
        END,
        updated_at = CURRENT_TIMESTAMP;

    IF NEW.is_full_tank = true AND NEW.previous_odometer IS NOT NULL THEN
        INSERT INTO fuel_consumption_audit (
            vehicle_id,
            fuel_slip_id,
            action,
            previous_odometer,
            new_odometer,
            quantity_added,
            distance_travelled,
            consumption_calculated,
            performed_at
        )
        VALUES (
            NEW.vehicle_id,
            NEW.id,
            'REFILL',
            NEW.previous_odometer,
            NEW.odometer_reading,
            NEW.quantity,
            NEW.odometer_reading - NEW.previous_odometer,
            (NEW.quantity / NULLIF(NEW.odometer_reading - NEW.previous_odometer, 0)) * 100,
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Update vehicle consumption settings
CREATE OR REPLACE FUNCTION update_vehicle_consumption_settings()
RETURNS TRIGGER AS $$
DECLARE
    avg_consumption DECIMAL(10,2);
BEGIN
    SELECT AVG(
        (quantity / NULLIF(odometer_reading - previous_odometer, 0)) * 100
    ) INTO avg_consumption
    FROM fuel_slip
    WHERE vehicle_id = NEW.vehicle_id
    AND is_full_tank = true
    AND finalized = true
    AND odometer_reading > 0
    ORDER BY transaction_date DESC
    LIMIT 5;
    
    INSERT INTO vehicle_consumption_settings (
        vehicle_id,
        system_avg_consumption,
        virtual_consumption,
        updated_at
    )
    VALUES (
        NEW.vehicle_id,
        avg_consumption,
        avg_consumption,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (vehicle_id) 
    DO UPDATE SET
        system_avg_consumption = COALESCE(avg_consumption, vehicle_consumption_settings.system_avg_consumption),
        virtual_consumption = COALESCE(avg_consumption, vehicle_consumption_settings.virtual_consumption),
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Reset vehicle fuel to full
CREATE OR REPLACE FUNCTION reset_vehicle_fuel_to_full(
    p_vehicle_id BIGINT,
    p_odometer_reading DECIMAL(10,2) DEFAULT NULL,
    p_tank_number INTEGER DEFAULT 1
)
RETURNS TEXT AS $$
DECLARE
    tank_capacity DECIMAL(10,2);
    current_odometer DECIMAL(10,2);
BEGIN
    SELECT COALESCE(fuel_capacity, 400) INTO tank_capacity
    FROM vehicle 
    WHERE id = p_vehicle_id;
    
    IF p_odometer_reading IS NULL THEN
        SELECT current_odometer INTO current_odometer
        FROM vehicle 
        WHERE id = p_vehicle_id;
    ELSE
        current_odometer := p_odometer_reading;
    END IF;
    
    UPDATE vehicle 
    SET 
        current_fuel_level = tank_capacity,
        last_fuel_update = CURRENT_TIMESTAMP
    WHERE id = p_vehicle_id;
    
    INSERT INTO vehicle_fuel_status (
        vehicle_id,
        tank_number,
        current_level,
        capacity,
        last_refill_date,
        last_refill_odometer,
        percentage_full,
        status,
        updated_at
    )
    VALUES (
        p_vehicle_id,
        p_tank_number,
        tank_capacity,
        tank_capacity,
        CURRENT_DATE,
        current_odometer,
        100,
        'NORMAL',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (vehicle_id, tank_number) 
    DO UPDATE SET
        current_level = tank_capacity,
        capacity = tank_capacity,
        last_refill_date = CURRENT_DATE,
        last_refill_odometer = current_odometer,
        percentage_full = 100,
        status = 'NORMAL',
        updated_at = CURRENT_TIMESTAMP;
    
    INSERT INTO fuel_consumption_audit (
        vehicle_id,
        action,
        previous_fuel_level,
        new_fuel_level,
        previous_odometer,
        new_odometer,
        notes,
        performed_at
    )
    VALUES (
        p_vehicle_id,
        'RESET_FULL',
        0,
        tank_capacity,
        COALESCE(p_odometer_reading, 0),
        current_odometer,
        'Manual reset to full tank',
        CURRENT_TIMESTAMP
    );
    
    RETURN 'Fuel reset to full successfully';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. CREATE TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS trigger_update_vehicle_fuel_status ON fuel_slip;
CREATE TRIGGER trigger_update_vehicle_fuel_status
AFTER INSERT OR UPDATE OF quantity, odometer_reading, is_full_tank ON fuel_slip
FOR EACH ROW
WHEN (NEW.vehicle_id IS NOT NULL)
EXECUTE FUNCTION update_vehicle_fuel_status();

DROP TRIGGER IF EXISTS trigger_update_vehicle_consumption ON fuel_slip;
CREATE TRIGGER trigger_update_vehicle_consumption
AFTER UPDATE OF finalized ON fuel_slip
FOR EACH ROW
WHEN (NEW.finalized = true AND NEW.vehicle_id IS NOT NULL)
EXECUTE FUNCTION update_vehicle_consumption_settings();

-- ============================================================
-- 8. INITIALIZE FUEL STATUS FOR EXISTING vehicle
-- ============================================================

INSERT INTO vehicle_fuel_status (vehicle_id, tank_number, current_level, capacity, percentage_full, status, updated_at)
SELECT 
    id as vehicle_id,
    1 as tank_number,
    COALESCE(current_fuel_level, 0) as current_level,
    COALESCE(fuel_capacity, 400) as capacity,
    CASE 
        WHEN COALESCE(fuel_capacity, 400) > 0 
        THEN (COALESCE(current_fuel_level, 0) / COALESCE(fuel_capacity, 400)) * 100
        ELSE 0
    END as percentage_full,
    CASE 
        WHEN COALESCE(fuel_capacity, 400) > 0 
        AND (COALESCE(current_fuel_level, 0) / COALESCE(fuel_capacity, 400)) * 100 < 10 THEN 'CRITICAL'
        WHEN COALESCE(fuel_capacity, 400) > 0 
        AND (COALESCE(current_fuel_level, 0) / COALESCE(fuel_capacity, 400)) * 100 < 25 THEN 'LOW'
        ELSE 'NORMAL'
    END as status,
    CURRENT_TIMESTAMP as updated_at
FROM vehicle
WHERE is_active = true
ON CONFLICT (vehicle_id, tank_number) DO NOTHING;

-- ============================================================
-- 9. INITIALIZE CONSUMPTION SETTINGS FOR EXISTING vehicle
-- ============================================================

INSERT INTO vehicle_consumption_settings (vehicle_id, user_avg_consumption, low_fuel_threshold, critical_fuel_threshold)
SELECT 
    id as vehicle_id,
    COALESCE(avg_consumption, 12.5) as user_avg_consumption,
    25 as low_fuel_threshold,
    10 as critical_fuel_threshold
FROM vehicle
WHERE is_active = true
ON CONFLICT (vehicle_id) DO NOTHING;

-- ============================================================
-- 10. VERIFICATION QUERIES
-- ============================================================

-- Check vehicle fuel columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'vehicle' 
AND column_name IN ('fuel_capacity', 'current_fuel_level', 'virtual_consumption', 'fuel_tank_count', 'fuel_tank_type', 'last_fuel_update');

-- Check fuel slip new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fuel_slip' 
AND column_name IN ('virtual_consumption', 'user_consumption', 'is_full_tank', 'previous_odometer', 'distance_travelled', 'fuel_efficiency', 'tank_fill_percentage', 'consumption_calculated');

-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('vehicle_fuel_summary', 'vehicle_fuel_status', 'vehicle_consumption_settings', 'fuel_consumption_audit')
AND table_schema = 'public';

-- Check views exist
SELECT viewname 
FROM pg_views 
WHERE viewname IN ('vehicle_fuel_status_view', 'vehicle_fuel_consumption_view', 'vehicle_fuel_summary_view');

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_update_vehicle_fuel_status', 'trigger_update_vehicle_consumption');

COMMIT;

-- ============================================================
-- SCRIPT COMPLETE
-- ============================================================
-- Run this entire script in your UAT database
-- It includes all changes in a single transaction
-- ============================================================