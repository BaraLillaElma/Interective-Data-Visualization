export class GithubService {
  constructor(getToken){
    this.getToken = getToken;
    this.base = 'https://api.github.com';
  }

  async request(path){
    const headers = { 'Accept':'application/vnd.github+json' };
    const token = this.getToken?.();
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.base}${path}`, { headers });
    if(res.status === 403){
      const rl = res.headers.get('x-ratelimit-remaining');
      if(rl === '0') alert('GitHub rate limit aşıldı. Ayarlardan token ekleyin.');
    }
    if(!res.ok) throw new Error(`GitHub API error ${res.status}`);
    return { data: await res.json(), res };
  }

  async getDefaultBranch(owner, repo){
    const { data } = await this.request(`/repos/${owner}/${repo}`);
    return data.default_branch;
  }

  async getRateLimit(){
    try{
      const { data } = await this.request('/rate_limit');
      return data.resources.core;
    }catch{ return null }
  }

  // Build root lightweight tree structure
  async getRootTree(owner, repo, ref){
    const { data } = await this.request(`/repos/${owner}/${repo}/contents/?ref=${encodeURIComponent(ref)}`);
    const children = data.map(item => this.mapItem(owner, repo, ref, item));
    return {
      id: `${owner}/${repo}@${ref}`,
      type: 'folder',
      title: `${owner}/${repo} (${ref})`,
      path: '',
      expanded: true,
      _loaded: true,
      meta: { github: { owner, repo, ref, html_url: `https://github.com/${owner}/${repo}` } },
      children
    };
  }

  async loadChildren(owner, repo, ref, path){
    const p = path ? `/${path}` : '';
    const { data } = await this.request(`/repos/${owner}/${repo}/contents${p}?ref=${encodeURIComponent(ref)}`);
    return {
      children: data.map(item => this.mapItem(owner, repo, ref, item))
    };
  }

  mapItem(owner, repo, ref, item){
    const common = {
      id: item.sha,
      title: item.name,
      path: item.path,
      meta: { github: { owner, repo, ref, sha: item.sha, size: item.size, html_url: item.html_url } },
      expanded: false,
      children: []
    };
    if(item.type === 'dir') return { ...common, type: 'folder' };
    if(item.type === 'file') return { ...common, type: 'file' };
    if(item.type === 'submodule') return { ...common, type: 'submodule' };
    return { ...common, type: item.type };
  }
}


