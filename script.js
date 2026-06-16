/* ===== UTILITIES ===== */
function uuid() { return 'xxxx-xxxx-xxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16)); }
function getLS(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } }
function setLS(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
function fmtDate(d) { if (!d) return ''; const dt = new Date(d); return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtTime(d) { if (!d) return ''; const dt = new Date(d); return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
function fmtDateTime(d) { return fmtDate(d) + ' ' + fmtTime(d); }
function getParam(k) { return new URLSearchParams(window.location.search).get(k); }

/* ===== TOAST ===== */
function toast(msg, type = 'info') {
  const c = document.getElementById('toastContainer'); if (!c) return;
  const t = document.createElement('div'); t.className = 'toast toast-' + type; t.textContent = msg;
  c.appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

/* ===== THEME ===== */
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

/* ===== AUTH ===== */
function getCurrentUser() {
  const u = localStorage.getItem('currentUser');
  return u ? JSON.parse(u) : null;
}
function requireAuth() {
  if (!getCurrentUser()) { window.location.href = 'index.html'; return false; }
  initSidebar(); return true;
}
function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }

// Login
let loginRole = 'student';
function setLoginRole(r) {
  loginRole = r;
  document.querySelectorAll('#loginRoleToggle button').forEach(b => { b.classList.toggle('active', b.dataset.role === r); });
}
function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;
  const err = document.getElementById('loginError');
  err.style.display = 'none';
  if (!email.endsWith('@iiitsurat.ac.in')) { err.textContent = 'Email must end with @iiitsurat.ac.in'; err.style.display = 'block'; return; }
  const users = getLS('users');
  const user = users.find(u => u.email === email && u.password === pass && u.role === loginRole);
  if (!user) { err.textContent = 'Invalid credentials or role mismatch'; err.style.display = 'block'; return; }
  localStorage.setItem('currentUser', JSON.stringify(user));
  window.location.href = 'dashboard.html';
}

// Signup
let signupRole = 'student';
function setSignupRole(r) {
  signupRole = r;
  document.querySelectorAll('#signupRoleToggle button').forEach(b => { b.classList.toggle('active', b.dataset.role === r); });
  const pg = document.getElementById('passkeyGroup');
  const rg = document.getElementById('rollNumberGroup');
  if (pg) pg.style.display = r === 'teacher' ? 'block' : 'none';
  if (rg) rg.style.display = r === 'student' ? 'block' : 'none';
}
function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPassword').value;
  const roll = document.getElementById('signupRoll').value.trim();
  const passkey = document.getElementById('signupPasskey').value.trim();
  const err = document.getElementById('signupError');
  err.style.display = 'none';
  if (!email.endsWith('@iiitsurat.ac.in')) { err.textContent = 'Email must end with @iiitsurat.ac.in'; err.style.display = 'block'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters'; err.style.display = 'block'; return; }
  if (signupRole === 'teacher' && passkey !== 'TEACHER@IIITS') { err.textContent = 'Invalid teacher passkey'; err.style.display = 'block'; return; }
  if (signupRole === 'student' && !roll) { err.textContent = 'Roll number is required'; err.style.display = 'block'; return; }
  const users = getLS('users');
  if (users.find(u => u.email === email)) { err.textContent = 'Email already registered'; err.style.display = 'block'; return; }
  const user = { id: uuid(), name, email, password: pass, role: signupRole, rollNumber: signupRole === 'student' ? roll : '', createdAt: new Date().toISOString() };
  users.push(user); setLS('users', users);
  toast('Account created! Please sign in.', 'success'); showLogin();
}
function showLogin() { document.getElementById('loginForm').style.display = 'block'; document.getElementById('signupForm').style.display = 'none'; }
function showSignup() { document.getElementById('loginForm').style.display = 'none'; document.getElementById('signupForm').style.display = 'block'; }
function showAuthPage() { document.getElementById('introContainer').style.display = 'none'; document.getElementById('authContainer').style.display = 'block'; }

/* ===== SIDEBAR ===== */
function initSidebar() {
  const user = getCurrentUser(); if (!user) return;
  const av = document.getElementById('userAvatar');
  const un = document.getElementById('userName');
  const ur = document.getElementById('userRole');
  if (av) av.textContent = user.name.charAt(0).toUpperCase();
  if (un) un.textContent = user.name;
  if (ur) ur.textContent = user.role;
  loadSidebarSubjects();
  updateMsgBadge();
}
function loadSidebarSubjects() {
  const el = document.getElementById('sidebarSubjects'); if (!el) return;
  const user = getCurrentUser();
  const subjects = getLS('subjects');
  const enrollments = getLS('enrollments');
  let mySubjects = [];
  if (user.role === 'teacher') { mySubjects = subjects.filter(s => s.teacherId === user.id); }
  else { const myEnr = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId); mySubjects = subjects.filter(s => myEnr.includes(s.id)); }
  el.innerHTML = mySubjects.map(s => `<a href="subject.html?id=${s.id}"><span class="nav-icon">📘</span> ${s.name}</a>`).join('');
}
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function updateMsgBadge() {
  const user = getCurrentUser(); if (!user) return;
  const msgs = getLS('messages');
  const unread = msgs.filter(m => m.receiverId === user.id && !m.read).length;
  const badge = document.getElementById('sidebarMsgBadge');
  if (badge) badge.innerHTML = unread > 0 ? `<span class="notif-badge">${unread}</span>` : '';
}

/* ===== MODAL HELPERS ===== */
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

/* ===== DASHBOARD ===== */
function initDashboard() {
  const user = getCurrentUser(); if (!user) return;
  const subjects = getLS('subjects');
  const enrollments = getLS('enrollments');
  const messages = getLS('messages');
  if (user.role === 'teacher') {
    document.getElementById('teacherActions').classList.remove('hidden');
    const mySubjects = subjects.filter(s => s.teacherId === user.id);
    const totalStudents = new Set(enrollments.filter(e => mySubjects.some(s => s.id === e.subjectId)).map(e => e.studentId)).size;
    const unread = messages.filter(m => m.receiverId === user.id && !m.read).length;
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${mySubjects.length}</div><div class="stat-label">Subjects</div></div>
      <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">${totalStudents}</div><div class="stat-label">Total Students</div></div>
      <div class="stat-card"><div class="stat-icon">💬</div><div class="stat-value">${unread}</div><div class="stat-label">Unread Messages</div></div>
    `;
    renderSubjectsGrid(mySubjects, enrollments);
    document.getElementById('noSubjectsMsg').textContent = 'Create your first subject to get started.';
  } else {
    document.getElementById('studentActions').classList.remove('hidden');
    const myEnr = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId);
    const mySubjects = subjects.filter(s => myEnr.includes(s.id));
    const unread = messages.filter(m => m.receiverId === user.id && !m.read).length;
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${mySubjects.length}</div><div class="stat-label">Enrolled Subjects</div></div>
      <div class="stat-card"><div class="stat-icon">📝</div><div class="stat-value">${getLS('assignments').filter(a => myEnr.includes(a.subjectId)).length}</div><div class="stat-label">Assignments</div></div>
      <div class="stat-card"><div class="stat-icon">💬</div><div class="stat-value">${unread}</div><div class="stat-label">Unread Messages</div></div>
    `;
    renderSubjectsGrid(mySubjects, enrollments);
    document.getElementById('noSubjectsMsg').textContent = 'Join a subject to get started.';
  }
}
function renderSubjectsGrid(subjects, enrollments) {
  const grid = document.getElementById('subjectsGrid');
  const empty = document.getElementById('noSubjects');
  if (subjects.length === 0) { grid.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  const user = getCurrentUser();
  grid.innerHTML = subjects.map(s => {
    const count = enrollments.filter(e => e.subjectId === s.id).length;
    return `<div class="subject-card" onclick="window.location.href='subject.html?id=${s.id}'">
      <div class="subject-card-banner"></div>
      <div class="subject-card-body">
        <h3>${s.name}</h3><div class="code">${s.code}</div>
        <div class="teacher">${user.role === 'student' ? '👨‍🏫 ' + s.teacherName : ''}</div>
      </div>
      <div class="subject-card-footer">
        <span class="enrolled">👥 ${count} student${count !== 1 ? 's' : ''}</span>
        ${user.role === 'teacher' ? `<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();deleteSubject('${s.id}')">🗑️ Delete</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

/* ===== SUBJECT CRUD ===== */
function openCreateSubjectModal() { openModal('createSubjectModal'); }
function createSubject() {
  const name = document.getElementById('subjectName').value.trim();
  const code = document.getElementById('subjectCode').value.trim();
  const err = document.getElementById('createSubjectError');
  if (!name || !code) { err.textContent = 'All fields required'; err.style.display = 'block'; return; }
  const user = getCurrentUser();
  const subjects = getLS('subjects');
  subjects.push({ id: uuid(), name, code, teacherId: user.id, teacherName: user.name, createdAt: new Date().toISOString() });
  setLS('subjects', subjects); closeModal('createSubjectModal'); toast('Subject created!', 'success'); initDashboard(); loadSidebarSubjects();
  document.getElementById('subjectName').value = ''; document.getElementById('subjectCode').value = '';
}
function deleteSubject(id) {
  if (!confirm('Delete this subject and all its data?')) return;
  setLS('subjects', getLS('subjects').filter(s => s.id !== id));
  setLS('enrollments', getLS('enrollments').filter(e => e.subjectId !== id));
  setLS('materials', getLS('materials').filter(m => m.subjectId !== id));
  setLS('assignments', getLS('assignments').filter(a => a.subjectId !== id));
  setLS('announcements', getLS('announcements').filter(a => a.subjectId !== id));
  setLS('attendance', getLS('attendance').filter(a => a.subjectId !== id));
  setLS('marks', getLS('marks').filter(m => m.subjectId !== id));
  // Clean submissions for assignments in this subject
  const asgIds = getLS('assignments').filter(a => a.subjectId === id).map(a => a.id);
  setLS('submissions', getLS('submissions').filter(s => !asgIds.includes(s.assignmentId)));
  toast('Subject deleted', 'success'); initDashboard(); loadSidebarSubjects();
}
function openJoinSubjectModal() {
  const user = getCurrentUser();
  const subjects = getLS('subjects');
  const enrollments = getLS('enrollments');
  const myEnr = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId);
  const available = subjects.filter(s => !myEnr.includes(s.id));
  const el = document.getElementById('availableSubjects');
  if (available.length === 0) { el.innerHTML = '<div class="empty-state"><p>No subjects available to join.</p></div>'; }
  else { el.innerHTML = available.map(s => `<div class="list-item"><div class="list-item-content"><h4>${s.name}</h4><p>${s.code} • ${s.teacherName}</p></div><button class="btn btn-success btn-sm" onclick="joinSubject('${s.id}')">Join</button></div>`).join(''); }
  openModal('joinSubjectModal');
}
function joinSubject(id) {
  const user = getCurrentUser(); const enrollments = getLS('enrollments');
  if (enrollments.find(e => e.studentId === user.id && e.subjectId === id)) { toast('Already enrolled', 'error'); return; }
  enrollments.push({ studentId: user.id, subjectId: id }); setLS('enrollments', enrollments);
  toast('Enrolled successfully!', 'success'); closeModal('joinSubjectModal'); initDashboard(); loadSidebarSubjects();
}

/* ===== SUBJECT PAGE ===== */
let currentSubjectId = null;
function initSubjectPage() {
  currentSubjectId = getParam('id'); if (!currentSubjectId) { window.location.href = 'dashboard.html'; return; }
  const subjects = getLS('subjects'); const subject = subjects.find(s => s.id === currentSubjectId);
  if (!subject) { toast('Subject not found', 'error'); window.location.href = 'dashboard.html'; return; }
  document.getElementById('subjectTitle').textContent = subject.name;
  document.getElementById('subjectCodeBadge').textContent = subject.code;
  document.title = subject.name + ' � Academic Hub';
  const user = getCurrentUser();
  if (user.role === 'teacher') { document.querySelectorAll('.teacher-only').forEach(el => el.classList.remove('hidden')); }
  loadMaterials(); loadAssignments(); loadAnnouncements(); loadAttendance(); loadMarks(); loadSubjectMessages();
}
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.subject-tabs button').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  const tabs = document.querySelectorAll('.subject-tabs button');
  const tabNames = ['materials', 'assignments', 'announcements', 'attendance', 'marks', 'messages'];
  const idx = tabNames.indexOf(tab); if (idx >= 0 && tabs[idx]) tabs[idx].classList.add('active');
}

/* ===== MATERIALS ===== */
let matUploadMode = 'url';
function toggleMatUpload(mode) {
  matUploadMode = mode;
  const btns = document.querySelectorAll('#matUploadToggle button');
  btns.forEach(b => b.classList.remove('active'));
  if (mode === 'url') { btns[0].classList.add('active'); } else { btns[1].classList.add('active'); }
  document.getElementById('matLinkGroup').classList.toggle('hidden', mode !== 'url');
  document.getElementById('matFileGroup').classList.toggle('hidden', mode !== 'file');
}
function loadMaterials() {
  const materials = getLS('materials').filter(m => m.subjectId === currentSubjectId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const el = document.getElementById('materialsList');
  if (materials.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📄</div><h3>No Materials Yet</h3></div>'; return; }
  const icons = { notes: '📝', pdf: '📕', lecture: '🎥', other: '📎' };
  el.innerHTML = materials.map(m => {
    let fileHtml = '';
    if (m.link) { fileHtml = `<a href="${m.link}" target="_blank" style="font-size:0.85rem;">🔗 Open Link</a>`; }
    if (m.fileData) { fileHtml = `<a href="${m.fileData}" download="${m.fileName || 'file'}" class="file-attachment">📥 Download: ${m.fileName || 'File'}</a>`; }
    return `<div class="list-item">
      <div class="list-item-icon">${icons[m.type] || '📎'}</div>
      <div class="list-item-content"><h4>${m.title}</h4><p>${m.description || ''}</p>
      ${fileHtml}
      <div class="list-item-meta">${fmtDateTime(m.createdAt)}</div></div>
      ${getCurrentUser().role === 'teacher' ? `<button class="btn btn-danger btn-sm" onclick="deleteMaterial('${m.id}')">🗑️</button>` : ''}
    </div>`;
  }).join('');
}
function addMaterial() {
  const title = document.getElementById('matTitle').value.trim();
  const desc = document.getElementById('matDesc').value.trim();
  const type = document.getElementById('matType').value;
  if (!title) { toast('Title is required', 'error'); return; }

  if (matUploadMode === 'file') {
    const fileInput = document.getElementById('matFile');
    const file = fileInput.files[0];
    if (!file) { toast('Please select a file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('File too large (max 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function (e) {
      const materials = getLS('materials');
      materials.push({ id: uuid(), subjectId: currentSubjectId, title, description: desc, link: '', fileData: e.target.result, fileName: file.name, type, createdAt: new Date().toISOString() });
      setLS('materials', materials); closeModal('addMaterialModal'); toast('Material added!', 'success'); loadMaterials();
      resetMaterialForm();
    };
    reader.readAsDataURL(file);
  } else {
    const link = document.getElementById('matLink').value.trim();
    const materials = getLS('materials');
    materials.push({ id: uuid(), subjectId: currentSubjectId, title, description: desc, link, fileData: '', fileName: '', type, createdAt: new Date().toISOString() });
    setLS('materials', materials); closeModal('addMaterialModal'); toast('Material added!', 'success'); loadMaterials();
    resetMaterialForm();
  }
}
function resetMaterialForm() {
  document.getElementById('matTitle').value = ''; document.getElementById('matDesc').value = '';
  document.getElementById('matLink').value = ''; document.getElementById('matFile').value = '';
  toggleMatUpload('url');
}
function deleteMaterial(id) { if (confirm('Delete?')) { setLS('materials', getLS('materials').filter(m => m.id !== id)); toast('Deleted', 'success'); loadMaterials(); } }

/* ===== ASSIGNMENTS ===== */
function loadAssignments() {
  const assignments = getLS('assignments').filter(a => a.subjectId === currentSubjectId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const el = document.getElementById('assignmentsList');
  if (assignments.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📝</div><h3>No Assignments Yet</h3></div>'; return; }
  const now = new Date();
  const user = getCurrentUser();
  const submissions = getLS('submissions');
  el.innerHTML = assignments.map(a => {
    const dl = new Date(a.deadline); const overdue = dl < now;
    let fileHtml = '';
    if (a.fileData) { fileHtml = `<a href="${a.fileData}" download="${a.fileName || 'assignment'}" class="file-attachment">📥 Download: ${a.fileName || 'Assignment File'}</a>`; }
    let submissionHtml = '';
    if (user.role === 'student') {
      const mySub = submissions.find(s => s.assignmentId === a.id && s.studentId === user.id);
      if (mySub) {
        submissionHtml = `<div class="submission-card">✅ <strong>Submitted</strong> on ${fmtDateTime(mySub.submittedAt)}
          ${mySub.fileData ? `<br><a href="${mySub.fileData}" download="${mySub.fileName}" class="file-attachment">📎 ${mySub.fileName}</a>` : ''}
          ${mySub.note ? `<br><em style="font-size:0.85rem;color:var(--text-muted);">Note: ${mySub.note}</em>` : ''}
        </div>`;
      } else {
        submissionHtml = `<button class="btn btn-success btn-sm" style="margin-top:8px;" onclick="openSubmitModal('${a.id}','${a.title.replace(/'/g, "\\'")}')">📤 Submit</button>`;
      }
    }
    if (user.role === 'teacher') {
      const asgSubs = submissions.filter(s => s.assignmentId === a.id);
      if (asgSubs.length > 0) {
        const users = getLS('users');
        submissionHtml = `<div style="margin-top:8px;"><strong style="font-size:0.85rem;">📋 ${asgSubs.length} Submission(s):</strong>`;
        asgSubs.forEach(s => {
          const stu = users.find(u => u.id === s.studentId);
          submissionHtml += `<div class="submission-card"><strong>${stu ? stu.name : 'Unknown'}</strong> — ${fmtDateTime(s.submittedAt)}
            ${s.fileData ? `<br><a href="${s.fileData}" download="${s.fileName}" class="file-attachment">📎 ${s.fileName}</a>` : ''}
            ${s.note ? `<br><em style="font-size:0.85rem;color:var(--text-muted);">Note: ${s.note}</em>` : ''}
          </div>`;
        });
        submissionHtml += '</div>';
      }
    }
    return `<div class="list-item" style="flex-wrap:wrap;">
      <div class="list-item-icon">📝</div>
      <div class="list-item-content"><h4>${a.title}</h4><p>${a.description || ''}</p>
      ${fileHtml}
      <div class="list-item-meta">📅 Deadline: ${fmtDateTime(a.deadline)} <span class="badge ${overdue ? 'badge-danger' : 'badge-success'}" style="margin-left:8px;">${overdue ? 'Overdue' : 'Active'}</span>
      <span class="badge badge-secondary" style="margin-left:8px;">${a.isUngraded ? 'Ungraded' : (a.maxPoints ? a.maxPoints + ' Points' : '100 Points')}</span></div>
      ${submissionHtml}
      </div>
      ${user.role === 'teacher' ? `<button class="btn btn-danger btn-sm" onclick="deleteAssignment('${a.id}')">🗑️</button>` : ''}
    </div>`;
  }).join('');
}
function addAssignment() {
  const title = document.getElementById('asgTitle').value.trim();
  const desc = document.getElementById('asgDesc').value.trim();
  const deadline = document.getElementById('asgDeadline').value;
  const isUngraded = document.getElementById('asgUngraded').checked;
  const maxPoints = document.getElementById('asgMaxPoints').value;
  if (!title || !deadline) { toast('Title and deadline required', 'error'); return; }
  const fileInput = document.getElementById('asgFile');
  const file = fileInput.files[0];
  const saveAsg = function (fileData, fileName) {
    const assignments = getLS('assignments');
    assignments.push({ id: uuid(), subjectId: currentSubjectId, title, description: desc, deadline, isUngraded, maxPoints: isUngraded ? null : (maxPoints || 100), fileData: fileData || '', fileName: fileName || '', createdAt: new Date().toISOString() });
    setLS('assignments', assignments); closeModal('addAssignmentModal'); toast('Assignment created!', 'success'); loadAssignments();
    document.getElementById('asgTitle').value = ''; document.getElementById('asgDesc').value = ''; document.getElementById('asgDeadline').value = ''; fileInput.value = '';
    document.getElementById('asgUngraded').checked = false;
    document.getElementById('asgMaxPoints').value = '';
    document.getElementById('asgMaxPoints').disabled = false;
  };
  if (file) {
    if (file.size > 5 * 1024 * 1024) { toast('File too large (max 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onload = function (e) { saveAsg(e.target.result, file.name); };
    reader.readAsDataURL(file);
  } else { saveAsg('', ''); }
}
function deleteAssignment(id) {
  if (confirm('Delete?')) {
    setLS('assignments', getLS('assignments').filter(a => a.id !== id));
    setLS('submissions', getLS('submissions').filter(s => s.assignmentId !== id));
    toast('Deleted', 'success'); loadAssignments();
  }
}
let currentSubmitAsgId = null;
function openSubmitModal(asgId, asgTitle) {
  currentSubmitAsgId = asgId;
  document.getElementById('submitAsgTitle').textContent = 'Assignment: ' + asgTitle;
  document.getElementById('submissionFile').value = '';
  document.getElementById('submissionNote').value = '';
  openModal('submitAssignmentModal');
}
function submitAssignment() {
  const fileInput = document.getElementById('submissionFile');
  const note = document.getElementById('submissionNote').value.trim();
  const file = fileInput.files[0];
  if (!file) { toast('Please attach your submission file', 'error'); return; }
  if (file.size > 5 * 1024 * 1024) { toast('File too large (max 5MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = function (e) {
    const user = getCurrentUser();
    const submissions = getLS('submissions');
    submissions.push({ id: uuid(), assignmentId: currentSubmitAsgId, studentId: user.id, fileData: e.target.result, fileName: file.name, note, submittedAt: new Date().toISOString() });
    setLS('submissions', submissions);
    closeModal('submitAssignmentModal'); toast('Assignment submitted!', 'success'); loadAssignments();
  };
  reader.readAsDataURL(file);
}

/* ===== ANNOUNCEMENTS ===== */
function loadAnnouncements() {
  const anns = getLS('announcements').filter(a => a.subjectId === currentSubjectId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const el = document.getElementById('announcementsList');
  if (anns.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📢</div><h3>No Announcements Yet</h3></div>'; return; }
  el.innerHTML = anns.map(a => `<div class="list-item">
    <div class="list-item-icon">📢</div>
    <div class="list-item-content"><h4>${a.title}</h4><p>${a.content || ''}</p>
    <div class="list-item-meta">${fmtDateTime(a.createdAt)}</div></div>
    ${getCurrentUser().role === 'teacher' ? `<button class="btn btn-danger btn-sm" onclick="deleteAnnouncement('${a.id}')">🗑️</button>` : ''}
  </div>`).join('');
}
function addAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const content = document.getElementById('annContent').value.trim();
  if (!title) { toast('Title required', 'error'); return; }
  const anns = getLS('announcements');
  anns.push({ id: uuid(), subjectId: currentSubjectId, title, content, createdAt: new Date().toISOString() });
  setLS('announcements', anns); closeModal('addAnnouncementModal'); toast('Announcement posted!', 'success'); loadAnnouncements();
  document.getElementById('annTitle').value = ''; document.getElementById('annContent').value = '';
}
function deleteAnnouncement(id) { if (confirm('Delete?')) { setLS('announcements', getLS('announcements').filter(a => a.id !== id)); toast('Deleted', 'success'); loadAnnouncements(); } }

/* ===== ATTENDANCE ===== */
function getEnrolledStudents(subjectId) {
  const enrollments = getLS('enrollments').filter(e => e.subjectId === subjectId);
  const users = getLS('users');
  return enrollments.map(e => users.find(u => u.id === e.studentId)).filter(Boolean);
}
function loadAttendance() {
  const user = getCurrentUser(); const el = document.getElementById('attendanceContent');
  if (user.role === 'teacher') {
    const students = getEnrolledStudents(currentSubjectId);
    const attendance = getLS('attendance').filter(a => a.subjectId === currentSubjectId);
    if (students.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">✅</div><h3>No Students Enrolled</h3></div>'; return; }
    const dates = [...new Set(attendance.map(a => a.date))].sort().reverse();
    let html = '<div class="table-wrapper"><table><thead><tr><th>Student</th><th>Roll No</th><th>Present</th><th>Total</th><th>%</th></tr></thead><tbody>';
    students.forEach(s => {
      const records = attendance.filter(a => a.studentId === s.id);
      const present = records.filter(a => a.status === 'present').length;
      const total = dates.length; const pct = total > 0 ? Math.round(present / total * 100) : 0;
      html += `<tr onclick="viewStudentAttendance('${s.id}', '${s.name.replace(/'/g, "\\'")}')" style="cursor:pointer;" class="hover-row"><td>${s.name} <span style="font-size:0.8rem; color:var(--primary); margin-left:8px;">👁️ View</span></td><td>${s.rollNumber || '-'}</td><td>${present}</td><td>${total}</td><td class="${pct < 75 ? 'attendance-low' : ''}">${pct}%</td></tr>`;
    });
    html += '</tbody></table></div>'; el.innerHTML = html;
  } else {
    const attendance = getLS('attendance').filter(a => a.subjectId === currentSubjectId && a.studentId === user.id);
    const allDates = [...new Set(getLS('attendance').filter(a => a.subjectId === currentSubjectId).map(a => a.date))];
    const present = attendance.filter(a => a.status === 'present').length;
    const total = allDates.length; const pct = total > 0 ? Math.round(present / total * 100) : 0;
    let html = `<div style="text-align:center;padding:20px;"><div style="font-size:3rem;font-weight:800;${pct < 75 ? 'color:var(--danger)' : 'color:var(--secondary)'}">${pct}%</div>
      <div style="color:var(--text-secondary);margin-top:4px;">Attendance (${present}/${total} classes)</div>
      ${pct < 75 ? '<div class="badge badge-danger" style="margin-top:8px;">⚠️ Below 75% - Shortage Warning</div>' : '<div class="badge badge-success" style="margin-top:8px;">✅ Good Standing</div>'}
    </div>`;
    if (attendance.length > 0) {
      html += '<div class="table-wrapper" style="margin-top:16px;"><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>';
      attendance.sort((a, b) => b.date.localeCompare(a.date)).forEach(a => {
        html += `<tr><td>${fmtDate(a.date)}</td><td><span class="badge ${a.status === 'present' ? 'badge-success' : 'badge-danger'}">${a.status === 'present' ? '✅ Present' : '❌ Absent'}</span></td></tr>`;
      });
      html += '</tbody></table></div>';
    }
    el.innerHTML = html;
  }
}
function openMarkAttendanceModal() {
  const students = getEnrolledStudents(currentSubjectId);
  if (students.length === 0) { toast('No students enrolled', 'error'); return; }
  document.getElementById('attendanceDate').value = new Date().toISOString().split('T')[0];
  const el = document.getElementById('attendanceStudentsList');
  el.innerHTML = '<div style="margin-top:16px;">' + students.map(s => `<div class="list-item" style="padding:8px 0;">
    <label style="display:flex;align-items:center;gap:12px;cursor:pointer;width:100%;">
      <input type="checkbox" checked data-student-id="${s.id}" style="width:20px;height:20px;">
      <div><strong>${s.name}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${s.rollNumber || ''}</div></div>
    </label>
  </div>`).join('') + '</div>';
  openModal('markAttendanceModal');
}
function saveAttendance() {
  const date = document.getElementById('attendanceDate').value;
  if (!date) { toast('Select a date', 'error'); return; }
  const checkboxes = document.querySelectorAll('#attendanceStudentsList input[type="checkbox"]');
  let attendance = getLS('attendance');
  attendance = attendance.filter(a => !(a.subjectId === currentSubjectId && a.date === date));
  checkboxes.forEach(cb => {
    attendance.push({ subjectId: currentSubjectId, studentId: cb.dataset.studentId, date, status: cb.checked ? 'present' : 'absent' });
  });
  setLS('attendance', attendance); closeModal('markAttendanceModal'); toast('Attendance saved!', 'success'); loadAttendance();
}

function viewStudentAttendance(studentId, studentName) {
  const attendance = getLS('attendance').filter(a => a.subjectId === currentSubjectId && a.studentId === studentId);
  document.getElementById('viewStudentAttendanceName').textContent = studentName;
  const el = document.getElementById('viewStudentAttendanceContent');
  if (attendance.length === 0) {
    el.innerHTML = '<div class="empty-state"><p>No attendance records found.</p></div>';
  } else {
    let html = '<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Status</th></tr></thead><tbody>';
    attendance.sort((a, b) => b.date.localeCompare(a.date)).forEach(a => {
      html += `<tr><td>${fmtDate(a.date)}</td><td><span class="badge ${a.status === 'present' ? 'badge-success' : 'badge-danger'}">${a.status === 'present' ? '✅ Present' : '❌ Absent'}</span></td></tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  }
  openModal('viewStudentAttendanceModal');
}

/* ===== MARKS ===== */
function loadMarks() {
  const user = getCurrentUser(); const el = document.getElementById('marksContent');
  const marks = getLS('marks').filter(m => m.subjectId === currentSubjectId);
  if (user.role === 'teacher') {
    const students = getEnrolledStudents(currentSubjectId);
    if (students.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📊</div><h3>No Students Enrolled</h3></div>'; return; }
    const exams = [...new Set(marks.map(m => m.examName))];
    if (exams.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📊</div><h3>No Marks Assigned Yet</h3></div>'; return; }
    let html = '<div class="table-wrapper"><table><thead><tr><th>Student</th><th>Roll No</th>';
    exams.forEach(e => {
      const tm = marks.find(m => m.examName === e);
      const safeExam = e.replace(/'/g, "\\'");
      html += `<th>${e} (${tm ? tm.totalMarks : ''})<div style="margin-top:4px;display:flex;gap:4px;justify-content:center;">
        <button class="btn btn-sm" style="padding:2px 8px;font-size:0.7rem;background:var(--primary);color:#fff;" onclick="editExamMarks('${safeExam}')">✏️ Edit</button>
        <button class="btn btn-sm" style="padding:2px 8px;font-size:0.7rem;background:var(--danger);color:#fff;" onclick="deleteExamMarks('${safeExam}')">🗑️</button>
      </div></th>`;
    });
    html += '</tr></thead><tbody>';
    students.forEach(s => {
      html += `<tr><td>${s.name}</td><td>${s.rollNumber || '-'}</td>`;
      exams.forEach(e => { const m = marks.find(mk => mk.studentId === s.id && mk.examName === e); html += `<td>${m ? m.marks : '-'}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></div>'; el.innerHTML = html;
  } else {
    const myMarks = marks.filter(m => m.studentId === user.id);
    if (myMarks.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">📊</div><h3>No Marks Available</h3></div>'; return; }
    let html = '<div class="table-wrapper"><table><thead><tr><th>Exam</th><th>Marks</th><th>Total</th><th>%</th></tr></thead><tbody>';
    myMarks.forEach(m => {
      const pct = Math.round(m.marks / m.totalMarks * 100);
      html += `<tr><td>${m.examName}</td><td>${m.marks}</td><td>${m.totalMarks}</td><td><span class="badge ${pct >= 40 ? 'badge-success' : 'badge-danger'}">${pct}%</span></td></tr>`;
    });
    html += '</tbody></table></div>'; el.innerHTML = html;
  }
}
function openAssignMarksModal() {
  const students = getEnrolledStudents(currentSubjectId);
  if (students.length === 0) { toast('No students enrolled', 'error'); return; }
  document.getElementById('examName').value = '';
  document.getElementById('examName').removeAttribute('readonly');
  document.getElementById('totalMarks').value = '100';
  const el = document.getElementById('marksStudentsList');
  el.innerHTML = '<div style="margin-top:16px;">' + students.map(s => `<div class="list-item" style="padding:8px 0;">
    <div style="flex:1;"><strong>${s.name}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${s.rollNumber || ''}</div></div>
    <input type="number" data-student-id="${s.id}" placeholder="Marks" style="width:80px;" min="0">
  </div>`).join('') + '</div>';
  openModal('assignMarksModal');
}
function saveMarks() {
  const examName = document.getElementById('examName').value.trim();
  const totalMarks = parseInt(document.getElementById('totalMarks').value);
  if (!examName || !totalMarks) { toast('Fill exam name and total marks', 'error'); return; }
  const inputs = document.querySelectorAll('#marksStudentsList input[type="number"]');
  let marks = getLS('marks');
  marks = marks.filter(m => !(m.subjectId === currentSubjectId && m.examName === examName));
  inputs.forEach(inp => {
    const v = parseInt(inp.value);
    if (!isNaN(v)) { marks.push({ subjectId: currentSubjectId, studentId: inp.dataset.studentId, examName, marks: v, totalMarks }); }
  });
  setLS('marks', marks); closeModal('assignMarksModal'); toast('Marks saved!', 'success'); loadMarks();
}
function editExamMarks(examName) {
  const students = getEnrolledStudents(currentSubjectId);
  const marks = getLS('marks').filter(m => m.subjectId === currentSubjectId && m.examName === examName);
  const tm = marks.length > 0 ? marks[0].totalMarks : 100;
  document.getElementById('examName').value = examName;
  document.getElementById('examName').setAttribute('readonly', true);
  document.getElementById('totalMarks').value = tm;
  const el = document.getElementById('marksStudentsList');
  el.innerHTML = '<div style="margin-top:16px;">' + students.map(s => {
    const existing = marks.find(m => m.studentId === s.id);
    return `<div class="list-item" style="padding:8px 0;">
      <div style="flex:1;"><strong>${s.name}</strong><div style="font-size:0.8rem;color:var(--text-muted);">${s.rollNumber || ''}</div></div>
      <input type="number" data-student-id="${s.id}" value="${existing ? existing.marks : ''}" placeholder="Marks" style="width:80px;" min="0">
    </div>`;
  }).join('') + '</div>';
  openModal('assignMarksModal');
}
function deleteExamMarks(examName) {
  if (!confirm('Delete all marks for "' + examName + '"? This cannot be undone.')) return;
  let marks = getLS('marks');
  marks = marks.filter(m => !(m.subjectId === currentSubjectId && m.examName === examName));
  setLS('marks', marks);
  toast('Marks for "' + examName + '" deleted', 'success');
  loadMarks();
}

/* ===== SUBJECT MESSAGES ===== */
function loadSubjectMessages() {
  const el = document.getElementById('subjectMessagesArea'); if (!el) return;
  const user = getCurrentUser();
  if (user.role === 'teacher') {
    const students = getEnrolledStudents(currentSubjectId);
    if (students.length === 0) { el.innerHTML = '<div class="empty-state"><div class="icon">💬</div><h3>No Students to Message</h3></div>'; return; }
    el.innerHTML = `<button class="btn btn-primary btn-sm mb-4" onclick="openSubjectMsgModal()">✉️ Send Message to Student</button>
      <div class="card"><div class="card-body" id="subjectMsgList"></div></div>`;
    const msgs = getLS('messages').filter(m => m.subjectId === currentSubjectId && (m.senderId === user.id || m.receiverId === user.id)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const list = document.getElementById('subjectMsgList');
    if (msgs.length === 0) { list.innerHTML = '<div class="empty-state"><p>No messages yet</p></div>'; return; }
    const users = getLS('users');
    list.innerHTML = msgs.map(m => {
      const other = users.find(u => u.id === (m.senderId === user.id ? m.receiverId : m.senderId));
      return `<div class="list-item"><div class="list-item-icon">${m.senderId === user.id ? '📤' : '📥'}</div>
        <div class="list-item-content"><h4>${m.senderId === user.id ? 'To: ' : 'From: '}${other ? other.name : 'Unknown'}</h4><p>${m.content}</p>
        <div class="list-item-meta">${fmtDateTime(m.timestamp)}</div></div></div>`;
    }).join('');
  } else {
    const subject = getLS('subjects').find(s => s.id === currentSubjectId);
    const msgs = getLS('messages').filter(m => m.subjectId === currentSubjectId && (m.senderId === user.id || m.receiverId === user.id)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    el.innerHTML = `<button class="btn btn-primary btn-sm mb-4" onclick="openSubjectMsgModalStudent()">✉️ Message Teacher</button>
      <div class="card"><div class="card-body" id="subjectMsgList"></div></div>`;
    const list = document.getElementById('subjectMsgList');
    if (msgs.length === 0) { list.innerHTML = '<div class="empty-state"><p>No messages yet</p></div>'; return; }
    list.innerHTML = msgs.map(m => `<div class="list-item"><div class="list-item-icon">${m.senderId === user.id ? '📤' : '📥'}</div>
      <div class="list-item-content"><h4>${m.senderId === user.id ? 'You' : 'Teacher'}</h4><p>${m.content}</p>
      <div class="list-item-meta">${fmtDateTime(m.timestamp)}</div></div></div>`).join('');
  }
}
function openSubjectMsgModal() {
  const students = getEnrolledStudents(currentSubjectId);
  const sel = document.getElementById('msgRecipient');
  sel.innerHTML = students.map(s => `<option value="${s.id}">${s.name} (${s.rollNumber || ''})</option>`).join('');
  document.getElementById('msgContent').value = ''; openModal('sendMsgModal');
}
function openSubjectMsgModalStudent() {
  const subject = getLS('subjects').find(s => s.id === currentSubjectId); if (!subject) return;
  const sel = document.getElementById('msgRecipient');
  sel.innerHTML = `<option value="${subject.teacherId}">${subject.teacherName} (Teacher)</option>`;
  document.getElementById('msgContent').value = ''; openModal('sendMsgModal');
}
function sendSubjectMessage() {
  const receiverId = document.getElementById('msgRecipient').value;
  const content = document.getElementById('msgContent').value.trim();
  if (!content) { toast('Message cannot be empty', 'error'); return; }
  const user = getCurrentUser(); const msgs = getLS('messages');
  msgs.push({ id: uuid(), senderId: user.id, receiverId, subjectId: currentSubjectId, content, timestamp: new Date().toISOString(), read: false });
  setLS('messages', msgs); closeModal('sendMsgModal'); toast('Message sent!', 'success'); loadSubjectMessages(); updateMsgBadge();
}

/* ===== INBOX ===== */
let activeChatUserId = null;
function initInbox() {
  loadConversations();
  if (window.innerWidth <= 768) { document.getElementById('chatBackBtn').style.display = 'block'; }
}
function loadConversations() {
  const user = getCurrentUser(); const msgs = getLS('messages'); const users = getLS('users');
  const myMsgs = msgs.filter(m => m.senderId === user.id || m.receiverId === user.id);
  const partnerIds = [...new Set(myMsgs.map(m => m.senderId === user.id ? m.receiverId : m.senderId))];
  const el = document.getElementById('conversationsList');
  const empty = document.getElementById('noConversations');
  if (partnerIds.length === 0) { el.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  el.innerHTML = partnerIds.map(pid => {
    const partner = users.find(u => u.id === pid); if (!partner) return '';
    const thread = myMsgs.filter(m => (m.senderId === pid && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === pid)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const last = thread[0]; const unread = thread.filter(m => m.receiverId === user.id && !m.read).length;
    return `<div class="inbox-list-item ${unread > 0 ? 'unread' : ''} ${activeChatUserId === pid ? 'active' : ''}" onclick="openChat('${pid}')">
      <div class="user-avatar" style="width:40px;height:40px;font-size:0.9rem;">${partner.name.charAt(0).toUpperCase()}</div>
      <div style="flex:1;min-width:0;">
        <div class="flex justify-between"><strong style="font-size:0.9rem;">${partner.name}</strong><span class="time">${fmtTime(last.timestamp)}</span></div>
        <div class="preview">${last.content}</div>
      </div>
      ${unread > 0 ? `<span class="notif-badge">${unread}</span>` : ''}
    </div>`;
  }).join('');
}
function openChat(partnerId) {
  activeChatUserId = partnerId;
  const user = getCurrentUser(); const users = getLS('users'); const partner = users.find(u => u.id === partnerId);
  if (!partner) return;
  document.getElementById('chatPlaceholder').style.display = 'none';
  const view = document.getElementById('activeChatView'); view.classList.remove('hidden'); view.style.display = 'flex';
  document.getElementById('chatPartnerName').textContent = partner.name;
  document.getElementById('chatPartnerRole').textContent = partner.role;
  if (window.innerWidth <= 768) { document.getElementById('chatArea').classList.add('active'); }
  // Mark as read
  let msgs = getLS('messages');
  msgs.forEach(m => { if (m.senderId === partnerId && m.receiverId === user.id && !m.read) m.read = true; });
  setLS('messages', msgs);
  renderChatMessages(partnerId); loadConversations(); updateMsgBadge();
}
function renderChatMessages(partnerId) {
  const user = getCurrentUser(); const msgs = getLS('messages');
  const thread = msgs.filter(m => (m.senderId === partnerId && m.receiverId === user.id) || (m.senderId === user.id && m.receiverId === partnerId)).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const el = document.getElementById('chatMessages');
  el.innerHTML = thread.map(m => `<div class="message-bubble ${m.senderId === user.id ? 'sent' : 'received'}">
    <div>${m.content}</div><div class="message-time">${fmtTime(m.timestamp)}</div>
  </div>`).join('');
  el.scrollTop = el.scrollHeight;
}
function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const content = input.value.trim(); if (!content || !activeChatUserId) return;
  const user = getCurrentUser(); const msgs = getLS('messages');
  msgs.push({ id: uuid(), senderId: user.id, receiverId: activeChatUserId, content, timestamp: new Date().toISOString(), read: false });
  setLS('messages', msgs); input.value = ''; renderChatMessages(activeChatUserId); loadConversations();
}
function closeChatMobile() {
  document.getElementById('chatArea').classList.remove('active'); activeChatUserId = null;
}
function openNewMessageModal() {
  const user = getCurrentUser(); const users = getLS('users');
  const subjects = getLS('subjects'); const enrollments = getLS('enrollments');
  let contacts = [];
  if (user.role === 'teacher') {
    const mySubjects = subjects.filter(s => s.teacherId === user.id);
    const studentIds = [...new Set(enrollments.filter(e => mySubjects.some(s => s.id === e.subjectId)).map(e => e.studentId))];
    contacts = users.filter(u => studentIds.includes(u.id));
  } else {
    const myEnr = enrollments.filter(e => e.studentId === user.id).map(e => e.subjectId);
    const teacherIds = [...new Set(subjects.filter(s => myEnr.includes(s.id)).map(s => s.teacherId))];
    contacts = users.filter(u => teacherIds.includes(u.id));
  }
  const sel = document.getElementById('newMsgRecipient');
  sel.innerHTML = contacts.length === 0 ? '<option value="">No contacts available</option>' : contacts.map(c => `<option value="${c.id}">${c.name} (${c.role})</option>`).join('');
  document.getElementById('newMsgContent').value = ''; openModal('newMsgModal');
}
function sendNewMessage() {
  const receiverId = document.getElementById('newMsgRecipient').value;
  const content = document.getElementById('newMsgContent').value.trim();
  if (!receiverId || !content) { toast('Select recipient and type a message', 'error'); return; }
  const user = getCurrentUser(); const msgs = getLS('messages');
  msgs.push({ id: uuid(), senderId: user.id, receiverId, content, timestamp: new Date().toISOString(), read: false });
  setLS('messages', msgs); closeModal('newMsgModal'); toast('Message sent!', 'success'); loadConversations();
  if (activeChatUserId === receiverId) renderChatMessages(receiverId);
  updateMsgBadge();
}
