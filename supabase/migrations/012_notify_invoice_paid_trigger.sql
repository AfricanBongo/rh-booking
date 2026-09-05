CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_user_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, stripe, extensions
AS $$
DECLARE
  v_project_url text;
  v_service_key text;
  v_booking_id text;
  v_amount bigint;
  v_type text;
BEGIN
  IF NEW.status != 'paid' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'paid' THEN
    RETURN NEW;
  END IF;

  IF NEW.metadata IS NULL THEN
    RETURN NEW;
  END IF;

  v_type := NEW.metadata->>'type';
  IF v_type != 'room_payment' THEN
    RETURN NEW;
  END IF;

  v_booking_id := NEW.metadata->>'booking_id';
  v_amount := NEW.total;

  IF v_booking_id IS NULL OR v_amount IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO v_project_url
    FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  IF v_project_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[notify_user_invoice_paid] Vault secrets not configured, skipping notification';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_project_url || '/functions/v1/notify-invoice-paid',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'invoice_id', NEW.id,
      'booking_id', v_booking_id,
      'amount', v_amount,
      'type', v_type
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify_user_invoice_paid] Error: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_invoice_paid_notify_user ON stripe.invoices;

CREATE TRIGGER on_invoice_paid_notify_user
  AFTER INSERT OR UPDATE ON stripe.invoices
  FOR EACH ROW
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION notify_user_invoice_paid();
