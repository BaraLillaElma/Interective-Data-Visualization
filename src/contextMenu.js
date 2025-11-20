export function buildContextMenu(container, actions){
  container.hidden = true;
  return {
    show(){ container.hidden = false; },
    hide(){ container.hidden = true; }
  };
}

// This module only initializes the container. Buttons are created by TreeRenderer per-node context.


