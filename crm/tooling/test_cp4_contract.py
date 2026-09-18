import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEAD = json.loads((ROOT / "crm/contracts/lead_contract.json").read_text())
PIPE = json.loads((ROOT / "crm/contracts/pipeline_contract.json").read_text())
SQL = (ROOT / "crm/pipeline/001_ow_crm_domain.sql").read_text()


class CP4ContractTests(unittest.TestCase):
    def test_public_contract_has_required_capture_fields(self):
        required = set(LEAD["required_fields"])
        self.assertTrue({
            "submission_key",
            "contact_first_name",
            "contact_email",
            "wedding_date",
            "service_interests",
            "privacy_consent",
        }.issubset(required))

    def test_server_only_fields_cannot_be_client_authority(self):
        blocked = set(LEAD["server_boundary"]["client_must_not_send"])
        self.assertTrue({"business_id", "owner_id", "lead_score", "loss_reason"}.issubset(blocked))
        self.assertTrue(LEAD["server_boundary"]["server_sets_business_id_from_configuration"])

    def test_attribution_contract_contains_no_direct_contact_pii(self):
        pii = set(LEAD["pii_fields"])
        attribution = set(LEAD["attribution_fields"])
        self.assertTrue(pii.isdisjoint(attribution))
        self.assertNotIn("contact_email", attribution)
        self.assertNotIn("contact_phone", attribution)

    def test_declared_pii_fields_exist_in_contract(self):
        fields = set(LEAD["fields"])
        self.assertTrue(set(LEAD["pii_fields"]).issubset(fields))

    def test_state_machine_targets_known_states(self):
        states = set(PIPE["states"])
        for transition in PIPE["transitions"]:
            self.assertIn(transition["from"], states)
            self.assertIn(transition["to"], states)
            self.assertTrue(transition["event"])
            self.assertTrue(transition["actors"])

    def test_terminal_and_reopenable_states_are_consistent(self):
        self.assertEqual(PIPE["terminal_states"], ["WON"])
        self.assertIn("LOST", PIPE["reopenable_states"])
        reopen = [t for t in PIPE["transitions"] if t["from"] == "LOST" and t["to"] == "CONTACTED"]
        self.assertEqual(len(reopen), 1)
        self.assertTrue(reopen[0].get("requires_human_override"))

    def test_won_requires_contract_and_deposit(self):
        won = " | ".join(PIPE["won_condition"]["all"])
        self.assertIn("contract_signed_at", won)
        self.assertIn("deposit_received_at", won)
        self.assertIn("deposit_amount_eur > 0", won)

    def test_lost_requires_taxonomy(self):
        self.assertIn("ghosted", PIPE["lost_reasons"])
        lost = [t for t in PIPE["transitions"] if t["to"] == "LOST"]
        self.assertGreaterEqual(len(lost), 9)
        self.assertTrue(all("loss_reason present" in t["preconditions"] for t in lost))

    def test_ddl_uses_isolated_weddings_domain(self):
        self.assertIn("create table if not exists public.ow_leads", SQL.lower())
        self.assertNotIn("create table if not exists public.leads", SQL.lower())
        self.assertNotIn("alter table public.leads", SQL.lower())
        self.assertIn("service_interests <@ array['photo','video','photo_video','post_wedding','pre_wedding','other']::text[]", SQL.lower())

    def test_ddl_has_idempotency_and_rls(self):
        lower = SQL.lower()
        self.assertIn("unique (business_id, submission_key)", lower)
        self.assertIn("unique (business_id, idempotency_key)", lower)
        for table in ("ow_leads", "ow_lead_attribution", "ow_lead_consents", "ow_lead_events"):
            self.assertIn(f"alter table public.{table} enable row level security", lower)
            self.assertIn(f"revoke all on public.{table} from anon", lower)

    def test_consent_and_events_are_append_only_for_authenticated(self):
        lower = SQL.lower()
        self.assertIn("revoke update, delete on public.ow_lead_consents from authenticated", lower)
        self.assertIn("revoke update, delete on public.ow_lead_events from authenticated", lower)

    def test_sql_does_not_apply_public_anon_insert(self):
        lower = SQL.lower()
        self.assertNotIn("grant insert on public.ow_leads to anon", lower)
        self.assertNotIn("for insert to anon", lower)


if __name__ == "__main__":
    unittest.main()
