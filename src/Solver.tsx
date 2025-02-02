// Template component that acts as the main content script
// Content scripts should import this and apply specific functionality into it.
// Functionality that requires providing specific logic:
//  -- Detection of page on Quiz
//  -- Location of solve button and solving logic
//  -- Locating and solving questions
// Content Scripts
//  -- have limitted access to the webextensions API
//  -- can communicate with Background Script for further (indirect) access to the API 
//  -- have access to the DOM
//  -- can use window.wrappedJSObject for xray content view

import React, {useContext, type PropsWithChildren } from "react";
import { createPortal } from "react-dom";
import InteractionChecker, { InteractionResultContext, type InteractionCheckerOpts } from "InteractionChecker";

const solveButtonRootID = "solve-button-root";

export interface SolverContextProps {
  mainContainerQueryString: string,
  buttonContainerQueryString: string,
  quizDetection: ()=>(boolean | Error),
  solveButton: React.ReactNode,
}

export const SolverContext = React.createContext<SolverContextProps | undefined >(undefined);

export default function Solver(props: {interactionCheckerOpts?: InteractionCheckerOpts}){
  const context = useContext(SolverContext);
  if( ! context ){ return <></> }
    
  const pageInteractionHandler = React.useCallback(async ()=>{
    const mainContainer = document.querySelector(context.mainContainerQueryString) as HTMLElement | null;
    if( mainContainer === null ){
      return (new Error(`querySelector('${context.mainContainerQueryString}') not found`));
    }
    const buttonContainer = document.querySelector(context.buttonContainerQueryString) as HTMLElement | null;
    if( buttonContainer === null ){
      return (new Error(`querySelector('${context.buttonContainerQueryString}') not found`));
    }
    const isQuiz = context.quizDetection();
    if(isQuiz instanceof Error){
      return isQuiz;
    }
    if(isQuiz){
      insertSolveButtonRoot(buttonContainer);
      mainContainer.style.border = "3px dashed red";
    }else{
      mainContainer.style.border = "3px dashed blue";
    }
    return isQuiz;
  },[])
  
  return(
    <InteractionChecker onInteract={ pageInteractionHandler } {...props.interactionCheckerOpts} >
      <SolveButtonInserter solveButton={context.solveButton}/>
    </InteractionChecker>
  )
}

// Component that handles SolveButton rendering given isQuiz context
function SolveButtonInserter(props: {solveButton: React.ReactNode}){
  const isQuiz = useContext<boolean | Error>( InteractionResultContext );
  const [container, setContainer] = React.useState<HTMLElement | null>(null)

  React.useEffect(()=>{
    if(isQuiz instanceof Error){
      console.error(isQuiz);
      setContainer(null);
    }else if(isQuiz){
      setContainer(document.getElementById(solveButtonRootID));
    }
  },[isQuiz]);

  return(<>
    { (isQuiz && container)
        ? createPortal(props.solveButton, container)
        : <></>
    }
  </>)
}

function insertSolveButtonRoot(container: HTMLElement){
  if(document.getElementById(solveButtonRootID) === null ){
    const buttonRoot = document.createElement("div");
    buttonRoot.id = solveButtonRootID;
    container.prepend(buttonRoot);
  }
}
