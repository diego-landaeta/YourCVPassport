-- Update display settings to show connect links by default
-- Remove QR code option (no longer used)

-- Set show_connect_links to true for all existing profiles where it's NULL or false
UPDATE public.profiles
SET show_connect_links = true
WHERE show_connect_links IS NULL OR show_connect_links = false;

-- Set default value for new profiles
ALTER TABLE public.profiles
ALTER COLUMN show_connect_links SET DEFAULT true;

-- Note: show_qr_code column can remain in the table for backward compatibility
-- but it's no longer used in the application
