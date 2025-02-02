// Kineo quiz specific section

import { Xray } from "xray"

type ExtendsErrorUndefined<Response> = Response | Error | undefined

type questionFormat = "radio" | "menu" | "checkbox"

interface AllQuizQuestionsByQuestionId{
  [key: number]: {
    id: number,
    parts: {
      part1: {
        answers: {
          correct: boolean,
          text: string,
        }[],
        format: questionFormat,
        part: string,
        userAnswers: any[],
      }
    }
    score: number,
    text: string,
    weight: number,
    xmlText: string
  } 
}

type DomElement = Pick<HTMLElement, "id"|"classList"|"localName"> | {
  children: {[key: string|number]: DomElement}
}
type DomChild<T> = {[key: number|string]: T} | {[key: string|number]: DomElement};

interface QuestionsDom{
  classList: ("quiz")[];
  children: DomChild<{
    id: `question${number}`,
    localName: "div",
    children: DomChild<{
      localName: "p",
      children: DomChild<{
        localName: "fieldset",
        children: DomChild<{
          localName: "div",
          classList: ("checkboxOption")[],
          children: DomChild<{
            localName: "input"|"label",
          }>
        } | {
          localName: "div",
          classList: ("radioOption")[],
          children: DomChild<{
            localName: "option",
          }>
        }>
      } | {
        localName: "select",
        children: DomChild<{
          localName: "option",
        }>
      }>
    }>
  }>
}

type ExtractQuestionsDom<T extends DomElement> = Extract<QuestionsDom, T>;

export default class KineoQuiz{
  protected _questions: ExtendsErrorUndefined<AllQuizQuestionsByQuestionId>;
  protected _questionsDom: ExtendsErrorUndefined<QuestionsDom>;

  constructor(){
    this._questions = undefined;
    this._questionsDom = undefined;
  }

  async init(){
    try{
      await this.getAllQuizQuestionsByQuestionId();
      await this.getQuestionsDom();
      return true;
    }catch{ console.error }
    return false;
  }

  private async getAllQuizQuestionsByQuestionId(): Promise<ExtendsErrorUndefined<AllQuizQuestionsByQuestionId>>{
    if( this._questions ){ return this._questions }
    try{
      const model = await Xray.exposeObject("Model");
      const instance = await model.getInstance();
      this._questions = await instance.allQuizQuestionsByQuestionId;
      return this._questions;
    }catch{ handleError }
    return undefined
  }
  get questions(){
    const res = this.getAllQuizQuestionsByQuestionId()
      .then((res)=>{
        return res
      })
      .catch( console.error )
    ;
    return res
  }

  private async getQuestionsDom(): Promise<ExtendsErrorUndefined<QuestionsDom>>{
    if( this._questionsDom ){ return this._questionsDom }
    try{
      const parentDom = document.querySelector(".quiz") as DomElement | null;
      if( ! parentDom ){
        return new Error("Could not find quiz DOM");
      }
      this._questionsDom = parentDom as ExtractQuestionsDom<typeof parentDom>;
      return this._questionsDom;
    }catch{ handleError }
    return undefined
  }
  get questionsDom(){
    const res = this.getQuestionsDom()
      .then((res)=>{
        return res
      })
      .catch( console.error )
    ;
    return res
  }
}


function handleError(e: Error | unknown | any){
  if(e instanceof Error){
    return e
  }
  return undefined
}