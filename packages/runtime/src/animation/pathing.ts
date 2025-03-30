// Path-Based Animation Support

import { Element } from '@flare/shared';

/**
 * Point interface for path coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Path command types
 */
export enum PathCommandType {
  MOVE_TO = 'M',
  LINE_TO = 'L',
  CURVE_TO = 'C',  // Cubic bezier
  QUAD_TO = 'Q',   // Quadratic bezier
  ARC_TO = 'A',    // Elliptical arc
  CLOSE = 'Z'      // Close path
}

/**
 * Base path command interface
 */
export interface PathCommand {
  type: PathCommandType;
}

/**
 * Move to command
 */
export interface MoveToCommand extends PathCommand {
  type: PathCommandType.MOVE_TO;
  x: number;
  y: number;
}

/**
 * Line to command
 */
export interface LineToCommand extends PathCommand {
  type: PathCommandType.LINE_TO;
  x: number;
  y: number;
}

/**
 * Cubic bezier curve command
 */
export interface CurveToCommand extends PathCommand {
  type: PathCommandType.CURVE_TO;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x: number;
  y: number;
}

/**
 * Quadratic bezier curve command
 */
export interface QuadToCommand extends PathCommand {
  type: PathCommandType.QUAD_TO;
  x1: number;
  y1: number;
  x: number;
  y: number;
}

/**
 * Elliptical arc command
 */
export interface ArcToCommand extends PathCommand {
  type: PathCommandType.ARC_TO;
  rx: number;
  ry: number;
  rotation: number;
  largeArc: boolean;
  sweep: boolean;
  x: number;
  y: number;
}

/**
 * Close path command
 */
export interface CloseCommand extends PathCommand {
  type: PathCommandType.CLOSE;
}

/**
 * Union type for all path commands
 */
export type AnyPathCommand = 
  | MoveToCommand
  | LineToCommand
  | CurveToCommand
  | QuadToCommand
  | ArcToCommand
  | CloseCommand;

/**
 * Path definition
 */
export interface Path {
  id: string;
  commands: AnyPathCommand[];
  closed: boolean;
}

/**
 * Path animation options
 */
export interface PathAnimationOptions {
  pathId: string;
  startOffset: number;     // 0-1, where to start on the path
  endOffset: number;       // 0-1, where to end on the path
  orient: boolean;         // Whether to rotate element to follow path
  alignOrigin: Point;      // Which point on the element aligns to the path (0,0 is top-left)
  easing: string;          // Easing function name
}

/**
 * Path animation definition for an element
 */
export interface PathAnimation {
  elementId: string;
  startFrame: number;
  duration: number;
  options: PathAnimationOptions;
}

/**
 * Path manager class for handling path-based animations
 */
export class PathManager {
  private paths: Map<string, Path> = new Map();
  private pathAnimations: PathAnimation[] = [];
  
  /**
   * Register a new path
   */
  public registerPath(path: Path): void {
    this.paths.set(path.id, path);
  }
  
  /**
   * Register a path animation
   */
  public registerPathAnimation(animation: PathAnimation): void {
    this.pathAnimations.push(animation);
  }
  
  /**
   * Apply path animations to elements
   */
  public applyPathAnimations(elements: Element[], currentFrame: number): Element[] {
    // Create a map for quick element lookup
    const elementsMap = new Map<string, Element>();
    elements.forEach(element => {
      elementsMap.set(element.id, element);
    });
    
    // Process each path animation
    this.pathAnimations.forEach(animation => {
      // Check if this animation is active at the current frame
      if (
        currentFrame >= animation.startFrame && 
        currentFrame < animation.startFrame + animation.duration
      ) {
        // Get the element
        const element = elementsMap.get(animation.elementId);
        if (!element) return;
        
        // Get the path
        const path = this.paths.get(animation.options.pathId);
        if (!path) return;
        
        // Calculate progress along the path
        const timeProgress = (currentFrame - animation.startFrame) / animation.duration;
        
        // Apply easing to the time progress
        // In a full implementation, this would use the Easing class
        const easedTimeProgress = this.applyEasing(
          timeProgress, 
          animation.options.easing || 'linear'
        );
        
        // Convert time progress to path offset progress
        const { startOffset, endOffset } = animation.options;
        const pathOffset = startOffset + (endOffset - startOffset) * easedTimeProgress;
        
        // Get the point and angle at this offset
        const { point, angle } = this.getPointAtOffset(path, pathOffset);
        
        // Update element position
        // Adjust by alignOrigin if specified
        const alignX = animation.options.alignOrigin?.x || 0;
        const alignY = animation.options.alignOrigin?.y || 0;
        
        if (!element.properties) {
          element.properties = {};
        }
        
        element.properties.x = point.x - (element.properties.width || 0) * alignX;
        element.properties.y = point.y - (element.properties.height || 0) * alignY;
        
        // Update rotation if orient is true
        if (animation.options.orient && angle !== null) {
          element.properties.rotation = angle * (180 / Math.PI); // Convert to degrees
        }
      }
    });
    
    return elements;
  }
  
  /**
   * Get a point at a specific offset along a path
   */
  private getPointAtOffset(path: Path, offset: number): { point: Point, angle: number | null } {
    // Calculate the total length of the path (simplified)
    const pathSegments = this.calculatePathSegments(path);
    const totalLength = pathSegments.reduce((sum, segment) => sum + segment.length, 0);
    
    // Find the target distance along the path
    const targetDistance = totalLength * Math.max(0, Math.min(1, offset));
    
    // Find the segment containing the target distance
    let distanceTraveled = 0;
    for (const segment of pathSegments) {
      if (distanceTraveled + segment.length >= targetDistance) {
        // Found the segment
        const segmentOffset = (targetDistance - distanceTraveled) / segment.length;
        return this.getPointOnSegment(segment, segmentOffset);
      }
      distanceTraveled += segment.length;
    }
    
    // Fallback to the last point if not found
    const lastCommand = path.commands[path.commands.length - 1];
    return {
      point: { 
        x: 'x' in lastCommand ? lastCommand.x : 0, 
        y: 'y' in lastCommand ? lastCommand.y : 0 
      },
      angle: null
    };
  }
  
  /**
   * Calculate segments along a path for length measurement
   * Note: This is a simplified implementation
   */
  private calculatePathSegments(path: Path): PathSegment[] {
    const segments: PathSegment[] = [];
    let currentX = 0;
    let currentY = 0;
    let startX = 0;
    let startY = 0;
    
    for (let i = 0; i < path.commands.length; i++) {
      const command = path.commands[i];
      
      switch (command.type) {
        case PathCommandType.MOVE_TO:
          currentX = (command as MoveToCommand).x;
          currentY = (command as MoveToCommand).y;
          startX = currentX;
          startY = currentY;
          break;
          
        case PathCommandType.LINE_TO:
          const lineCmd = command as LineToCommand;
          segments.push({
            type: 'line',
            x0: currentX,
            y0: currentY,
            x1: lineCmd.x,
            y1: lineCmd.y,
            length: this.distance(currentX, currentY, lineCmd.x, lineCmd.y)
          });
          currentX = lineCmd.x;
          currentY = lineCmd.y;
          break;
          
        case PathCommandType.CURVE_TO:
          const curveCmd = command as CurveToCommand;
          segments.push({
            type: 'cubic',
            x0: currentX,
            y0: currentY,
            x1: curveCmd.x1,
            y1: curveCmd.y1,
            x2: curveCmd.x2,
            y2: curveCmd.y2,
            x3: curveCmd.x,
            y3: curveCmd.y,
            length: this.estimateCubicBezierLength(
              currentX, currentY,
              curveCmd.x1, curveCmd.y1,
              curveCmd.x2, curveCmd.y2,
              curveCmd.x, curveCmd.y
            )
          });
          currentX = curveCmd.x;
          currentY = curveCmd.y;
          break;
          
        case PathCommandType.QUAD_TO:
          const quadCmd = command as QuadToCommand;
          segments.push({
            type: 'quadratic',
            x0: currentX,
            y0: currentY,
            x1: quadCmd.x1,
            y1: quadCmd.y1,
            x2: quadCmd.x,
            y2: quadCmd.y,
            length: this.estimateQuadraticBezierLength(
              currentX, currentY,
              quadCmd.x1, quadCmd.y1,
              quadCmd.x, quadCmd.y
            )
          });
          currentX = quadCmd.x;
          currentY = quadCmd.y;
          break;
          
        case PathCommandType.ARC_TO:
          // Simplified arc handling - in a full implementation, this would be more complex
          const arcCmd = command as ArcToCommand;
          segments.push({
            type: 'arc',
            x0: currentX,
            y0: currentY,
            x1: arcCmd.x,
            y1: arcCmd.y,
            rx: arcCmd.rx,
            ry: arcCmd.ry,
            rotation: arcCmd.rotation,
            largeArc: arcCmd.largeArc,
            sweep: arcCmd.sweep,
            length: this.estimateArcLength(
              currentX, currentY,
              arcCmd.x, arcCmd.y,
              arcCmd.rx, arcCmd.ry,
              arcCmd.rotation,
              arcCmd.largeArc,
              arcCmd.sweep
            )
          });
          currentX = arcCmd.x;
          currentY = arcCmd.y;
          break;
          
        case PathCommandType.CLOSE:
          segments.push({
            type: 'line',
            x0: currentX,
            y0: currentY,
            x1: startX,
            y1: startY,
            length: this.distance(currentX, currentY, startX, startY)
          });
          currentX = startX;
          currentY = startY;
          break;
      }
    }
    
    return segments;
  }
  
  /**
   * Get a point and angle on a segment at a specific offset
   */
  private getPointOnSegment(segment: PathSegment, offset: number): { point: Point, angle: number | null } {
    offset = Math.max(0, Math.min(1, offset));
    
    switch (segment.type) {
      case 'line':
        return {
          point: {
            x: segment.x0 + (segment.x1 - segment.x0) * offset,
            y: segment.y0 + (segment.y1 - segment.y0) * offset
          },
          angle: Math.atan2(segment.y1 - segment.y0, segment.x1 - segment.x0)
        };
        
      case 'cubic':
        // Ensure all required coordinates exist before calling the function
        if (segment.x0 !== undefined && segment.y0 !== undefined &&
            segment.x1 !== undefined && segment.y1 !== undefined &&
            segment.x2 !== undefined && segment.y2 !== undefined &&
            segment.x3 !== undefined && segment.y3 !== undefined) {
          return this.getPointOnCubicBezier(
            segment.x0, segment.y0,
            segment.x1, segment.y1,
            segment.x2, segment.y2,
            segment.x3, segment.y3,
            offset
          );
        }
        // Fallback if any coordinates are missing
        return { point: { x: segment.x0, y: segment.y0 }, angle: null };
        
      case 'quadratic':
        // Ensure all required coordinates exist before calling the function
        if (segment.x0 !== undefined && segment.y0 !== undefined &&
            segment.x1 !== undefined && segment.y1 !== undefined &&
            segment.x2 !== undefined && segment.y2 !== undefined) {
          return this.getPointOnQuadraticBezier(
            segment.x0, segment.y0,
            segment.x1, segment.y1,
            segment.x2, segment.y2,
            offset
          );
        }
        // Fallback if any coordinates are missing
        return { point: { x: segment.x0, y: segment.y0 }, angle: null };
        
      case 'arc':
        // Simplified arc implementation
        // In a full implementation, this would compute points along an elliptical arc
        return {
          point: {
            x: segment.x0 + (segment.x1 - segment.x0) * offset,
            y: segment.y0 + (segment.y1 - segment.y0) * offset
          },
          angle: null // Proper angle calculation for arcs is complex
        };
        
      default:
        return { point: { x: 0, y: 0 }, angle: null };
    }
  }
  
  /**
   * Calculate a point and angle on a cubic bezier curve at a specific offset
   */
  private getPointOnCubicBezier(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    t: number
  ): { point: Point, angle: number } {
    // Calculate point using Bernstein polynomial form
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;
    
    const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
    const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;
    
    // Calculate derivatives for the tangent
    const dx = 3 * mt2 * (x1 - x0) + 6 * mt * t * (x2 - x1) + 3 * t2 * (x3 - x2);
    const dy = 3 * mt2 * (y1 - y0) + 6 * mt * t * (y2 - y1) + 3 * t2 * (y3 - y2);
    
    return {
      point: { x, y },
      angle: Math.atan2(dy, dx)
    };
  }
  
  /**
   * Calculate a point and angle on a quadratic bezier curve at a specific offset
   */
  private getPointOnQuadraticBezier(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    t: number
  ): { point: Point, angle: number } {
    // Calculate point using Bernstein polynomial form
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    
    const x = mt2 * x0 + 2 * mt * t * x1 + t2 * x2;
    const y = mt2 * y0 + 2 * mt * t * y1 + t2 * y2;
    
    // Calculate derivatives for the tangent
    const dx = 2 * (mt * (x1 - x0) + t * (x2 - x1));
    const dy = 2 * (mt * (y1 - y0) + t * (y2 - y1));
    
    return {
      point: { x, y },
      angle: Math.atan2(dy, dx)
    };
  }
  
  /**
   * Distance between two points
   */
  private distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Estimate the length of a cubic bezier curve
   * This uses a simple approximation by sampling points
   */
  private estimateCubicBezierLength(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number
  ): number {
    const samples = 10; // Number of samples to take
    let length = 0;
    let prevX = x0;
    let prevY = y0;
    
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = mt3 * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t3 * x3;
      const y = mt3 * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * y3;
      
      length += this.distance(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
    
    return length;
  }
  
  /**
   * Estimate the length of a quadratic bezier curve
   * This uses a simple approximation by sampling points
   */
  private estimateQuadraticBezierLength(
    x0: number, y0: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): number {
    const samples = 10; // Number of samples to take
    let length = 0;
    let prevX = x0;
    let prevY = y0;
    
    for (let i = 1; i <= samples; i++) {
      const t = i / samples;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const t2 = t * t;
      
      const x = mt2 * x0 + 2 * mt * t * x1 + t2 * x2;
      const y = mt2 * y0 + 2 * mt * t * y1 + t2 * y2;
      
      length += this.distance(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }
    
    return length;
  }
  
  /**
   * Estimate the length of an elliptical arc
   * This is a simplified implementation
   */
  private estimateArcLength(
    x0: number, y0: number,
    x1: number, y1: number,
    rx: number, ry: number,
    rotation: number,
    largeArc: boolean,
    sweep: boolean
  ): number {
    // For simplicity, we'll just use the chord length as an approximation
    // A full implementation would calculate the actual arc length
    return this.distance(x0, y0, x1, y1) * 1.5; // Rough approximation
  }
  
  /**
   * Apply easing function to a progress value
   * This is a placeholder - in a full implementation this would use the Easing class
   */
  private applyEasing(progress: number, easingName: string): number {
    // Simple easing functions
    switch (easingName) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return progress * (2 - progress);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : -1 + (4 - 2 * progress) * progress;
      default:
        return progress;
    }
  }
}

/**
 * Interface for path segments used in path calculations
 */
interface PathSegment {
  type: 'line' | 'cubic' | 'quadratic' | 'arc';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  x2?: number;
  y2?: number;
  x3?: number;
  y3?: number;
  rx?: number;
  ry?: number;
  rotation?: number;
  largeArc?: boolean;
  sweep?: boolean;
  length: number;
}

/**
 * Parse an SVG path string into path commands
 */
export function parseSVGPath(pathString: string): AnyPathCommand[] {
  // This is a simplified implementation
  // A full implementation would handle all SVG path commands
  const commands: AnyPathCommand[] = [];
  const pathData = pathString.match(/([A-Za-z])([^A-Za-z]*)/g) || [];
  
  let currentX = 0;
  let currentY = 0;
  
  for (const segment of pathData) {
    const command = segment.charAt(0);
    const params = segment.substring(1).trim().split(/[\s,]+/).map(parseFloat);
    
    switch (command) {
      case 'M': // Move to
        currentX = params[0];
        currentY = params[1];
        commands.push({
          type: PathCommandType.MOVE_TO,
          x: currentX,
          y: currentY
        });
        break;
        
      case 'L': // Line to
        currentX = params[0];
        currentY = params[1];
        commands.push({
          type: PathCommandType.LINE_TO,
          x: currentX,
          y: currentY
        });
        break;
        
      case 'C': // Cubic bezier
        commands.push({
          type: PathCommandType.CURVE_TO,
          x1: params[0],
          y1: params[1],
          x2: params[2],
          y2: params[3],
          x: params[4],
          y: params[5]
        });
        currentX = params[4];
        currentY = params[5];
        break;
        
      case 'Q': // Quadratic bezier
        commands.push({
          type: PathCommandType.QUAD_TO,
          x1: params[0],
          y1: params[1],
          x: params[2],
          y: params[3]
        });
        currentX = params[2];
        currentY = params[3];
        break;
        
      case 'A': // Arc
        commands.push({
          type: PathCommandType.ARC_TO,
          rx: params[0],
          ry: params[1],
          rotation: params[2],
          largeArc: params[3] !== 0,
          sweep: params[4] !== 0,
          x: params[5],
          y: params[6]
        });
        currentX = params[5];
        currentY = params[6];
        break;
        
      case 'Z': // Close path
        commands.push({
          type: PathCommandType.CLOSE
        });
        break;
        
      // Add support for relative commands (lowercase) in a full implementation
    }
  }
  
  return commands;
}