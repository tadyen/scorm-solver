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
  content();
})();

const browser = extendedGlobal.browser;

function content(){
  window.addEventListener("focus", ()=>{
    console.log("window focus event");
    Xray.exposeObject("iSpring").then((v)=>{console.log(v)});
  });
  
  window.addEventListener("click",()=>{
    console.log("window click event");
  });
  
  const reactRootMountPrototype = document.createElement("null");
  reactRootMountPrototype.id = "react-root-mountpoint";
  type RootMountPoint = { root: ReturnType<typeof createRoot> | undefined };
  const reactRootMountPoint: RootMountPoint = { root: undefined };
  if( document.getElementById(reactRootMountPrototype.id) === null ){
    document.body.prepend(reactRootMountPrototype);
    reactRootMountPoint.root = createRoot(document.getElementById(reactRootMountPrototype.id) as HTMLElement);
  }
  reactRootMountPoint.root?.render(<React.StrictMode><ContentScript/></React.StrictMode>);

}


function ContentScript(){
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




