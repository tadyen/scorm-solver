// interaction checker provider 

import React, { Children } from "react";

type EventHandler = ()=>(any | Promise<any>);

interface Props {
  onInteract: EventHandler,
  debounceTimerResetMS?: number,
  debounceTimerUpdateIntervalMS?: number,
  children?: React.JSX.Element;
}

export const InteractionContext = React.createContext<any>(undefined);

export default function InteractionChecker({ onInteract, debounceTimerResetMS = 500, debounceTimerUpdateIntervalMS = 100, children }: Props){
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
    function resetTimer(){
      setDebounceTimer((x)=>{
        if(x <= 0){
          setPageInteracted(true);
        }
        return debounceTimerResetMS;
      });
    }
    if( ! loaded.current ){
      window.addEventListener("focus", resetTimer);
      window.addEventListener("click", resetTimer);
    }
    loaded.current = true;
    return (()=>{
      window.removeEventListener("focus", resetTimer);
      window.removeEventListener("click", resetTimer);
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