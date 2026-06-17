# รายงานตรวจสอบ Traceability สำหรับ Validation 30 Episodes

## สรุปสั้น

คำตอบสั้นคือ: `ทุก episode มีร่องรอยย้อนกลับได้` แต่ `ไม่ได้อยู่ในระดับเดียวกันทุกอัน`

การตรวจครั้งนี้แยกได้เป็น 3 ระดับ:

- `direct_local`: ย้อนกลับไปยังไฟล์หรือ workdoc ภายใน workspace ได้ตรง ๆ
- `direct_external`: ย้อนกลับไปยัง public GitHub issue URL ได้ตรง ๆ
- `ledger_only_pattern`: ย้อนกลับได้ถึง provenance ledger หรือ authoring ledger แต่ไม่ได้อ้างว่าเกิดจาก raw source ชิ้นเดียวแบบ one-to-one

จำนวนรวม:

- `direct_local`: `13`
- `direct_external`: `6`
- `ledger_only_pattern`: `11`

ดังนั้นถ้าถามว่า `หา source ได้ทุกอันไหม` คำตอบคือ:

- `ได้ทุกอัน` ในความหมายว่าแต่ละ episode มี provenance surface ให้ตามกลับ
- `ไม่ได้ทุกอัน` ในความหมายว่าไม่ใช่ทุก episode จะมี raw source object แบบเฉพาะเจาะจงหนึ่งชิ้น

constructed episodes และบาง historical pilot cases ถูกออกแบบมาให้เป็น `authored-from-pattern` ตั้งแต่ต้น ไม่ใช่ `verbatim extraction`

---

## วิธีตรวจ

ผมตรวจจาก:

- `docs/validation-30-episode-hidden-ledger.md`
- `docs/validation-pilot-provenance-ledger.md`
- `docs/validation-30-episode-wave-1-ledger.md`
- `docs/validation-30-episode-wave-2-ledger.md`
- `docs/tasklog-v4-1-dev-annotation-family-briefs.md`
- `docs/tasklog-v4-family-allocation-table.json`
- `docs/tasklog-v4-1-dev-source-pool-manifest.json`
- `workdocs/je0AuN-advance-tasklog-as-an-open-source-tool/spec.md`
- `workdocs/lImttL-add-closed-work-re-entry-summaries-to-tasklog/spec.md`
- `workdocs/EzrPj7-smoke-test-resumptive-state-mcp-surface/summary.md`

และตรวจ public issue refs เพิ่มจาก GitHub:

- OpenHands issue `#4677`
- OpenHands issue `#12170`
- OpenHands issue `#11188`
- OpenHands issue `#11432`
- SWE-agent issue `#1247`
- SWE-agent issue `#1051`

---

## ตารางผลตรวจ

| Episode ID | Source Type | ระดับการ trace | ผลตรวจ | หมายเหตุ |
| --- | --- | --- | --- | --- |
| `E-SWE-01` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `authoritative_log_overrides_note` → `v4-1-dev-001` |
| `E-SWE-02` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-annotation-family-briefs.md` → `blocked_work_requires_escalation` → `v4-1-dev-005` |
| `E-CON-01` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | ย้อนกลับได้ถึง pilot provenance ledger แต่ไม่ได้อ้าง raw source ชิ้นเดียว |
| `E-CON-02` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | ย้อนกลับได้ถึง pilot provenance ledger |
| `E-HIS-01` | `historical_internal` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | มี provenance entry ชัด แต่ไม่ผูกกับไฟล์ internal ชิ้นเดียว |
| `E-CON-03` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-04` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-05` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-06` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-07` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-08` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-09` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-CON-10` | `constructed` | `ledger_only_pattern` | ผ่านแบบ pattern-grounded | อยู่ใน wave 1 ledger |
| `E-SWE-03` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-family-allocation-table.json` → `v4-002` |
| `E-SWE-07` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-family-allocation-table.json` → `v4-009` |
| `E-HIS-02` | `historical_internal` | `direct_local` | ผ่าน | ชี้ไปที่ `workdocs/je0AuN-advance-tasklog-as-an-open-source-tool/spec.md` |
| `E-HIS-03` | `historical_internal` | `direct_local` | ผ่าน | ชี้ไปที่ `workdocs/lImttL-add-closed-work-re-entry-summaries-to-tasklog/spec.md` และ `je0AuN` workdocs |
| `E-HIS-04` | `historical_internal` | `direct_local` | ผ่าน | ชี้ไปที่ `workdocs/EzrPj7-smoke-test-resumptive-state-mcp-surface/summary.md` |
| `E-PUB-01` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ OpenHands issue `#4677` |
| `E-PUB-02` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ OpenHands issue `#12170` |
| `E-PUB-03` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ OpenHands issue `#11188` |
| `E-PUB-04` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ OpenHands issue `#11432` |
| `E-PUB-05` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ SWE-agent issue `#1247` |
| `E-PUB-06` | `public_grounded` | `direct_external` | ผ่าน | ชี้ไปที่ SWE-agent issue `#1051` |
| `E-SWE-04` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec` |
| `E-SWE-05` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-log-parser-python` |
| `E-SWE-06` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-family-allocation-table.json` → `v4-007` |
| `E-SWE-08` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-modal-run-evaluation` |
| `E-SWE-09` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-family-allocation-table.json` → `v4-021` |
| `E-SWE-10` | `repo_grounded` | `direct_local` | ผ่าน | ชี้ไปที่ `docs/tasklog-v4-1-dev-source-pool-manifest.json` → `swebench-harness-test-spec-javascript` |

---

## ข้อสรุปเชิงใช้งาน

ถ้าจะตอบแบบตรงและปลอดภัย:

1. ทุก episode มีที่มาที่ตามกลับได้
2. แต่ไม่ใช่ทุก episode มี raw source object แบบหนึ่งต่อหนึ่ง
3. กลุ่มที่ trace ได้แน่นที่สุดคือ `repo_grounded`, `public_grounded`, และ `historical_internal` wave 2
4. กลุ่ม `constructed` ทั้งหมด และ `E-HIS-01` เป็น pattern-grounded โดยตั้งใจ และควรอธิบายแบบนั้นเสมอ

---

## จุดที่ควรพูดให้ชัดเวลานำเสนอ

- อย่าพูดว่า constructed episodes “มาจาก issue/file ชิ้นใดชิ้นหนึ่งโดยตรง”
- ให้พูดว่า episodes เหล่านี้ “authored from repeated documented patterns and recorded in hidden provenance ledgers”
- public-grounded episodes trace กลับไปยัง issue URL ได้ แต่ episode text เป็น `abstracted scenario` ไม่ใช่การคัด verbatim จาก issue
- repo-grounded episodes trace กลับไปยัง local docs/JSON ids ได้ตรงกว่า และเป็นกลุ่มที่ strongest traceability

---

## ลิงก์อ้างอิงภายนอกที่ตรวจแล้ว

- `E-PUB-01`: `https://github.com/OpenHands/OpenHands/issues/4677`
- `E-PUB-02`: `https://github.com/OpenHands/OpenHands/issues/12170`
- `E-PUB-03`: `https://github.com/OpenHands/OpenHands/issues/11188`
- `E-PUB-04`: `https://github.com/OpenHands/OpenHands/issues/11432`
- `E-PUB-05`: `https://github.com/SWE-agent/SWE-agent/issues/1247`
- `E-PUB-06`: `https://github.com/SWE-agent/SWE-agent/issues/1051`
