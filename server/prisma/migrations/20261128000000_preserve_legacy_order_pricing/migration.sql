BEGIN;

-- This is the first Lab 7 rollout. All orders present before new checkout
-- code is enabled were created using the legacy pricing policy.
ALTER TABLE "Order" ADD COLUMN "usesLab7Pricing" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Order"
SET "subtotal" = "totalAmount", "discountAmount" = 0.00, "shippingFee" = 0.00;

-- An old application can still write after the migration or after rollback.
-- It omits the policy flag and therefore receives the legacy breakdown.
CREATE FUNCTION techtent_set_legacy_order_pricing() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT NEW."usesLab7Pricing" THEN
    NEW."subtotal" := NEW."totalAmount";
    NEW."discountAmount" := 0.00;
    NEW."shippingFee" := 0.00;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER techtent_set_legacy_order_pricing
BEFORE INSERT ON "Order"
FOR EACH ROW EXECUTE FUNCTION techtent_set_legacy_order_pricing();

COMMIT;
