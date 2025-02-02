// kineo section. 
// urls end in **/quiz/ eg. https://aurora.kineoportal.com.au/courses/unit24658/#topic2/quiz1/
// there is also a fiv class "quiz" when kineo is launched
// Answers from page DOM: 

/* extract in browswer with the following:
  Model
    .getInstance()
    .allQuizQuestions
    .forEach((e) => (
      console.log(e.parts.part1.answers)
    ))
*/

import React from "react";
import Solver, { SolverContext, type SolverContextProps } from "Solver";
import ReactMounter from "ReactMounter";
import { extendedGlobal, extendedWindow, Xray } from "xray.ts";
import KineoQuiz from "./KineoQuiz";
import {type InteractionCheckerOpts } from "InteractionChecker";

const browser = extendedGlobal.browser;

const interactionCheckerOpts: InteractionCheckerOpts = {
  interactionDelayMS: 1000,
}

// onLoad, mount only once per page
const reactMounter = new ReactMounter();
(()=>{
  if(extendedWindow.hasRun){ return; };
  extendedWindow.hasRun = true;
  reactMounter.render(<Content/>);
})();

const solverContextProps: SolverContextProps = {
  mainContainerQueryString: "#pageContent",
  buttonContainerQueryString: ".footerdefault",
  solveButton: SolveButton(),
  quizDetection: isQuiz,
}

function Content(){
  return(<>
    <SolverContext.Provider value={solverContextProps}>
      <Solver interactionCheckerOpts={interactionCheckerOpts}/>
    </SolverContext.Provider>
  </>)
}

function isQuiz(){
  const quizDiv = document.querySelector("#mainActivity");
  console.log(`isQuiz checked ${(quizDiv !== null)}`);
  return(quizDiv !== null);
}

function SolveButton(){
  const kineo = new KineoQuiz();
  function handleClick(){
    (async ()=>{
      await kineo.init();
      try{
        const questions = await kineo.questions;
        const questionsDom = await kineo.questionsDom;
        console.log(questionsDom);
        console.log(questions);
      }catch{console.error}
    })();
  }
  return (
    <a className="pagenav plain" id="solve-button" tabIndex={2} onClick={handleClick}>
      <span>Solve</span>
    </a>
  );
}
