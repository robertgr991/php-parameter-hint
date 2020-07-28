# Change Log

All notable changes to the "php-parameter-hint" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.0.1 - 0.0.4 (12-03-2020)

- Initial release and fixes.

## 0.0.5 (12-03-2020)

- Add support for "@", "break/continue", "eval" and showing the ampersand for parameters passed by reference.

## 0.0.6 (13-03-2020)

- Added option to collapse hints when parameter name matches the variable name, option to show hints only for literals, option to show hints only for current line and changed the regex that extracts the parameters from hover content.

## 0.0.7 (13-03-2020)

- Update dev dependency "minimist" version

## 0.0.8 (14-03-2020)

- Option to show only arguments on current line now shows arguments in
  selection. If there is a large number of arguments to display, they will show
  once every an arbitrary number.

## 0.0.9 (14-03-2020)

- Added unique id to every update call, to cancel previous update call in case a
  call is still active when a new update call is made.

## 0.1.0 (15-03-2020)

- Now parameters are taken from SignatureHelpProvider and the Hover content is
  the fallback.

## 0.1.1 (15-03-2020)

- Update parser. Set status bar message after execution of a command.
  Separation. Grouping arguments by function, to avoid unnecessary calls to signature helper.

## 0.1.2 (16-03-2020)

- Update README and fixed bug with hint only current line.

## 0.1.3(11-04-2020)

- New way of getting only the text containing php, old function was breaking if
  a php tag was in a comment/string. Refactoring.

## 0.1.4(15-05-2020)

- Add configuration for the vertical and horizontal padding of the decoration.

## 0.1.5(17-05-2020)

- Remove the white spaces before and after the hint, to allow it to be fully
  customizable by changing the horizontal padding. Increase the default
  horizontal padding so decorations look like before the removal of white spaces.

## 0.2.0(26-07-2020)

- Add option to toggle between showing only parameter name, type and name or
  only type, if type is available

## 0.2.1(27-07-2020)

- Updated the PHP Parser to the latest version
- Fixed an issue for no typed mode where params weren't visible.