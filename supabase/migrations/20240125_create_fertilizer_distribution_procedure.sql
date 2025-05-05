-- Create a function to handle fertilizer distribution transaction
CREATE OR REPLACE FUNCTION public.create_fertilizer_distribution(
  p_farmer_id UUID,
  p_coordinator_id UUID,
  p_fertilizer_id UUID,
  p_quantity DECIMAL,
  p_quantity_unit TEXT,
  p_status TEXT DEFAULT 'pending'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fertilizer_quantity DECIMAL;
  v_new_quantity DECIMAL;
  v_new_status TEXT;
  v_distribution_record json;
BEGIN
  -- Start transaction
  BEGIN;
    -- Get current fertilizer quantity
    SELECT quantity INTO v_fertilizer_quantity
    FROM public.fertilizers
    WHERE id = p_fertilizer_id
    FOR UPDATE;

    -- Check if there's enough quantity
    IF v_fertilizer_quantity < p_quantity THEN
      RAISE EXCEPTION 'Insufficient fertilizer quantity available';
    END IF;

    -- Calculate new quantity and status
    v_new_quantity := v_fertilizer_quantity - p_quantity;
    v_new_status := CASE WHEN v_new_quantity <= 0 THEN 'depleted' ELSE 'available' END;

    -- Update fertilizer quantity
    UPDATE public.fertilizers
    SET quantity = v_new_quantity,
        status = v_new_status
    WHERE id = p_fertilizer_id;

    -- Create distribution record
    INSERT INTO public.fertilizer_distributions (
      farmer_id,
      coordinator_id,
      fertilizer_id,
      quantity,
      quantity_unit,
      status
    ) VALUES (
      p_farmer_id,
      p_coordinator_id,
      p_fertilizer_id,
      p_quantity,
      p_quantity_unit,
      p_status
    ) RETURNING to_json(fertilizer_distributions.*) INTO v_distribution_record;

    -- Commit transaction
    COMMIT;

    RETURN v_distribution_record;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction on error
    ROLLBACK;
    RAISE;
END;
$$;