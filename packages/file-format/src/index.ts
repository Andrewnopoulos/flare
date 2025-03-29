import { Timeline, Element } from '@flare/shared';

// For the initial implementation, we'll use a simplified format
// that's directly loaded as JSON, rather than parsing a binary format

export class FlareParser {
  /**
   * Parse a Flare JSON file content
   */
  static parseJSON(content: string): Timeline {
    try {
      const data = JSON.parse(content);
      // Validate the parsed data (simplified for initial implementation)
      if (!data.version || !data.frameRate || !data.layers) {
        throw new Error('Invalid Flare file format');
      }
      return data as Timeline;
    } catch (error) {
      console.error('Failed to parse Flare content:', error);
      throw error;
    }
  }

  /**
   * Create a simplified scene graph from the timeline data
   * (used for initial rendering before full animation support)
   */
  static createSceneGraph(timeline: Timeline): Element[] {
    const elements: Element[] = [];
    
    // For simplicity, we'll create a flat list of all elements from the first frame of each layer
    for (const layer of timeline.layers) {
      if (!layer.visible || !layer.frames.length) continue;
      
      const firstFrame = layer.frames[0];
      if (firstFrame && firstFrame.elements) {
        elements.push(...firstFrame.elements);
      }
    }
    
    return elements;
  }
}