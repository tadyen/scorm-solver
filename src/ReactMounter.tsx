// helper to mount react into page

import React from "react";
import { createRoot, type Root } from "react-dom/client";

const reactRootMountPointID = "react-root-mountpoint";
type RootMountPoint = {
  root?: Root,
  elem?: HTMLElement,
};

export default class ReactMounter {
  private mnt: RootMountPoint;

  constructor(){
    this.mnt = {
      elem: undefined,
      root: undefined,
    };
    this.mnt = {
      elem: this.getMountElement(),
      root: this.getMountRoot(),
    };
  }

  private getMountElement(){
    if( this.mnt.elem ){
      return this.mnt.elem;
    }
    const element = document.getElementById(reactRootMountPointID);
    if( element !== null ){
      this.mnt.elem = element;
      return element;
    }
    const reactRootMountPrototype = document.createElement("div");
    reactRootMountPrototype.id = reactRootMountPointID;
    document.body.prepend(reactRootMountPrototype);
    this.mnt.elem = reactRootMountPrototype;
    return this.mnt.elem;
  }
  
  private getMountRoot(){
    if( this.mnt.root ){
      return this.mnt.root
    }
    const element = this.getMountElement();
    this.mnt.root = createRoot(element);
    return this.mnt.root;
  }

  get elem(){
    return this.getMountElement();
  }

  get root(){
    return this.getMountRoot();
  }

  public render(children: React.ReactNode ){

    this.root?.render(
      <React.StrictMode>
        { children }
      </React.StrictMode>
    )
  }
}