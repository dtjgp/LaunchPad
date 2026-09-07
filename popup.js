const launchpad = document.getElementById('launchpad');
const addForm = document.getElementById('addForm');
const editModeBtn = document.getElementById('editModeBtn');
const siteNameInput = document.getElementById('siteName');
const siteUrlInput = document.getElementById('siteUrl');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const popupStatus = document.getElementById('popupStatus');
const shortcutFormStatus = document.getElementById('shortcutFormStatus');
let editingIndex = null;
let menuIndex = null;
let menuReturnFocus = null;
let formReturnFocus = null;

// escapeHtml, safeColor, defaultSites are provided by shared.js

let isEditMode = false;
let sites = [];
let settingsWriter = null;
let pendingExternalSites = null;

// 强制重置标记：改为 true 可以清除存储并使用默认站点

// 初始化
async function init() {
  let restoredSettings = {};
  try {
    {
      const keys = LaunchPadCore.STORAGE_KEYS;
      const [local, sync] = await Promise.all([
        chrome.storage.local.get(keys),
        chrome.storage.sync?.get ? chrome.storage.sync.get(keys).catch(() => ({})) : Promise.resolve({})
      ]);
      const selected = LaunchPadCore.selectNewestStorage(local, sync);
      restoredSettings = selected.primary;
      const checked = LaunchPadCore.sanitizeStoredSettings(selected.primary);
      const primary = checked.value;
      const secondary = LaunchPadCore.sanitizeStoredSettings(selected.secondary).value;
      if (checked.invalid.length) showPopupStatus('Some saved settings were invalid. Defaults are shown for those fields.', true);
      sites = Array.isArray(primary.sites)
        ? primary.sites
        : Array.isArray(secondary.sites)
          ? secondary.sites
          : [...defaultSites];
      applyLaunchPadTheme(primary.themeMode ?? secondary.themeMode ?? 'auto');
    }
  } catch (error) {
    sites = [...defaultSites];
    showPopupStatus('Stored shortcuts could not be loaded.', true);
  }
  settingsWriter = LaunchPadCore.createSettingsWriter(chrome.storage, { sites, ...restoredSettings });
  render();
}

// 添加按钮 (在 render 之前创建)
const addBtn = document.createElement('button');
addBtn.className = 'add-btn';
addBtn.type = 'button';
addBtn.setAttribute('aria-label', 'Add shortcut');
addBtn.innerHTML = `
  <span class="icon"><span class="material-icon icon-add" aria-hidden="true"></span></span>
  <span class="name">Add</span>
`;

// 渲染启动面板
function render() {
  launchpad.innerHTML = '';

  if (sites.length === 0) {
    launchpad.innerHTML = `
      <div class="empty-state">
        <p>No shortcuts yet. Click + to add one.</p>
      </div>
    `;
    launchpad.appendChild(addBtn);
    return;
  }

  sites.forEach((site, index) => {
    const siteUrl = LaunchPadCore.normalizeHttpUrl(site.url);
    if (!siteUrl) return;
    const item = document.createElement('div');
    item.className = 'launch-item';
    item.dataset.index = String(index);
    item.draggable = isEditMode;
    item.innerHTML = `
      <a class="launch-link" href="${escapeHtml(siteUrl)}" target="_blank" rel="noopener" title="${escapeHtml(site.name)}" draggable="false">
        <div class="icon"></div>
        <span class="name">${escapeHtml(site.name)}</span>
      </a>
      <button class="shortcut-more" type="button" aria-label="More options for ${escapeHtml(site.name)}" aria-haspopup="menu" aria-expanded="false"><span class="material-icon icon-more_vert" aria-hidden="true"></span></button>
      <button class="delete-btn" type="button" aria-label="Remove ${escapeHtml(site.name)}">&times;</button>
    `;
    item.querySelector('.icon').appendChild(createSiteIcon(siteUrl, site.name));
    launchpad.appendChild(item);
  });

  launchpad.appendChild(addBtn);

  // 删除按钮事件
  launchpad.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.disabled = true;
      await removeShortcut(Number(btn.closest('.launch-item').dataset.index));
    });
  });
}

function reorder(list, fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
}

function clearDragOver() {
  launchpad.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

let dragState = null;

function handleDragStart(e) {
  if (!isEditMode) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  dragState = {
    index: parseInt(item.dataset.index, 10)
  };
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (!dragState) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  e.preventDefault();
  clearDragOver();
  item.classList.add('drag-over');
}

async function handleDrop(e) {
  if (!dragState) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  e.preventDefault();
  const targetIndex = parseInt(item.dataset.index, 10);
  const previousSites = [...sites];
  reorder(sites, dragState.index, targetIndex);
  dragState = null;
  clearDragOver();
  const result = await saveSites({ announce: true });
  if (!result.localOk) sites = previousSites;
  render();
}

function handleDragEnd() {
  dragState = null;
  clearDragOver();
}

function showPopupStatus(message, isError = false) {
  if (!popupStatus) return;
  popupStatus.textContent = message;
  popupStatus.classList.toggle('error', isError);
}

// 保存站点
async function saveSites({ announce = false } = {}) {
  const result = await settingsWriter.save({ sites });
  if (announce) {
    if (!result.localOk) {
      showPopupStatus(`Save failed. ${result.localError}`, true);
    } else if (result.syncOk === false) {
      showPopupStatus('Saved locally; Chrome sync failed.', true);
    } else {
      showPopupStatus('Saved');
    }
  }
  return result;
}

// 编辑模式切换
editModeBtn.addEventListener('click', () => {
  isEditMode = !isEditMode;
  editModeBtn.classList.toggle('active', isEditMode);
  editModeBtn.setAttribute('aria-pressed', isEditMode ? 'true' : 'false');
  document.body.classList.toggle('edit-mode', isEditMode);
  document.body.classList.toggle('drag-enabled', isEditMode);
  render();
  if (!isEditMode) applyPendingExternalSites();
});

function closeForm() {
  addForm.classList.add('hidden');
  siteNameInput.value = '';
  siteUrlInput.value = '';
  clearShortcutValidation();
  const fallback = editingIndex === null ? addBtn
    : launchpad.querySelector(`[data-index="${editingIndex}"] .shortcut-more`) || addBtn;
  (formReturnFocus?.isConnected ? formReturnFocus : fallback).focus();
  editingIndex = null;
  applyPendingExternalSites();
}

function openForm(index = null, returnFocus = document.activeElement) {
  editingIndex = index;
  formReturnFocus = returnFocus;
  clearShortcutValidation();
  document.getElementById('shortcutFormTitle').textContent = index === null ? 'Add shortcut' : 'Edit shortcut';
  saveBtn.textContent = index === null ? 'Add' : 'Save';
  siteNameInput.value = index === null ? '' : sites[index].name;
  siteUrlInput.value = index === null ? '' : sites[index].url;
  addForm.classList.remove('hidden');
  siteNameInput.focus();
}

cancelBtn.addEventListener('click', closeForm);
for (const input of [siteNameInput, siteUrlInput]) {
  input.addEventListener('input', () => {
    input.setAttribute('aria-invalid', 'false');
    document.getElementById(`${input.id}Error`).textContent = '';
    shortcutFormStatus.textContent = '';
  });
}
addForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (saveBtn.disabled) return;
  const candidate = LaunchPadCore.validateShortcut(siteNameInput.value, siteUrlInput.value);
  showShortcutValidation(candidate);
  if (!candidate.ok) {
    (candidate.errors.name ? siteNameInput : siteUrlInput).focus();
    return;
  }
  const previousSites = [...sites];
  if (editingIndex === null) sites.push({ name: candidate.name, url: candidate.url });
  else sites[editingIndex] = { ...sites[editingIndex], name: candidate.name, url: candidate.url };
  saveBtn.disabled = true;
  cancelBtn.disabled = true;
  launchpad.inert = true;
  editModeBtn.disabled = true;
  const result = await saveSites({ announce: true });
  saveBtn.disabled = false;
  cancelBtn.disabled = false;
  launchpad.inert = false;
  editModeBtn.disabled = false;
  if (!result.localOk) {
    sites = previousSites;
    shortcutFormStatus.textContent = `Could not save this shortcut. ${result.localError} Your changes are still here.`;
    return;
  }
  render();
  closeForm();
});

async function removeShortcut(index) {
  const previousSites = [...sites];
  sites.splice(index, 1);
  const result = await saveSites({ announce: true });
  if (!result.localOk) sites = previousSites;
  render();
  addBtn.focus();
}

const shortcutMenu = document.createElement('div');
shortcutMenu.className = 'shortcut-menu hidden';
shortcutMenu.setAttribute('role', 'menu');
shortcutMenu.innerHTML = '<button type="button" role="menuitem" data-action="edit">Edit shortcut</button><button type="button" role="menuitem" data-action="remove">Remove</button>';
document.body.appendChild(shortcutMenu);
function closeMenu(restoreFocus = false) {
  shortcutMenu.classList.add('hidden');
  menuReturnFocus?.setAttribute('aria-expanded', 'false');
  if (restoreFocus && menuReturnFocus?.isConnected) menuReturnFocus.focus();
}
function openMenu(item, x, y) {
  menuIndex = Number(item.dataset.index);
  menuReturnFocus = item.querySelector('.shortcut-more');
  shortcutMenu.classList.remove('hidden');
  const rect = shortcutMenu.getBoundingClientRect();
  shortcutMenu.style.left = `${Math.max(8, Math.min(x, innerWidth - rect.width - 8))}px`;
  shortcutMenu.style.top = `${Math.max(8, Math.min(y, innerHeight - rect.height - 8))}px`;
  menuReturnFocus.setAttribute('aria-expanded', 'true');
  shortcutMenu.querySelector('button').focus();
}
launchpad.addEventListener('click', event => {
  const more = event.target.closest('.shortcut-more');
  if (more) {
    event.stopPropagation();
    const rect = more.getBoundingClientRect();
    openMenu(more.closest('.launch-item'), rect.left, rect.bottom + 4);
  } else if (event.target.closest('.add-btn')) openForm();
});
launchpad.addEventListener('contextmenu', event => {
  const item = event.target.closest('.launch-item');
  if (!item) return;
  event.preventDefault();
  openMenu(item, event.clientX, event.clientY);
});
shortcutMenu.addEventListener('click', async event => {
  const action = event.target.closest('button')?.dataset.action;
  if (!action) return;
  closeMenu();
  if (action === 'edit') openForm(menuIndex, menuReturnFocus);
  if (action === 'remove') await removeShortcut(menuIndex);
});
shortcutMenu.addEventListener('keydown', event => {
  const items = Array.from(shortcutMenu.querySelectorAll('button'));
  const index = items.indexOf(document.activeElement);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }
  if (event.key === 'Tab') closeMenu(true);
});
document.addEventListener('click', event => {
  if (!shortcutMenu.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!shortcutMenu.classList.contains('hidden')) closeMenu(true);
  else if (!addForm.classList.contains('hidden') && !saveBtn.disabled) closeForm();
});

launchpad.addEventListener('dragstart', handleDragStart);
launchpad.addEventListener('dragover', handleDragOver);
launchpad.addEventListener('dragleave', clearDragOver);
launchpad.addEventListener('drop', handleDrop);
launchpad.addEventListener('dragend', handleDragEnd);

// 初始化
function applyPendingExternalSites() {
  if (!pendingExternalSites || isEditMode || !addForm.classList.contains('hidden')) return;
  sites = pendingExternalSites;
  pendingExternalSites = null;
  settingsWriter.accept({ sites });
  render();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !settingsWriter) return;
  if (changes.sites && Array.isArray(changes.sites.newValue) && !LaunchPadCore.settingsEqual(changes.sites.newValue, sites)) {
    pendingExternalSites = changes.sites.newValue;
    applyPendingExternalSites();
  }
  if (changes.themeMode) applyLaunchPadTheme(changes.themeMode.newValue);
});

init();
