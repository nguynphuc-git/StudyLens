import {useState} from 'react';
import {mixedTextToLatex} from '../math-paste';
export function ProblemSourceInput({disabled,onApply}:{disabled:boolean;onApply:(latex:string)=>void}) {
  const [source,setSource]=useState(''),[error,setError]=useState('');
  function apply(){
    const latex=mixedTextToLatex(source,true);
    if(!source.trim()||latex.length>6000){setError('Enter a problem that fits within 6,000 characters after formatting.');return;}
    onApply(latex);setSource('');setError('');
  }
  return <details className="problem-source"><summary>Paste text or LaTeX source</summary><p className="subtle">Paste the hypotheses and what to prove. Use $...$ for formulas or LaTeX such as \text&#123;Let ABCD be cyclic.&#125;. This replaces the current problem; it does not execute TeX commands.</p><label>Problem source<textarea aria-label="Problem source" disabled={disabled} rows={5} maxLength={6000} value={source} onChange={e=>setSource(e.target.value)} placeholder={'Let $ABCD$ be a cyclic quadrilateral. Prove that $\\angle A + \\angle C = 180^\\circ$.'}/></label>{error&&<p role="alert" className="error">{error}</p>}<button type="button" disabled={disabled||!source.trim()} onClick={apply}>Use pasted problem</button></details>;
}
