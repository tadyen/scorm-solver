// Kineo quiz specific section

import { Xray } from "xray"

type ExtendsErrorUndefined<Response> = Response | Error | undefined

// As observed directly from browser
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
type DomChild<T> = {[key: string|number]: DomElement & T}

// As observed directly from browser
type GenericQuestionDom = DomChild<{
  id: `question${number}`,
  localName: "div",
  children: DomChild<{
    localName: "p",
    children: DomChild<
    {
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
    } | 
    {
      localName: "select",
      children: DomChild<{
        localName: "option",
      }>
    }>
  }>
}>

type questionFormat = "radio" | "menu" | "checkbox"
type QuestionDom<T> = T extends questionFormat
  ? T extends "menu" 
    ? Extract<GenericQuestionDom, {
        children: DomChild<{
          children: DomChild<{
            localName: "select"
          }>
        }>
      }>
    : T extends "radio"
      ? Extract<GenericQuestionDom, {
        children: DomChild<{
          children: DomChild<{
            children: DomChild<{
              classList: ("radioOption")[],
            }>
          }>
        }>
      }>
      // "checkbox"
      : Extract<GenericQuestionDom, {
        children: DomChild<{
          children: DomChild<{
            children: DomChild<{
              classList: ("checkboxOption")[],
            }>
          }>
        }>
      }>
  : GenericQuestionDom
;

interface QuizDom{
  classList: ("quiz")[];
  children: GenericQuestionDom;
}

type ExtractQuizDom<T extends DomElement> = Extract<QuizDom, T>;

interface QuestionsMap {
  id: number,
  number: number,
  text: string,
  format: questionFormat,
  dom: QuestionDom<questionFormat>;
  answers: {
    text: string,
    correct: boolean
  }[],
}

export default class KineoQuiz{
  protected _questions: ExtendsErrorUndefined<AllQuizQuestionsByQuestionId>;
  protected _quizDom: ExtendsErrorUndefined<QuizDom>;
  protected _questionsMap: ExtendsErrorUndefined<QuestionsMap[]>;

  constructor(){
    this._questions = undefined;
    this._quizDom = undefined;
    this._questionsMap = undefined;
  }

  async init(){
    try{
      await this.getAllQuizQuestionsByQuestionId();
      await this.getQuizDom();
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
    return this._questions;
  }

  private async getQuizDom(): Promise<ExtendsErrorUndefined<QuizDom>>{
    if( this._quizDom ){ return this._quizDom }
    try{
      const parentDom = document.querySelector(".quiz") as DomElement | null;
      if( ! parentDom ){
        return new Error("Could not find quiz DOM");
      }
      this._quizDom = parentDom as ExtractQuizDom<typeof parentDom>;
      return this._quizDom;
    }catch{ handleError }
    return undefined
  }
  get quizDom(){
    return this._quizDom;
  }

  private async getQuestionsMap(): Promise<ExtendsErrorUndefined<QuestionsMap[]>>{
    if( (! this._questions) || (! this._quizDom) ){
      return new Error("getQuestionsMap is missing information. Is it called prematurely?");
    }
    if( this._questions instanceof Error){ return this._questions }
    if( this._quizDom instanceof Error){ return this._quizDom }
    const questionsMap: ExtendsErrorUndefined<Partial<QuestionsMap>[]> = [];
    const extractPtag = /<p>(.+?)<\/p>/;
    // Extract questions info
    for( const [_, v] of Object.entries(this._questions)){
      const ptext = extractPtag.exec(v.parts.text);
      const map: ExtendsErrorUndefined<Partial<QuestionsMap>> = {
        id: v.id,
        number: undefined,
        text: (ptext ? ptext[0] : ''),
        format: v.parts.part1.format,
        dom: undefined,
        answers: v.parts.part1.answers,
      }
      questionsMap.push(map);
    }
    // Extract dom info. Numbers are unknown and must be matched by matching text
    for(let i=0; i < questionsMap.length; i++){
      const number = i+1;
      questionsMap[i].number = number;
      const dom = this._quizDom.children[`question${number}`];
      switch(questionsMap[i].format){
        case "radio":
          questionsMap[i].dom = dom as QuestionDom<"radio">;
          break;
          case "checkbox":
            questionsMap[i].dom = dom as QuestionDom<"checkbox">;
            break;
          case "menu":
            questionsMap[i].dom = dom as QuestionDom<"menu">;
            break;
        default:
          break;
      }


    }
    

    return 
  }

}


function handleError(e: Error | unknown | any){
  if(e instanceof Error){
    return e
  }
  return undefined
}

type asdf = Extract<GenericQuestionDom, DomChild<{
  children: DomChild<{
    children: DomChild<{
      children: DomChild<{
        classList: ("radioOption")[],
      }>
    }>
  }>
}>>