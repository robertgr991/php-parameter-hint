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
      let finalStep;

      if (Array.isArray(step)) {
        finalStep = [step[0], step.slice(1)];
      } else {
        finalStep = [step];
      }

      this.steps.push(finalStep);
    });

    return this;
  }

  /**
   * The value to be processed by the pipeline
   *
   * @param {any} value
   */
  async process(value) {
    let currentValue = value;
    this.steps.forEach(async ([step, ...additionalArgs]) => {
      currentValue = await step(currentValue, ...additionalArgs);
    });

    return currentValue;
  }
}

module.exports = {
  Pipeline
};