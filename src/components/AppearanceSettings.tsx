import {useId} from 'react';
import {SelectMenu} from './SelectMenu';
import type {AppearanceController, AppearancePreferences} from '../appearance';

export function AppearanceSettings({appearance}: {appearance: AppearanceController}) {
  const id = useId();
  const {preferences, updateAppearance, resetAppearance, savedLocally} = appearance;
  return <section className="appearance-settings" aria-label="Appearance settings">
    <p className="subtle" id={`${id}-help`}>Make your reading space comfortable. Math keeps its standard notation.</p>
    <div className="appearance-options">
      <div className="appearance-field"><span>Theme</span><SelectMenu<AppearancePreferences['theme']> id={`${id}-theme`} label="Theme" value={preferences.theme} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]} onChange={theme=>updateAppearance({theme})}/></div>
      <div className="appearance-field"><span>Page color</span><SelectMenu<AppearancePreferences['background']> id={`${id}-background`} label="Page color" value={preferences.background} options={[{value:'paper',label:'Paper'},{value:'sage',label:'Sage'},{value:'blue',label:'Sky'},{value:'rose',label:'Rose'}]} onChange={background=>updateAppearance({background})}/></div>
      <div className="appearance-field"><span>Reading font</span><SelectMenu<AppearancePreferences['font']> id={`${id}-font`} label="Reading font" describedBy={`${id}-help`} value={preferences.font} options={[{value:'sans',label:'Sans serif'},{value:'serif',label:'Book serif'}]} onChange={font=>updateAppearance({font})}/></div>
      <div className="appearance-field"><span>Text color</span><SelectMenu<AppearancePreferences['textColor']> id={`${id}-ink`} label="Text color" value={preferences.textColor} options={[{value:'default',label:'Default'},{value:'blue',label:'Blue'},{value:'plum',label:'Plum'}]} onChange={textColor=>updateAppearance({textColor})}/></div>
      <div className="appearance-size">
        <label htmlFor={`${id}-size`}>Reading size <output htmlFor={`${id}-size`}>{preferences.textSize}px</output></label>
        <input id={`${id}-size`} type="range" min="14" max="24" step="1" value={preferences.textSize} aria-valuetext={`${preferences.textSize} pixels`} onChange={event => updateAppearance({textSize: Number(event.target.value)})}/>
      </div>
    </div>
    <div className={`appearance-preview preview-${preferences.background}`} aria-label="Live appearance preview">
      <strong>Reading preview</strong>
      <p style={{
        fontFamily: preferences.font === 'serif' ? "'Lora', Georgia, serif" : "'Be Vietnam Pro', system-ui, sans-serif",
        fontSize: `${preferences.textSize}px`,
        color: preferences.textColor === 'blue' ? 'var(--preview-blue)' : preferences.textColor === 'plum' ? 'var(--preview-plum)' : undefined,
        textAlign: 'left',
      }}>A clear explanation stays readable as you study.</p>
      <span>Area of a circle: A = πr²</span>
    </div>
    <button type="button" className="subtle-button" onClick={resetAppearance}>Reset appearance</button>
    {!savedLocally && <p className="subtle" role="status">Your preferences apply to this tab. Browser storage is unavailable, so they may reset when you reload.</p>}
  </section>;
}
