import { GithubService } from './githubService.js';
import { TreeRenderer } from './treeRenderer.js';
import { PersonalStorage } from './personalStorage.js';
import { buildContextMenu } from './contextMenu.js';

const repoInput = document.getElementById('repoInput');
const branchInput = document.getElementById('branchInput');
const loadBtn = document.getElementById('loadBtn');
const modeSelect = document.getElementById('modeSelect');
const searchInput = document.getElementById('searchInput');
const ratelimitEl = document.getElementById('ratelimit');
const detailsEl = document.getElementById('details');
const explorerEl = document.getElementById('explorer');
const settingsBtn = document.getElementById('settingsBtn');
const settingsDialog = document.getElementById('settingsDialog');
const tokenInput = document.getElementById('tokenInput');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');

const github = new GithubService(() => localStorage.getItem('gh_token') || '');
const storage = new PersonalStorage();
const renderer = new TreeRenderer('#tree', {
  onToggle: handleToggle,
  onSelect: showDetails,
  onOpen: handleOpen,
});

const contextMenu = buildContextMenu(document.getElementById('contextMenu'), {
  onAddChild: (node) => {
    const newNode = storage.createNode({ parentId: node.id });
    renderer.setData(storage.getTree());
    renderer.centerOnNode(newNode.id);
  },
  onRename: (node) => {
    const title = prompt('Başlık', node.title || 'Yeni Düğüm');
    if (title) {
      storage.updateTitle(node.id, title);
      renderer.setData(storage.getTree());
    }
  },
  onDelete: (node) => {
    storage.deleteNode(node.id);
    renderer.setData(storage.getTree());
  },
  onEditNote: (node) => editMarkdown(node),
});

function setMode(mode){
  if(mode === 'repo'){
    repoInput.disabled = false; branchInput.disabled = false; loadBtn.disabled = false;
  } else {
    repoInput.disabled = true; branchInput.disabled = true; loadBtn.disabled = true;
    renderer.setData(storage.getTree());
  }
}

modeSelect.addEventListener('change', () => setMode(modeSelect.value));
setMode(modeSelect.value);

settingsBtn.addEventListener('click', () => {
  tokenInput.value = localStorage.getItem('gh_token') || '';
  settingsDialog.showModal();
});
saveSettingsBtn.addEventListener('click', () => {
  localStorage.setItem('gh_token', tokenInput.value.trim());
  settingsDialog.close();
});

loadBtn.addEventListener('click', async () => {
  try{
    const { owner, repo } = parseRepoUrl(repoInput.value.trim());
    const ref = branchInput.value.trim() || (await github.getDefaultBranch(owner, repo));
    const root = await github.getRootTree(owner, repo, ref);
    renderer.setData(root);
    renderExplorer(renderer.getData());
  }catch(err){
    console.error(err);
    alert('Yükleme başarısız: ' + (err?.message || err));
  }
});

searchInput.addEventListener('input', () => renderer.highlight(searchInput.value.trim()));

exportBtn.addEventListener('click', () => {
  const data = modeSelect.value === 'repo' ? renderer.getData() : storage.getTree();
  downloadJSON(data, 'tree.json');
});
importFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if(!file) return;
  const text = await file.text();
  const json = JSON.parse(text);
  if(modeSelect.value === 'repo'){
    renderer.setData(json);
    renderExplorer(renderer.getData());
  } else {
    storage.replaceTree(json);
    renderer.setData(storage.getTree());
  }
});

function showDetails(node){
  const meta = node.meta || {};
  const md = meta.note?.markdown || '';
  const html = md ? DOMPurify.sanitize(marked.parse(md)) : '<em>Not yok</em>';
  detailsEl.innerHTML = `
    <div><span class="badge">${node.type}</span> <strong>${node.title || node.path || ''}</strong></div>
    <div style="margin-top:8px">${html}</div>
    ${meta.github?.html_url ? `<div style="margin-top:8px"><a target="_blank" rel="noopener" href="${meta.github.html_url}">GitHub'da aç</a></div>` : ''}
  `;
}

async function handleToggle(node){
  if(node.type !== 'folder') return;
  if(node._loaded) return; // already loaded
  const { owner, repo, ref } = node.meta.github;
  const updated = await github.loadChildren(owner, repo, ref, node.path);
  node.children = updated.children;
  node._loaded = true;
  node.expanded = true;
  renderer.refresh();
  renderExplorer(renderer.getData());
}

function handleOpen(node){
  const url = node?.meta?.github?.html_url;
  if(url) window.open(url, '_blank', 'noopener');
}

function parseRepoUrl(input){
  if(!input) throw new Error('Repo giriniz');
  try{
    if(input.includes('github.com')){
      const u = new URL(input);
      const [owner, repo] = u.pathname.replace(/^\//,'').split('/');
      return { owner, repo };
    }
    const [owner, repo] = input.split('/');
    return { owner, repo };
  }catch(e){
    alert('Geçersiz repo');
    throw e;
  }
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function editMarkdown(node){
  const current = node?.meta?.note?.markdown || '';
  const next = prompt('Markdown notu düzenle', current);
  if(next === null) return;
  if(modeSelect.value === 'personal'){
    storage.updateNote(node.id, next);
    renderer.setData(storage.getTree());
  } else {
    // only annotate locally in repo mode
    node.meta = node.meta || {}; node.meta.note = { markdown: next };
    renderer.refresh();
  }
}

// rate limit indicator updater
setInterval(async () => {
  const info = await github.getRateLimit();
  if(info){
    ratelimitEl.textContent = `${info.remaining}/${info.limit} kalan (reset ${new Date(info.reset*1000).toLocaleTimeString()})`;
  }
}, 15000);

// Explorer rendering
function renderExplorer(data){
  if(!explorerEl) return;
  explorerEl.innerHTML = '';
  if(!data) return;
  const root = renderNode(data);
  explorerEl.appendChild(root);
}

function renderNode(node){
  const ul = document.createElement('ul');
  const li = document.createElement('li');
  const a = document.createElement('span');
  a.textContent = node.title || node.path || '';
  a.className = node.type === 'folder' ? 'folder' : 'file';
  a.onclick = () => {
    if(node.type === 'folder'){
      node.expanded = !node.expanded;
      if(node.expanded && !node._loaded && node.meta?.github){ handleToggle(node); }
      renderExplorer(renderer.getData());
      renderer.refresh();
    } else {
      handleOpen(node); showDetails(node);
    }
  };
  li.appendChild(a);
  ul.appendChild(li);
  if(node.expanded && node.children && node.children.length){
    const inner = document.createElement('ul');
    for(const c of node.children){ inner.appendChild(renderNode(c)); }
    li.appendChild(inner);
  }
  return ul;
}
