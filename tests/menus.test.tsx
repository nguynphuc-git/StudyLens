// @vitest-environment happy-dom
import {act,useState} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {MenuDisclosure} from '../src/components/MenuDisclosure';
import {SelectMenu} from '../src/components/SelectMenu';
let host:HTMLDivElement,root:Root;const change=vi.fn();
function Harness({disabled=false}:{disabled?:boolean}){const [value,setValue]=useState('a');return <><MenuDisclosure className="test-menu"><summary>Options</summary><SelectMenu label="Reading choice" value={value} disabled={disabled} onChange={value=>{setValue(value);change(value);}} options={[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Gamma'}]}/></MenuDisclosure><button id="outside">Outside</button></>;}
const trigger=()=>host.querySelector<HTMLButtonElement>('[role="combobox"]')!;
const disclosure=()=>host.querySelector<HTMLDetailsElement>('details')!;
async function open(){await act(async()=>host.querySelector<HTMLElement>('summary')!.click());await act(async()=>trigger().click());}
async function key(value:string){await act(async()=>trigger().dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true})));}
beforeEach(async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});change.mockReset();host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root.render(<Harness/>));});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.restoreAllMocks();});
describe('temporary menus',()=>{
  it('keeps the parent menu open when choosing a portalled option and marks the selected value',async()=>{
    await open();const option=document.querySelector<HTMLButtonElement>('[role="option"][data-index="1"]')!;
    expect(host.contains(option)).toBe(false);await act(async()=>{option.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));option.click();});
    expect(disclosure().open).toBe(true);expect(trigger().textContent).toContain('Beta');expect(document.querySelector('[role="listbox"]')).toBeNull();expect(change).toHaveBeenCalledWith('b');
    await act(async()=>trigger().click());expect(document.querySelector('[role="option"][aria-selected="true"]')!.textContent).toContain('Beta');
  });
  it('dismisses both layers on outside pointer input without changing a value or stealing focus',async()=>{
    await open();const outside=host.querySelector<HTMLButtonElement>('#outside')!;
    await act(async()=>{outside.focus();outside.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});
    expect(disclosure().open).toBe(false);expect(document.querySelector('[role="listbox"]')).toBeNull();expect(change).not.toHaveBeenCalled();expect(document.activeElement).toBe(outside);
  });
  it('supports arrows, end, enter and typeahead without committing until an option is selected',async()=>{
    await open();await key('End');expect(change).not.toHaveBeenCalled();await key('Enter');expect(change).toHaveBeenCalledWith('c');
    await act(async()=>trigger().click());await key('b');await key('Enter');expect(change).toHaveBeenLastCalledWith('b');
    await act(async()=>trigger().click());await key('ArrowUp');await key('Enter');expect(change).toHaveBeenLastCalledWith('a');
  });
  it('Escape closes the option list first, then its disclosure, and Tab does not commit',async()=>{
    await open();await key('ArrowDown');await key('Escape');expect(disclosure().open).toBe(true);expect(trigger().getAttribute('aria-expanded')).toBe('false');expect(change).not.toHaveBeenCalled();
    await act(async()=>trigger().click());await key('Tab');expect(change).not.toHaveBeenCalled();
    await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));expect(disclosure().open).toBe(false);
  });
  it('cleans up portalled menus on unmount and never opens a disabled choice',async()=>{
    await open();await act(async()=>root.render(<Harness disabled/>));expect(document.querySelector('[role="listbox"]')).toBeNull();expect(trigger().disabled).toBe(true);
    await act(async()=>root.render(<Harness/>));await act(async()=>trigger().click());expect(document.querySelector('[role="listbox"]')).not.toBeNull();await act(async()=>root.render(null));expect(document.querySelector('[role="listbox"]')).toBeNull();
  });
});
