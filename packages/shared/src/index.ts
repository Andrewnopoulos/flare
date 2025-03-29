// Element types
export enum ElementType {
    RECTANGLE = 'rectangle',
    CIRCLE = 'circle',
    ELLIPSE = 'ellipse',
    POLYGON = 'polygon',
    PATH = 'path',
    TEXT = 'text',
    IMAGE = 'image',
    GROUP = 'group',
  }
  
  // Basic scene element interface
  export interface Element {
    id: string;
    type: ElementType;
    properties: Record<string, any>;
    children?: Element[];
    animations?: PropertyAnimation[];
  }
  
  // Timeline interfaces
  export interface Keyframe {
    frame: number;
    value: any;
    easing: string;
  }
  
  export interface PropertyAnimation {
    property: string;
    keyframes: Keyframe[];
  }
  
  export interface Frame {
    startFrame: number;
    duration: number;
    elements: Element[];
  }
  
  export interface Layer {
    id: string;
    type: string;
    frames: Frame[];
    locked: boolean;
    visible: boolean;
  }
  
  export interface Timeline {
    version: string;
    frameRate: number;
    duration: number;
    dimensions: {
      width: number | string;
      height: number | string;
      responsive: boolean;
    };
    layers: Layer[];
    scripts: any[];
  }