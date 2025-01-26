// This component provides content scripts the ability to expose page content which is normally isolated from the content script environment

// https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts#xray_vision_in_firefox
// https://developer.chrome.com/docs/extensions/reference/api/scripting#type-ExecutionWorld

/// <reference types="chrome"/>
import * as browser from "webextension-polyfill";
import type{Browser} from "webextension-polyfill";

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
  browser: Browser | typeof chrome,
  window: ExtendedWindow
};
export const extendedGlobal = ((globalThis as unknown) as ExtendedGlobal);
if( browserFamily === "chrome"){
  // Chrome does not support the browser namespace yet.
  extendedGlobal.browser = chrome as typeof chrome;
}else{
  // Firefox
  extendedGlobal.browser = browser as Browser;
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
  const tabId = activeTab
    .then((tab)=>{ return tab.id })
    .catch((e)=>{throw e})
  return tabId;
}


export class Xray{
  static async executeMain(cb: <T>(...args: T[]) => any ){
    try{
      const tabId = await getCurrentTabId();
      if( ! tabId ){ 
        throw new Error("tabId not found");
      };
      return extendedGlobal.browser.scripting.executeScript({
        target: {tabId: 2},
        world: "MAIN",
        func: cb
      })
    }catch(e){throw e}
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
