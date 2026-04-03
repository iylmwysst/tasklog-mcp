# Publication Strategy: Interrupted Coding Work Taxonomy

## Three-Paper Arc

```
Paper 1 → IEEE Software (Insights/Viewpoints)
           "นี่คือ problem + taxonomy"
           Contribution: viewpoint / conceptual reframing

Paper 2 → IST (Information and Software Technology)
           "taxonomy ใช้ได้จริงไหม + refined version"
           Contribution: empirically validated & refined framework

Paper 3 → TBD venue (systems / empirical SE)
           "ระบบที่ implement taxonomy แล้วลด failure"
           Contribution: mechanism + evaluation
```

## Timeline

```
Month 1-2:   Compress + rewrite → submit IEEE Software
             เริ่มเก็บ interrupted episodes + recruit annotators
Month 3-4:   ระหว่างรอ IEEE review → run annotation study
             คำนวณ Cohen's κ, analyze boundary cases
Month 5-6:   IEEE result กลับมา
             accept → extend taxonomy with empirical findings → IST
             reject → incorporate IEEE review feedback + empirical → IST
Month 7+:    Paper 3 scoping begins (mechanism)
```

---

## Paper 1: IEEE Software

### Profile

| Item | Detail |
|---|---|
| Track | Insights or Viewpoints |
| Word limit | ~4,000–5,500 |
| Audience | Practitioners, engineering leads, applied researchers |
| Empirical requirement | ไม่มี — conceptual/viewpoint papers accepted |
| Contribution statement | Authority เป็น missing object ใน coding-agent resumption; เสนอ taxonomy ที่ organize failure around work state, not memory |

### Source Material

ใช้ `tasklog-taxonomy-perspective-rewrite.md` เป็น base แล้ว transform — ไม่ใช่แค่ตัดสั้น

### Already Done

- [x] §2.4 reframed: authority = domain-specific operationalization of source-precedence problem
- [x] §3.3 added: interruption classes ไม่ใช่ exhaustive ontology + ยกตัวอย่าง candidates (review rejection, context overflow, dependency cascade)
- [x] §3.7 added: SWE-bench-inspired examples = illustrative application, not empirical validation

### Must Do Before Submit

#### Structure & Compression

- [ ] Compress total word count จาก ~12,000 → ≤5,500
- [ ] Section 2 (adjacent frames): compress จาก ~4,000 words / 5 subsections → ~800 words / 1 section + comparison table
  - สรุป 5 traditions ใน table: tradition | what it gets right | what it misses
  - BDI (§2.4) ให้ยาวกว่าอันอื่นเล็กน้อยเพราะเป็น strongest counterargument
- [ ] Table 3 (auxiliary recovery states): ตัดออก — ไม่ใช่ core contribution, ย้ายไป IST version
- [ ] Section 4 + 5: merge เป็น 1 section "Design Implications"
- [ ] Section 6.3 (open research questions): ย่อเหลือ 3-4 bullet ใน merged discussion
- [ ] Section 7 (limitations): ย่อจาก 4 subsections → 1 paragraph
- [ ] References: ลดจาก ~40 → ≤20

#### Tone Shift (Critical)

- [ ] Rewrite intro — practitioner-facing, ไม่ใช่ research-paper style
  - เปลี่ยนจาก "The claim of this paper is that..."
  - เป็น "Coding agents keep failing at session boundaries not because they forget, but because they trust the wrong record."
- [ ] ผ่าน full read ทั้ง paper ว่าไม่มีประโยค research-heavy หลุด
- [ ] ลด hedging language ("we argue that", "the claim here is") — พูดตรง

#### Content ที่ต้องเพิ่ม

- [ ] เพิ่ม concrete scenario ที่ practitioner เห็นภาพทันที
  - ไม่ใช่ abstract "work X" แต่เป็น:
  - "Agent กลับมาเช้าวันจันทร์ เห็น Jira in-progress + Slack จาก PM ว่า deprioritize + PR comment ว่า approach ต้องเปลี่ยน — 3 records, ทุกอันดู relevant, อันไหน govern?"
- [ ] เพิ่ม "What Should Builders Do Differently?" section — actionable design heuristics:
  - anti-pattern: trust richest-looking artifact trail
  - heuristic: check timestamp ordering of competing records before act
  - heuristic: expose readiness mode explicitly before generating action content
  - heuristic: treat non-action (wait/ask/escalate) as valid system output, not failure

#### Final Checks

- [ ] Word count verified ≤ 5,500
- [ ] IEEE Software formatting guidelines followed
- [ ] All tables fit within column width
- [ ] Figure 1 (dominant assignment) — verify still works at reduced size or replace with inline description

---

## Paper 2: IST

### Profile

| Item | Detail |
|---|---|
| Paper type | Research article (taxonomy + validation) |
| Word limit | ~8,000–12,000 |
| Audience | SE researchers, PhD students |
| Empirical requirement | ต้องมี — taxonomy validation |
| Contribution statement | Empirically validated taxonomy of interrupted coding work with refined class boundaries informed by structured classification exercise |

### Contribution ต้องต่างจาก Paper 1

Paper 1 (IEEE Software) = "นี่คือ problem + taxonomy" — **proposal**
Paper 2 (IST) = taxonomy + validated boundaries + refined classes จาก annotation — **validated framework**

IST version ต้องให้ empirical findings **change the taxonomy itself**:
- κ ต่ำที่ boundary ไหน → split หรือ redefine class definitions
- Annotators เจอ case ที่ไม่ fit → เพิ่ม class หรือ refine inclusion/exclusion rule
- Dominant-assignment rule ให้ผลต่างกัน → เพิ่ม tie-breaking heuristic

### Empirical Section: Structured Classification Exercise

- [ ] **Episode collection** (20-30 episodes)
  - Sources: OpenHands agent logs, SWE-bench traces, own prototype logs
  - Selection criteria: episodes ที่มี clear interruption boundary + resumption attempt
  - Document provenance per episode
- [ ] **Codebook development**
  - Classification protocol based on Table 1 (interruption class) + Table 2 (loss class) + dominant-assignment rule
  - Include worked example ใน codebook
  - Pilot test กับ 3-5 episodes ก่อน full run
- [ ] **Annotator recruitment** (2-3 คน)
  - ต้องมี familiarity กับ coding agents หรือ SE practice
  - Independent classification — ไม่ discuss ระหว่าง annotate
- [ ] **Agreement analysis**
  - Cohen's κ per loss class
  - Cohen's κ per interruption class
  - Identify boundary cases ที่ disagreement สูง
  - Qualitative analysis: ทำไม annotators ไม่ agree ตรงไหน
- [ ] **Taxonomy refinement based on findings**
  - ปรับ definitions ถ้า boundary ไม่ชัด
  - เพิ่ม/merge classes ถ้า data support
  - Update inclusion/exclusion rules

### Content Checklist

- [ ] Restore detail ที่ตัดออกใน IEEE Software version (Table 3, full Section 2, limitations subsections)
- [ ] Section 2: upgrade จาก narrative → structured comparison (อาจไม่ถึง full SLR แต่ต้องมี search strategy อย่างน้อย)
- [ ] เพิ่ม explicit threats to validity section (beyond current Section 7)
- [ ] เพิ่ม references ที่ขาด:
  - [ ] Ko et al. (2006) — information foraging in maintenance tasks → §2.1
  - [ ] Practical systems acknowledgment (OpenHands, Aider, etc.) → §2.3
  - [ ] Dignum et al. (2000) / Dastani et al. (2005) — external normative sources in agent reasoning → §2.4
- [ ] Integrate IEEE Software reviewer feedback (ถ้ามี)

### If IEEE Software Accepted → IST Framing

- Position as "empirical follow-up" — Paper 1 proposed, Paper 2 validates and refines
- Cite Paper 1 explicitly
- New contribution = validated class boundaries + refinements ที่ empirical data drove

### If IEEE Software Rejected → IST Framing

- Standalone taxonomy paper with built-in validation
- Incorporate IEEE reviewer feedback into revisions
- ไม่ต้อง reference Paper 1

---

## Paper 3: Mechanism (Future — Brief Scope)

### What It Should Propose

- **Pre-action divergence check**: runtime mechanism ที่ verify governing state ก่อน resumed action
- Operationalize authority resolution: explicit precedence rules among record types + freshness validation
- Operationalize readiness: structured output ที่ include action mode (act/ask/wait/escalate/abstain) ก่อน action content

### Likely Contribution Shape

- System design + implementation of authority-aware resumption layer
- Before/after evaluation: does explicit authority resolution reduce resumptive failures?
- Ablation: which components (authority check, readiness mode, freshness validation) contribute most?
- Benchmark: interrupted coding episodes with known-correct governing state as ground truth

### Venue Candidates

- ICSE / FSE / ASE (top SE venues — if mechanism + evaluation strong enough)
- ASE NIER track (if scoped as novel idea + preliminary results)
- AAAI/NeurIPS agent workshop (if framed as agent architecture contribution)

### Dependency

ไม่ต้องรอ Paper 1 หรือ 2 ถึงจะเริ่ม scope ได้ แต่ implementation ควรใช้ refined taxonomy จาก Paper 2 เป็น basis — เพื่อ mechanism ตอบ validated classes ไม่ใช่ speculative ones

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| IEEE Software reject เพราะ "not practitioner-relevant enough" | ต่ำ — ปัญหานี้ไม่ apply กับ IST | ใช้ reviewer feedback ปรับ IST version |
| IEEE Software reject เพราะ "not novel enough" | สูง — ถ้า novelty argument ไม่ hold ที่ IEEE ก็ไม่ hold ที่ IST | ต้อง rethink positioning ก่อนส่ง IST |
| κ ต่ำมากใน annotation study | สูง — taxonomy boundaries อาจต้อง major revision | Pilot test 3-5 episodes ก่อน full run; ถ้า pilot κ ต่ำ → refine codebook ก่อน |
| Annotators หายากที่มี coding-agent experience | ปานกลาง | ขยายไป SE practitioners ที่ไม่ได้ทำ agent โดยตรงแต่เข้าใจ interrupted programming |
| Paper 1 accept แต่ Paper 2 ถูกมองว่าซ้ำ contribution | ปานกลาง | ต้องให้ empirical findings เปลี่ยน taxonomy จริง ไม่ใช่แค่ confirm |
