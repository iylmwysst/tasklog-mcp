# ชุดตั้งค่า Google Form สำหรับ Validation 30 Episodes

## จุดประสงค์

ใช้ไฟล์นี้สำหรับสร้าง Google Form ฝั่ง annotator สำหรับรอบ validation เต็ม `30` episodes

ไฟล์นี้ทำมาเพื่อลด wording drift ระหว่าง packet ต้นทางกับฟอร์มจริง

ให้ใช้คู่กับ:

- `docs/validation-30-episode-send-pack.md`
- `docs/validation-codebook-th.md`
- `docs/validation-annotation-form-th.md`

ห้ามใช้:

- `docs/validation-30-episode-hidden-ledger.md`
- expected labels
- provenance notes ฝั่ง research

---

## ชื่อฟอร์มที่แนะนำ

`Interrupted Coding Work Taxonomy: 30-Episode Validation Round`

ถ้าต้องการชื่อภาษาไทย:

`แบบฟอร์ม Annotate: Interrupted Coding Work Taxonomy (30 Episodes)`

## คำอธิบายฟอร์มที่แนะนำ

ให้ใช้ codebook และข้อความ episode ตามที่จัดไว้เท่านั้น

สำหรับแต่ละ episode:

- เลือก `interruption_class` หนึ่งค่า
- เลือก `dominant_loss_class` หนึ่งค่า
- เลือก `boundary_ambiguous` หนึ่งค่า
- เลือก `nearest_alternative_class` หนึ่งค่า
- เขียน `justification` แบบสั้นและอิงโครงสร้าง

ให้ classify episode ตามที่เขียนไว้
ห้ามใช้ hidden notes, outside provenance, expected labels, หรือ LLM ช่วยตัดสิน label ระหว่างการ annotate

ถ้า `boundary_ambiguous = no` ให้เลือก `nearest_alternative_class = none`

---

## การตั้งค่า Form ที่แนะนำ

- Collect email addresses: ปิด เว้นแต่ต้องการผูกตัวตนผ่าน Google
- Limit to 1 response: เปิด ถ้าต้องการให้ annotator ส่งได้ครั้งเดียว
- Edit after submit: ปิด
- See summary charts and text responses: ปิด
- Shuffle question order: ปิด
- Shuffle option order: ปิด
- Show progress bar: เปิด
- Confirm before submit: เปิด

---

## Section 1: ข้อมูล Annotator

ชื่อ section:
`ข้อมูล Annotator`

คำอธิบาย section:
`กรอกส่วนนี้หนึ่งครั้งก่อนเริ่มตอบ episode ทั้ง 30 ตอน`

คำถาม:

1. Short answer, required
   Title: `annotator_id`
   Help text: `ตัวอย่าง: HUM-01`

2. Multiple choice, required
   Title: `annotator_tier`
   Options:
   - `human`
   - `llm`

3. Short answer, required
   Title: `annotator_family`
   Help text: `ตัวอย่าง: human, gpt, claude, gemini`

---

## ชุดตัวเลือกมาตรฐาน

ให้ใช้ค่าเหล่านี้แบบตรงตัวทุก section

`interruption_class`

- `session_cutoff`
- `task_switch`
- `blocked_waiting`
- `environment_drift`
- `failure_boundary`
- `handoff`
- `multi_open_work_conflict`
- `false_done`
- `dirty_done`

`dominant_loss_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

`boundary_ambiguous`

- `yes`
- `no`

`nearest_alternative_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`
- `none`

`confidence`

- `high`
- `medium`
- `low`

---

## Template ต่อ 1 Episode

สำหรับแต่ละ episode ให้สร้าง 1 section ใหม่

ให้นำข้อความ episode ไปใส่ใน `section description`
ไม่ต้องแยกเป็นคำถามอีกข้อ

ให้คัดข้อความ episode แบบตรงตัวจาก `docs/validation-30-episode-send-pack.md`
อย่า paraphrase หรือย่อ scenario ระหว่างนำลงฟอร์ม

ภายในแต่ละ section ให้สร้างคำถามตามลำดับนี้:

1. Multiple choice, required
   Title: `[EPISODE_ID] interruption_class`
   Options: ใช้ชุด `interruption_class`

2. Multiple choice, required
   Title: `[EPISODE_ID] dominant_loss_class`
   Options: ใช้ชุด `dominant_loss_class`

3. Multiple choice, required
   Title: `[EPISODE_ID] boundary_ambiguous`
   Options:
   - `yes`
   - `no`

4. Multiple choice, required
   Title: `[EPISODE_ID] nearest_alternative_class`
   Options: ใช้ชุด `nearest_alternative_class`
   Help text: `ถ้า boundary_ambiguous = no ให้เลือก none`

5. Multiple choice, optional
   Title: `[EPISODE_ID] confidence`
   Options:
   - `high`
   - `medium`
   - `low`

6. Paragraph, required
   Title: `[EPISODE_ID] justification`
   Help text: `เขียนสั้น ๆ แบบอิงโครงสร้าง โดยโฟกัสที่ earliest unresolved object`

7. Paragraph, optional
   Title: `[EPISODE_ID] notes`
   Help text: `ใช้เมื่อมีข้อสังเกตเรื่อง wording หรือ ambiguity ที่ยังไม่ได้อธิบายใน justification`

---

## ลำดับ Episode ที่ต้องเรียงตามนี้

1. `Episode E-SWE-01`
2. `Episode E-SWE-02`
3. `Episode E-CON-01`
4. `Episode E-CON-02`
5. `Episode E-HIS-01`
6. `Episode E-CON-03`
7. `Episode E-CON-04`
8. `Episode E-CON-05`
9. `Episode E-CON-06`
10. `Episode E-CON-07`
11. `Episode E-CON-08`
12. `Episode E-CON-09`
13. `Episode E-CON-10`
14. `Episode E-SWE-03`
15. `Episode E-SWE-07`
16. `Episode E-HIS-02`
17. `Episode E-HIS-03`
18. `Episode E-HIS-04`
19. `Episode E-PUB-01`
20. `Episode E-PUB-02`
21. `Episode E-PUB-03`
22. `Episode E-PUB-04`
23. `Episode E-PUB-05`
24. `Episode E-PUB-06`
25. `Episode E-SWE-04`
26. `Episode E-SWE-05`
27. `Episode E-SWE-06`
28. `Episode E-SWE-08`
29. `Episode E-SWE-09`
30. `Episode E-SWE-10`

---

## Checklist ตอนสร้างฟอร์ม

- ใช้ชื่อฟอร์มและคำอธิบายตามด้านบน
- สร้าง section `ข้อมูล Annotator` ก่อน
- สร้าง episode sections ให้ครบ `30`
- วางลำดับ episode ให้ตรงตามรายการด้านบน
- คัดข้อความ episode แต่ละตอนจาก send pack แบบตรงตัว
- ใช้ option banks เดิมทุก section
- ตั้งชื่อคำถามให้ขึ้นต้นด้วย `[EPISODE_ID]` เพื่อ export เข้า spreadsheet ง่าย
- ให้ `nearest_alternative_class` เป็น required
- ให้ `justification` เป็น required
- ห้ามมี hidden ledger หรือ expected labels อยู่ในฟอร์ม

---

## Final Check ก่อนส่ง

ก่อนส่งให้ annotator ให้เช็กว่า:

- ฟอร์มมี episode sections ครบ `30`
- แต่ละ episode section มีคำถามครบ `7` ข้อ
- ชื่อ section ตรงกับ episode ID ใน send pack
- section description คัดมาจาก send pack แบบไม่ paraphrase
- `nearest_alternative_class` มีตัวเลือก `none`
- ฟอร์มไม่มี hidden provenance, packet origin, หรือ expected labels
