/* eslint-disable no-console */
const path = require('path');
const cp = require('child_process');
const {
  runTests,
  resolveCliPathFromVSCodeExecutablePath,
  downloadAndUnzipVSCode
} = require('vscode-test');

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../');

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index');
    const vscodeExecutablePath = await downloadAndUnzipVSCode('insiders');
    const cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath);

    // Use cp.spawn / cp.exec for custom setup
    cp.spawnSync(cliPath, ['--install-extension', 'bmewburn.vscode-intelephense-client'], {
      encoding: 'utf-8',
      stdio: 'inherit'
    });

    // Download VS Code, unzip it and run the integration test
    await runTests({
      vscodeExecutablePath,
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error(err);
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
