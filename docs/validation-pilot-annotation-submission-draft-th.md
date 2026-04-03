# Pilot Annotation Submission

Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

## Episode E-SWE-01
Episode ID: E-SWE-01
Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

Interruption Class: environment_drift
Dominant Loss Class: focus_loss
Boundary-Ambiguous: no
Nearest Alternative Class: none
Confidence: high

Justification:
เดิมมี local continuity ที่ชัด แต่ state ภายหลังเปลี่ยนไปจนทำให้ current work ไม่ชัด ดังนั้นปัญหาแรกที่ยังไม่ resolve คือ identity ของงานที่ควรทำต่อ จึงเป็น focus_loss

Notes:
None.

## Episode E-SWE-02
Episode ID: E-SWE-02
Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

Interruption Class: blocked_waiting
Dominant Loss Class: readiness_loss
Boundary-Ambiguous: no
Nearest Alternative Class: none
Confidence: high

Justification:
งานชัดอยู่แล้ว และ trusted state ก็ชี้ว่าการทำต่อยังขึ้นอยู่กับ approval ที่จำเป็น ดังนั้นสิ่งแรกที่ยังไม่ resolve คือ valid action mode ว่าตอนนี้ควรทำต่อหรือควรรอ จึงเป็น readiness_loss

Notes:
None.

## Episode E-CON-01
Episode ID: E-CON-01
Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

Interruption Class: multi_open_work_conflict
Dominant Loss Class: focus_loss
Boundary-Ambiguous: yes
Nearest Alternative Class: authority_loss
Confidence: high

Justification:
แม้ visible signals จะมีรายละเอียดค่อนข้างครบ แต่การที่งานเก่ายังไม่ปิดและยังมีอีก strand ที่ active อยู่ ทำให้ current work ยังไม่ชัด จึงเป็น focus_loss

Notes:
None.

## Episode E-CON-02
Episode ID: E-CON-02
Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

Interruption Class: multi_open_work_conflict
Dominant Loss Class: intent_loss
Boundary-Ambiguous: yes
Nearest Alternative Class: readiness_loss
Confidence: high

Justification:
มีทางเลือกที่ plausible มากกว่าหนึ่งทางภายใน resumed work เดียวกัน แต่โจทย์หลักไม่ใช่ว่าควรทำต่อได้หรือไม่ โจทย์หลักคือควรเริ่ม implementation move ไหนก่อน จึงเป็น intent_loss

Notes:
None.

## Episode E-HIS-01
Episode ID: E-HIS-01
Annotator ID: HUM-AUTH-01
Annotator Tier: human
Annotator Family: human

Interruption Class: dirty_done
Dominant Loss Class: closure_loss
Boundary-Ambiguous: no
Nearest Alternative Class: none
Confidence: high

Justification:
งานหลักดูเหมือนเสร็จแล้ว แต่ยังมี follow-up obligation ลักษณะคล้าย review หรือ safeguard ที่ต้องกลับไปทำต่อ ดังนั้นปัญหาหลักคือ closure status ของงานนี้ยังไม่ปิดจริง จึงเป็น closure_loss

Notes:
None.
