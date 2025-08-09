export default function fixLinkifyPlugin() {
  return {
    name: 'fix-linkify',
    enforce: 'pre',
    transform(code, id) {
      // Process any file that contains linkify-related content
      if (!id.includes('linkify') && !code.includes('linkify') && !code.includes('Linkify')) {
        return null;
      }
      
      let hasChanges = false;
      let transformed = code;
      
      // Fix the specific linkify-react issue: options.assign is not a function
      // This happens because linkify-react assumes options has an assign method
      if (code.includes('options.assign(')) {
        transformed = transformed.replace(
          /\boptions\.assign\(/g,
          'Object.assign('
        );
        hasChanges = true;
        console.log(`[fix-linkify] Fixed options.assign calls in: ${id}`);
      }
      
      // Handle variations of the assign pattern in linkify libraries
      if (code.includes('.assign(') && !transformed.includes('Object.assign')) {
        // Fix specific patterns from linkify-react source
        transformed = transformed.replace(
          /(\w+)\.assign\s*\(/g,
          'Object.assign('
        );
        hasChanges = true;
        console.log(`[fix-linkify] Fixed .assign calls in: ${id}`);
      }
      
      // Add additional safety check: ensure Object.assign is available
      if (hasChanges && !code.includes('Object.assign')) {
        const objectAssignPolyfill = `
// Object.assign polyfill for linkify-react compatibility
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}
`;
        transformed = objectAssignPolyfill + '\n' + transformed;
        console.log(`[fix-linkify] Added Object.assign polyfill to: ${id}`);
      }
      
      if (hasChanges) {
        return {
          code: transformed,
          map: null
        };
      }
      
      return null;
    }
  };
}