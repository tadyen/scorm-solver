//  https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#xray_vision_in_firefox
// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ExecutionWorld

/// <reference types="chrome"/>

import * as browser from "webextension-polyfill";

interface ExtendedWindow extends Window{
  hasRun?: boolean;
}
export const extendedWindow = ((window as unknown) as ExtendedWindow);

type BrowserFamily = "firefox" | "chrome" | undefined;
function getBrowserFamily(): BrowserFamily{
  if( typeof chrome !== "undefined" ){
    if( typeof browser !== "undefined" ){
      return "firefox"
    } else {
      return "chrome";
    }
  }
  return undefined
}

const browserFamily = getBrowserFamily();
type Global = typeof global;
interface ExtendedGlobal extends Omit<Global,"window">{
  browser: any
  window: ExtendedWindow
};
export const extendedGlobal = ((globalThis as unknown) as ExtendedGlobal);
if( browserFamily === "chrome"){
  // Chrome does not support the browser namespace yet.
  extendedGlobal.browser = chrome;
}else{
  // Firefox
  extendedGlobal.browser = browser;
}
extendedGlobal.window = extendedWindow;

// Firefox specific Xray API
interface ExportFunctionProps{
  func: <T>(arg: T)=> T,
  targetScope: Object,
  options?: {
    defineAs?: string,
    allowCrossOriginArguments?: boolean
  }
}
interface CloneIntoProps{
  obj: Object,
  targetScope: Object,
  options?: {
    cloneFunctions?: boolean,
    wrapReflectors?: boolean
  }
}
interface XPCNativeWrapper{ <T = Object>(arg: T): void }
interface WrappedJSObject{ [key: string]: any }
declare function exportFunction(props: ExportFunctionProps): ExportFunctionProps["func"];
declare function cloneInto(props: CloneIntoProps): CloneIntoProps["obj"];
declare const XPCNativeWrapper: XPCNativeWrapper; // rewrapper for wrappedJSObject

interface ExtendedWindow{
  wrappedJSObject: WrappedJSObject,
}
interface ExtendedGlobal{
  XPCNativeWrapper: XPCNativeWrapper,
  cloneInto: typeof cloneInto,
  exportFunction: typeof exportFunction,
}

async function getCurrentTabId(){
  const query = browser.tabs.query({
    windowId: browser.windows.WINDOW_ID_CURRENT,
    active: true
  });
  const activeTab = query
    .then((tabs)=>{ return tabs[0]})
    .catch((e)=>{throw e})
  ;
  return (await activeTab).id;
}


export class Xray{
  static async executeMain(cb: <T>(arg: T) => any){
    return extendedGlobal.browser.scripting.executeScript({
      target: {tabId: await getCurrentTabId()},
      world: "MAIN",
      func: cb
    })
  }

  static async exposeObject(objKey: string){
    try{
      if(browserFamily === "firefox"){
        return Promise.resolve(extendedWindow.wrappedJSObject[objKey]);
      }
      return(
        this.executeMain(()=>{
          return (extendedWindow as WrappedJSObject)[objKey];
        })
      )
    }catch(e){
      return Promise.reject(e);
    }
  }

}
