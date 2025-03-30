// This file is executed before each test file

// Add Jest mock for requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Add Jest mocks for performance.now()
global.performance = {
  now: () => Date.now(),
};

// EventTriggerType enum values for tests that need them
global.EventTriggerType = {
  CLICK: 'click',
  HOVER: 'hover',
  DRAG_START: 'dragStart',
  DRAG_END: 'dragEnd',
  FRAME_ENTER: 'frameEnter',
  FRAME_EXIT: 'frameExit',
  RANGE_ENTER: 'rangeEnter',
  RANGE_EXIT: 'rangeExit',
  PLAY: 'play',
  PAUSE: 'pause',
  STOP: 'stop',
  LOOP: 'loop',
  CUSTOM: 'custom'
};