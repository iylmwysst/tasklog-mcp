# ชุดส่ง Annotator สำหรับ Validation 30 Episodes

## จุดประสงค์

ไฟล์นี้คือชุดส่งแบบรวม `annotator-facing` สำหรับการศึกษา interrupted coding work taxonomy รอบเต็มชุดแรกที่มี `30` episodes

ให้ใช้ไฟล์นี้เมื่อคุณต้องการส่ง packet ชุดเดียวที่เพียงพอสำหรับ:

- อธิบายว่ารอบนี้มีไว้เพื่ออะไร
- อธิบายวิธีให้ label
- ส่ง episode ทั้ง `30` ตอน
- ชี้ไปยัง submission sheet ที่ใช้กรอกคำตอบ

packet นี้ถูกรวมมาจาก canonical materials ปัจจุบัน:

- `docs/validation-pilot-episodes.md`
- `docs/validation-30-episode-wave-1.md`
- `docs/validation-30-episode-wave-2.md`
- `docs/validation-codebook.md`
- `docs/validation-annotation-form.md`
- `docs/validation-30-episode-submission-template.md`

ห้ามส่งไฟล์นี้คู่กับ:

- `docs/validation-pilot-provenance-ledger.md`
- `docs/validation-30-episode-hidden-ledger.md`
- expected labels
- author-side source commentary

---

## รอบนี้มีไว้เพื่ออะไร

รอบนี้คือ annotation packet แบบเต็มชุดรอบแรกสำหรับ interrupted coding work taxonomy

เป้าหมายคือทดสอบ taxonomy บนชุด episode ที่เขียนขึ้นแบบสมดุล ครอบคลุม:

- `REAL`
- `CON`
- `SWE`

packet นี้รักษาทั้ง anchor cases, boundary cases, และ stress cases ไว้

annotator ควร classify แต่ละ episode ตามที่เขียนไว้
ไม่ควรใช้ outside provenance, raw logs, หรือ hidden source notes

---

## คำแนะนำสำหรับ Annotator

ให้ classify แต่ละ episode ตามที่เขียนไว้

- อย่าเติม fact ที่ไม่ได้อยู่ใน episode
- อย่าแก้ scenario เอง
- อย่าใช้ outside notes, raw logs, หรือ provenance material
- อย่าพยายามเดาว่าผู้วิจัยอยากได้คำตอบอะไร
- อย่าใช้ hidden ledgers หรือ expected labels

ก่อนเริ่มรอบนี้ คุณสามารถอ่าน codebook เพื่อทำความเข้าใจระบบ label ได้
แต่ระหว่าง annotation ให้ตัดสิน label ด้วยตัวเอง ห้ามใช้ LLM หรือเครื่องมือภายนอกช่วยเลือก label สำหรับคำตอบของ annotator

---

## สิ่งที่ต้องส่งสำหรับแต่ละ Episode

สำหรับแต่ละ episode ให้ส่ง:

1. `interruption_class` หนึ่งค่า
2. `dominant_loss_class` หนึ่งค่า
3. `boundary_ambiguous` หนึ่งค่า
4. `nearest_alternative_class` หนึ่งค่า
5. `justification` สั้น ๆ แบบอิงโครงสร้าง

field ที่ optional แต่แนะนำให้มี:

- `confidence`
- `notes`

ถ้า `boundary_ambiguous = no` ให้ใช้:

- `nearest_alternative_class: none`

ให้ใช้ response sheet คู่กัน:

- `docs/validation-30-episode-submission-template.md`
- `docs/validation-30-episode-google-form-kit.md` สำหรับตั้งค่า Google Form

---

## ขั้นตอนการ Annotate

ให้ใช้ขั้นตอน 4 ข้อเดิมกับทุก episode

### ขั้นที่ 1: หา Interruption Boundary

ถามว่า:

> boundary event แบบไหนที่สร้าง resume point นี้ขึ้นมา

แล้วเลือก `interruption_class` ที่ตรงที่สุดกับ boundary event นั้น

### ขั้นที่ 2: หา Earliest Broken Governing Object

ให้ถามตามลำดับนี้:

1. งานไหนคือ current work จริง
2. ทำไม state นี้จึงควรถูกเชื่อมากกว่า signal อื่นที่แข่งกันอยู่
3. ตอนนี้ action mode ที่ valid คือ `act`, `ask`, `wait`, `escalate`, หรือ `abstain`
4. ถ้า action mode นั้น fix แล้ว next concrete step ที่ควรทำคืออะไร
5. งานนี้ done จริงแล้วหรือยังยัง active อยู่

แล้วเลือก `dominant_loss_class` ที่เป็น earliest unresolved layer

### ขั้นที่ 3: เช็ก Boundary ที่ใกล้ที่สุด

ก่อน finalize ให้เทียบ dominant loss ที่เลือกกับคู่แข่งใกล้ที่สุด:

- `focus_loss` vs `authority_loss`
- `authority_loss` vs `readiness_loss`
- `readiness_loss` vs `intent_loss`
- `false_done` vs `dirty_done`

ถ้า nearest alternative ยัง plausible จริง ให้ใส่:

- `boundary_ambiguous: yes`
- `nearest_alternative_class` เป็น rival ที่แรงที่สุด

ถ้าไม่ก้ำกึ่ง ให้ใช้:

- `boundary_ambiguous: no`
- `nearest_alternative_class: none`

### ขั้นที่ 4: เขียน Justification แบบสั้น

ให้ justification สั้นและอิงโครงสร้าง

ตัวอย่างที่ดี:

> งานชัดแล้ว แต่ records ที่มองเห็นไม่ตรงกันว่าโดน block อยู่หรือไม่ ดังนั้น object แรกที่ยังไม่ resolve คือ record ไหนควร govern

ตัวอย่างที่ไม่ดี:

> รู้สึกว่าเป็น authority เพราะมันคล้ายอีกเคสหนึ่ง

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

## Quick Tie-Break Reminders

- ถ้ายังมีหลาย strands ที่ดูเหมือน current ได้จริง ให้พิจารณา `focus_loss` ก่อนจะขยับไป later-layer classes
- ถ้างานพอระบุได้แล้ว แต่ records ที่เห็นขัดกันว่า state ไหนควร govern ให้พิจารณา `authority_loss`
- ถ้างานและ governing state ชัดอยู่แล้ว แต่ valid present mode ยังเป็น `wait`, `ask`, หรือ `escalate` ให้พิจารณา `readiness_loss`
- ถ้า `act` justified แล้ว และความไม่แน่นอนที่เหลืออยู่คือควรลงมือ next move ไหนก่อน ให้พิจารณา `intent_loss`
- ถ้าประเด็นหลักคือ งานปิดจริงแล้วหรือยังยังถูก govern โดย obligation ที่เหลืออยู่ ให้พิจารณา `closure_loss`
- ถ้าสถานะ blocked หรือ waiting มองเห็นได้ผ่าน later record ที่ยังมีข้อพิพาทอยู่ ให้ resolve เรื่อง governing record ก่อน ซึ่งยังเป็นเคส `authority_loss` จนกว่า governing record จะ settled
- ถ้า governing record เสถียรแล้วและไม่มี blocker ใหม่มาทับ การมี next edits หลายทางที่ plausible เป็น pattern ของ `intent_loss` มากกว่า `authority_loss`

---

## ลำดับ Episode

packet นี้ประกอบด้วย:

- `5` pilot-seeded episodes
- `10` wave 1 episodes
- `15` wave 2 episodes

รวมทั้งหมด: `30` episodes

---

## Episode E-SWE-01

Setting:
coding agent กลับเข้ามาใน evaluation harness repository หลังจากหยุดงานไปช่วงหนึ่ง ขณะกำลังทำงานกับ modal execution entrypoint เส้นงาน local เดิมยังดูต่อเนื่องได้: มี note บอกให้ทำ wiring ของ entrypoint ต่อ และ open work item เดิมก็ยังดู active อยู่

Interruption boundary:
session ก่อนหน้าจบลงหลังจากมีความคืบหน้าบางส่วนบนเส้นทาง entrypoint โดยคาดว่าเมื่อกลับมาแล้วจะทำ implementation ต่อในบริเวณเดิม

Visible records at resume time:
- มี local note ล่าสุดอธิบาย next edit ใน entrypoint wrapper
- มี open work item ที่ยังผูกกับ subsystem เดิม
- มี structured state record ที่ใหม่กว่า ระบุว่า strand เดิมถูก block รอ approval และตอนนี้มี strand ข้างเคียงอีกเส้นที่ govern แทน
- ไม่มี record ที่ใหม่กว่านี้ซึ่งยืนยันได้อย่างอิสระว่า blocked-status record นั้นควรมีน้ำหนักเหนือ local thread เดิม

What happened before or during the interrupted attempt:
agent ได้ทำความเข้าใจกับเส้นทาง entrypoint ไปแล้ว และทิ้ง local context ไว้มากพอจน strand เดิมยังดูเหมือนสามารถทำต่อได้ง่าย

Decision pressure:
ทางเลือกที่เห็นชัดที่สุดคือทำ implementation ของงาน entrypoint ต่อ เพราะมี local trail ให้ตามอยู่แล้ว

Complication:
records ที่มองเห็นไม่สอดคล้องกันเต็มที่ว่าอะไร govern อยู่ในตอนนี้ record หนึ่งหนุน local continuity ขณะที่อีก record ที่ใหม่กว่ากลับเปลี่ยนสถานะของงานนั้นและชี้ไปยัง governing strand อื่น ความไม่แน่นอนหลักยังไม่ใช่ว่า agent ควรรอ approval หรือไม่ แต่คือ blocked-status record ที่ใหม่กว่านั้นควรมีน้ำหนักเหนือ local thread เดิมตั้งแต่แรกหรือไม่

---

## Episode E-SWE-02

Setting:
coding agent กลับมาทำงานบน modal evaluation runner ใน repository ที่ target work item ชัดเจน และ state ล่าสุดฝั่ง repository ก็ยังชี้ไปยัง runner area เดิม

Interruption boundary:
session ก่อนหน้าหยุดลงหลังจาก agent ระบุ next changes ที่เกี่ยวข้องกับ runner ได้แล้ว แต่ยังไม่ได้ลงมือทำ

Visible records at resume time:
- มี current work item ที่ชัดและผูกกับ modal runner
- มี trusted state record ที่บอกว่าการทำต่อขึ้นอยู่กับ approval, ownership confirmation, หรือ external handoff
- มี cue จาก repository ที่ยังทำให้ implementation ต่อดูเป็นไปได้ในระดับ local

What happened before or during the interrupted attempt:
attempt ที่ถูกขัดจังหวะไปก่อนหน้ามีความคืบหน้าพอสมควร จนเส้นทาง implementation ที่เหลือดูตรงไปตรงมาหาก agent มองข้าม blocker ไป

Decision pressure:
agent ถูกล่อให้แก้ runner ต่อทันที เพราะเส้นทางการเขียนโค้ดมองเห็นได้และเข้าใจได้ในระดับ local

Complication:
ปัญหาไม่ใช่ว่าควรแตะ code path ไหนต่อ ปัญหาคือปลอดภัยหรือไม่ที่จะทำต่อเลยก่อนที่ external confirmation หรือ handoff จะมาถึง

---

## Episode E-CON-01

Setting:
agent กลับเข้ามาใน repository ที่มี feature strands เปิดค้างอยู่ให้เห็นสองเส้น เส้นหนึ่งมี commit ล่าสุดและ open pull request อีกเส้นมี tracker card ที่ mark ว่า `in progress` และมีข้อความจากฝั่งทีมที่ใหม่กว่าระบุว่า strand ที่สองนี้ควรได้ priority ก่อน

Interruption boundary:
session ก่อนหน้าจบลงก่อนที่ agent จะ resolve ว่าในสอง strands ที่ดู active นี้ เส้นไหนกันแน่ที่ควร govern resumed work

Visible records at resume time:
- มี open PR และ recent commit trail สำหรับ strand หนึ่ง
- มี tracker record ที่ mark ว่าอีก strand หนึ่ง active
- มี team-side instruction ที่ใหม่กว่าซึ่งเลื่อน focus ไปยัง strand ที่สอง

What happened before or during the interrupted attempt:
งานก่อนหน้าพัวพันกับทั้งสอง strands มากพอจนเมื่อกลับมา แต่ละอันยังดู plausibly current อยู่

Decision pressure:
ทางที่ง่ายที่สุดคือ resume branch ที่มี implementation trail หนากว่าและมี open PR อยู่แล้ว

Complication:
candidate works ทั้งสองมองเห็นและเรียกชื่อได้ แต่ signals ที่เห็นไม่ตรงกันว่าอันไหนควร govern resumed action จริง ความกำกวมไม่ได้อยู่แค่ว่ามีงานอะไรอยู่บ้าง แต่อยู่ที่ signal ไหนควรมีน้ำหนักเหนืออีกอัน

---

## Episode E-CON-02

Setting:
coding agent กลับเข้ามาใน repository หลังจากหยุดไปช่วงหนึ่ง ระหว่างที่กำลังทำ fix ที่ current work item ยังชัดอยู่ trusted state ล่าสุดไม่ได้บ่งชี้ว่ามี blocker, ownership handoff, หรือ waiting condition ใด ๆ งานนี้ควรทำต่อได้

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก agent ลดปัญหาลงเหลือ next edits ที่เป็นรูปธรรมสองทางภายใน active strand เดียวกัน

Visible records at resume time:
- มี current work item ที่เสถียรและไม่มี superseding record ที่ใหม่กว่า
- มี notes ที่บอกว่าตอนนี้ควร act ต่อ ไม่ใช่ wait หรือ escalate
- มีหลักฐานจาก repository ที่ทำให้ immediate next edits สองทางยังดู plausible
- ไม่มี tracker, handoff, หรือ later state record ที่แข่งกันและบอกว่าควรเชื่อ governing source คนละตัว

What happened before or during the interrupted attempt:
attempt ก่อนหน้านี้ resolve คำถามระดับบนไปแล้วว่าควรทำต่อหรือไม่ สิ่งที่ยังไม่ settled คือควรทำ concrete implementation move ไหนก่อน

Decision pressure:
agent ต้อง resume ด้วยการเลือก next admissible edit แล้วทำต่อ

Complication:
agent รู้แล้วว่าควรทำงานต่อ และไม่ได้กำลังเลือกท่ามกลาง competing records สิ่งที่ยังไม่รู้คือในสอง edits ที่ plausible นั้น ควรลงมืออันไหนก่อนภายใน work strand เดียวที่ govern อยู่แล้ว

---

## Episode E-HIS-01

Setting:
coding agent กลับมาที่ work tracker ในเช้าวันถัดจากที่ patch ถูก mark ว่า complete tracker แสดงว่างาน done แล้ว และ implementation notes ก็ชี้ว่าภารกิจการเขียนโค้ดหลักจบลงแล้ว อย่างไรก็ตาม engineering-side record ที่อยู่ข้างเคียงกลับบอกว่ายังมี follow-up safeguard หนึ่งรายการที่ยังเปิดอยู่ ก่อนจะถือว่างานนี้ปิดสมบูรณ์ได้

Interruption boundary:
session ก่อนหน้าหยุดลงหลังจาก visible done-signal ปรากฏ แต่ก่อนที่ residual follow-up obligation จะถูก resolve

Visible records at resume time:
- มี tracker หรือ status surface ที่แสดงว่างาน complete แล้ว
- มี implementation notes ที่ย้ำภาพว่าปิดงานเรียบร้อยแล้ว
- มี engineering-side record ที่ใหม่กว่าซึ่งบอกว่ายังมี follow-up obligation หนึ่งอันที่ยัง govern อยู่

What happened before or during the interrupted attempt:
agent มีเหตุผลที่ชอบธรรมที่จะเชื่อว่า implementation หลักเสร็จแล้ว แต่ lifecycle state ของงานยัง settle ไม่สะอาดก่อนจะหยุดไป

Decision pressure:
ทางที่เป็นธรรมชาติคือมองว่างานที่ดู complete นี้ปิดแล้ว และขยับไปทำงานอื่น

Complication:
done-signal ที่มองเห็นอาจเป็นของจริง แต่ยังไม่เพียงพอ การตัดสินใจเมื่อกลับมาขึ้นอยู่กับว่า obligation ที่เหลืออยู่นั้นหมายความว่างานยังต้องการความสนใจต่อหรือไม่ แม้จะมี completion marker แล้วก็ตาม

---

## Episode E-CON-03

Setting:
coding agent กลับมาหลังจากมีการเปลี่ยน priority ชั่วคราวภายในวันทำงานเดียวกัน ก่อนถูกขัดจังหวะ agent กำลังทำ cleanup ความเสี่ยงต่ำในบริเวณหนึ่งของ repository ระหว่างช่วง interruption มี teammate redirect ความสนใจไปยังบั๊กที่ด่วนกว่าในอีกบริเวณหนึ่ง แต่ cleanup branch และ notes เดิมก็ยังมองเห็นและยังใหม่อยู่

Interruption boundary:
session ก่อนหน้าหยุดลงตอน agent switch ออกจาก cleanup task หลังจากบั๊กด่วนถูกยกขึ้นมา แต่การ switch นั้นไม่ได้ถูก externalize เข้าสู่ working notes อย่างชัดเจน

Visible records at resume time:
- มี local note ล่าสุดอธิบาย next cleanup edit
- มี open bug report และ team instruction ที่ใหม่กว่าเกี่ยวกับบั๊กด่วน
- มี branch และ file context ที่ยังทำให้ cleanup task ดู resumable ได้ทันที

What happened before or during the interrupted attempt:
agent ทำ cleanup ไปมากพอจนเส้นทางเดิมยังให้ความรู้สึกคุ้นมือในระดับ local บั๊กด่วนได้รับการ acknowledge แล้ว แต่ handoff ระหว่างสอง strands ไม่เคยถูกทำให้เสถียรเป็น current-work record เดียว

Decision pressure:
ทางง่ายที่สุดคือเปิดไฟล์ cleanup กลับขึ้นมาและทำ change ที่เกือบเสร็จนั้นต่อ

Complication:
ปัญหาหลักไม่ใช่ว่า record ไหน govern งานที่รู้จักอยู่หนึ่งชิ้น ปัญหาหลักคือ resumed action ยังขึ้นอยู่กับการตัดสินว่า work ไหนคือ current work จริง ระหว่าง cleanup task เดิมที่ local continuity แข็งแรง กับ urgent bug strand ที่ใหม่กว่า

---

## Episode E-CON-04

Setting:
coding agent กลับมาที่ repository task ที่ทั้ง work item, owner, และ target code area ชัดอยู่แล้ว fix เองก็เข้าใจแล้ว และ implementation path ที่เหลือก็ดูตรงไปตรงมา แต่อย่างไรก็ตาม external dependency หนึ่งอย่างยังไม่ได้รับ approval ให้ใช้ในการเปลี่ยนแปลงครั้งนี้

Interruption boundary:
session ก่อนหน้าหยุดลงหลังจาก agent ระบุ code change ที่อยากทำได้แล้ว แต่ก่อนที่ required approval จะมาถึง

Visible records at resume time:
- มี stable work item สำหรับ fix เดิม
- มี recent note ที่บอกว่าควรรอ approval สำหรับ external dependency นี้
- มี cue จาก repository ที่ยังทำให้ code change นี้ดูเหมือนทำได้ทันที

What happened before or during the interrupted attempt:
agent ลดงานลงมาเป็น implementation plan ที่เฉพาะเจาะจงแล้ว ไม่มีอะไรในตอนกลับมาที่บอกว่ามี work item หรือ competing state record อื่นที่ควร govern แทน

Decision pressure:
แรงดึงตามธรรมชาติคือทำ change นี้เลย เพราะ coding path มองเห็นได้ชัด และตัวงานเองก็ยัง active อย่างชัดเจน

Complication:
คำถามที่ยังไม่ resolve คือ present action mode เป็น `act` หรือ `wait` กันแน่ work identity และ governing state settled แล้ว เหลือเพียงว่าการทำต่อก่อน approval จะมาถึงนั้นอนุญาตได้หรือไม่

---

## Episode E-CON-05

Setting:
coding agent กลับมาที่ repository task ซึ่งดูเหมือนปิดแล้วเมื่อมองครั้งแรก tracker mark ว่างาน complete patch ถูก merge แล้ว และ implementation notes ก็อ่านเหมือนเรื่องที่จบแล้ว อย่างไรก็ตาม ภาพของ closure นี้กลับขึ้นอยู่กับ verification step ที่ไม่เคยถูกบันทึกว่าผ่านจริง

Interruption boundary:
session ก่อนหน้าจบลงหลังจากงานถูก mark ว่า complete แต่ก่อนที่ใครจะเช็กว่า final verification ที่จำเป็นนั้นเกิดขึ้นจริงหรือไม่

Visible records at resume time:
- มี tracker status แสดงว่างาน done แล้ว
- มี implementation notes ที่บรรยายว่าการเปลี่ยนแปลงเสร็จแล้ว
- ไม่มี record อิสระที่ยืนยันว่า required final verification สำเร็จจริง

What happened before or during the interrupted attempt:
agent มี success signals มากพอจะเชื่อว่างานนี้ปิดแล้ว จึงถือว่างานเสร็จตอนจบ session

Decision pressure:
ทางที่เป็นธรรมชาติคือ archive งานนี้แล้วไปโฟกัสอย่างอื่น

Complication:
ประเด็นที่เหลือไม่ใช่ว่างานไหน current และไม่ใช่ว่า state record ไหนควร govern ประเด็นคือ closure เคย valid จริงหรือไม่ เพราะ final closure condition ดูเหมือนจะขาดหายไป ไม่ใช่แค่ยังไม่สมบูรณ์

---

## Episode E-CON-06

Setting:
agent กลับมาที่ repository ที่มี strands สองเส้นซึ่งทับซ้อนกันบางส่วนและยังเปิดอยู่ หลังจากช่วงบ่ายที่เต็มไปด้วย interruptions เส้นหนึ่งเป็น refactor ที่ยังไม่เสร็จและมี local branch active อีกเส้นเป็น bugfix card ที่ถูก escalate ช่วงท้ายวัน และไม่เคยถูก assign กลับเข้า working notes อย่างชัดเจน

Interruption boundary:
session ก่อนหน้าจบลงก่อนที่ agent จะ settle ได้ว่า strands สองเส้นที่ยังเปิดนี้ เส้นไหนควรถูกถือเป็น current เมื่อกลับมาทำงาน

Visible records at resume time:
- มี local branch และ note trail สำหรับ refactor
- มี bugfix card ที่ใหม่กว่าและถูก flag ว่าด่วน
- มี open files และ recent commands ที่แตะทั้งสอง strands

What happened before or during the interrupted attempt:
agent สลับไปมาระหว่าง refactor กับ bugfix ภายใน session เดียวกัน ไม่มี strand ไหนถูกปิด และไม่มี strand ไหนถูก demote อย่างสะอาด

Decision pressure:
ทางง่ายที่สุดคือทำ refactor ต่อ เพราะมี local continuity trail ที่หนากว่า

Complication:
ปัญหาไม่ใช่แค่ว่าสอง records ขัดกันเรื่อง work item ที่ระบุได้แล้ว ปัญหาที่ลึกกว่าคือ resumed action ยังต้อง triage ก่อนว่า work ไหนควรเป็น current work ตั้งแต่แรก เพราะทั้งสอง strands ยังดู live ได้ทั้งคู่

---

## Episode E-CON-07

Setting:
coding agent กลับเข้ามาใน repository หลังจากมีช่วงหายไปสั้น ๆ ที่เกิดจาก environment change ก่อนถูกขัดจังหวะ local notes และ open branch ยังชี้ไปยัง implementation task เดียวได้อย่างชัด ระหว่างช่วงที่หายไป automated status surface มีการ refresh และตอนนี้แสดงว่า later state อื่นควร govern next move แทน

Interruption boundary:
งานหยุดไปนานพอที่ visible environment-facing state จะอัปเดต แต่ไม่นานพอที่ local trail เดิมจะหายไปหรือ stale อย่างชัดเจน

Visible records at resume time:
- มี local note และ branch ที่ยังชี้ไปยัง implementation path เดิม
- มี status surface ที่ใหม่กว่าซึ่งแสดงว่า work state เปลี่ยนไประหว่าง interruption
- ไม่มี bridge note ที่อธิบายชัดว่าเหตุใด surface ที่ใหม่กว่าควรมีน้ำหนักเหนือ local trail เดิม

What happened before or during the interrupted attempt:
agent ได้ orient ตัวเองกับ work path เดิมไปแล้ว และคงจะทำต่อทันทีถ้าไม่มี surface ใหม่โผล่มา

Decision pressure:
ทางตรงไปตรงมาที่สุดคือเชื่อ local continuity ที่หนากว่าและทำ implementation ต่อ

Complication:
ความไม่แน่นอนหลักคือ visible record อันไหนกันแน่ที่มีสิทธิ govern current state ของงานหลัง environment shift ปัญหายังไม่ใช่ว่าภายใต้ state ที่ govern แล้วควร `wait` หรือ `act` แต่คือ changed-state signal ที่ใหม่กว่าควรมีน้ำหนักเหนือ local thread เดิมตั้งแต่ต้นหรือไม่

---

## Episode E-CON-08

Setting:
coding agent resume repository task หลังจาก model หรือ operator คนอื่นเคยรับงานเดียวกันนี้มาก่อน ตัวงานเองยังรู้ว่าเป็นอะไร และ trusted work record ล่าสุดก็บอกว่าการเปลี่ยนแปลงนี้ถูก block อยู่เพราะยังขาด ownership confirmation จากอีกทีมหนึ่ง

Interruption boundary:
resume point นี้เกิดขึ้นที่ handoff boundary: มี actor คนก่อนกำลัง carry งานนี้อยู่ แล้วหยุดไปก่อนที่ blocker จะถูกเคลียร์

Visible records at resume time:
- มี stable work item สำหรับ repository change เดิม
- มี handoff notes ที่อธิบายว่ายังเหลืออะไรต้องทำ
- มี blocker note ที่บอกว่า ownership confirmation ยังไม่มา

What happened before or during the interrupted attempt:
actor ก่อนหน้าลดงานนี้ลงมาได้ละเอียดพอที่ implementation path จะพอเข้าใจได้ แต่ blocker ยังไม่ถูก resolve ตอน handoff

Decision pressure:
incoming agent ถูกล่อให้ทำ implementation ต่ออยู่ดี เพราะตัวงานและ intended change อ่านออกจาก handoff notes ได้ชัด

Complication:
ประเด็นที่ยังไม่ resolve ไม่ใช่ว่าใคร owns งานนี้ และไม่ใช่ว่า next code edit ควรเป็นอะไร ประเด็นคือ valid present mode ยังเป็น `wait` หรือ `ask` อยู่แทน `act` หรือไม่ เพราะ blocker ยังค้างข้าม handoff มา

---

## Episode E-CON-09

Setting:
coding agent กลับมาทำงานต่อทันทีหลังจาก recover จาก failed validation attempt ตัว failure เองถูกเข้าใจและควบคุมไว้แล้ว งานยัง active อยู่ใน repository area เดิม แต่ตอนนี้มีทาง repair สองทางที่ดู plausible: จะปรับ implementation ตรง ๆ เลย หรือจะไป tighten helper ที่เกี่ยวข้องก่อนซึ่งดูเหมือนจะเป็นต้นเหตุจริง

Interruption boundary:
session ก่อนหน้าจบลงตรง failed validation step ที่เด่นชัด หลังจากระบุตำแหน่งของ failure ได้แล้ว แต่ก่อนเลือก repair path ถัดไป

Visible records at resume time:
- มี failed validation result จาก attempt ก่อนหน้า
- มี notes ที่บอกว่างานยัง active อยู่ใน strand เดิม
- มี repair directions ที่เป็นรูปธรรมสองทางและดู admissible ในระดับ local
- ไม่มี blocker ใหม่หรือ superseding work record

What happened before or during the interrupted attempt:
agent resolve คำถามระดับบนไปแล้วว่าควรทำงานต่อหลัง failure หรือไม่ recovery กำลังเริ่มต้น แต่ next concrete repair move ยังไม่ settled

Decision pressure:
ทางที่เป็นธรรมชาติคือรีบเลือก repair ทางหนึ่งแล้วรักษา momentum ไว้

Complication:
ประเด็นที่ยังไม่ resolve ไม่ใช่อีกต่อไปว่าหลัง failure จะ act ได้หรือไม่ ประเด็นคือควรทำ concrete next repair ไหนก่อนภายใน governed work strand เดิม

---

## Episode E-CON-10

Setting:
coding agent กลับมาที่งานซึ่ง main implementation เสร็จจริงไปแล้วใน session ก่อนหน้า มี valid completion marker อยู่ และ core change ก็ได้รับการยอมรับแล้ว ขณะเดียวกัน follow-up safeguard หนึ่งอย่างที่อยู่ใน obligation chain เดียวกันยังเปิดค้างอยู่ และยัง govern อยู่ว่าจะถือว่างานนี้ settled สมบูรณ์ได้หรือไม่

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก main implementation ถูกปิดสำเร็จแล้ว แต่ก่อนที่ residual safeguard จะถูกทำเสร็จ

Visible records at resume time:
- มี valid completion marker สำหรับ main implementation
- มี notes ที่บอกว่า central change ลงได้ตามตั้งใจ
- มี reminder ที่ใหม่กว่าซึ่งบอกว่ายังมี safeguard หนึ่งอย่างที่ govern อยู่และยังไม่เสร็จ

What happened before or during the interrupted attempt:
session ก่อนหน้ามีเหตุผลที่ชอบธรรมจะถือว่า main implementation done แล้ว ดังนั้น done-signal นี้ไม่ใช่สัญญาณปลอม

Decision pressure:
ทางที่ง่ายที่สุดคือยอมรับ done marker แล้วขยับไปต่อ เพราะ primary implementation path จบชัดแล้ว

Complication:
ประเด็นคือสำหรับ resumptive purposes งานนี้ปิดสมบูรณ์หรือยังยัง active อยู่เพราะ safeguard ที่เหลือยัง govern follow-up action ต่ออยู่ นี่ไม่ใช่ false completion แต่เป็น completion จริงที่ยังมี residual obligation พ่วงอยู่

---

## Episode E-SWE-03

Setting:
coding agent กลับมาที่ repo-grounded task ใน SWE-bench harness area หลัง interruption สั้น ๆ local trail เดิมยังชี้ไปยัง implementation path หนึ่งอยู่ แต่ structured status surface ที่ใหม่กว่าตอนนี้กลับบอกว่า path เดิมถูก supersede ไปด้วย governing state อื่น

Interruption boundary:
session ก่อนหน้าหยุดลงขณะที่ path เดิมยังดู active ในระดับ local และ governing state ที่ใหม่กว่านั้นเพิ่งมองเห็นได้หลัง interruption

Visible records at resume time:
- มี local note ผูกกับ harness-side path เดิม
- มี open work trail ที่ยังดู coherent ใน area เดิม
- มี structured record ที่ใหม่กว่าระบุว่า state เดิมไม่ควร govern อีกต่อไป
- ไม่มี reconciliation note ที่อธิบายชัดว่าทำไม later record จึงมีน้ำหนักเหนือ local thread เดิม

What happened before or during the interrupted attempt:
agent ลงแรงทำความเข้าใจกับ path เดิมไปมากพอจนตอนกลับมามันยังดูเป็น continuation route ที่ง่ายที่สุด

Decision pressure:
ทางที่เป็นธรรมชาติคือ resume path เดิม เพราะมี immediate continuity signal ที่แรงที่สุด

Complication:
ประเด็นที่ยังไม่ resolve คือ visible source อันไหนควร govern current state ของงานหลัง interruption episode นี้ไม่ได้เกี่ยวหลัก ๆ กับ missing approval หรือ waiting condition แต่เกี่ยวกับ later state transition ควร override local continuity เดิมหรือไม่

---

## Episode E-SWE-07

Setting:
coding agent resume repo-grounded task ที่ current work ระบุได้ดีอยู่แล้ว และ governing state ก็เสถียร work strand เดิมยัง active อยู่ แต่ trusted state ล่าสุดบอกว่าต้อง escalation ก่อน implementation จะทำต่อได้อย่างปลอดภัย

Interruption boundary:
session ก่อนหน้าหยุดลงหลัง agent เข้าใจงานที่เหลือแล้ว แต่ยังไม่ได้ทำ escalation ที่จำเป็นเพื่อ unblock task นี้

Visible records at resume time:
- มี stable repo-grounded work item ใน source area เดิม
- มี trusted state record ที่บอกว่างานนี้ block อยู่และรอ escalation
- มี cue จาก repository ที่ยังทำให้ implementation path ดูลงมือได้ในระดับ local

What happened before or during the interrupted attempt:
agent ลดงานลงมาเป็น concrete implementation plan แล้ว ไม่มี competing work strand หรือ governing record ที่ใหม่กว่าโผล่มาตอน resume

Decision pressure:
แรงดึงตามธรรมชาติคือทำ implementation ต่อ เพราะ code path มองเห็นได้และงานก็ยัง active ชัดเจน

Complication:
ประเด็นที่ยังไม่ resolve ไม่ใช่ว่างานไหน current และไม่ใช่ว่า record ไหน govern งานนั้น ประเด็นคือ valid present mode ยังเป็น `escalate` หรือ `wait` อยู่แทน `act` หรือไม่ แม้ implementation path เองจะนึกออกได้ง่าย

---

## Episode E-HIS-02

Setting:
coding agent resume work item จาก internal prototype history ที่ current task ชัดอยู่แล้ว และ latest credible work state ก็ยังชี้ไปยัง implementation area เดิม handoff notes บอกว่างานยัง block อยู่เพราะขาด ownership confirmation จากอีกทีมหนึ่ง แม้ implementation path เองจะเข้าใจแล้วก็ตาม

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก agent ลดงานลงมาเป็น concrete implementation plan ได้แล้ว แต่ก่อนที่ required ownership confirmation จะมาถึง

Visible records at resume time:
- มี stable work item ที่อธิบาย change เดิม
- มี handoff note ที่ mark ว่างาน block อยู่และรอ ownership confirmation
- มี implementation notes ที่ยังทำให้ code path ดูเหมือนทำต่อได้ง่าย

What happened before or during the interrupted attempt:
attempt ก่อนหน้าทำให้ชัดแล้วว่าจะสร้างอะไรและสร้างที่ไหน ไม่มี competing work strand หรือ rival state record ปรากฏในตอนกลับมา

Decision pressure:
ทางที่เป็นธรรมชาติคือทำ implementation ต่อ เพราะ code path ยังดู obvious ในระดับ local

Complication:
ประเด็นที่ยังไม่ resolve คือการ act ตอนนี้ได้รับอนุญาตจริงหรือไม่ work identity และ governing state settled แล้ว เหลือเพียงว่า mode ที่ถูกต้องยังเป็น `wait` หรือ `ask` อยู่แทน `act` หรือไม่

---

## Episode E-HIS-03

Setting:
coding agent กลับมาที่ internal work item ซึ่งถูก archive ว่า finished แล้ว หลังจากมีทั้ง documentation pass และ implementation pass tracker แสดงว่าปิดแล้ว แต่การตัดสินใจปิดงานครั้งนั้นพึ่งพา summary artifact ที่ไม่เคยถูกสร้างขึ้นจริง แม้งานจะถูกถือราวกับว่า final condition นั้นสำเร็จแล้วก็ตาม

Interruption boundary:
session ก่อนหน้าจบลงเมื่อ item นี้ถูก mark ว่า done ก่อนจะเช็กว่ามี summary หรือ closure artifact ที่ขาดอยู่นั้นจริงหรือไม่

Visible records at resume time:
- มี done marker บน work item
- มี notes ที่สื่อว่างานนี้ไปถึง closure แล้ว
- ไม่มี summary artifact หรือ equivalent closure evidence ในตำแหน่งที่ควรมี

What happened before or during the interrupted attempt:
session ก่อนหน้ามี progress evidence มากพอจะทำให้ closure ดู plausible จึง archive งานนี้ไปโดยไม่มี final verification แบบ explicit ของ closing artifact

Decision pressure:
ทางที่ง่ายที่สุดคือปล่อยให้งานนี้ปิดอยู่ต่อไปและไปใช้เวลาอย่างอื่น

Complication:
ประเด็นที่ยังไม่ resolve คือ closure เคย valid จริงหรือไม่ ปัญหาไม่ใช่ residual follow-up หลังจาก completion จริง แต่คือ required closing condition ดูเหมือนไม่เคยถูก satisfy ตั้งแต่แรก

---

## Episode E-HIS-04

Setting:
coding agent กลับมาหลัง internal handoff ที่ actor คนหนึ่งปิดส่วนของงานตัวเองและทิ้ง summary ไว้ ซึ่งดูมี authority สูง ขณะเดียวกัน active-work record ที่ใหม่กว่ากลับชี้ไปยัง strand อื่นที่ยังเปิดอยู่และอาจ govern อยู่แทน

Interruption boundary:
session ก่อนหน้าจบลงที่ handoff boundary และ actor คนถัดไปกลับมาพร้อมกับทั้ง closing summary ของ strand เก่า และ active-work signal ที่ใหม่กว่าสำหรับอีก strand หนึ่งซึ่งยังมองเห็นอยู่

Visible records at resume time:
- มี handoff summary ที่ consolidate strand หนึ่งซึ่งดูเหมือน complete แล้ว
- มี active-work signal ที่ใหม่กว่าและชี้ไปยัง follow-up strand ที่ยังเปิดอยู่
- มี notes ที่ไม่ได้ reconcile อย่างชัดเจนว่า record ไหนควร govern resumed action

What happened before or during the interrupted attempt:
actor คนก่อนทิ้ง structured summary state ไว้มากพอจนดูสมเหตุสมผลที่จะถือว่า summarized strand นั้นคือสิ่งหลักที่ควรย้อนกลับไปดู

Decision pressure:
ทางที่เป็นธรรมชาติคือเชื่อ polished summary เพราะมันดูเหมือน handoff artifact ที่ตั้งใจที่สุด

Complication:
ประเด็นที่ยังไม่ resolve คือ record ไหนกันแน่ที่มีสิทธิ govern หลัง handoff boundary ปัญหาไม่ใช่ว่างานตั้งชื่อไม่ได้ แต่คือ fresher active strand กับ polished closing summary กำลังแข่งกันกำหนดว่าควรทำอะไรต่อ

---

## Episode E-PUB-01

Setting:
coding agent กลับมาที่ public issue-driven workflow หลังถูกดึงออกไปกลาง session ก่อน interruption มันกำลังตาม code-change thread หนึ่งที่มองเห็นได้ ระหว่างช่องว่างนั้น attention ถูกย้ายไปยังปัญหาใหม่จากภายนอกซึ่งตอนนี้ถูกถือว่าเป็น urgent item แต่ earlier thread ก็ยังดู active จาก local branch และ recent notes

Interruption boundary:
session ก่อนหน้าจบลงตอนที่ attention switch ไปยัง public issue ใหม่ แต่การ switch นั้นไม่ได้ถูก externalize เป็น stable current-work marker เดียวอย่างสะอาด

Visible records at resume time:
- มี recent local note สำหรับ earlier thread
- มี public issue thread ที่ใหม่กว่าและถูก mark ว่าเป็น urgent problem
- มี branch state และ recent files ที่ยังทำให้ earlier thread ดู live

What happened before or during the interrupted attempt:
agent ได้ progress บน code path เดิมไปแล้ว จึงยังรู้สึกว่านี่คือสิ่งที่ resume ง่ายที่สุด

Decision pressure:
ทางที่ตรงไปตรงมาคือทำ earlier thread ต่อ เพราะมี immediate continuity ที่หนาที่สุด

Complication:
ประเด็นหลักที่ยังไม่ resolve คือ work ไหนกันแน่ที่ควร govern resumed action ความยากไม่ใช่เรื่อง record precedence ภายใน known work item เดียว แต่คือการ triage ระหว่าง work strands สองเส้นที่ plausible หลัง priority shift

---

## Episode E-PUB-02

Setting:
coding agent กลับมายัง public-facing development environment ที่ conversation หรือ runtime เก่าหนึ่งยังดู active อยู่ แม้อีก strand ที่ใหม่กว่าจะเริ่มไปแล้ว strand เก่ายังแสดงสถานะคล้าย active ขณะที่ strand ใหม่เป็นตัวที่มี forward motion จริง

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก runtime หรือ conversation เก่าถูกหยุดไปแล้ว แต่ visible status surface ยัง settle ไม่ครบก่อนที่ strand ใหม่จะเริ่มขึ้น

Visible records at resume time:
- มี strand เก่าที่บน status surface ยังดู active
- มี strand ใหม่ที่ activity สดกว่าและมี forward progress จริง
- ไม่มี record ที่ explicit ว่า strand ไหนควรถูกนับว่า current

What happened before or during the interrupted attempt:
strand เก่าไม่ได้ถูกเอาออกจาก visible activity field อย่างสะอาด จึงยังแข่งเรียกร้องความสนใจหลัง resume boundary

Decision pressure:
ทางที่เป็นธรรมชาติคือคลิกกลับไปที่ strand เก่า เพราะมันยังดู live

Complication:
การตัดสินใจตอน resume ขึ้นอยู่กับการตัดสินว่าใน strands ที่ยังมองเห็นนี้ strand ไหนคือ current จริง ความกำกวมไม่ได้มีแค่ว่า status surface stale แต่คือยังมี work candidates หลายอันที่ดูเปิดอยู่พร้อมกัน

---

## Episode E-PUB-03

Setting:
coding agent กลับมายัง public issue environment ที่ infrastructure surface หนึ่งบอกว่า runtime หรือ backend พร้อมใช้งานแล้ว ขณะที่อีก surface หนึ่งยังรายงานว่า startup ยังไม่เสร็จและงานยังทำต่อไม่ได้ overall task เดิมยังอยู่ แต่ surfaces เหล่านี้ไม่ตรงกันว่า state ไหนควรถูกเชื่อ

Interruption boundary:
session ก่อนหน้าหยุดลงขณะระบบยังรอ initialization อยู่ และ conflicting signals เหล่านั้นยังมองเห็นได้เมื่อกลับมาทำงาน

Visible records at resume time:
- มี runtime-facing signal หนึ่งบอกว่าบริการดูเหมือนขึ้นแล้ว
- มีอีก surface หนึ่งที่ยังรายงานว่า startup ยังไม่ complete
- มี user-facing task เดิมที่ยัง active ข้ามช่วงหยุดมา

What happened before or during the interrupted attempt:
attempt ก่อนหน้ามี partial success มากพอจนตอนนี้ signal หนึ่งดูเหมือนบอกว่า environment พร้อมแล้ว แม้ blocking surface จะไม่เคยเคลียร์ก็ตาม

Decision pressure:
ทางที่ง่ายที่สุดคือเชื่อ surface ที่ดูเป็นบวกในเชิง operational มากกว่า แล้วทำต่อ

Complication:
ประเด็นที่ยังไม่ resolve คือ visible state source อันไหนควร govern current work state หลัง interruption episode นี้ยังไม่ใช่เรื่องเลือก `act` กับ `wait` ภายใน trusted state แต่เป็นเรื่อง state ใดกันแน่ที่ควรได้รับความเชื่อถือก่อน

---

## Episode E-PUB-04

Setting:
coding agent resume public agent workflow หลังจากมี task-tracking หรือ coordination action ถูกยิงออกไป แต่ระบบกลับค้างแทนที่จะดำเนินต่ออย่างสะอาด task เองยังรู้ว่าเป็นอะไร และงานเดิมก็ยัง active อยู่ แต่ actor หรือ session ถัดไปไม่รู้ว่าปลอดภัยหรือไม่ที่จะ execute ต่อ หรือควรรอให้ stuck coordination state คลี่คลายก่อน

Interruption boundary:
session ก่อนหน้าจบลงที่ coordination หรือ task-tracking boundary ตรงจุดที่ workflow หยุดความคืบหน้า

Visible records at resume time:
- มีคำอธิบายที่เสถียรของ active work เดิม
- มี stuck state ที่มองเห็นได้ทันทีหลัง tracking หรือ coordination step
- ไม่มี competing work strand ที่บอกว่าตอนนี้มี task อื่น govern อยู่แทน

What happened before or during the interrupted attempt:
task นี้ยังเข้าใจได้และดู act ได้ในระดับ local แต่ workflow ไม่เคย advance ผ่าน coordination step ไปได้อย่างสะอาด

Decision pressure:
แรงดึงตามธรรมชาติคือพยายาม push task เดิมต่อ เพราะตัวงานเองยังดูรู้เรื่องอยู่

Complication:
ประเด็นที่ยังไม่ resolve คือ present action ยังได้รับอนุญาตอยู่หรือไม่หลัง stalled coordination boundary work identity และ governing state ชัดแล้ว เหลือคำถามเพียงว่าจะ `wait`, `ask`, หรือ `act`

---

## Episode E-PUB-05

Setting:
coding agent กลับมาที่ public batch-run scenario หลังจาก session ก่อนหน้าจบลงก่อนจะทำ next command sequence เดียวกัน work item เดิมยัง active, governing run configuration ก็ไม่เปลี่ยน และ action ก็ยัง allowed แต่ตอนนี้มี immediate next operations สองทางที่ดู plausible เท่ากัน: จะ rerun small single-instance path ก่อน หรือจะ push batch path ต่อด้วย adjusted flag หนึ่งตัว

Interruption boundary:
session ก่อนหน้าจบลงก่อน next command sequence จะถูก execute แม้ work strand เองยังเสถียรอยู่

Visible records at resume time:
- มี stable work item ที่ผูกกับ public run configuration เดิม
- มี notes ที่บอกว่าควรทำต่อใน strand เดิม
- มี concrete next commands สองทางที่ทั้งคู่ดู defensible ในระดับ local

What happened before or during the interrupted attempt:
agent ตัดทางเลือกที่จะ abandon งานหรือ switch งานทิ้งไปแล้ว สิ่งที่ยังไม่ resolve คือควรลอง concrete next operation ไหนก่อน

Decision pressure:
ทางที่เป็นธรรมชาติคือรีบเลือก command หนึ่งแล้วเดิน run ต่อ

Complication:
ประเด็นที่ยังไม่ resolve ไม่ใช่ว่า action อนุญาตอยู่หรือไม่ ประเด็นคือควรทำ concrete next operation ไหนก่อนภายใน work strand เดียวที่ยัง govern อยู่

---

## Episode E-PUB-06

Setting:
coding agent กลับมาหลังจาก public issue thread บันทึก failed code-edit attempt ที่ก่อ syntax-related error และเริ่ม loop กับ failures ที่ใกล้เคียงกัน overall work ยัง active อยู่ การ recover ยัง justified และ session ถัดไปต้องเลือกว่าจะ repair failure นี้อย่างไรโดยไม่กลับเข้า loop เดิม

Interruption boundary:
session ก่อนหน้าจบลงที่ salient failure boundary หลังจากเห็น failing repair attempts ชุดแรกไปแล้ว

Visible records at resume time:
- มี syntax-related failure และ looping behavior จากก่อนหน้า
- มี still-active work item เดิม
- มี next recovery moves ที่ plausible สองทาง เช่น แก้ immediate edit path ตรง ๆ หรือ tighten helper หรือ format assumptions ที่อยู่ข้างหลังมันก่อน

What happened before or during the interrupted attempt:
session ก่อนหน้า establish ไปแล้วว่าควรทำงานต่อ ไม่ใช่ abandon failure นี้ถูกเข้าใจพอสมควรจน resumed action ได้ แต่ next repair path ยังไม่ถูก fix

Decision pressure:
ทางที่ง่ายที่สุดคือ retry เร็ว ๆ เพื่อดึง momentum กลับมา

Complication:
ประเด็นที่ยังไม่ resolve คือ concrete recovery move ไหนควรถูกลองก่อนหลัง failure boundary ปัญหาไม่ใช่อีกต่อไปว่า agent ควรทำงานต่อหรือไม่ แต่คือจะเดินหน้าต่ออย่างไรโดยไม่เดาสุ่ม next repair

---

## Episode E-SWE-04

Setting:
coding agent กลับมาที่ repo-grounded SWE-bench source area หลังจาก actor หรือ model คนอื่นเคยจัดการ strand เดียวกันนี้มาก่อน ตัวงานเองยังพอระบุได้ แต่ actor คนใหม่ inherit ทั้ง local trail และ handoff-oriented source record ที่อาจนิยามใหม่ว่าควรให้สิ่งใด govern ต่อ

Interruption boundary:
session ก่อนหน้าจบลงที่ handoff boundary ก่อนที่ actor คนถัดไปจะ reconcile ระหว่าง local trail ที่ inherited มากับ handoff state ที่ใหม่กว่า

Visible records at resume time:
- มี local trail ใน source area เดิม
- มี handoff-oriented state record ที่อธิบายว่าอะไร govern อยู่ตอนนี้
- ไม่มี reconciliation note ที่ explicit ว่าสองอย่างนี้อะไรควรมีน้ำหนักเหนือกว่า

What happened before or during the interrupted attempt:
actor คนก่อนทิ้ง material ไว้มากพอจน path เก่ายังดูยั่วยวนให้ resume ตรง ๆ

Decision pressure:
ทางที่ง่ายที่สุดคือทำ local path ที่หนากว่าต่อ แทนที่จะตีความ handoff state ใหม่

Complication:
ประเด็นที่ยังไม่ resolve คือ visible record อันไหนควรนิยาม current state ของงานหลัง actor boundary งานยังตั้งชื่อได้อยู่ แต่สิ่งที่ยังไม่ settled คือ record precedence หลัง handoff

---

## Episode E-SWE-05

Setting:
coding agent กลับมาที่ repo-grounded source area ซึ่งมี work strands สองเส้นที่ plausible และยังมองเห็นได้อยู่ใน artifact field เส้นหนึ่งมาจาก parser-side trail ที่ยังดู active ในระดับ local อีกเส้นมาจาก neighboring strand ที่มี recent status cues แข็งแรงกว่า

Interruption boundary:
session ก่อนหน้าจบลงก่อนที่ agent จะ resolve ว่าใน strands ที่มองเห็นสองเส้นนี้ เส้นไหนควรถูกนับว่าเป็น current work เมื่อตอนกลับมา

Visible records at resume time:
- มี local work trail หนึ่งเส้นพร้อม recent edits
- มี visible strand อีกเส้นพร้อม fresher status signals
- มี repository artifacts ที่รองรับว่าทั้งสอง strands ยังเป็น live candidates

What happened before or during the interrupted attempt:
session ก่อนหน้าแตะทั้งสอง strands มากพอจนแต่ละเส้นยังเป็น plausible resumed target ได้

Decision pressure:
ทางที่เป็นธรรมชาติคือทำ strand ที่มี local continuity หนากว่าต่อ

Complication:
ประเด็นหลักที่ยังไม่ resolve คือ work ไหนกันแน่ที่ควร govern resumed action ปัญหาไม่ใช่แค่การเลือกว่า record ไหนน่าเชื่อสำหรับ fixed work item หนึ่งอัน แต่เป็นการตัดสินตั้งแต่ต้นว่า work item ไหนคือ current work

---

## Episode E-SWE-06

Setting:
coding agent กลับมาที่ repo-grounded task หลังจาก active-context record เดิมยังค้างอยู่ให้เห็นนานเกินควร task ใหม่ที่เกี่ยวข้องกว่ากลับกลายมาเป็น path ที่เหมาะกว่าแล้ว แต่ stale active-context surface เดิมยังชี้ไปที่ strand เก่าและทำให้มันดูเหมือน resumable สด ๆ

Interruption boundary:
session ก่อนหน้าจบลงก่อนที่ stale active-context signal จะถูกแก้ และ task ใหม่เพิ่งมาเกี่ยวข้องหลัง boundary นั้น

Visible records at resume time:
- มี stale active-context surface ที่ชี้ไปยัง strand เก่า
- มี newer work trail ที่บอกว่าตอนนี้ควร focus ไปที่อื่น
- มี cue จาก repository ที่ยังทำให้ strand เก่าดู resumable ได้ง่าย

What happened before or during the interrupted attempt:
strand เก่ามี local continuity มากพอจนยังดึงดูดความสนใจเมื่อกลับมา แม้ working focus จะขยับไปแล้ว

Decision pressure:
ทางที่เห็นชัดคือเชื่อ active-context surface แล้วทำ strand เก่าต่อ

Complication:
ประเด็นที่ยังไม่ resolve คือหลัง focus shift แล้ว work ไหนคือ current work จริง stale surface มีส่วน แต่ปัญหาที่ลึกกว่าคือ resumed action ยังขึ้นอยู่กับการ triage current work identity ไม่ใช่การเลือกระหว่าง records สำหรับ task ที่ fixed อยู่แล้ว

---

## Episode E-SWE-08

Setting:
coding agent กลับมาที่ repo-grounded task หลังจาก plain session cutoff work item เดิมยัง active, governing state ก็เสถียร และไม่มีอะไรบ่งชี้ว่าต้อง wait หรือ escalate แต่อย่างไรก็ตาม immediate next edits สองทางยังดู plausible เพราะทั้ง source file หนึ่งและ utility layer หนึ่งต่างก็ดูเหมือนเป็นจุดเริ่มต้นที่สมเหตุสมผลสำหรับ change ถัดไป

Interruption boundary:
session ก่อนหน้าจบลงก่อนจะเลือก next code edit แม้ governing work state เดิมจะไม่เปลี่ยน

Visible records at resume time:
- มี stable current work item ใน source area เดิม
- ไม่มี record ใหม่ที่ supersede หรือ block งานนี้
- มีหลักฐานจาก repository ที่รองรับ immediate next edits สองทาง

What happened before or during the interrupted attempt:
session ก่อนหน้า resolve แล้วว่าตอนนี้ควรทำงานต่อ ความไม่แน่นอนที่เหลือมีเพียง code move ใดควรมาก่อน

Decision pressure:
ทางที่เป็นธรรมชาติคือเลือก edit หนึ่งอย่างเร็ว ๆ แล้ว resume execution

Complication:
ประเด็นที่ยังไม่ resolve คือ concrete next step ภายใน work strand เดียวที่ยัง govern อยู่ episode นี้ไม่ได้เกี่ยวกับว่า act ได้หรือไม่ แต่เกี่ยวกับ admissible next edit ไหนควรถูกทำก่อนหลัง session cutoff

---

## Episode E-SWE-09

Setting:
coding agent กลับมาที่ repo-grounded task ซึ่ง main implementation path ดูเหมือน complete แล้วจาก repository cues ชุดหนึ่ง มี valid completion marker สำหรับ primary work แต่ later still-governing signal กลับบอกว่ายังมี follow-up obligation ใน area เดียวกันอีกหนึ่งรายการที่ยังไม่เสร็จ

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก main path ไปถึง genuine completion point แล้ว แต่ก่อนที่ residual follow-up obligation จะถูก resolve

Visible records at resume time:
- มี repository signal ที่ดูเหมือน completion ของจริง
- มี notes ที่บอกว่า main work path ลงได้สำเร็จ
- มี later still-governing reminder ว่ายังมี follow-up obligation หนึ่งรายการค้างอยู่

What happened before or during the interrupted attempt:
session ก่อนหน้ามีเหตุผลที่ดีจะเชื่อว่า core implementation done แล้ว ดังนั้น completion marker นี้ไม่ใช่ของปลอม

Decision pressure:
ทางที่เป็นธรรมชาติคือยอมรับ completion signal แล้วขยับไปทำงานอื่น

Complication:
ประเด็นที่ยังไม่ resolve คือสำหรับ resumptive purposes งานนี้ปิดแล้วจริงหรือยัง active อยู่เพราะ follow-up ที่เหลือยัง govern action ต่อ นี่คือ done signal ของจริงที่ยังมี residual obligation ติดอยู่

---

## Episode E-SWE-10

Setting:
coding agent กลับมาที่ repo-grounded source area ที่งานเคยถูกถือว่า complete เพราะมี completion-looking signal หนึ่งอันปรากฏในบริบทของ repository แต่เมื่อดูใกล้ ๆ supposed closure นี้กลับพึ่งพา assumption ที่ไม่เคยถูกทำให้เป็นจริง จึงเป็นไปได้ว่างานถูกปิดเร็วเกินไป

Interruption boundary:
session ก่อนหน้าจบลงหลังจาก completion-looking signal ปรากฏ แต่ก่อนที่ใครจะเช็กว่า full closure condition สำเร็จจริงหรือไม่

Visible records at resume time:
- มี repository signal ที่ทำให้งานดูเหมือน done แล้ว
- ไม่มีหลักฐานชัดว่าข้อกำหนดปิดงานขั้นสุดท้ายเกิดขึ้นจริง
- ยังมี lingering cues ว่างานอาจยังต้องการความสนใจ แม้อยู่ในสภาพที่ดูเหมือน done

What happened before or during the interrupted attempt:
session ก่อนหน้าตีความ visible completion cue ว่าพอแล้วที่จะหยุดทำงานนี้

Decision pressure:
ทางที่ง่ายที่สุดคือปล่อยให้งานนี้ปิดอยู่ และใช้ apparent done state เป็นหลักฐานว่ามันไม่ govern action อีกแล้ว

Complication:
ประเด็นที่ยังไม่ resolve คือ closure เคย valid จริงหรือไม่ ปัญหาไม่ใช่ completion จริงที่ยังมี follow-up ค้าง แต่คือ completion-looking state อาจถูกยอมรับเร็วเกินไปโดยไม่มี closing evidence ที่จำเป็น

---

## Submission Sheet

ให้ใช้ response file คู่กัน:

- `docs/validation-30-episode-submission-template.md`

ไฟล์นั้นมี ready-to-fill block หนึ่งชุดสำหรับแต่ละ episode ใน packet นี้
