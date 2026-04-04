-- Update subscription plan prices from USD to INR
-- Also adds a currency column to make the denomination explicit.

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';

-- Update Contributor (free tier stays ₹0)
UPDATE public.subscription_plans
SET
  price_monthly = 0,
  price_annual  = 0,
  currency      = 'INR'
WHERE name = 'Contributor';

-- Update Professional (was $29/mo, $261/yr → ₹299/mo, ₹999/yr)
UPDATE public.subscription_plans
SET
  price_monthly = 299,
  price_annual  = 999,
  currency      = 'INR'
WHERE name = 'Professional';

-- Update Elite (was $89/mo, $801/yr → ₹7499/mo, ₹66999/yr)
UPDATE public.subscription_plans
SET
  price_monthly = 699,
  price_annual  = 1599,
  currency      = 'INR'
WHERE name = 'Elite';
