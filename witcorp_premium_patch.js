// ============================================================
// WITCORP PREMIUM PATCH — Speed-dial Actions + Boot Animation
// Add this code AFTER your existing script.js
// ============================================================

// ============================================================
// BOOT CINEMATIC ANIMATION
// ============================================================
(function initBootAnimation() {
    // Create boot overlay
    const overlay = document.createElement('div');
    overlay.id = 'bootOverlay';
    overlay.innerHTML = `
        <div class="boot-particles" id="bootParticles"></div>
        <div class="boot-logo-ring">
            <div class="boot-logo-inner">
                <img src="logo.png" alt="Witcorp">
            </div>
        </div>
        <div class="boot-title">Witcorp Hub</div>
        <div class="boot-subtitle">Strategic Wisdom · Global Growth</div>
        <div class="boot-bar-wrap"><div class="boot-bar-fill"></div></div>
    `;
    document.body.insertBefore(overlay, document.body.firstChild);

    // Particles
    const colors = ['#fbbf24','#f59e0b','#3b82f6','#4ade80','#a78bfa'];
    const particles = document.getElementById('bootParticles');
    for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.className = 'boot-particle';
        const size = 4 + Math.random() * 6;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const tx = (Math.random() - 0.5) * 300;
        const ty = -80 - Math.random() * 200;
        const delay = Math.random() * 1.5;
        const dur = 1.5 + Math.random() * 1.5;
        p.style.cssText = `
            width:${size}px; height:${size}px;
            background:${color};
            left:${30 + Math.random()*40}%;
            top:${30 + Math.random()*40}%;
            --tx:${tx}px; --ty:${ty}px;
            --dur:${dur}s; --delay:${delay}s;
            animation-delay: ${delay}s;
            animation-duration: ${dur}s;
        `;
        particles.appendChild(p);
    }

    // Dismiss after animation
    setTimeout(() => {
        overlay.classList.add('fade-out');
        setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 750);
    }, 2200);
})();

// ============================================================
// SPEED-DIAL ACTION PANEL SYSTEM
// ============================================================
let _activeSpeedDial = null;

function openActionPanel(rowId, triggerBtn) {
    // Close any already open panel
    closeAllActionPanels();

    const row = rowDataMap.get(rowId);
    if (!row) return;

    const clientName = row.client_name || '';

    // Create panel
    const panel = document.createElement('div');
    panel.className = 'action-panel';
    panel.id = 'actionPanel_' + rowId;

    panel.innerHTML = `
        <button class="action-panel-btn apb-pin" onclick="togglePin(${rowId}); closeAllActionPanels();" id="apb_pin_${rowId}">
            <div class="apb-icon"><i class="fas fa-thumbtack"></i></div>
            <span>Pin Record</span>
        </button>
        <button class="action-panel-btn apb-chat" onclick="openCommentsModal(${rowId}, '${escPanelStr(clientName)}'); closeAllActionPanels();">
            <div class="apb-icon"><i class="fas fa-comments"></i></div>
            <span>Comments</span>
        </button>
        <button class="action-panel-btn apb-check" onclick="openSubtasksModal(${rowId}, '${escPanelStr(clientName)}'); closeAllActionPanels();">
            <div class="apb-icon"><i class="fas fa-list-check"></i></div>
            <span>Checklist</span>
        </button>
        <button class="action-panel-btn apb-hist" onclick="openAuditModal(${rowId}); closeAllActionPanels();">
            <div class="apb-icon"><i class="fas fa-clock-rotate-left"></i></div>
            <span>History</span>
        </button>
        <div class="action-panel-divider"></div>
        <button class="action-panel-btn apb-edit" onclick="editRecord(${rowId}); closeAllActionPanels();">
            <div class="apb-icon"><i class="fas fa-edit"></i></div>
            <span>Edit Record</span>
        </button>
        <button class="action-panel-btn apb-del" onclick="deleteRecord(${rowId}); closeAllActionPanels();">
            <div class="apb-icon"><i class="fas fa-trash-alt"></i></div>
            <span>Delete</span>
        </button>
    `;

    document.body.appendChild(panel);

    // Position near trigger button
    const rect = triggerBtn.getBoundingClientRect();
    const panelW = 170;
    const panelH = 270;
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;

    let left = rect.right - panelW;
    let top = rect.bottom + 6;

    if (left < 8) left = 8;
    if (left + panelW > vpW - 8) left = vpW - panelW - 8;
    if (top + panelH > vpH - 8) top = rect.top - panelH - 6;

    panel.style.left = left + 'px';
    panel.style.top = top + 'px';

    // Trigger open animation
    requestAnimationFrame(() => {
        panel.style.display = 'flex';
        requestAnimationFrame(() => panel.classList.add('open'));
    });

    // Mark trigger
    triggerBtn.classList.add('open');
    _activeSpeedDial = { panel, btn: triggerBtn };

    // Check pin status and update
    checkIfPinned(rowId).then(isPinned => {
        const pinBtn = document.getElementById('apb_pin_' + rowId);
        if (pinBtn) {
            const icon = pinBtn.querySelector('.apb-icon i');
            const label = pinBtn.querySelector('span');
            if (isPinned) {
                icon.style.color = '#f59e0b';
                label.textContent = 'Unpin';
                pinBtn.style.background = '#fffbeb';
            }
        }
    });
}

function closeAllActionPanels() {
    document.querySelectorAll('.action-panel').forEach(p => {
        p.classList.remove('open');
        setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 220);
    });
    document.querySelectorAll('.action-trigger-btn.open').forEach(b => b.classList.remove('open'));
    _activeSpeedDial = null;
}

function escPanelStr(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// Close on outside click
document.addEventListener('click', function(e) {
    if (_activeSpeedDial) {
        if (!e.target.closest('.action-panel') && !e.target.closest('.action-trigger-btn')) {
            closeAllActionPanels();
        }
    }
}, true);

// Close on scroll
document.addEventListener('scroll', function() {
    if (_activeSpeedDial) closeAllActionPanels();
}, true);

// ============================================================
// PATCH renderTable — replace actions column with speed-dial
// ============================================================
const _origRenderTable = renderTable;

function renderTable(data, targetId) {
    currentExportData = data;
    currentExportType = "records";
    const tbody = document.getElementById(targetId);
    if (!tbody) return;

    _rmkCounter = 0;
    rowDataMap.clear();

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="12" class="p-16 text-center">
              <div class="flex flex-col items-center gap-4">
                <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-folder-open text-3xl text-slate-300"></i>
                </div>
                <p class="font-black text-slate-400 text-sm uppercase tracking-wider">No records found</p>
                <p class="text-xs text-slate-300">Try adjusting your filters or add a new record above</p>
              </div>
            </td></tr>`;
        return;
    }

    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
    const rows = [];

    data.forEach(row => {
        rowDataMap.set(row.id, row);

        const statusClass = {'Completed':'st-completed','Pending':'st-pending','Processing':'st-processing'}[row.status] || 'bg-slate-100';
        const statusIcon  = {'Completed':'fa-circle-check','Pending':'fa-circle-exclamation','Processing':'fa-spinner fa-spin'}[row.status] || 'fa-info-circle';

        let rowBg = 'hover:bg-slate-50/80';
        if (row.deadline && row.status !== 'Completed') {
            const dl = new Date(row.deadline); dl.setHours(0,0,0,0);
            if (dl < today)       rowBg = 'bg-red-50 hover:bg-red-100/60';
            else if (dl.getTime() === today.getTime() || dl.getTime() === tomorrow.getTime()) rowBg = 'bg-amber-50 hover:bg-amber-100/60';
        }

        let datePart = '', timePart = '';
        if (row.updated_at) {
            const d = new Date(row.updated_at);
            datePart = d.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
            timePart = d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true});
        }
        const lastUpdate = row.updated_at ? `${datePart}, ${timePart}` : 'Syncing...';

        const svcFull = esc(row.service_detail || 'General Consulting');
        const svcWords = svcFull.split(' ');
        let svcLines = [];
        if (svcWords.length <= 3) { svcLines = [svcFull]; }
        else { for (let i=0;i<svcWords.length;i+=3) svcLines.push(svcWords.slice(i,i+3).join(' ')); }
        const svcDisplay = svcLines.map(l => `<span style="display:block;font-size:13px;font-weight:600;color:#334155;line-height:1.6;">${l}</span>`).join('');

        _rmkCounter++;
        const uid = `rmk_${_rmkCounter}`;
        const fullRemarksRaw = row.remarks || '—';
        const safeShort = fullRemarksRaw.length > 55 ? fullRemarksRaw.substring(0,54)+'\u2026' : fullRemarksRaw;
        const needsExpand = fullRemarksRaw.length > 55;
        const safeShortHtml = esc(safeShort);
        const safeFull = esc(fullRemarksRaw);

        const remarksCell = needsExpand
            ? `<div style="min-width:180px;max-width:260px;">
                <span id="${uid}_s" style="font-size:13px;color:#475569;font-weight:400;">${safeShortHtml}</span>
                <span id="${uid}_f" style="font-size:13px;color:#475569;font-weight:400;display:none;">${safeFull}</span>
                <button data-rmk="${uid}" class="rmk-toggle-btn" style="margin-left:4px;font-size:11px;font-weight:700;color:#3b82f6;background:none;border:none;cursor:pointer;padding:0;text-decoration:underline;vertical-align:middle;">more</button>
               </div>`
            : `<span style="font-size:13px;color:#475569;font-weight:400;">${safeShortHtml}</span>`;

        const updatedBy = row.updated_by || 'N/A';
        const updatedByShort = updatedBy.includes('@') ? updatedBy.split('@')[0] : updatedBy;
        const updatedByCell = `
            <div style="display:inline-flex;align-items:center;gap:5px;max-width:145px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:4px 9px;" title="${esc(updatedBy)}">
              <i class="fas fa-user-circle" style="color:#3b82f6;font-size:12px;flex-shrink:0;"></i>
              <span style="font-size:12px;font-weight:600;color:#1d4ed8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${esc(updatedByShort)}</span>
            </div>`;

        let deadlineDisplay = 'N/A', deadlineBadge = '';
        if (row.deadline) {
            const dl = new Date(row.deadline); dl.setHours(0,0,0,0);
            deadlineDisplay = dl.toLocaleDateString('en-GB');
            if (row.status !== 'Completed') {
                if (dl < today) deadlineBadge = `<span style="display:block;font-size:9px;font-weight:700;color:#dc2626;background:#fee2e2;padding:1px 5px;border-radius:4px;margin-top:2px;">OVERDUE</span>`;
                else if (dl.getTime() === today.getTime()) deadlineBadge = `<span style="display:block;font-size:9px;font-weight:700;color:#d97706;background:#fef3c7;padding:1px 5px;border-radius:4px;margin-top:2px;">TODAY</span>`;
                else if (dl.getTime() === tomorrow.getTime()) deadlineBadge = `<span style="display:block;font-size:9px;font-weight:700;color:#d97706;background:#fef3c7;padding:1px 5px;border-radius:4px;margin-top:2px;">TOMORROW</span>`;
            }
        }

        const isChecked = selectedRowIds.has(row.id) ? 'checked' : '';

        // ★ SPEED-DIAL TRIGGER — replaces all 6 action buttons
        const speedDialBtn = `
            <div class="action-speed-dial">
                <button class="action-trigger-btn" 
                    onclick="openActionPanel(${row.id}, this)"
                    title="Actions">
                    <i class="fas fa-bolt"></i>
                </button>
            </div>`;

        rows.push(`
            <tr class="group transition-all ${rowBg}" id="row_${row.id}">
              <td class="p-4">
                <input type="checkbox" class="row-checkbox w-4 h-4 rounded" data-id="${row.id}" ${isChecked}
                  onchange="toggleRowSelect(${row.id}, this.checked)">
              </td>
              <td class="p-4 font-bold text-slate-800 text-sm whitespace-nowrap">${esc(row.client_name)}</td>
              <td class="p-4 whitespace-nowrap">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <i class="far fa-clock text-blue-400"></i>${lastUpdate}
                </div>
              </td>
              <td class="p-4" style="min-width:140px;max-width:200px;">${svcDisplay}</td>
              <td class="p-4 text-center whitespace-nowrap">
                <div class="inline-block px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase">${esc(row.service_category)}</div>
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 shadow-sm">
                  <i class="fas fa-user-tie text-blue-500 text-xs"></i>${esc(row.assigned_staff||'TBD')}
                </div>
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-xl text-xs font-semibold text-cyan-700 shadow-sm">
                  <i class="fas fa-user-check text-xs"></i>${esc(row.alloted_by||'N/A')}
                </div>
              </td>
              <td class="p-4 text-center font-semibold text-slate-600 text-sm whitespace-nowrap">
                <div>${deadlineDisplay}</div>${deadlineBadge}
              </td>
              <td class="p-4 text-center whitespace-nowrap">
                <span class="status-pill ${statusClass}"><i class="fas ${statusIcon}"></i>${esc(row.status)}</span>
              </td>
              <td class="p-4">${remarksCell}</td>
              <td class="p-4 whitespace-nowrap">${updatedByCell}</td>
              <td class="p-4 text-right whitespace-nowrap">
                ${speedDialBtn}
              </td>
            </tr>`);
    });

    tbody.innerHTML = rows.join('');
}

// ============================================================
// PREMIUM: Stagger table rows on load
// ============================================================
const _origFetchRecords = fetchRecords;
const _tableRowStagger = new MutationObserver(() => {
    document.querySelectorAll('#mainTableBody tr, #filterTableBody tr').forEach((tr, i) => {
        if (!tr.dataset.animated) {
            tr.dataset.animated = '1';
            tr.style.opacity = '0';
            tr.style.transform = 'translateY(12px)';
            tr.style.transition = `opacity 0.3s ease ${i*0.025}s, transform 0.3s cubic-bezier(0.34,1.2,0.64,1) ${i*0.025}s`;
            requestAnimationFrame(() => requestAnimationFrame(() => {
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            }));
        }
    });
});
_tableRowStagger.observe(document.body, { childList: true, subtree: true });

// ============================================================
// PREMIUM: Nav button ripple effect
// ============================================================
document.addEventListener('click', function(e) {
    const navBtn = e.target.closest('.nav-btn');
    if (navBtn) {
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position:absolute; border-radius:50%;
            background:rgba(255,255,255,0.25);
            pointer-events:none; transform:scale(0);
            animation: rippleOut 0.5s ease-out forwards;
            width:100px; height:100px;
            left:${e.offsetX-50}px; top:${e.offsetY-50}px;
        `;
        if (!document.getElementById('rippleStyle')) {
            const s = document.createElement('style');
            s.id = 'rippleStyle';
            s.textContent = '@keyframes rippleOut { to { transform:scale(2.5); opacity:0; } }';
            document.head.appendChild(s);
        }
        navBtn.style.position = 'relative';
        navBtn.style.overflow = 'hidden';
        navBtn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 500);
    }
});

// ============================================================
// PREMIUM: Status pill animate on change
// ============================================================
const _statusObserver = new MutationObserver(muts => {
    muts.forEach(m => {
        if (m.target.classList?.contains('status-pill')) {
            m.target.style.animation = 'none';
            requestAnimationFrame(() => {
                m.target.style.animation = 'cardBounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
            });
        }
    });
});
console.log('✅ Witcorp Premium Patch loaded — Speed-dial Actions + 3D Boot Animation active');
