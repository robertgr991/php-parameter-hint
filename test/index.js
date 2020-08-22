// eslint-disable-next-line import/no-unresolved
const vscode = require('vscode');
const path = require('path');
const Mocha = require('mocha');
const glob = require('glob');
const { sleep, examplesFolderPath } = require('./utils');

function run() {
  process.env.NODE_ENV = 'test';
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: '600s'
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((c, e) => {
    glob('test/**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        e(err);
        return;
      }

      // Add files to the test suite
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
      mocha.rootHooks({
        beforeAll: async () => {
          const uri = vscode.Uri.file(path.join(`${examplesFolderPath}general.php`));
          const document = await vscode.workspace.openTextDocument(uri);
          await vscode.window.showTextDocument(document);
          await sleep(4000); // wait for file to be completely functional
        }
      });

      try {
        // Run the mocha test
        mocha.run(failures => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`));
          } else {
            c();
          }
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        e(error);
      }
    });
  });
}

module.exports = {
  run
};
