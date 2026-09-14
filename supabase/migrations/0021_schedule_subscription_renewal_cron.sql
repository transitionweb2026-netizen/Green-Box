-- Phase 2: schedule the daily subscription-renewal batch job.
-- 06:00 UTC (~08:00-09:00 Cairo time) is a technical scheduling default,
-- not a business rule -- easy to change with `select cron.alter_job(...)`
-- or by unscheduling and re-running this statement with a new expression.
-- generate_subscription_orders() itself has no execute grant for anon/
-- authenticated (see migration 0020); only pg_cron (running as the
-- postgres role that owns the job) can invoke it this way.
create extension if not exists pg_cron;

select cron.schedule('generate-subscription-orders', '0 6 * * *', $$select public.generate_subscription_orders();$$);
