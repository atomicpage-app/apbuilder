CREATE OR REPLACE FUNCTION change_account_status(
  p_account_id UUID,
  p_from_status account_status,
  p_to_status account_status,
  p_reason TEXT,
  p_actor_type TEXT,
  p_actor_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE accounts
  SET status = p_to_status
  WHERE id = p_account_id
    AND status = p_from_status;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Status changed concurrently or account missing';
  END IF;

  INSERT INTO account_status_events (
    account_id,
    from_status,
    to_status,
    reason,
    actor_type,
    actor_id
  ) VALUES (
    p_account_id,
    p_from_status,
    p_to_status,
    p_reason,
    p_actor_type,
    p_actor_id
  );
END;
$$;
