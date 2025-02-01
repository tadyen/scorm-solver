// Content script
//  -- has limitted access to the webextensions API
//  -- can communicate with Background Script for further (indirect) access to the API 
//  -- has access to the DOM
//  -- can use window.wrappedJSObject for xray content view

import React, { useContext, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { extendedGlobal, extendedWindow, Xray } from "xray.ts";
import InteractionChecker from "InteractionChecker";
import { InteractionContext } from "InteractionChecker";

const solveButtonRootID = "solve-button-root";
const reactRootMountPointID = "react-root-mountpoint";

(()=>{
  if(extendedWindow.hasRun){ return; };
  extendedWindow.hasRun = true;
  const reactRootMountPoint = mountReact();
})();

const browser = extendedGlobal.browser;

type RootMountPoint = { root: ReturnType<typeof createRoot> | undefined };
function mountReact(): RootMountPoint{
  const reactRootMountPrototype = document.createElement("div");
  reactRootMountPrototype.id = reactRootMountPointID;
  const reactRootMountPoint: RootMountPoint = {root: undefined};
  if( document.getElementById(reactRootMountPrototype.id) === null ){
    document.body.prepend(reactRootMountPrototype);
  }
  reactRootMountPoint.root = createRoot(document.getElementById(reactRootMountPrototype.id) as HTMLElement);
  reactRootMountPoint.root?.render(
    <React.StrictMode>
      <InteractionChecker onInteract={ pageInteractionHandler }>
        <Content/>
      </InteractionChecker>
    </React.StrictMode>
  );
  return reactRootMountPoint;
}

// checks page if it is a quiz or not based on dom objects. Applies dom injections if it's there.
// Promise resolves: true if is quiz, false otherwise
async function pageInteractionHandler(){
  const isQuiz = ( document.querySelector('.quiz-control-panel') !== null );
  const mainContainer = document.querySelector('.main-container') as HTMLElement|null;
  if(mainContainer === null){
    return (new Error("querySelector('.main-container') not found"));
  }
  (isQuiz) 
    ? mainContainer.style.border = "1px solid green"
    : mainContainer.style.border = "1px solid blue"
  ;
  if(isQuiz){
    if(document.getElementById("solve-button-root") === null ){
      const submitContainer = document.querySelector('.quiz-control-panel') as HTMLElement;
      const solveButtonRoot = document.createElement("null");
      solveButtonRoot.id = solveButtonRootID;
      submitContainer?.prepend(solveButtonRoot);
    }
    return true;
  }else{
    return false;
  }
};

// main addon content
function Content(){
  const isQuiz = useContext<Awaited<ReturnType<typeof pageInteractionHandler>>>(InteractionContext);
  const [solveButtonNode, setSolveButtonNode] = React.useState<HTMLElement | undefined>();
  
  React.useEffect(()=>{
    console.log(isQuiz);
    if(isQuiz instanceof Error){
      console.error(isQuiz);
      return;
    }
    if(isQuiz){
      const node = document.getElementById(solveButtonRootID);
      if( node !== null){ setSolveButtonNode( node ) };
    }
  },[isQuiz]);

  return(<>
    <Portal node={solveButtonNode}><SolveButton/></Portal>
  </>)
}

// Portals a react element into a DOM node if both exists
function Portal(props: {node?: HTMLElement, children?: React.JSX.Element}){
  if( props.node && props.children ){
    return(<>
      {createPortal(props.children, props.node)}
    </>)
  }
  return <></>
}

function SolveButton(){
  function handleClick(){
    (async ()=>{
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




