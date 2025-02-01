// interaction checker provider 

import React, { type PropsWithChildren } from "react";

type EventHandler = ()=>(any | Promise<any>);

export const InteractionContext = React.createContext<any>(undefined);

export default function InteractionChecker<Props extends PropsWithChildren<{
    onInteract: EventHandler,
    debounceTimerResetMS?: number,
    debounceTimerUpdateIntervalMS?: number,
  }>>
  ({debounceTimerResetMS = 500, debounceTimerUpdateIntervalMS = 100, onInteract, children }: Props){
  const [pageInteracted, setPageInteracted] = React.useState(false);
  const [debounceTimer, setDebounceTimer] = React.useState(0);
  const [debounceTimerLock, setDebounceTimerLock] = React.useState(false);
  const [interactionResult, setInteractionResult] = React.useState<any>(undefined);
  
  let loaded = React.useRef(false);

  // Debounce timer
  React.useEffect(()=>{
    if( ! debounceTimerLock ){
      setDebounceTimerLock(true);
      (async()=>{
        await new Promise(f => setTimeout(f, debounceTimerUpdateIntervalMS));
        setDebounceTimer((previous)=>{
          const next = previous - debounceTimerUpdateIntervalMS;
          return (next > 0 ? next : 0);
        })
        setDebounceTimerLock(false);
      })().catch(console.error);
    }
    if( debounceTimer <= 0){
      setDebounceTimerLock(false);
      setDebounceTimer(0);
    }
  },[debounceTimer])

  // apply event listeners to check for page interactions
  React.useEffect(()=>{
    const events = ["focus", "click"];
    function resetTimer(){
      setDebounceTimer((x)=>{
        if(x <= 0){
          setPageInteracted(true);
        }
        return debounceTimerResetMS;
      });
    }
    if( ! loaded.current ){
      events.forEach((event)=>{
        window.addEventListener(event, resetTimer, {capture: true})
      })
    }
    loaded.current = true;
    return (()=>{
      events.forEach((event)=>{
        window.removeEventListener(event, resetTimer, {capture: true})
      })
      loaded.current = false;
    });
  },[]);

  // handle page-interactions
  React.useEffect(()=>{
    if(pageInteracted){
      (async()=>{
        try{
          const response = await onInteract();
          setInteractionResult(response);
        }catch{console.error}
      })();
      setPageInteracted(false);
    }
  },[pageInteracted]);
  
  return (<InteractionContext.Provider value={interactionResult}>
    { (children) ? children : <></> }
  </InteractionContext.Provider>)
}