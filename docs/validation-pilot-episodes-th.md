# Validation Pilot Episodes (ฉบับภาษาไทย)

## จุดประสงค์

เอกสารนี้รวบรวม pilot episodes ชุดแรกจำนวน `5` ตอน สำหรับการทดลองใช้ taxonomy ว่าด้วย `interrupted coding work`

นี่คือเอกสาร `annotator-facing`
ให้ใช้คู่กับ:

- [validation-codebook-th.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-codebook-th.md)
- [validation-annotation-form-th.md](/Users/Lab/Desktop/WebWay/tasklog-mcp/docs/validation-annotation-form-th.md)

ห้ามใช้คู่กับ provenance ledger หรือ expected labels ระหว่าง annotate

---

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

---

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

---

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

---

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

---

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
