import test from "node:test";
import assert from "node:assert/strict";

import {
  PHISHING_PAYLOAD_URL,
  getMailCtaCopyText,
  getMailCtaFailureText,
} from "./mailDefinitions.ts";

test("phishing mail keeps a copyable payload URL", () => {
  assert.equal(getMailCtaCopyText("phishing"), PHISHING_PAYLOAD_URL);
  assert.equal(getMailCtaCopyText("elevenlabs"), null);
});

test("phishing mail failure text matches the phishing variant", () => {
  assert.equal(
    getMailCtaFailureText("pool-phishing-it-123", "phishing"),
    "Nice try. That verification link was a phishing test. You failed. Access revoked."
  );
  assert.equal(
    getMailCtaFailureText("pool-phishing-lottery-456", "phishing"),
    "Nice try. That prize claim was a phishing test. You failed. Access revoked."
  );
  assert.equal(getMailCtaFailureText("manager", "elevenlabs"), null);
});
