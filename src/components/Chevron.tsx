/** Keep the frame still; only the centered vector arrow rotates. */
export function Chevron({expanded,className=''}:{expanded?:boolean;className?:string}){
  return <span className={`menu-chevron ${className}`} aria-hidden="true"><svg viewBox="0 0 16 16" data-expanded={expanded} focusable="false"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}
