-- 0013's `revoke ... from public` did not actually remove anon/
-- authenticated's access: this project has a default-privileges rule
-- granting EXECUTE on new functions directly to anon and authenticated
-- (the function-level analog of the table-level default documented in
-- 0010_privilege_lockdown.sql), which stands independently of the PUBLIC
-- pseudo-role grant. Confirmed via information_schema.routine_privileges
-- after 0013 -- anon/authenticated retained EXECUTE despite the revoke.
-- Revoking directly from the named roles (not just public) here, and
-- fixing the default going forward so this can't recur silently for
-- future functions.

revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_user_email_change() from anon, authenticated;
revoke execute on function public.prevent_role_self_change() from anon, authenticated;
revoke execute on function public.enforce_single_default_address() from anon, authenticated;
revoke execute on function public.enforce_box_items_types() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;

revoke execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer) from anon, authenticated;
revoke execute on function public.update_order_status(uuid, text, text) from anon, authenticated;
revoke execute on function public.record_payment_verification(uuid, text, text) from anon, authenticated;
grant execute on function public.create_order(uuid, uuid, uuid, uuid, text, integer) to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.record_payment_verification(uuid, text, text) to authenticated;

-- is_admin/normalize_arabic/search_products/search_suggestions are meant
-- to stay exactly as granted (anon+authenticated) -- re-stating explicitly
-- rather than assuming, since the previous migration's revoke-from-public
-- turned out not to be reliable evidence of the actual grant state.
revoke execute on function public.is_admin() from anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

revoke execute on function public.normalize_arabic(text) from anon, authenticated;
grant execute on function public.normalize_arabic(text) to anon, authenticated;

revoke execute on function public.search_products(text, uuid, integer) from anon, authenticated;
grant execute on function public.search_products(text, uuid, integer) to anon, authenticated;

revoke execute on function public.search_suggestions(text, integer) from anon, authenticated;
grant execute on function public.search_suggestions(text, integer) to anon, authenticated;

-- Prevent this from recurring for any function created after this
-- migration: without this, Supabase's project-level default privileges
-- would keep auto-granting EXECUTE on every new function to anon/
-- authenticated regardless of what each migration explicitly grants.
alter default privileges in schema public revoke execute on functions from anon, authenticated;
