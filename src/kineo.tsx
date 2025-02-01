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

const browser = extendedGlobal.browser;

console.log("kineojs");
// onLoad, mount only once per page
const reactMounter = new ReactMounter();
(()=>{
  if(extendedWindow.hasRun){ return; };
  extendedWindow.hasRun = true;
  reactMounter.render(<Content/>);
  console.log("react mounted")
})();

const solverContextProps: SolverContextProps = {
  mainContainerQueryString: "#pageContent",
  buttonContainerQueryString: ".footerdefault",
  solveButton: SolveButton(),
  quizDetection: isQuiz,
}

function isQuiz(){
  const quizDiv = document.querySelector("#mainActivity");
  console.log(`isQuiz checked ${(quizDiv !== null)}`);
  return(quizDiv !== null);
}

function SolveButton(){
  function handleClick(){
    (async ()=>{
      try{
        const model = await Xray.exposeObject("Model");
        const questions = model.getInstance().allQuizQuestions as any[];
        questions.forEach((e) => {
          console.log(e.parts.part1.answers)
        })
      }catch{console.error}
    })();
  }
  return (
    <button className="pagenav plain" id="solve-button" onClick={handleClick}>
      <div className="fa fa-fw">Solve</div>
    </button>
  );
}

function Content(){
  
  return(<>
    <SolverContext.Provider value={solverContextProps}>
      <Solver/>
    </SolverContext.Provider>
  </>)
}
