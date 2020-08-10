/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-unused-vars
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
          opacity: config.get('opacity'),
          color: new ThemeColor('phpParameterHint.hintForeground'),
          contentText: message,
          backgroundColor: new ThemeColor('phpParameterHint.hintBackground'),
          margin: `0px ${config.get('margin') + 1}px 0px ${config.get(
            'margin'
          )}px;padding: ${config.get('verticalPadding')}px ${config.get('horizontalPadding')}px;`,
          borderRadius: `${config.get('borderRadius')}px`,
          fontStyle: config.get('fontStyle'),
          fontWeight: `${config.get('fontWeight')};font-size:${config.get('fontSize')}px;`
        }
      }
    };
  }
}

module.exports = Hints;
