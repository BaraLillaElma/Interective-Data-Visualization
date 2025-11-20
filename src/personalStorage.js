const DEFAULT_TREE = {
  id: 'personal-root',
  type: 'group',
  title: 'Kişisel Ağaç',
  path: '',
  expanded: true,
  children: [],
  meta: { }
};

export class PersonalStorage{
  constructor(){
    this.key = 'personal_tree_v1';
    if(!localStorage.getItem(this.key)){
      localStorage.setItem(this.key, JSON.stringify(DEFAULT_TREE));
    }
  }

  getTree(){
    return JSON.parse(localStorage.getItem(this.key));
  }

  replaceTree(tree){
    localStorage.setItem(this.key, JSON.stringify(tree));
  }

  createNode({ parentId }){
    const tree = this.getTree();
    const parent = this.findNode(tree, parentId) || tree;
    const node = {
      id: crypto.randomUUID(),
      type: 'note',
      title: 'Yeni Düğüm',
      path: '',
      expanded: true,
      children: [],
      meta: { note: { markdown: 'Notunuzu yazın...' } }
    };
    parent.children.push(node);
    parent.expanded = true;
    this.replaceTree(tree);
    return node;
  }

  updateTitle(id, title){
    const tree = this.getTree();
    const node = this.findNode(tree, id);
    if(!node) return;
    node.title = title;
    this.replaceTree(tree);
  }

  updateNote(id, markdown){
    const tree = this.getTree();
    const node = this.findNode(tree, id);
    if(!node) return;
    node.meta = node.meta || {}; node.meta.note = { markdown };
    this.replaceTree(tree);
  }

  deleteNode(id){
    const tree = this.getTree();
    if(tree.id === id) return; // cannot delete root
    this.removeRec(tree, id);
    this.replaceTree(tree);
  }

  removeRec(parent, id){
    const idx = parent.children.findIndex(c => c.id === id);
    if(idx >= 0){ parent.children.splice(idx,1); return true; }
    for(const c of parent.children){ if(this.removeRec(c,id)) return true; }
    return false;
  }

  findNode(node, id){
    if(node.id === id) return node;
    for(const c of node.children || []){ const f = this.findNode(c,id); if(f) return f; }
    return null;
  }
}


