// Content script
//  -- has limitted access to the webextensions API
//  -- can communicate with Background Script for further (indirect) access to the API 
//  -- has access to the DOM
//  -- can use window.wrappedJSObject for xray content view

import React from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { extendedGlobal, extendedWindow, Xray } from "xray.ts";
import InteractionChecker from "InteractionChecker";

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
  reactRootMountPoint.root?.render(
    <React.StrictMode>
      <InteractionChecker onInteract={()=>{console.log("interacted!")}}/>
    </React.StrictMode>
  );
  return reactRootMountPoint;
}


//   const solveButtonNode = document.getElementById("solve-button-root");
//   if( solveButtonNode !== null){
//     return (
//       <>
//         {createPortal(<SolveButton/>, solveButtonNode)}
//       </>
//     )
//   }else{
//     return (<></>)
//   }
// }

async function handlePageInteraction(){
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
  }
  return Promise.resolve(true);
}

function SolveButton(){
  function handleClick(){
    (async ()=>{
      console.log("solve button async call")
      try{
        const iSpring = await Xray.exposeObject("iSpring")
        const lms = iSpring.LMS.instance();
        console.log(lms);
      }catch{console.error}
    })();
  }

  return(
    <button className="quiz-control-panel__button solve-button" id="solve-button" onClick={handleClick}>
      <div className="quiz-control-panel__text-label">Solve</div>
    </button>
  );
}




