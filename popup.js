const launchpad = document.getElementById('launchpad');
const addForm = document.getElementById('addForm');
const editModeBtn = document.getElementById('editModeBtn');
const siteNameInput = document.getElementById('siteName');
const siteUrlInput = document.getElementById('siteUrl');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');

// escapeHtml, safeColor, defaultSites are provided by shared.js

let isEditMode = false;
let sites = [];

// 强制重置标记：改为 true 可以清除存储并使用默认站点
const FORCE_RESET = false;

// 初始化
async function init() {
  console.log('FORCE_RESET =', FORCE_RESET);
  if (FORCE_RESET) {
    // 强制使用默认站点
    sites = [...defaultSites];
    await saveSites();
    console.log('LaunchPad: 已重置为默认 16 个站点');
    console.log('当前 sites 数量:', sites.length);
  } else {
    const stored = await chrome.storage.local.get('sites');
    console.log('从存储读取 sites 数量:', stored.sites?.length || 0);
    sites = stored.sites || defaultSites;
  }
  render();
}

// 添加按钮 (在 render 之前创建)
const addBtn = document.createElement('div');
addBtn.className = 'add-btn';
addBtn.innerHTML = `
  <span class="icon">+</span>
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
    const item = document.createElement('a');
    item.className = 'launch-item';
    item.href = site.url;
    item.target = '_blank';
    item.rel = 'noopener';
    item.dataset.index = String(index);
    item.draggable = isEditMode;
    item.innerHTML = `
      <div class="icon" style="background: ${safeColor(site.color) || getColorFromUrl(site.url)}">
        ${getFavicon(site.url)}
      </div>
      <span class="name">${escapeHtml(site.name)}</span>
      <button class="delete-btn" data-index="${index}">&times;</button>
    `;
    launchpad.appendChild(item);
  });

  launchpad.appendChild(addBtn);

  // 删除按钮事件
  launchpad.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(btn.dataset.index);
      sites.splice(index, 1);
      saveSites();
      render();
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

function handleDrop(e) {
  if (!dragState) return;
  const item = e.target.closest('[data-index]');
  if (!item) return;
  e.preventDefault();
  const targetIndex = parseInt(item.dataset.index, 10);
  reorder(sites, dragState.index, targetIndex);
  dragState = null;
  clearDragOver();
  saveSites();
  render();
}

function handleDragEnd() {
  dragState = null;
  clearDragOver();
}

// 获取颜色
function getColorFromUrl(url) {
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// 获取 favicon
function getFavicon(url) {
  try {
    const domain = new URL(url).hostname;
    return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" style="width:24px;height:24px;border-radius:6px;" />`;
  } catch {
    return '🔗';
  }
}

// 保存站点
function saveSites() {
  chrome.storage.local.set({ sites });
}

// 编辑模式切换
editModeBtn.addEventListener('click', () => {
  isEditMode = !isEditMode;
  editModeBtn.classList.toggle('active', isEditMode);
  document.body.classList.toggle('edit-mode', isEditMode);
  document.body.classList.toggle('drag-enabled', isEditMode);
  render();
});

// 添加新站点
cancelBtn.addEventListener('click', () => {
  addForm.classList.add('hidden');
  siteNameInput.value = '';
  siteUrlInput.value = '';
});

saveBtn.addEventListener('click', () => {
  const name = siteNameInput.value.trim();
  const url = siteUrlInput.value.trim();

  if (!name || !url) return;

  // 确保 URL 有协议
  let finalUrl = url;
  if (!/^https?:\/\//i.test(url)) {
    finalUrl = 'https://' + url;
  }

  sites.push({ name, url: finalUrl });
  saveSites();
  render();

  addForm.classList.add('hidden');
  siteNameInput.value = '';
  siteUrlInput.value = '';
});

// 点击添加按钮时显示表单
launchpad.addEventListener('click', (e) => {
  if (e.target.closest('.add-btn') || (isEditMode && launchpad.children.length === 0)) {
    addForm.classList.remove('hidden');
    siteNameInput.focus();
  }
});

launchpad.addEventListener('dragstart', handleDragStart);
launchpad.addEventListener('dragover', handleDragOver);
launchpad.addEventListener('dragleave', clearDragOver);
launchpad.addEventListener('drop', handleDrop);
launchpad.addEventListener('dragend', handleDragEnd);

// 初始化
init();
