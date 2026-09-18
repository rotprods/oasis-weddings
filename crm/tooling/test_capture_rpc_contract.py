import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL = (ROOT / "crm/pipeline/002_ow_capture_lead_rpc.sql").read_text().lower()


class CaptureRpcContractTests(unittest.TestCase):
    def test_function_is_security_definer_with_fixed_search_path(self):
        self.assertIn("security definer", SQL)
        self.assertIn("set search_path = public, pg_temp", SQL)

    def test_function_is_server_only(self):
        self.assertIn("from public;", SQL)
        self.assertIn("from anon;", SQL)
        self.assertIn("from authenticated;", SQL)
        self.assertIn("to service_role;", SQL)
        self.assertNotIn("to anon;", SQL)
        self.assertNotIn("to authenticated;", SQL)

    def test_capture_is_idempotent_on_submission_key(self):
        self.assertIn("on conflict (business_id, submission_key) do nothing", SQL)
        self.assertIn("return query select v_lead_id, false", SQL)

    def test_capture_writes_complete_atomic_bundle(self):
        for table in (
            "public.ow_leads",
            "public.ow_lead_attribution",
            "public.ow_lead_consents",
            "public.ow_lead_events",
        ):
            self.assertIn(f"insert into {table}", SQL)

    def test_capture_never_uses_legacy_b2b_leads(self):
        self.assertNotIn("insert into public.leads", SQL)
        self.assertNotIn("update public.leads", SQL)

    def test_privacy_processing_is_explicit(self):
        self.assertIn("privacy_consent_required", SQL)
        self.assertIn("'privacy_processing'", SQL)
        self.assertIn("'granted'", SQL)

    def test_business_id_is_explicit_server_parameter(self):
        self.assertIn("p_business_id uuid", SQL)
        self.assertIn("business_id_required", SQL)

    def test_attribution_has_no_contact_pii_columns(self):
        attribution_block = SQL.split("insert into public.ow_lead_attribution", 1)[1].split(");", 1)[0]
        self.assertNotIn("contact_email", attribution_block)
        self.assertNotIn("contact_phone", attribution_block)
        self.assertNotIn("contact_first_name", attribution_block)


if __name__ == "__main__":
    unittest.main()
