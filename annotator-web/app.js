const STORAGE_KEY_PREFIX = "validation-annotator-draft-v2";

const state = {
  packet: null,
  currentIndex: 0,
  respondentName: "",
  respondentTag: "",
  responses: {},
};

const packetTitle = document.querySelector("#packet-title");
const packetDescription = document.querySelector("#packet-description");
const respondentNameInput = document.querySelector("#respondent-name");
const respondentTagInput = document.querySelector("#respondent-tag");
const episodeNav = document.querySelector("#episode-nav");
const episodePanel = document.querySelector("#episode-panel");
const progressText = document.querySelector("#progress-text");
const progressFill = document.querySelector("#progress-fill");
const saveState = document.querySelector("#save-state");
const autofillButton = document.querySelector("#autofill-button");
const prevButton = document.querySelector("#prev-button");
const nextButton = document.querySelector("#next-button");
const submitButton = document.querySelector("#submit-button");
const episodeTemplate = document.querySelector("#episode-template");

async function boot() {
  hydrateDraft();
  const response = await fetch("/api/packet");
  state.packet = await response.json();
  seedResponses();
  bindShellEvents();
  render();
}

function hydrateDraft() {
  const savedRespondentTag = localStorage.getItem(`${STORAGE_KEY_PREFIX}:last-respondent-tag`);
  if (!savedRespondentTag) {
    return;
  }

  state.respondentTag = savedRespondentTag;
  hydrateDraftForRespondent(savedRespondentTag);
}

function hydrateDraftForRespondent(respondentTag) {
  const raw = localStorage.getItem(storageKeyFor(respondentTag));
  if (!raw) {
    state.respondentName = "";
    state.responses = {};
    state.currentIndex = 0;
    if (state.packet) {
      seedResponses();
    }
    return;
  }

  try {
    const draft = JSON.parse(raw);
    state.respondentName = draft.respondentName ?? "";
    state.respondentTag = draft.respondentTag ?? respondentTag;
    state.responses = draft.responses ?? {};
    state.currentIndex = Number.isInteger(draft.currentIndex) ? draft.currentIndex : 0;
  } catch {
    localStorage.removeItem(storageKeyFor(respondentTag));
    state.respondentName = "";
    state.responses = {};
    state.currentIndex = 0;
  }

  if (state.packet) {
    seedResponses();
  }
}

function seedResponses() {
  for (const episode of state.packet.episodes) {
    if (!state.responses[episode.id]) {
      state.responses[episode.id] = {
        interruptionClass: "",
        dominantLossClass: "",
        boundaryAmbiguous: "",
        nearestAlternativeClass: "",
        confidence: "",
        justification: "",
        notes: "",
      };
    }
  }
}

function bindShellEvents() {
  respondentNameInput.value = state.respondentName;
  respondentTagInput.value = state.respondentTag;

  respondentNameInput.addEventListener("input", () => {
    state.respondentName = respondentNameInput.value;
    persistDraft("บันทึกชื่อผู้ตอบแล้ว");
    renderNav();
  });

  respondentTagInput.addEventListener("change", () => {
    const nextTag = respondentTagInput.value;
    state.respondentTag = nextTag;
    localStorage.setItem(`${STORAGE_KEY_PREFIX}:last-respondent-tag`, nextTag);
    hydrateDraftForRespondent(nextTag);
    respondentNameInput.value = state.respondentName;
    persistDraft("เปลี่ยนผู้ตอบแล้ว");
    render();
  });

  prevButton.addEventListener("click", () => {
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    render();
  });

  nextButton.addEventListener("click", () => {
    state.currentIndex = Math.min(state.packet.episodes.length - 1, state.currentIndex + 1);
    render();
  });

  autofillButton.addEventListener("click", autofillTestData);
  submitButton.addEventListener("click", submitAllResponses);
}

function render() {
  packetTitle.textContent = state.packet.packetTitle;
  packetDescription.textContent = state.packet.packetDescription;
  respondentNameInput.value = state.respondentName;
  respondentTagInput.value = state.respondentTag;
  renderNav();
  renderEpisode();
  renderProgress();
  updateButtons();
}

function renderNav() {
  episodeNav.innerHTML = "";

  if (!state.respondentTag) {
    const note = document.createElement("p");
    note.className = "subtle";
    note.textContent = "เลือก Annotator ก่อน แล้วระบบจะแยก draft ให้ตามรหัส";
    episodeNav.appendChild(note);
    return;
  }

  state.packet.episodes.forEach((episode, index) => {
    const button = document.createElement("button");
    const isDone = episodeComplete(episode.id);
    button.className = [
      index === state.currentIndex ? "active" : "",
      isDone ? "done" : "",
    ]
      .filter(Boolean)
      .join(" ");
    button.type = "button";
    button.innerHTML = `
      <span class="nav-title">${episode.id}</span>
      <span class="nav-meta">${isDone ? "ตอบแล้ว" : "ยังไม่ครบ"}</span>
    `;
    button.addEventListener("click", () => {
      state.currentIndex = index;
      render();
    });
    episodeNav.appendChild(button);
  });
}

function renderEpisode() {
  if (!state.respondentTag) {
    episodePanel.innerHTML = `
      <article class="episode-card">
        <header class="episode-header">
          <div>
            <p class="eyebrow episode-index">Start</p>
            <h3 class="episode-title">เลือก Annotator ก่อนเริ่มตอบ</h3>
          </div>
          <span class="episode-status">ยังไม่พร้อม</span>
        </header>
        <section class="episode-copy">
          <section class="copy-block">
            <h4>ขั้นแรก</h4>
            <p>เลือกผู้ตอบจาก HUM-01 ถึง HUM-05 แล้วกรอกชื่อผู้ตอบ ระบบจะเก็บ draft แยกตามรหัสที่เลือก</p>
          </section>
        </section>
      </article>
    `;
    return;
  }

  const episode = state.packet.episodes[state.currentIndex];
  const response = state.responses[episode.id];
  const node = episodeTemplate.content.firstElementChild.cloneNode(true);

  node.querySelector(".episode-index").textContent = `Episode ${state.currentIndex + 1} / ${state.packet.episodes.length}`;
  node.querySelector(".episode-title").textContent = episode.title;
  node.querySelector(".episode-status").textContent = episodeComplete(episode.id) ? "ตอบครบแล้ว" : "ยังตอบไม่ครบ";

  const copy = node.querySelector(".episode-copy");
  copy.innerHTML = "";

  for (const field of episode.fields) {
    const block = document.createElement("section");
    block.className = "copy-block";
    const heading = document.createElement("h4");
    heading.textContent = field.key;
    block.appendChild(heading);

    const bulletLines = field.value.filter((line) => line.startsWith("- "));
    const proseLines = field.value.filter((line) => line && !line.startsWith("- "));

    if (proseLines.length > 0) {
      const paragraph = document.createElement("p");
      paragraph.textContent = proseLines.join(" ");
      block.appendChild(paragraph);
    }

    if (bulletLines.length > 0) {
      const list = document.createElement("ul");
      for (const line of bulletLines) {
        const item = document.createElement("li");
        item.textContent = line.replace(/^- /, "");
        list.appendChild(item);
      }
      block.appendChild(list);
    }

    copy.appendChild(block);
  }

  wireSelect(node, "interruptionClass", state.packet.choices.interruptionClass, response.interruptionClass);
  wireSelect(node, "dominantLossClass", state.packet.choices.dominantLossClass, response.dominantLossClass);
  wireSelect(node, "boundaryAmbiguous", state.packet.choices.boundaryAmbiguous, response.boundaryAmbiguous);
  wireSelect(
    node,
    "nearestAlternativeClass",
    state.packet.choices.nearestAlternativeClass,
    response.nearestAlternativeClass,
  );
  wireSelect(node, "confidence", state.packet.choices.confidence, response.confidence, true);

  wireText(node, "justification", response.justification);
  wireText(node, "notes", response.notes);

  episodePanel.innerHTML = "";
  episodePanel.appendChild(node);
}

function wireSelect(container, fieldName, options, selectedValue, allowBlank = false) {
  const select = container.querySelector(`[data-field="${fieldName}"]`);
  select.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = allowBlank ? "ยังไม่ระบุ" : "เลือกคำตอบ";
  select.appendChild(placeholder);

  for (const option of options) {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  }

  select.value = selectedValue ?? "";
  select.addEventListener("change", () => {
    updateEpisodeField(fieldName, select.value);
  });
}

function wireText(container, fieldName, value) {
  const input = container.querySelector(`[data-field="${fieldName}"]`);
  input.value = value ?? "";
  input.addEventListener("input", () => {
    updateEpisodeField(fieldName, input.value);
  });
}

function updateEpisodeField(fieldName, value) {
  const episode = state.packet.episodes[state.currentIndex];
  const response = state.responses[episode.id];
  response[fieldName] = value;

  if (fieldName === "boundaryAmbiguous" && value === "no") {
    response.nearestAlternativeClass = "none";
  }

  persistDraft("Draft ถูกบันทึกแล้ว");
  renderNav();
  renderProgress();
  renderEpisode();
}

function renderProgress() {
  if (!state.respondentTag) {
    progressText.textContent = "0 / 30";
    progressFill.style.width = "0%";
    return;
  }
  const completed = state.packet.episodes.filter((episode) => episodeComplete(episode.id)).length;
  progressText.textContent = `${completed} / ${state.packet.episodes.length}`;
  progressFill.style.width = `${(completed / state.packet.episodes.length) * 100}%`;
}

function updateButtons() {
  const disabled = !state.respondentTag;
  autofillButton.disabled = disabled;
  prevButton.disabled = disabled || state.currentIndex === 0;
  nextButton.disabled = disabled || state.currentIndex === state.packet.episodes.length - 1;
  submitButton.disabled = disabled;
}

function episodeComplete(episodeId) {
  const response = state.responses[episodeId];
  return Boolean(
    response &&
      response.interruptionClass &&
      response.dominantLossClass &&
      response.boundaryAmbiguous &&
      response.nearestAlternativeClass &&
      response.justification.trim().length >= 4,
  );
}

function persistDraft(message) {
  if (!state.respondentTag) {
    saveState.textContent = "เลือก Annotator ก่อน ระบบถึงจะเริ่มเก็บ draft";
    return;
  }

  localStorage.setItem(
    storageKeyFor(state.respondentTag),
    JSON.stringify({
      respondentName: state.respondentName,
      respondentTag: state.respondentTag,
      responses: state.responses,
      currentIndex: state.currentIndex,
    }),
  );
  localStorage.setItem(`${STORAGE_KEY_PREFIX}:last-respondent-tag`, state.respondentTag);
  saveState.textContent = message;
}

function autofillTestData() {
  if (!state.respondentTag) {
    showToast("เลือก Annotator ก่อนใช้ Auto Fill", true);
    return;
  }

  state.respondentName = `Test ${state.respondentTag}`;
  respondentNameInput.value = state.respondentName;
  respondentTagInput.value = state.respondentTag;

  state.packet.episodes.forEach((episode, index) => {
    state.responses[episode.id] = {
      interruptionClass: pickByIndex(
        ["session_cutoff", "task_switch", "blocked_waiting", "handoff", "failure_boundary"],
        index,
      ),
      dominantLossClass: pickByIndex(
        ["focus_loss", "authority_loss", "readiness_loss", "intent_loss", "closure_loss"],
        index,
      ),
      boundaryAmbiguous: index % 4 === 0 ? "yes" : "no",
      nearestAlternativeClass: index % 4 === 0 ? "authority_loss" : "none",
      confidence: pickByIndex(["high", "medium", "low"], index),
      justification: `Test rationale for ${episode.id}: the earliest unresolved object was selected for validation flow testing.`,
      notes: index % 5 === 0 ? "Auto-filled test note." : "",
    };
  });

  persistDraft("เติมข้อมูลทดสอบให้ครบทั้งชุดแล้ว");
  render();
  showToast("เติมข้อมูลทดสอบครบแล้ว กดส่งได้เลย");
}

function pickByIndex(options, index) {
  return options[index % options.length];
}

async function submitAllResponses() {
  await submitAllResponsesInternal(false);
}

async function submitAllResponsesInternal(overwrite) {
  if (!state.respondentTag) {
    showToast("กรุณาเลือก Annotator ก่อนส่ง", true);
    return;
  }

  if (state.respondentName.trim().length < 2) {
    showToast("กรุณากรอกชื่อผู้ตอบก่อนส่ง", true);
    return;
  }

  const missing = state.packet.episodes.find((episode) => !episodeComplete(episode.id));
  if (missing) {
    const missingIndex = state.packet.episodes.findIndex((episode) => episode.id === missing.id);
    state.currentIndex = missingIndex;
    render();
    showToast(`ยังตอบไม่ครบที่ ${missing.id}`, true);
    return;
  }

  const responses = state.packet.episodes.map((episode) => ({
    episodeId: episode.id,
    ...state.responses[episode.id],
  }));

  const request = await fetch("/api/submissions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      respondentName: state.respondentName,
      respondentTag: state.respondentTag,
      submittedAtClient: new Date().toISOString(),
      overwrite,
      responses,
    }),
  });

  if (request.status === 409) {
    const conflict = await request.json();
    const confirmed = window.confirm(
      `${state.respondentTag} เคยส่งแล้ว (${conflict.existingFileName})\nต้องการเขียนทับ submission เดิมหรือไม่?`,
    );

    if (confirmed) {
      await submitAllResponsesInternal(true);
    }
    return;
  }

  if (!request.ok) {
    showToast("ส่งไม่สำเร็จ ลองอีกครั้ง", true);
    return;
  }

  const result = await request.json();
  localStorage.removeItem(storageKeyFor(state.respondentTag));
  saveState.textContent = `ส่งสำเร็จ: ${result.fileName}`;
  showToast(`ส่งคำตอบเรียบร้อยแล้ว ไฟล์: ${result.fileName}`);
}

function storageKeyFor(respondentTag) {
  return `${STORAGE_KEY_PREFIX}:${respondentTag}`;
}

function showToast(message, isError = false) {
  const existing = document.querySelector(".toast");
  existing?.remove();

  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3200);
}

boot().catch((error) => {
  console.error(error);
  showToast("โหลดหน้าแบบประเมินไม่สำเร็จ", true);
});
