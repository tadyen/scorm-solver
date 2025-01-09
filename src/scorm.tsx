// Content script
//  -- has limitted access to the webextensions API
//  -- can communicate with Background Script for further (indirect) access to the API 
//  -- has access to the DOM
//  -- can use window.wrappedJSObject for xray content view

import React from "react";
import { createRoot } from "react-dom/client";
import { extendedGlobal, extendedWindow, Xray } from "xray.ts";

(()=>{
  if(extendedWindow.hasRun){ return; };
  extendedWindow.hasRun = true;
  const reactRootMountPoint = mountReact();
})();

const browser = extendedGlobal.browser;

type RootMountPoint = { root: ReturnType<typeof createRoot> | undefined };
function mountReact(): RootMountPoint{
  const reactRootMountPrototype = document.createElement("div");
  reactRootMountPrototype.id = "react-root-mountpoint";
  const reactRootMountPoint: RootMountPoint = {root: undefined};
  if( document.getElementById(reactRootMountPrototype.id) === null ){
    document.body.prepend(reactRootMountPrototype);
  }
  reactRootMountPoint.root = createRoot(document.getElementById(reactRootMountPrototype.id) as HTMLElement);
  reactRootMountPoint.root?.render(<React.StrictMode><Content/></React.StrictMode>);
  return reactRootMountPoint;
}

function Content(){
  const debounceTimerResetMS = 500;
  const debounceTimerUpdateIntervalMS = 100; 
  
  const [pageInteract, setPageInteract] = React.useState(false);
  const [debounceTimer, setDebounceTimer] = React.useState(0);
  const [debounceTimerLock, setDebounceTimerLock] = React.useState(false);
  
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

  // Reject interactions and refresh timer 
  const refresh = React.useCallback(()=>{
    setDebounceTimer((x)=>{
      if(x <= 0){
        setPageInteract(true);
      }
      return debounceTimerResetMS;
    });
  },[]);

  // apply event listeners to check for page interactions
  React.useEffect(()=>{
    window.addEventListener("focus", ()=>{
      refresh();
    });
    window.addEventListener("click",()=>{
      refresh();
    });
  },[]);

  // handle re-updates on page-interactions
  React.useEffect(()=>{
    function handlePageInteract(){

    }
    setPageInteract((x)=>{
      if( ! x ){ return false }
      handlePageInteract();
      return false
    });
  },[pageInteract]);

  return (<></>)
}

async function handleScormClick(){
  const isQuiz = ( document.querySelector('.quiz-control-panel') !== null );
  const mainContainer = document.querySelector('.main-container') as HTMLElement|null;
  if(mainContainer === null){
    return Promise.reject(new Error("querySelector('.main-container') not found"));
  }
  (isQuiz) 
    ? mainContainer.style.border = "1px solid green"
    : mainContainer.style.border = "1px solid blue"        
  ;
  if(isQuiz){
    if(document.getElementById("solve-button-root") === null ){
      const submitContainer = document.querySelector('.quiz-control-panel') as HTMLElement;
      const solveButtonRoot = document.createElement("null");
      solveButtonRoot.id="solve-button-root";
      submitContainer?.prepend(solveButtonRoot);
    }
    const solveButtonNode = document.getElementById("solve-button-root") as HTMLElement;
    const solveButtonReactRoot = createRoot(solveButtonNode);
    solveButtonReactRoot.render(<SolveButton/>);
  }
  return Promise.resolve(true);
}

function SolveButton(){
  function handleClick(){
  }

  return(
    <button className="quiz-control-panel__button solve-button" id="solve-button" onClick={handleClick}>
      <div className="quiz-control-panel__text-label">Solve</div>
    </button>
  );
}




