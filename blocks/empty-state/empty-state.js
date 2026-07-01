export default function decorate(block) {
  // The empty-state block is mostly styled via CSS.
  // We just ensure the inner wrapper has a clear class for targeting if needed.
  const wrapper = block.firstElementChild;
  if (wrapper) {
    wrapper.classList.add('empty-state-content');
  }
}
