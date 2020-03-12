# PHP Parameter Hint for Visual Studio Code

[<img src="https://raw.githubusercontent.com/robertgr991/php-parameter-hint/master/php-parameter-hint.png?token=AIX5PCBJFE2GYVQLKC6AY5S6NJO4O">](https://raw.githubusercontent.com/)

Inserts parameter hints into function calls to easily understand the parameter role.

## Settings

There currently is a few configurable settings in the extension

| Name                                     | Description                                  | Default  |
| ---------------------------------------- | -------------------------------------------- | -------- |
| `phpParameterHint.enabled`               | Enable PHP Parameter Hint                    | true     |
| `phpParameterHint.margin`                | Hints styling of margin CSS property         | 2        |
| `phpParameterHint.fontWeight`            | Hints styling of font-weight CSS property    | "400"    |
| `phpParameterHint.fontStyle`             | Hints styling of font-style CSS property     | "italic" |
| `phpParameterHint.fontSize`              | Hints styling of font size CSS property      | 12       |
| `phpParameterHint.onSave`                | Create parameter hints on document save      | true     |
| `phpParameterHint.saveDelay`             | Delay in ms for on document save run         | 500      |
| `phpParameterHint.onChange`              | Create parameter hints on document change    | false    |
| `phpParameterHint.changeDelay`           | Delay in ms for on document change run       | 100      |
| `phpParameterHint.textEditorChangeDelay` | Delay in ms for on active text editor change | 750      |
| `phpParameterHint.php7`                  | True if php version is 7.0+, false otherwise | true     |

## Colors

You can change the default foreground and background colors in the `workbench.colorCustomizations` property in user settings.

| Name                              | Description                                 |
| --------------------------------- | ------------------------------------------- |
| `phpParameterHint.hintForeground` | Specifies the foreground color for the hint |
| `phpParameterHint.hintBackground` | Specifies the background color for the hint |

## Credits

[PHP Parser](https://github.com/glayzzle/php-parser)

[PHP Intelephense](https://github.com/bmewburn/vscode-intelephense)
