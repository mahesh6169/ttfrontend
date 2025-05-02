export function isHoneypotTriggered(honeypotValue) {
    return !!honeypotValue;
  }
  
  export function isFormSubmittedTooQuickly(formLoadTime, threshold = 1500) {
    const elapsed = Date.now() - formLoadTime;
    return elapsed < threshold;
  }