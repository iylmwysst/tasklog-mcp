# Validation Annotation Form (ฉบับภาษาไทย)

## จุดประสงค์

เอกสารนี้กำหนดรูปแบบคำตอบมาตรฐานสำหรับการศึกษา interrupted coding work taxonomy

form เดียวกันนี้ควรใช้ทั้ง:

- `human annotators`
- `LLM annotators`

การใช้ form เดียวกันช่วยให้เทียบได้ง่ายขึ้นระหว่าง:

- human-human agreement
- model-model agreement
- human-model disagreement

---

## กติกาการตอบ

สำหรับแต่ละ episode:

- ให้เลือก `interruption class` เพียง `หนึ่ง` ค่า
- ให้เลือก `dominant loss class` เพียง `หนึ่ง` ค่า
- ให้ระบุว่าเคสนี้ `boundary-ambiguous` หรือไม่
- ถ้าก้ำกึ่ง ให้ระบุ `nearest_alternative_class`
- ให้เขียน `justification` สั้น ๆ แบบอิงโครงสร้าง

ให้ classify episode ตามที่เขียนไว้
อย่า invent context เพิ่มหรือแก้ scenario เอง

---

## Canonical Fields

ในแต่ละ annotation record ควรมี:

- `episode_id`
- `annotator_id`
- `annotator_tier`
- `annotator_family`
- `interruption_class`
- `dominant_loss_class`
- `boundary_ambiguous`
- `nearest_alternative_class`
- `justification`
- `confidence`
- `notes`

---

## คำอธิบายแต่ละ Field

### `episode_id`

รหัส episode ตาม authoring protocol เช่น:

- `E-CON-03`
- `E-PUB-07v2`
- `E-SWE-05`

### `annotator_id`

รหัสประจำ annotator

ตัวอย่าง:

- `HUM-01`
- `HUM-02`
- `LLM-CLAUDE`
- `LLM-GPT`
- `LLM-GEMINI`

### `annotator_tier`

ค่าที่อนุญาต:

- `human`
- `llm`

### `annotator_family`

label ที่ใช้บอก family ของคนหรือโมเดลเพื่อการวิเคราะห์

ตัวอย่าง:

- `human`
- `gpt`
- `claude`
- `gemini`

### `interruption_class`

ค่าที่อนุญาต:

- `session_cutoff`
- `task_switch`
- `blocked_waiting`
- `environment_drift`
- `failure_boundary`
- `handoff`
- `multi_open_work_conflict`
- `false_done`
- `dirty_done`

### `dominant_loss_class`

ค่าที่อนุญาต:

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

### `boundary_ambiguous`

ค่าที่อนุญาต:

- `yes`
- `no`

ใช้ `yes` เมื่อ nearest alternative ยัง plausible จริงหลังจากใช้ codebook แล้ว

### `nearest_alternative_class`

ให้ใส่ dominant loss class ที่เป็นคู่แข่งใกล้ที่สุด

ค่าที่อนุญาต:

- หนึ่งในห้า dominant loss classes
- `none`

ถ้า `boundary_ambiguous = no` ให้ใช้ `none` เว้นแต่ภายหลัง study จะอยากเก็บ rival-class notes แม้ในเคสที่มั่นใจ

### `justification`

คำอธิบายเชิงโครงสร้างสั้น ๆ `1–3` ประโยค

ตัวอย่างที่ดี:

> งานชัดและ governing state ก็พอมองเห็นได้ แต่ episode นี้ยังไม่ establish ว่าตอนนี้ควรทำต่อเลยหรือควรรอ approval ดังนั้น object แรกที่ยังไม่ resolve คือ readiness

ตัวอย่างที่ไม่ดี:

> รู้สึกว่าเป็น readiness

### `confidence`

ค่าที่แนะนำ:

- `high`
- `medium`
- `low`

field นี้ optional สำหรับ paper แรก แต่มีประโยชน์ตอนวิเคราะห์ disagreement

### `notes`

field free-text แบบ optional สำหรับคอมเมนต์สั้น ๆ

ใช้สำหรับ:

- ข้อกังวลเรื่อง wording
- ข้อกังวลเรื่องข้อมูลไม่พอ
- ambiguity ที่อยาก note เพิ่มจาก justification หลัก

อย่าใช้ field นี้แทน justification

---

## Markdown Form

ถ้าเป็น human annotation แบบง่ายที่สุด ให้ใช้รูปแบบนี้:

```md
Episode ID: E-CON-03
Annotator ID: HUM-01
Annotator Tier: human
Annotator Family: human

Interruption Class: blocked_waiting
Dominant Loss Class: readiness_loss
Boundary-Ambiguous: no
Nearest Alternative Class: none
Confidence: high

Justification:
งานและ governing state ชัด แต่ episode นี้ยังไม่ justify ว่าควรลงมือทำต่อ เพราะ approval ที่จำเป็นยังไม่มา ดังนั้น object ที่ยังไม่ resolve คือ valid present mode ไม่ใช่ next concrete implementation step

Notes:
None.
```

---

## JSON Form

ถ้าเป็น LLM annotation หรือจะ export เข้า spreadsheet ให้ใช้ structured form แบบนี้:

```json
{
  "episode_id": "E-CON-03",
  "annotator_id": "LLM-GPT",
  "annotator_tier": "llm",
  "annotator_family": "gpt",
  "interruption_class": "blocked_waiting",
  "dominant_loss_class": "readiness_loss",
  "boundary_ambiguous": "no",
  "nearest_alternative_class": "none",
  "confidence": "high",
  "justification": "งานและ governing state ชัด แต่ episode นี้ยังไม่ justify ว่าควรลงมือทำต่อ เพราะ approval ที่จำเป็นยังไม่มา ดังนั้น object ที่ยังไม่ resolve คือ valid present mode ไม่ใช่ next concrete implementation step",
  "notes": ""
}
```

---

## Minimal Validation Rules

submission จะถือว่า valid ก็ต่อเมื่อ:

- มี `episode_id`
- `interruption_class` เป็นหนึ่งในเก้าค่าที่อนุญาต
- `dominant_loss_class` เป็นหนึ่งในห้าค่าที่อนุญาต
- กรอก `boundary_ambiguous`
- กรอก `nearest_alternative_class`
- `justification` ไม่ว่าง

สำหรับ pilot แค่นี้พอ
field เพิ่มเติมค่อยใส่ทีหลังได้ถ้าชั้น analysis ต้องการ

---

## คำแนะนำสำหรับรอบ Pilot

สำหรับ pilot แรก:

- ทำ form ให้สั้น
- ใช้แค่ canonical fields ชุดนี้
- อย่าเพิ่ม secondary ratings หรือ dimension อื่นมากเกินไป

pilot ควรทดสอบ `taxonomy usability`
ไม่ใช่ความซับซ้อนของ form
