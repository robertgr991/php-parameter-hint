const { isDefined } = require('./utils');

/**
 * Pipeline class used to apply middlewares in a pipe style
 */
class Pipeline {
  constructor() {
    this.steps = [];
  }

  /**
   * Each argument can be a function or an array with the step function being
   * the first element and the rest of the elements are the additional args that
   * will be passed to the function.
   * They must be set in the order set by the parameters of the function
   * definition, the value being processed by the pipe wil be set as the first
   * arg when the function is called.
   *
   * @param  {(Function|(any)[])[]} steps
   */
  pipe(...steps) {
    steps.forEach(step => {
      if (!isDefined(step)) return;

      let finalStep;

      if (Array.isArray(step)) {
        finalStep = step;
      } else {
        finalStep = [step];
      }

      this.steps.push(finalStep);
    });

    return this;
  }

  /**
   * Clear existing pipes
   */
  clear() {
    this.steps = [];
    return this;
  }

  /**
   * The value to be processed by the pipeline
   *
   * @param {any} value
   * @param {boolean} clearAfter the pipes after computing the value
   */
  async process(value, clearAfter = false) {
    let currentValue = value;
    for (const [step, ...additionalArgs] of this.steps) {
      currentValue = await step(currentValue, ...additionalArgs);
    }

    if (clearAfter) {
      this.clear();
    }

    return currentValue;
  }
}

module.exports = {
  Pipeline
};
