const path = require('path');

const sleep = ms => {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
};

const examplesFolderPath = path.join(`${__dirname}/examples/`);

module.exports = {
  sleep,
  examplesFolderPath
};
