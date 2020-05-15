/* eslint-disable import/no-unresolved */
const { ThemeColor, workspace, Range } = require('vscode');

class Hints {
  /**
   *
   * @param {string} message
   * @param {Range} range
   */
  static paramHint(message, range) {
    const config = workspace.getConfiguration('phpParameterHint');

    return {
      range,
      renderOptions: {
        before: {
          opacity: 0.4,
          color: new ThemeColor('phpParameterHint.hintForeground'),
          contentText: message,
          backgroundColor: new ThemeColor('phpParameterHint.hintBackground'),
          margin: `0px ${config.get('margin') + 1}px 0px ${config.get(
            'margin'
          )}px;padding: ${config.get('verticalPadding')}px ${config.get('horizontalPadding')}px;`,
          borderRadius: '5px',
          fontStyle: config.get('fontStyle'),
          fontWeight: `${config.get('fontWeight')};font-size:${config.get('fontSize')}px;`
        }
      }
    };
  }
}

module.exports = Hints;
