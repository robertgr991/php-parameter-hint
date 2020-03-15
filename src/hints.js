/* eslint-disable import/no-unresolved */
const { ThemeColor, workspace, Range } = require('vscode');

class Hints {
  /**
   *
   * @param {string} message
   * @param {Range} range
   */
  static paramHint(message, range) {
    return {
      range,
      renderOptions: {
        before: {
          color: new ThemeColor('phpParameterHint.hintForeground'),
          contentText: message,
          backgroundColor: new ThemeColor('phpParameterHint.hintBackground'),
          margin: `0px ${workspace.getConfiguration('phpParameterHint').get('margin') +
            1}px 0px ${workspace
            .getConfiguration('phpParameterHint')
            .get('margin')}px;padding: 1px 0px;`,
          borderRadius: '5px',
          fontStyle: workspace.getConfiguration('phpParameterHint').get('fontStyle'),
          fontWeight: `${workspace
            .getConfiguration('phpParameterHint')
            .get('fontWeight')};font-size:${workspace
            .getConfiguration('phpParameterHint')
            .get('fontSize')}px;`
        }
      }
    };
  }
}

module.exports = Hints;
