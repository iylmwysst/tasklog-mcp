# แบบฟอร์มส่งคำตอบสำหรับ Annotator

## จุดประสงค์

template นี้คือแผ่นตอบแบบ copy-and-fill ที่ง่ายที่สุดสำหรับ annotator

ให้ใช้คู่กับ:

- [validation-pilot-episodes-th.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-pilot-episodes-th.md)
- [validation-codebook-th.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook-th.md)
- [validation-annotation-form-th.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form-th.md)

field names ด้านล่างตั้งใจให้ตรงกับ schema ของ annotation form เพื่อให้เอาผลไปเทียบกันต่อได้ง่าย

---

## วิธีใช้

- คัดลอก block ไปกรอก
- อย่าเปลี่ยนชื่อ field
- กรอกทุก field ที่จำเป็น
- ถ้า `boundary_ambiguous = no` ให้ใส่ `nearest_alternative_class = none`
- เขียน `justification` สั้น ๆ แบบอิงโครงสร้างของปัญหา

---

## Blank Template

```md
Episode ID:
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

---

## ชุดส่งคำตอบสำหรับ Pilot Pack

คัดลอก block ทั้งชุดด้านล่าง แล้วกรอกทีละ episode

```md
# Pilot Annotation Submission

Annotator ID:
Annotator Tier:
Annotator Family:

## Episode E-SWE-01
Episode ID: E-SWE-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:

## Episode E-SWE-02
Episode ID: E-SWE-02
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:

## Episode E-CON-01
Episode ID: E-CON-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:

## Episode E-CON-02
Episode ID: E-CON-02
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:

## Episode E-HIS-01
Episode ID: E-HIS-01
Annotator ID:
Annotator Tier:
Annotator Family:

Interruption Class:
Dominant Loss Class:
Boundary-Ambiguous:
Nearest Alternative Class:
Confidence:

Justification:

Notes:
```

---

## Checklist ก่อนส่ง

ก่อนส่งคำตอบ ให้เช็กว่า:

- ทุก episode มีทั้ง interruption class และ dominant loss class
- กรอก `boundary_ambiguous` ครบทุก episode
- กรอก `nearest_alternative_class` ครบทุก episode
- ทุก episode มี `justification`
