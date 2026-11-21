/** Toggle on a bare Alt/Option release, never a chord, AltGraph or composition. */
export function altToggle(toggle:()=>void) {
  let down=false,chord=false;
  return {
    keydown(event:KeyboardEvent){
      if(event.isComposing||event.getModifierState('AltGraph')){this.reset();return;}
      if(event.key!=='Alt'){if(down)chord=true;return;}
      if(event.repeat||down)return;
      down=true;chord=event.ctrlKey||event.metaKey||event.shiftKey;
      // A bare Alt must not hand focus to the browser menu on Windows.
      if(!chord)event.preventDefault();
    },
    keyup(event:KeyboardEvent){
      if(event.key!=='Alt'||!down)return;
      const allowed=!chord&&!event.isComposing&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.getModifierState('AltGraph');
      this.reset();if(allowed){event.preventDefault();toggle();}
    },
    reset(){down=false;chord=false;}
  };
}
