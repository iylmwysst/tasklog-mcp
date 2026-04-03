# ชุดเอกสารสำหรับ Annotator: Pilot Validation ของ Taxonomy งานขัดจังหวะของ Coding Agent

## จุดประสงค์

เอกสารชุดนี้ใช้สำหรับการ annotate pilot ชุดแรกของ taxonomy ว่าด้วย `interrupted coding work`

เป้าหมายของรอบนี้ไม่ใช่การวัดว่าโมเดลหรือระบบไหนเก่งกว่าใคร แต่คือการดูว่า:

- ตัว taxonomy ใช้ classify episode ได้จริงไหม
- ขอบเขตของแต่ละ class ชัดพอหรือยัง
- episode wording ทำให้เข้าใจตรงกันหรือยัง

---

## ให้ใช้เอกสารอะไรบ้าง

ให้ใช้เอกสารชุดนี้:

- [validation-pilot-episodes.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-episodes.md)
- [validation-codebook.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook.md)
- [validation-annotation-form.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form.md)

สรุปไทยของประโยคที่เราจะส่งให้ annotator คือ:

- ใช้ [validation-pilot-episodes.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-episodes.md)
- คู่กับ [validation-codebook.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook.md) และ [validation-annotation-form.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form.md)

ห้ามใช้เอกสารนี้ระหว่าง annotate:

- [validation-pilot-provenance-ledger.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-provenance-ledger.md)

เหตุผล:

- provenance ledger มีข้อมูลที่ผู้วิจัยใช้ตรวจสอบย้อนกลับ
- มี source pointer และ expected labels
- ถ้า annotator เห็น จะทำให้การ annotate ไม่เป็นอิสระ

---

## ลำดับการอ่านที่แนะนำ

1. อ่าน [validation-codebook.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook.md) ก่อน
2. ดูรูปแบบคำตอบใน [validation-annotation-form.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form.md)
3. จากนั้นค่อยเปิด [validation-pilot-episodes.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-episodes.md) แล้ว annotate ทีละ episode

---

## Annotator ต้องตอบอะไร

สำหรับแต่ละ episode ให้ตอบ 5 อย่างหลัก:

1. `interruption class`
2. `dominant loss class`
3. `boundary_ambiguous` ว่าเคสนี้ก้ำกึ่งไหม
4. `nearest_alternative_class` ถ้ามี class ที่เฉียดกันมากที่สุด
5. `justification` สั้น ๆ ว่าทำไมถึงให้ label แบบนั้น

ถ้าจะใส่เพิ่มก็มี:

- `confidence`
- `notes`

---

## วิธีคิดตอน annotate

ให้ใช้หลักเดียวกับ codebook:

### ขั้นที่ 1

ถามก่อนว่า:

> boundary ของเคสนี้คืออะไร

แล้วเลือก `interruption class`

### ขั้นที่ 2

ถามต่อว่า object ไหนเป็นตัวแรกที่ยัง resolve ไม่ได้:

1. งานไหนคือ current work
2. record ไหนควรเป็นตัว govern
3. ตอนนี้ควร act / ask / wait / escalate / abstain
4. ถ้าควร act แล้ว next step จริง ๆ คืออะไร
5. งานนี้ done แล้วจริงหรือยัง

แล้วเลือก `dominant loss class` ที่เป็นตัวแรกสุดใน chain นี้ที่ยังพังอยู่

### ขั้นที่ 3

ดูว่ามี class รองที่สูสีกันไหม

ถ้ามี ให้ mark `boundary_ambiguous: yes`

---

## ข้อสำคัญระหว่าง annotate

- ให้ classify จาก `episode as written`
- อย่าเดา fact เพิ่มจากสิ่งที่ไม่ได้เขียน
- อย่าพยายาม “ช่วยผู้วิจัย” โดยเดาว่าเขาต้องการคำตอบอะไร
- ถ้าเคสก้ำกึ่งจริง ให้ตอบแบบก้ำกึ่งได้
- ambiguity ไม่ใช่ความผิดของ annotator

---

## เรื่องการใช้ LLM ช่วย

ใช้ LLM ได้เฉพาะเพื่อ `ทำความเข้าใจ codebook ก่อนเริ่ม annotate`

ห้ามใช้ LLM ระหว่างตัดสิน label ของ episode จริง เช่น:

- ห้ามถามว่าเคสนี้ควรเป็น class อะไร
- ห้ามให้ LLM ช่วย compare alternatives ต่อ episode

ถ้าจะรักษาให้รอบนี้ยังนับเป็น `human annotation` จริง การตัดสินตอน annotate ต้องเป็นการตัดสินของ annotator เอง

---

## รูปแบบคำตอบที่แนะนำ

ใช้รูปแบบนี้ต่อ 1 episode:

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
งานและ governing state ชัด แต่ยังไม่มี approval ที่จำเป็น จึงยังไม่ควรลงมือทำต่อ ปัญหาหลักจึงอยู่ที่ action mode ไม่ใช่ next concrete edit

Notes:
None.
```

ถ้าต้องการ ให้ยึด field names ตาม [validation-annotation-form.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form.md) ตรง ๆ

---

## เป้าหมายของรอบ Pilot นี้

รอบนี้เราอยากรู้ว่า:

- codebook ใช้งานได้ไหม
- episode descriptions ชัดพอไหม
- class boundary คู่ไหนยังสับสน

ดังนั้นไม่จำเป็นที่ทุกเคสต้อง “ตอบตรงกันหมด”

ถ้ามีบางเคสก้ำกึ่ง นั่นเป็นผลลัพธ์ที่มีค่าต่อการปรับ taxonomy

---

## เอกสารที่ใช้จริง

- Episodes: [validation-pilot-episodes.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-episodes.md)
- Codebook: [validation-codebook.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook.md)
- Annotation form: [validation-annotation-form.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form.md)

ถ้าจะส่ง annotator แบบเปิดไฟล์เดียวก่อน ให้เปิดไฟล์นี้เป็นหน้าแรก แล้วค่อยไล่ไปตามลิงก์ด้านบน
