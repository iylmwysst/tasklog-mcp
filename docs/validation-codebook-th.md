# Validation Codebook for the Interrupted Coding Work Taxonomy (ฉบับภาษาไทย)

## จุดประสงค์

codebook นี้ใช้อธิบายว่า annotator ควร classify `episode descriptions` สำหรับการศึกษา validation ของ interrupted coding work taxonomy อย่างไร

ออกแบบให้ใช้ได้ทั้ง:

- `human annotators` ในชั้น claim-bearing validation
- `LLM annotators` ในชั้น auxiliary annotation

codebook นี้ใช้กับ `episode descriptions` ที่ถูก normalize แล้ว ไม่ใช่ raw logs, raw traces, หรือ transcript เต็ม

---

## Annotator ต้องส่งอะไร

สำหรับแต่ละ episode ให้ระบุ:

1. `interruption class` หนึ่งค่า
2. `dominant loss class` หนึ่งค่า
3. `justification` สั้น ๆ
4. `boundary_ambiguous` ถ้ารู้สึกว่าเคสนี้ก้ำกึ่งจริง

ให้ classify ตาม episode ที่เขียนไว้
อย่าเติม fact ที่ไม่ได้ปรากฏใน episode

---

## Unit of Analysis

หน่วยที่เรากำลัง classify คือ:

> one resumptive decision episode at one interruption boundary

ไม่ต้อง classify ทั้งโปรเจกต์ ไม่ต้อง classify ทั้ง session history และไม่ต้องประเมินคุณภาพของระบบโดยรวม
ให้ classify เฉพาะสถานการณ์ interruption/resumption ที่ถูกอธิบายอยู่ใน episode นั้น

---

## ขั้นตอนการ Annotate

### ขั้นที่ 1: หา Interruption Boundary

ถามว่า:

> boundary event แบบไหนที่ทำให้เกิด resume point นี้

แล้วเลือก `interruption class`

### ขั้นที่ 2: หา Earliest Broken Governing Object

ถามตามลำดับนี้:

1. `Which work is truly current?`
2. `Why should this state be trusted over competing signals?`
3. `Which action mode is currently valid: act, ask, wait, escalate, or abstain?`
4. `Given the fixed action mode, what concrete next step should be taken?`
5. `Is this work actually done or still active?`

แล้ว assign `dominant loss class` ที่เป็น layer แรกสุดที่ยัง resolve ไม่ได้

### ขั้นที่ 3: เช็ก boundary ที่ใกล้กันที่สุด

ก่อน finalize ให้เทียบ class ที่เลือกกับคู่ที่สับสนง่าย:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`
- `false_done` vs `dirty_done`

ถ้ารู้สึกว่า alternative ยัง plausible พอ ๆ กัน ให้ mark ว่า `boundary-ambiguous`

### ขั้นที่ 4: เขียน Justification สั้น ๆ

justification ควรสั้นและอิงโครงสร้างของปัญหา

ตัวอย่างที่ดี:

> งานชัด แต่ records ที่มองเห็นไม่ตรงกันว่า blocked หรือไม่ blocked ดังนั้น object แรกที่ยัง resolve ไม่ได้คือ record ไหนควร govern

ตัวอย่างที่ไม่ดี:

> รู้สึกว่าเป็น authority เพราะคล้ายเคสก่อนหน้า

---

## Interruption Classes

Interruption classes ใช้อธิบาย `boundary event`
ไม่ใช่ dominant failure object

### `session_cutoff`

ใช้เมื่อ:

- session ก่อนหน้าจบลงก่อนที่ local trajectory จะถูก externalize หรือ resume อย่างสมบูรณ์
- ความยากหลักมาจากการหยุดชะงัก, terminal ปิด, context/token หมด, หรือค้างข้ามคืน

ไม่ใช้เมื่อ:

- boundary หลักคือการเปลี่ยน actor ระหว่างคนหรือโมเดล
- boundary หลักคือ environment หรือ dependency เปลี่ยน ไม่ใช่แค่ session จบ

### `task_switch`

ใช้เมื่อ:

- attention หรือ priority ถูก redirect ไปอีกงาน
- resume point ถูกกำหนดโดยการสลับไปหรือกลับจากงานอื่น

ไม่ใช้เมื่อ:

- boundary event ไม่ใช่การ redirect priority แบบตั้งใจหรือที่ระบบผลักให้เกิด
- มีหลายงานมองเห็นพร้อมกันเพียงเพราะ tracker หรือ closure state ทำให้มันเปิดค้างแบบกำกวม
  (กรณีนี้ `multi_open_work_conflict`, `false_done`, หรือ `dirty_done` อาจเหมาะกว่า)

### `blocked_waiting`

ใช้เมื่อ:

- งานยัง identifiable
- การทำต่ออย่างปลอดภัยขึ้นอยู่กับ input, approval, ownership confirmation หรือ dependency ที่ยังไม่มา

ไม่ใช้เมื่อ:

- session ก่อนหน้าจบลงตรง failed step และความไม่แน่ใจหลักคือจะ recover จาก failure นั้นยังไง

### `environment_drift`

ใช้เมื่อ:

- state ของโลกจริงเปลี่ยนระหว่างช่วงที่ถูกขัดจังหวะ
- state ที่เคยบันทึกไว้ก่อนหน้าอาจไม่น่าเชื่อถือแล้วเพราะ environment เปลี่ยน

ไม่ใช้เมื่อ:

- ปัญหาหลักเป็นแค่ session ถูกขัดจังหวะโดยไม่มี meaningful world-state change

world-state change จะถือว่า meaningful เมื่อมันสามารถทำให้ fact ที่บันทึกไว้ก่อนหน้าใช้ต่อไม่ได้ ถ้า agent ยังเชื่อตาม fact นั้นตอน resume

### `failure_boundary`

ใช้เมื่อ:

- attempt ก่อนหน้าจบลงตรง command ที่ fail, tool invocation ที่ fail, validation step ที่ fail หรือ permission boundary
- recovery mode เองเป็นส่วนหนึ่งของความยาก

ไม่ใช้เมื่อ:

- งานแค่ถูก block รอ input ภายนอก โดยไม่มี failed attempt ที่เด่นชัดเป็นจุดจบของ episode ก่อนหน้า

### `handoff`

ใช้เมื่อ:

- episode นี้ข้าม boundary ระหว่าง model, operator หรือ role
- tacit rationale หายไป แม้ durable artifacts จะยังอยู่

ไม่ใช้เมื่อ:

- interruption เป็นแค่ session จบ โดยไม่มีการเปลี่ยน actor ที่มีนัยสำคัญ

### `multi_open_work_conflict`

ใช้เมื่อ:

- มี open work candidates มากกว่าหนึ่งอันที่ยังมองเห็นอยู่
- การ triage ว่างานไหนควร current เป็นส่วนหนึ่งของ boundary event เอง

ไม่ใช้เมื่อ:

- งานชัดอยู่แล้ว แต่ประเด็นหลักคือ record ไหนควร govern งานนั้น

### `false_done`

ใช้เมื่อ:

- มีสัญญาณที่ดูเหมือนปิดงานแล้ว
- แต่จริง ๆ closure evidence ที่จำเป็นยังไม่เคยครบ

ไม่ใช้เมื่อ:

- มี completion marker ที่ valid จริง แต่ยังมี follow-up obligation ที่มองเห็นอยู่

### `dirty_done`

ใช้เมื่อ:

- มี completion marker ที่ valid จริง
- แต่ยังมี residual obligations ที่ยัง govern follow-up action

ไม่ใช้เมื่อ:

- done-state ที่เห็นไม่เคย valid ตั้งแต่แรก

---

## Dominant Loss Classes

Loss classes ใช้อธิบาย earliest unresolved governing object

### `focus_loss`

คำถามหลัก:

> Which work is truly current?

ใช้เมื่อ:

- current-work identity ยังไม่ resolve
- ระบบยังไม่สามารถตัดสินได้อย่างน่าเชื่อว่างานไหน govern resumed action

ไม่ใช้เมื่อ:

- current work ชัด แต่ยังไม่รู้ว่า record ไหน govern งานนั้น

ลักษณะที่พบบ่อย:

- มี current works ที่ plausible มากกว่าหนึ่งอัน
- closure failure ซ่อนงาน active ตัวจริง
- priority redirect ทำให้ current-work identity สั่นคลอน

### `authority_loss`

คำถามหลัก:

> Why should this state be trusted over competing signals?

ใช้เมื่อ:

- งานชัด
- มี records, cues หรือ state sources หลายตัวที่แข่งกัน
- ประเด็นที่ยัง resolve ไม่ได้คือ ตัวไหนมีสิทธิ์ govern

ไม่ใช้เมื่อ:

- ความไม่แน่ใจหลักคือควร act, wait, ask, escalate หรือ abstain

ลักษณะที่พบบ่อย:

- stale context ที่ดู rich ชนะ fresher state
- tracker ที่ structured กว่าชนกับ engineering-side state ที่ใหม่กว่า
- persisted records หลายตัวขัดกันเรื่อง blocked/active/current

### `readiness_loss`

คำถามหลัก:

> Which action mode is currently valid: act, ask, wait, escalate, or abstain?

ใช้เมื่อ:

- งานชัด
- governing record น่าเชื่อถือแล้ว
- ความไม่แน่ใจหลักคือ ตอนนี้ action ยัง permissible ไหม

ไม่ใช้เมื่อ:

- action mode ถูก fix แล้ว และเหลือแค่ next step ที่เป็นรูปธรรม

ลักษณะที่พบบ่อย:

- output ที่ถูกอาจเป็น non-action
- งานถูก block, pending review หรือรอ input
- ต้อง escalate ก่อนถึงจะทำ implementation ต่อได้

### `intent_loss`

คำถามหลัก:

> Given the fixed action mode, what concrete next step should be taken?

ใช้เมื่อ:

- action mode ถูกกำหนดแล้ว
- ความไม่แน่ใจที่เหลืออยู่คือ next-step content ที่เป็นรูปธรรม

ไม่ใช้เมื่อ:

- ปัญหาที่ลึกกว่ายังคือควร act หรือไม่

ลักษณะที่พบบ่อย:

- รู้แล้วว่าควร `act` แต่ยังไม่แน่ใจว่าควรเริ่ม edit ไหนก่อน
- มี fact เดียวที่ยังขาดและเป็นตัวตัดสินระหว่าง next steps ที่ plausible หลายอัน

### `closure_loss`

คำถามหลัก:

> Is this work actually done or still active?

ใช้เมื่อ:

- closure status เป็น object หลักที่ยัง resolve ไม่ได้
- completion ที่เห็นอาจ false หรือ incomplete

ไม่ใช้เมื่อ:

- งานชัดเจนว่ายัง active อยู่ แต่แค่ blocked

ลักษณะที่พบบ่อย:

- done-looking trail ทำให้ follow-up work ที่ยัง govern ถูก suppress
- มี completion marker จริง แต่ยังไม่พอจะ settle resume boundary

---

## Dominant-Assignment Rule

ใช้ลำดับนี้อย่างเคร่งครัด:

1. `focus_loss`
2. `authority_loss`
3. `readiness_loss`
4. `intent_loss`
5. `closure_loss`

ตีความดังนี้:

- ถ้า `focus` ยังไม่ resolve ให้ assign `focus_loss`
- ถ้า focus resolve แล้ว แต่ record precedence ยังไม่ resolve ให้ assign `authority_loss`
- ถ้า focus กับ authority resolve แล้ว แต่ valid action mode ยังไม่ resolve ให้ assign `readiness_loss`
- ถ้า mode resolve แล้ว แต่ next concrete step ยังไม่ resolve ให้ assign `intent_loss`
- ถ้าสิ่งที่เหลือยังไม่ resolve คือ งาน done จริงหรือยัง ให้ assign `closure_loss`

uncertainty ที่มาชั้นหลัง ไม่ควร outrank layer ที่ยังไม่ resolve ในชั้นก่อน

---

## Tie-Break Notes

### `focus_loss` vs `authority_loss`

เลือก `focus_loss` เมื่อ:

- current work เองยังไม่ชัด
- agent ยังบอกไม่ได้ว่างานไหน govern resumed action

เลือก `authority_loss` เมื่อ:

- current work ชัด
- แต่ยังเถียงกันว่า record หรือ cue ไหนควร govern งานนั้น

rule of thumb:

> ถ้าคุณบอกชื่อ current work ได้อย่างมั่นใจ แต่ยังไม่รู้ว่า record ไหนควร govern ให้เอนมาทาง `authority_loss`

### `focus_loss` vs `closure_loss`

เลือก `focus_loss` เมื่อ:

- agent ตัดสินไม่ได้จริง ๆ ว่างานไหนคือ current work
- current-work identity ยัง unresolved ไม่ว่าจะเกิดจากสาเหตุอะไร

เลือก `closure_loss` เมื่อ:

- ยังระบุตัวงานได้อยู่
- แต่ยังไม่แน่ใจว่างานนั้น done จริงหรือยัง หรือยัง action-governing อยู่

rule of thumb:

> ถ้า false หรือ misleading done-signal เป็นเหตุที่ทำให้งานผิดอันดูเหมือน current อยู่ triggering condition คือ closure แต่ dominant assignment จะขึ้นกับว่าปัจจุบัน current-work identity เองยัง unresolved (`focus_loss`) หรือว่ายังระบุตัวงานได้อยู่และมีแค่ completion status ที่ยัง unresolved (`closure_loss`)

### `authority_loss` vs `readiness_loss`

เลือก `authority_loss` เมื่อ:

- ระบบยังไม่รู้ว่า record ไหนมีสิทธิ์กำหนด current state ของงาน
- สถานะที่ blocked, waiting หรือ pending approval ปรากฏอยู่ใน record ที่ยัง disputed อยู่เพียงบางตัว ทำให้ยังต้อง resolve เรื่อง record precedence ก่อนจะไปตัดสิน mode

เลือก `readiness_loss` เมื่อ:

- trusted state ถูก fix แล้ว
- คำถามที่เหลือคือ ตอนนี้ควร act / ask / wait / escalate / abstain

rule of thumb:

> record selection มาก่อน mode selection

ข้อสรุปย่อย:

> ถ้า later record บอกว่า "งานนี้ blocked" แต่ใน episode ยังเถียงกันอยู่ว่า later record นั้นควร govern ตั้งแต่แรกหรือไม่ ให้เอน `authority_loss` มากกว่า `readiness_loss`

### `readiness_loss` vs `intent_loss`

เลือก `readiness_loss` เมื่อ:

- valid present mode ยังไม่ชัด

เลือก `intent_loss` เมื่อ:

- mode ถูก fix แล้ว
- เหลือแค่ next concrete step ที่ยังไม่ชัด

rule of thumb:

> ถ้า `act` ยังไม่ justified อย่างมั่นคง อย่าเพิ่ง assign `intent_loss`

ข้อสรุปย่อย:

> ถ้า governing record คงที่แล้ว และ `act` ถูก justify แล้ว การมี next edits ที่ plausible มากกว่าหนึ่งทางภายใน work strand เดียวกันเป็น pattern ของ `intent_loss` ไม่ใช่ `authority_loss`

### `false_done` vs `dirty_done`

เลือก `false_done` เมื่อ:

- closure ไม่เคยถูก satisfied จริง

เลือก `dirty_done` เมื่อ:

- มี done signal ที่ valid จริง
- แต่ยังมี follow-up obligations ที่ต้อง govern action ต่อ

rule of thumb:

> `false_done` คือ done signal ไม่ valid ตั้งแต่ต้น ส่วน `dirty_done` คือ done signal จริง แต่ยังไม่พอสำหรับ resumptive purposes

---

## การจัดการกับเคสที่ก้ำกึ่ง

บาง episode จะยากจริง
เมื่อเป็นแบบนั้น:

- ยังต้องเลือก interruption class ที่ fit ที่สุด
- ยังต้องเลือก dominant loss class ที่ fit ที่สุด
- mark ว่า `boundary-ambiguous`
- อธิบายว่าคู่แข่งที่ใกล้ที่สุดคือ class ไหน และเพราะอะไร

disagreement เป็นผลลัพธ์ที่มีค่า
ไม่ต้องฝืนทำให้ทุกเคสดูแน่ใจเกินจริง

---

## Output Format

สำหรับแต่ละ episode ให้บันทึก:

- `episode_id`
- `interruption_class`
- `dominant_loss_class`
- `boundary_ambiguous` (`yes` / `no`)
- `nearest_alternative_class`
- `justification` (`1–3` sentences)

ตัวอย่าง:

```md
Episode: E-CON-03
Interruption class: blocked_waiting
Dominant loss class: readiness_loss
Boundary-ambiguous: no
Nearest alternative: intent_loss
Justification: งานและ governing state ชัดแล้ว แต่ยังไม่มี approval ที่จำเป็น จึงยังไม่ควรลงมือทำต่อ Object ที่ยังไม่ resolve จึงเป็น valid present action mode ไม่ใช่ next implementation step
```

---

## Worked Micro-Examples

### Example 1

Episode sketch:

มีสอง unfinished works ที่ยังมองเห็นได้หลังจากกลับมาทำงานข้ามคืน อันหนึ่งมี local context ที่ใหม่และ rich กว่า แต่อีกด้านมี state record ที่ใหม่กว่าซึ่งบอกว่าอีกงานหนึ่งต่างหากที่ govern อยู่ ตอน resume agent เลือก strand ที่ดูต่อได้ง่ายกว่า

Classification:

- interruption class: `multi_open_work_conflict`
- dominant loss class: `authority_loss`

Why:

- มี work candidates หลายอันที่มองเห็นได้ที่ boundary
- failure หลักไม่ใช่ไม่รู้ว่ามีงานอะไรบ้าง แต่คือเลือก governing record ผิดท่ามกลาง signals ที่แข่งกัน

### Example 2

Episode sketch:

current work ชัด และ trusted record ก็บอกชัดว่างานนี้ถูก block รอ approval แต่ agent ยังทำ implementation ต่อแทนที่จะ surfacing blocker

Classification:

- interruption class: `blocked_waiting`
- dominant loss class: `readiness_loss`

Why:

- งานและ trusted state ชัดแล้ว
- object ที่ยังไม่ resolve คือ valid present mode

### Example 3

Episode sketch:

งานยัง active ชัด และ `act` ก็เป็น present mode ที่ถูก แต่ยังมีรายละเอียดที่ขาดอยู่หนึ่งจุดซึ่งเป็นตัวตัดสินว่าควร patch file A หรือ file B ก่อน agent เลยเดา

Classification:

- interruption class: `session_cutoff` หรือ `failure_boundary` แล้วแต่ boundary ที่ episode อธิบาย
- dominant loss class: `intent_loss`

Why:

- action mode ถูก fix แล้ว
- สิ่งที่ยังไม่ resolve คือ action content ที่เป็นรูปธรรม

### Example 4

Episode sketch:

agent กลับเข้ามาใน repo ที่ยังมี feature branches เปิดอยู่สองอัน อันหนึ่งมี recent commit และ open PR อีกอันมี tracker card ที่ mark ว่า `in progress` และมี team message ที่ใหม่กว่าบอกให้โฟกัสอันนี้ก่อน agent กลับไปทำ branch ที่มี open PR

Classification:

- interruption class: `multi_open_work_conflict`
- dominant loss class: `authority_loss`
- boundary-ambiguous: `yes`
- nearest alternative: `focus_loss`

Why:

- ทั้งสอง works ยังมองเห็นได้และเรียกชื่อได้ ซึ่งทำให้น้ำหนักไม่ไปทาง `focus_loss` แบบเต็ม
- แต่ข้อพิพาทหลักคือ signal ไหนควร govern resumed action
- ขณะเดียวกัน `focus_loss` ก็ยังเป็น alternative ที่ defend ได้ เพราะ current work เองยังรู้สึก unresolved ที่ boundary นี้

---

## สิ่งที่ Codebook นี้ไม่ได้ทำ

codebook นี้ไม่ได้:

- พิสูจน์ว่าตัว taxonomy ถูกต้องล่วงหน้า
- ลบ ambiguity ออกทั้งหมด
- แทนที่การ revision ของ taxonomy ถ้า disagreement ชี้ว่าขอบเขตยังอ่อน

หน้าที่ของมันแคบกว่านั้น:

> ทำให้ taxonomy ใช้งานได้พอสำหรับการศึกษาแบบ independent classification
