const d3ref = window.d3; // ensure access to global D3 from module scope

export class TreeRenderer{
  constructor(svgSelector, handlers={}){
    this.svg = d3ref.select(svgSelector);
    this.g = this.svg.append('g');
    this.linkLayer = this.g.append('g');
    this.nodeLayer = this.g.append('g');
    this.handlers = handlers;
    this.duration = 250;
    this.root = null;
    this.data = null;

    const zoomed = (event) => { this.g.attr('transform', event.transform); };
    this.svg.call(d3ref.zoom().scaleExtent([0.2, 2]).on('zoom', zoomed));

    this.svg.on('contextmenu', (event) => event.preventDefault());
  }

  setData(data){
    this.data = data;
    this.tree = d3ref.tree()
      .nodeSize([42, 230])
      .separation((a, b) => (a.parent === b.parent ? 1.6 : 2.4));
    this.rebuild();
  }

  getData(){
    return this.root?.data;
  }

  refresh(){ this.rebuild(); }

  rebuild(){
    if(!this.data) return;
    // Collapse nodes with expanded === false by not producing children
    this.root = d3ref.hierarchy(this.data, d => (d.expanded === false ? null : (d.children || null)));
    this.root.x0 = this.root.x0 ?? 0; this.root.y0 = this.root.y0 ?? 0;
    this.update(this.root);
  }

  centerOnNode(id){
    const node = this.root.descendants().find(n => n.data.id === id);
    if(!node) return;
    const t = d3ref.zoomTransform(this.svg.node());
    const x = node.y * t.k, y = node.x * t.k;
    this.svg.transition().duration(350).call(
      d3ref.zoom().transform,
      d3ref.zoomIdentity.translate(this.svg.node().clientWidth/3 - x, this.svg.node().clientHeight/2 - y).scale(t.k)
    );
  }

  highlight(query){
    const text = query.toLowerCase();
    this.nodeLayer.selectAll('g.node').classed('match', d => {
      const title = (d.data.title || d.data.path || '').toLowerCase();
      return text && title.includes(text);
    });
  }

  update(source){
    const treeData = this.tree(this.root);
    const nodes = treeData.descendants();
    const links = treeData.links();
    nodes.forEach(d => d.y = d.depth * 180);

    const node = this.nodeLayer.selectAll('g.node').data(nodes, d => d.data.id);

    const nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${source.y0},${source.x0})`)
      .on('click', (event, d) => this.onClick(d))
      .on('dblclick', (event, d) => this.handlers.onOpen?.(d.data))
      .on('contextmenu', (event, d) => this.showContext(event, d));

    nodeEnter.append('rect')
      .attr('rx', 6).attr('ry', 6)
      .attr('width', 180).attr('height', 26)
      .attr('x', -90).attr('y', -13)
      .attr('fill', d => d.data.type === 'folder' ? '#0e7490' : '#334155')
      .attr('stroke', '#1f2937');

    nodeEnter.append('text')
      .attr('dy', '0.32em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#e5e7eb')
      .text(d => d.data.title || d.data.path)
      .each(function(){
        const text = d3ref.select(this);
        const bbox = this.getBBox();
        const padding = 20;
        const w = Math.max(180, bbox.width + padding);
        d3ref.select(this.parentNode).select('rect')
          .attr('width', w)
          .attr('x', -w/2);
        // cache width on data for spacing heuristics if needed later
        const d = text.datum();
        d.data._boxWidth = w;
      });

    const nodeUpdate = nodeEnter.merge(node);
    nodeUpdate.transition().duration(this.duration)
      .attr('transform', d => `translate(${d.y},${d.x})`);

    node.exit().transition().duration(this.duration)
      .attr('transform', d => `translate(${source.y},${source.x})`).remove();

    const link = this.linkLayer.selectAll('path.link').data(links, d => d.target.data.id);
    const diagonal = d3ref.linkHorizontal().x(d => d.y).y(d => d.x);
    link.enter().append('path')
      .attr('class','link')
      .attr('fill','none')
      .attr('stroke','#334155')
      .attr('stroke-width',1.2)
      .attr('d', d => diagonal({source: {x: source.x0, y: source.y0}, target: {x: source.x0, y: source.y0}}))
      .merge(link)
      .transition().duration(this.duration)
      .attr('d', diagonal);
    link.exit().transition().duration(this.duration)
      .attr('d', d => diagonal({source:{x:source.x, y:source.y}, target:{x:source.x, y:source.y}}))
      .remove();

    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  onClick(d){
    if(d.data.type === 'folder'){
      d.data.expanded = d.data.expanded === false ? true : false;
      if(d.data.expanded){ this.handlers.onToggle?.(d.data); }
    }
    this.handlers.onSelect?.(d.data);
    this.rebuild();
  }

  showContext(event, d){
    const menu = document.getElementById('contextMenu');
    const isPersonal = ['note','group','link'].includes(d.data.type) || !d.data.meta?.github;
    menu.innerHTML = '';
    const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Alt Dal Ekle';
    const renameBtn = document.createElement('button'); renameBtn.className='btn'; renameBtn.textContent='Yeniden Adlandır';
    const deleteBtn = document.createElement('button'); deleteBtn.className='btn'; deleteBtn.textContent='Sil';
    const editNoteBtn = document.createElement('button'); editNoteBtn.className='btn'; editNoteBtn.textContent='Notu Düzenle';
    if(isPersonal){ menu.append(addBtn, renameBtn, editNoteBtn, deleteBtn); }
    else { const openBtn = document.createElement('button'); openBtn.className='btn'; openBtn.textContent='GitHub’da Aç'; openBtn.onclick = () => this.handlers.onOpen?.(d.data); menu.append(openBtn); }
    addBtn.onclick = () => this.handlers.onAddChild?.(d.data);
    renameBtn.onclick = () => this.handlers.onRename?.(d.data);
    deleteBtn.onclick = () => this.handlers.onDelete?.(d.data);
    editNoteBtn.onclick = () => this.handlers.onEditNote?.(d.data);
    const r = this.svg.node().getBoundingClientRect();
    menu.style.left = `${event.clientX - r.left}px`;
    menu.style.top = `${event.clientY - r.top}px`;
    menu.hidden = false;
    const hide = (e) => { if(!menu.contains(e.target)) { menu.hidden = true; document.removeEventListener('click', hide); } };
    setTimeout(()=>document.addEventListener('click', hide, { once:true }),0);
    event.preventDefault();
  }
}


