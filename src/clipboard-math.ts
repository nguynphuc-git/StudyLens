/** Recover actual TeX from copied KaTeX/MathJax HTML; never insert clipboard HTML. */
export function clipboardMathText(html:string, fallback:string):string {
  if(!html||html.length>200000)return fallback;
  const template=document.createElement('template');template.innerHTML=html;
  let found=false;
  for(const math of template.content.querySelectorAll('math')){
    const annotation=math.querySelector('annotation[encoding="application/x-tex"],annotation[encoding="application/x-latex"]');
    const latex=annotation?.textContent?.trim();if(!latex)continue;
    const root=math.closest('.katex-display')??math.closest('.katex,mjx-container')??math;
    if(!template.content.contains(root))continue;
    root.replaceWith(document.createTextNode(`\\(${latex}\\)`));found=true;
  }
  if(!found)return fallback;
  template.content.querySelectorAll('script,style,noscript,template,svg').forEach(node=>node.remove());
  function text(node:Node):string {
    if(node.nodeType===Node.TEXT_NODE)return node.textContent??'';
    if(!(node instanceof Element)&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return '';
    if(node instanceof Element&&node.tagName==='BR')return '\n';
    const value=[...node.childNodes].map(text).join('');
    return node instanceof Element&&/^(?:P|DIV|LI|H[1-6]|BLOCKQUOTE)$/.test(node.tagName)?value+'\n':value;
  }
  return text(template.content).trim();
}
