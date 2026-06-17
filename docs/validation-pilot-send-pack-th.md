# ชุดส่ง Annotator สำหรับ Validation Pilot

## จุดประสงค์

ไฟล์นี้คือชุดส่งแบบรวม `annotator-facing` สำหรับ pilot แรกของ interrupted coding work taxonomy

ให้ใช้ไฟล์นี้เมื่ออยากส่งเอกสารชุดเดียวที่เพียงพอสำหรับ:

- อธิบายว่ารอบ pilot นี้ทำไปเพื่ออะไร
- อธิบายวิธีให้ label
- ส่ง pilot episodes ทั้งชุด
- ส่งแบบฟอร์มสำหรับกรอกคำตอบ

ไฟล์นี้ถูกรวมมาจาก canonical source ปัจจุบัน:

- `docs/validation-pilot-episodes-th.md`
- `docs/validation-codebook-th.md`
- `docs/validation-annotation-form-th.md`
- `docs/validation-annotation-submission-template-th.md`

ห้ามส่งไฟล์นี้คู่กับ:

- `docs/validation-pilot-provenance-ledger.md`
- expected labels
- author-side commentary ที่เฉลยว่าเคสไหนตั้งใจให้ก้ำกึ่ง

---

## รอบ Pilot นี้มีไว้เพื่ออะไร

เป้าหมายของ pilot นี้ไม่ใช่การ validate taxonomy ทั้งชุดแบบเชิงสถิติ

เป้าหมายคือเช็กว่า:

- episode descriptions ชัดพอหรือยัง
- codebook ใช้งานได้จริงแบบอิสระหรือยัง
- dominant-loss boundaries ใช้งานได้จริงพอสำหรับการ annotate รอบแรกหรือยัง

การไม่เห็นตรงกันในรอบ pilot ถือว่าเกิดขึ้นได้
pilot ถือว่าสำเร็จถ้าความไม่ตรงกันนั้นตีความได้ ไม่ใช่สุ่ม

---

## คำแนะนำสำหรับ Annotator

ให้ classify แต่ละ episode ตามที่เขียนไว้

- อย่าเติม fact ที่ไม่ได้อยู่ใน episode
- อย่าแก้ scenario เอง
- อย่าใช้ raw logs, provenance material, หรือโน้ตภายในทีมวิจัย
- อย่าพยายามเดาว่าผู้วิจัยอยากได้คำตอบอะไร

ถ้าจะใช้ LLM เลย ให้ใช้ได้เฉพาะก่อนเริ่ม annotate เพื่อช่วยทำความเข้าใจ codebook
ห้ามใช้ LLM เพื่อตัดสิน label ของ episode จริง ถ้ารอบนี้ยังนับเป็น human annotation

---

## สิ่งที่ต้องส่งต่อ 1 Episode

สำหรับแต่ละ episode ให้ส่ง:

1. `interruption_class` หนึ่งค่า
2. `dominant_loss_class` หนึ่งค่า
3. `boundary_ambiguous` หนึ่งค่า
4. `nearest_alternative_class` หนึ่งค่า
5. `justification` สั้น ๆ แบบอิงโครงสร้าง

field ที่ optional แต่แนะนำให้มี:

- `confidence`
- `notes`

---

## ขั้นตอนการ Annotate

ให้ใช้ขั้นตอนเดียวกันกับทุก episode

### ขั้นที่ 1: หา Interruption Boundary

ถามว่า:

> boundary event แบบไหนที่ทำให้เกิด resume point นี้

แล้วเลือก `interruption_class` ที่ตรงที่สุด

### ขั้นที่ 2: หา Earliest Broken Governing Object

ถามตามลำดับนี้:

1. งานไหนคือ current work จริง
2. ทำไม state นี้จึงควรถูกเชื่อมากกว่า signal อื่น
3. ตอนนี้ action mode ที่ valid คือ `act`, `ask`, `wait`, `escalate`, หรือ `abstain`
4. ถ้า action mode นั้น fix แล้ว next concrete step คืออะไร
5. งานนี้ done จริงแล้วหรือยังยัง active อยู่

แล้วเลือก `dominant_loss_class` ที่เป็น layer แรกสุดที่ยัง resolve ไม่ได้

### ขั้นที่ 3: เช็ก Boundary ที่ใกล้ที่สุด

ก่อน finalize ให้เทียบ dominant loss ที่เลือกกับคู่แข่งที่ใกล้ที่สุด:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`
- `false_done` vs `dirty_done`

ถ้ารู้สึกว่า alternative ที่ใกล้ที่สุดยัง plausible จริง ให้ใส่:

- `boundary_ambiguous: yes`

ถ้าไม่ก้ำกึ่ง ให้ใส่:

- `boundary_ambiguous: no`
- `nearest_alternative_class: none`

### ขั้นที่ 4: เขียน Justification สั้น ๆ

ให้ justification สั้นและอิงโครงสร้างของปัญหา

ตัวอย่างที่ดี:

> งานชัด แต่ records ที่มองเห็นไม่ตรงกันว่า record ไหนควร govern ดังนั้น object แรกที่ยัง resolve ไม่ได้คือ authority ของ state

ตัวอย่างที่ไม่ดี:

> รู้สึกว่าเป็น authority

---

## Allowed Label Values

### `interruption_class`

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

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`

### `boundary_ambiguous`

- `yes`
- `no`

### `nearest_alternative_class`

- `focus_loss`
- `authority_loss`
- `readiness_loss`
- `intent_loss`
- `closure_loss`
- `none`

### `confidence`

- `high`
- `medium`
- `low`

---

## Quick Reference: Interruption Classes

label กลุ่มนี้ใช้อธิบาย `boundary event`
ไม่ใช่ตัวปัญหาลึกสุด

### `session_cutoff`

ใช้เมื่อปัญหาหลักเกิดจาก session จบลงกะทันหันก่อนที่ local trajectory จะถูก externalize ครบ

มักใช้กับ:

- ค้างข้ามคืน
- terminal ปิด
- context หรือ token หมด

ไม่ใช้ถ้า boundary หลักจริง ๆ คือการเปลี่ยน actor, environment เปลี่ยน, หรือมี failed step เป็นจุดตัดหลัก

### `task_switch`

ใช้เมื่อ attention หรือ priority ถูกย้ายจากงานหนึ่งไปอีกงานหนึ่ง

มักใช้กับ:

- มีการเปลี่ยน priority
- มีงานอื่นเข้ามาแทรกจนต้องสลับงาน

ไม่ใช้ถ้ามีหลายงานเปิดค้างอยู่เพียงเพราะ tracker หรือ closure state ทำให้มันดู active พร้อมกัน

### `blocked_waiting`

ใช้เมื่อยังรู้ว่างานคืออะไร แต่การทำต่ออย่างปลอดภัยยังต้องรอบางอย่าง

มักใช้กับ:

- รอ approval
- รอ ownership confirmation
- รอ input หรือ dependency ที่ยังไม่มา

ไม่ใช้ถ้า episode ก่อนหน้าจบลงตรง failed step และประเด็นหลักคือจะ recover จาก failure นั้นยังไง

### `environment_drift`

ใช้เมื่อ environment เปลี่ยนไประหว่างช่วงที่ถูกขัดจังหวะ จน fact เดิมอาจเชื่อถือไม่ได้แล้ว

มักใช้กับ:

- dependency state เปลี่ยน
- live world state ขยับ
- assumption เดิมอาจ stale แล้ว

ไม่ใช้ถ้าปัญหามีแค่ว่า session จบ

### `failure_boundary`

ใช้เมื่อ attempt ก่อนหน้าจบลงตรง command fail, tool fail, validation fail หรือ permission boundary และวิธี recover เองเป็นส่วนหนึ่งของความยาก

มักใช้กับ:

- test fail แล้ว resume ต้องเริ่มจาก recovery
- command ติด permission boundary

ไม่ใช้ถ้างานแค่รอ input ภายนอก

### `handoff`

ใช้เมื่อ episode ข้าม boundary ระหว่าง model, operator หรือ role และ tacit rationale หลุดหายไป

มักใช้กับ:

- คนหรือโมเดลหนึ่งส่งต่องานให้อีกคนหรืออีกโมเดล

ไม่ใช้กับการจบ session ธรรมดาที่ไม่มี actor transfer ที่มีนัยสำคัญ

### `multi_open_work_conflict`

ใช้เมื่อยังมี open work candidate มากกว่าหนึ่งอัน และการ triage ว่างานไหนควร current เป็นส่วนหนึ่งของ boundary event เอง

มักใช้กับ:

- มีสอง strands ที่ยังดู active
- ต้องตัดสินก่อนว่างานไหนคือ current work

ไม่ใช้ถ้างานชัดแล้ว และประเด็นมีแค่ว่า record ไหนควร govern งานนั้น

### `false_done`

ใช้เมื่อมีสัญญาณที่ดูเหมือนปิดงานแล้ว แต่ closure evidence ที่จำเป็นจริง ๆ ไม่เคยครบ

มักใช้กับ:

- มี done-looking state แต่ความ complete นั้นไม่เคย valid จริง

ไม่ใช้ถ้า completion valid แล้ว แต่ยังมี follow-up obligation ที่ยัง govern อยู่

### `dirty_done`

ใช้เมื่อมี completion marker ที่ valid จริง แต่ยังมี residual obligation ที่ยัง govern follow-up action

มักใช้กับ:

- implementation หลักเสร็จแล้ว แต่ยังมี safeguard หรือ follow-up ที่ยังบังคับอยู่

ไม่ใช้ถ้า done-state นั้นไม่เคย valid ตั้งแต่แรก

---

## Quick Reference: Dominant Loss Classes

label กลุ่มนี้ใช้อธิบาย `earliest unresolved governing object`

### `focus_loss`

คำถามหลัก:

> Which work is truly current?

ใช้เมื่อ current-work identity เองยังไม่ชัด

มักใช้กับ:

- มี current work ที่ plausible มากกว่าหนึ่งอัน
- ระบบยังบอกไม่ได้ว่างานไหน govern resumed action

ไม่ใช้ถ้างานชัดแล้ว แต่ยังเถียงกันแค่ว่า record ไหนควร govern

### `authority_loss`

คำถามหลัก:

> Why should this state be trusted over competing signals?

ใช้เมื่องานชัดแล้ว แต่มี records หรือ cues หลายตัวแข่งกัน และยังไม่ชัดว่าตัวไหนมีสิทธิ์ govern

มักใช้กับ:

- local context ชนกับ fresher structured state
- tracker state ชนกับ engineering-side state ที่ใหม่กว่า

ไม่ใช้ถ้าประเด็นลึกกว่าคือควร act หรือไม่

### `readiness_loss`

คำถามหลัก:

> Which action mode is currently valid: act, ask, wait, escalate, or abstain?

ใช้เมื่องานชัด governing record ก็น่าเชื่อถือแล้ว แต่ยังไม่รู้ว่าตอนนี้ action ยัง permissible ไหม

มักใช้กับ:

- blocked pending review หรือ approval
- รอ input
- ต้อง escalate ก่อนถึงจะทำ implementation ต่อได้

ไม่ใช้ถ้า action mode ถูก fix แล้ว และเหลือแค่ next concrete step ที่ยังไม่ชัด

### `intent_loss`

คำถามหลัก:

> Given the fixed action mode, what concrete next step should be taken?

ใช้เมื่อ `act` ถูก justify แล้ว แต่ next operation ที่เป็นรูปธรรมยังไม่ชัด

มักใช้กับ:

- มี next edits ที่ plausible มากกว่าหนึ่งทาง
- ยังไม่ชัดว่าควรเริ่มที่ไฟล์ไหนหรือ operation ไหนก่อน

ไม่ใช้ถ้าประเด็นลึกกว่ายังเป็นเรื่องควร act, wait, ask หรือ escalate

### `closure_loss`

คำถามหลัก:

> Is this work actually done or still active?

ใช้เมื่อ closure status เป็น object หลักที่ยังไม่ชัด

มักใช้กับ:

- done-looking trail ไปกดทับ follow-up work ที่ยัง govern อยู่
- completion อาจ false หรือ incomplete

ไม่ใช้ถ้างานยัง active ชัดเจนแต่แค่ blocked

---

## Quick Tie-Break Rules

- ถ้ายังบอกไม่ได้ว่างานไหนคือ current work ให้เอนมาทาง `focus_loss`
- ถ้ารู้งานแล้ว แต่ยังไม่รู้ว่า record ไหนควร govern ให้เอนมาทาง `authority_loss`
- ถ้างานกับ governing record ชัดแล้ว แต่ยังไม่รู้ว่าตอนนี้ action ได้หรือยัง ให้เอนมาทาง `readiness_loss`
- ถ้า action ได้แล้ว แต่ next concrete step ยังไม่ชัด ให้เอนมาทาง `intent_loss`
- ถ้าคำถามที่เหลือคือ งาน done จริงหรือยัง ให้เอนมาทาง `closure_loss`

ข้อเตือนสำคัญจาก pilot:

- ถ้า later record บอกว่างาน blocked แต่ใน episode ยังเถียงกันอยู่ว่า later record นั้นควร govern ตั้งแต่แรกหรือไม่ ให้เอน `authority_loss` มากกว่า `readiness_loss`
- ถ้า governing record คงที่แล้ว และ `act` ถูก justify แล้ว การมี next edits ที่ plausible มากกว่าหนึ่งทางภายใน work strand เดียวกันเป็น pattern ของ `intent_loss` ไม่ใช่ `authority_loss`

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

## Pilot Episodes

## ข้อมูล Annotator

กรอกส่วนนี้ครั้งเดียวก่อนเริ่ม:

```md
Annotator ID:
Annotator Tier:
Annotator Family:
```

## Episode E-SWE-01

Setting:
coding agent กลับเข้ามาทำงานใน evaluation harness repository หลังจาก pause งานที่เกี่ยวกับ modal execution entrypoint ไปชั่วคราว เส้นงานเดิมใน local context ยังดูต่อเนื่องดีอยู่: มี note บอกให้ทำ wiring ของ entrypoint flow ต่อ และ work item ที่เปิดอยู่ก็ดูเหมือนยัง active

Interruption boundary:
session ก่อนหน้าจบลงหลังจากมีความคืบหน้าบางส่วนใน path ของ entrypoint โดยคาดว่าจะกลับมาทำ implementation ต่อใน area เดิมเมื่อ resume

Visible records at resume time:
- local note ล่าสุดที่อธิบาย next edit ใน entrypoint wrapper
- open work item ที่ยังผูกกับ subsystem เดิม
- structured state record ที่ใหม่กว่า ซึ่งบอกว่า strand เดิมถูก block รอ approval และมี work strand ข้างเคียงที่กลายเป็นตัว govern แทน
- ไม่มี record ใหม่อีกตัวที่มายืนยันอย่างอิสระว่า blocked-status record นี้ควร outrank local thread จริง

What happened before or during the interrupted attempt:
agent เคย orient ตัวเองกับ path ของ entrypoint ไปแล้ว และทิ้ง local context ไว้พอที่ strand เดิมยังดูเหมือนเป็นงานที่ต่อได้ง่าย

Decision pressure:
ทางที่ดูตรงที่สุดคือทำ implementation ของงาน entrypoint ต่อ เพราะมี local trail ที่มองเห็นชัดอยู่แล้ว

Complication:
visible records ที่มีอยู่ไม่สอดคล้องกันทั้งหมดว่าอะไรคือสิ่งที่ govern งานปัจจุบันจริง ๆ record หนึ่งหนุน local continuity แต่ record ที่ใหม่กว่าเปลี่ยน status ของงานเดิมและชี้ไปยัง strand อื่นที่ควร govern แทน คำถามหลักจึงยังไม่ใช่ว่าต้องรอ approval หรือไม่ แต่คือ blocked-status record ตัวหลังนั้นควร outrank local thread ตั้งแต่แรกหรือไม่

### ช่องกรอกคำตอบ

```md
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
```

## Episode E-SWE-02

Setting:
coding agent กลับมาทำงานต่อที่ modal evaluation runner ใน repository ที่ target work item ค่อนข้างชัด และ state ฝั่ง repository ล่าสุดก็ยังชี้มาที่ runner area เดิม

Interruption boundary:
session ก่อนหน้าหยุดลงหลังจาก agent ระบุ next runner changes ที่เกี่ยวข้องได้แล้ว แต่ยังไม่ได้ execute

Visible records at resume time:
- current work item ที่ชัดและผูกกับ modal runner
- trusted state record ที่บอกว่าการทำต่อขึ้นอยู่กับ approval, ownership confirmation หรือ external handoff
- repository cues ที่ยังทำให้ implementation ต่อดูเหมือน feasible ใน local view

What happened before or during the interrupted attempt:
attempt ก่อนหน้ามีความคืบหน้ามากพอที่ path ของ implementation ที่เหลือดูตรงไปตรงมา ถ้า agent เลือก ignore blocker

Decision pressure:
agent ถูกดึงให้เริ่มแก้ runner ต่อทันที เพราะ path การแก้โค้ดยังมองเห็นและเข้าใจได้จาก local context

Complication:
ปัญหาไม่ใช่ว่าควรไปแตะ code path ไหนต่อ ปัญหาคือ ณ ตอนนี้ปลอดภัยหรือยังที่จะทำต่อ ก่อนที่ external confirmation หรือ handoff ที่จำเป็นจะมาถึง

### ช่องกรอกคำตอบ

```md
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
```

## Episode E-CON-01

Setting:
agent กลับเข้ามาที่ repository ซึ่งยังมี feature strands เปิดอยู่สองเส้น เส้นหนึ่งมี recent commit และ open pull request อีกเส้นหนึ่งมี tracker card ที่ mark ว่า `in progress` และมี team-side message ที่ใหม่กว่าบอกว่าควรให้ความสำคัญกับเส้นที่สองก่อน

Interruption boundary:
session ก่อนหน้าจบลงก่อนที่ agent จะ resolve ได้ว่าในสอง strands ที่ยังดู active อยู่นั้น strand ไหนควร govern resumed work

Visible records at resume time:
- open PR และ recent commit trail ของ strand หนึ่ง
- tracker record ที่ mark อีก strand ว่า active
- team-side instruction ที่ใหม่กว่าและ shift focus ไปยัง strand ที่สอง

What happened before or during the interrupted attempt:
งานก่อนหน้าพัวพันกับทั้งสอง strands มากพอที่พอกลับมาแล้วแต่ละอันยังดูเหมือนเป็น current work ได้ทั้งคู่

Decision pressure:
ทางที่ง่ายที่สุดคือ resume branch ที่มี implementation trail หนากว่าและมี open PR อยู่

Complication:
candidate works ทั้งสองยังมองเห็นได้และเรียกชื่อได้ แต่ visible signals ไม่ตรงกันว่าอะไรควร govern resumed action จริง ความกำกวมจึงไม่ได้อยู่แค่ว่างานอะไรมีอยู่บ้าง แต่อยู่ที่ว่า signal ไหนควร outrank ตัวอื่น

### ช่องกรอกคำตอบ

```md
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
```

## Episode E-CON-02

Setting:
coding agent กลับเข้ามาใน repository หลังจาก pause ระหว่างทำ fix งานหนึ่ง ซึ่ง current work item ยังชัดอยู่ trusted state ล่าสุดก็ไม่ได้ชี้ว่ามี blocker, ownership handoff หรือ waiting condition ใด ๆ งานควรเดินต่อได้

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก agent บีบปัญหาเหลือ next edits ที่เป็นรูปธรรมสองทาง ภายใน active strand เดียวกัน

Visible records at resume time:
- current work item ที่เสถียรและไม่มี record ใหม่มาซ้อนทับ
- notes ที่บอกว่าควรทำงานต่อได้เลย ไม่ใช่ wait หรือ escalate
- repository evidence ที่ทำให้มี next edits ที่ plausible อยู่สองแบบ
- ไม่มี tracker, handoff หรือ later state record คู่แข่งที่บอกว่าควรเชื่อ governing source ตัวอื่นแทน

What happened before or during the interrupted attempt:
attempt ก่อนหน้า resolve คำถามระดับสูงไปแล้วว่าควรทำต่อหรือไม่ สิ่งที่ยังค้างอยู่คือควรเริ่มจาก concrete implementation move อันไหนก่อน

Decision pressure:
agent ต้อง resume โดยเลือก next admissible edit แล้วทำ execution ต่อ

Complication:
agent รู้แล้วว่าควรทำงานต่อ และไม่ได้กำลังเลือกกันระหว่าง record คนละตัว สิ่งที่ยังไม่รู้คือควรเริ่มจาก edit ไหนก่อน ระหว่างสองทางที่ดู plausible ทั้งคู่ภายใน work strand เดียวกันที่ govern อยู่แล้ว

### ช่องกรอกคำตอบ

```md
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
```

## Episode E-HIS-01

Setting:
coding agent กลับมาที่ work tracker ในเช้าวันถัดจากที่ patch ถูก mark ว่า complete tracker แสดงว่างาน done แล้ว และ implementation notes ก็ทำให้ดูเหมือน main coding task จบแล้ว แต่มี engineering-side record ข้างเคียงที่บอกว่ายังมี follow-up safeguard อีกหนึ่งอย่างที่ยังไม่เสร็จ ก่อนที่งานนี้จะถือว่าปิดได้จริง

Interruption boundary:
session ก่อนหน้าหยุดลงหลังจาก done-signal ปรากฏขึ้น แต่ก่อนที่ residual follow-up obligation จะถูก resolve

Visible records at resume time:
- tracker หรือ status surface ที่แสดงว่างาน complete แล้ว
- implementation notes ที่ยิ่ง reinforce ภาพของการปิดงาน
- engineering-side record ที่ใหม่กว่าและบอกว่ายังมี follow-up obligation ที่ยัง govern อยู่

What happened before or during the interrupted attempt:
agent มีเหตุผลจริงที่จะเชื่อว่า main implementation เสร็จแล้ว แต่ lifecycle state ของงานยังไม่ settle ชัดก่อนที่จะ pause

Decision pressure:
ทางธรรมชาติที่สุดคือ treat งานที่ดู complete นี้ว่า closed แล้ว แล้ว move on ไปทำงานอื่น

Complication:
done-signal ที่เห็นอาจจริงแต่ยังไม่พอ การตัดสินใจตอน resume จึงขึ้นอยู่กับว่า obligation ที่เหลืออยู่นั้นหมายความว่างานนี้ยังต้องการการจัดการต่อ แม้จะมี completion marker อยู่แล้วหรือไม่

### ช่องกรอกคำตอบ

```md
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

ก่อนส่ง ให้เช็กว่า:

- ทุก episode มีทั้ง interruption class และ dominant loss class
- กรอก `boundary_ambiguous` ครบทุก episode
- กรอก `nearest_alternative_class` ครบทุก episode
- ทุก episode มี justification

---

## Canonical Source Files

ถ้าภายหลังจะปรับไฟล์รวมนี้ ให้แก้ source files หลักก่อน:

- `docs/validation-pilot-episodes-th.md`
- `docs/validation-codebook-th.md`
- `docs/validation-annotation-form-th.md`
- `docs/validation-annotation-submission-template-th.md`
