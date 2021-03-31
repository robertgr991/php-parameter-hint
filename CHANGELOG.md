# Change Log

## [0.5.2] - 31-03-2021

### Changed

- Update deps

## [0.5.1] - 17-09-2020

### Changed

- Stop using [js-coroutines](https://github.com/miketalbot/js-coroutines) for
  now because it causes high CPU usage

## [0.5.0] - 22-08-2020

### Added

- Commands to toggle hinting on text change/document save
- Command to toggle showing `$` before parameter name
- Integration tests in vscode environment
- More unit tests
- `FunctionGroupsFacade`

### Fixed

- RegExp for getting parameter names and types from function definition
- Hover provider when using the documentation RegExp
- Parser when there are only short opening tags or when there is only PHP
  embedded in HTML
- Bug when show only visible ranges was forced only locally before `update` it's called

### Changed

- `update` returns the decorations, for testing purposes

### Removed

- Remove margin for visible ranges middleware

## [0.4.1] - 13-08-2020

### Fixed

- Add missing `resolve` when there is an error while compressing the text.

## [0.4.0] - 13-08-2020

### Added

- Hint only visible ranges middleware, can be toggle with command. Defaults to
  `false`. For files with a lot of arguments, it's forcefully enabled.
- In-memory cache for function groups. If document text is different than the cached text, parse the
  file again, else return the cached function groups. Cached function groups
  have a TTL of 10 min, refreshed with each successful retrieval.

### Changed

- Add unit test for `clear` method of `Pipeline` class.

## 0.3.4(10-08-2020)

- Fix middlewares and pipeline

## 0.3.3(10-08-2020)

- - Set border-radius of hints as configurable
  - Set opacity of hints as configurable
  - Move construction of final decoration text to `parameterExtractor.js`
  - For variadic arguments, when showing only the type, don't show a space
    between the type and index - show `mixed[0]` instead of `mixed [0]`

## 0.3.2(09-08-2020)

- Bundle extension

## 0.3.1(09-08-2020)

- Exclude unnecessary files

## 0.3.0(09-08-2020)

- - Add command to collapse type and name when equal
  - Add command to show full name of type(namespaces including)
  - Use [js-coroutines](https://github.com/miketalbot/js-coroutines) to avoid
    high CPU load
  - Update php-parser version
  - Simplify AST crawling
  - Refactoring

## 0.2.3(29-07-2020)

- When available, use doc from signature help provider + some refactoring

## 0.2.2(28-07-2020)

- Fix regex for PHPDoc parsing when using hover provider: https://github.com/DominicVonk

## 0.2.1(28-07-2020)

- Show only the "short" name of the type, without the namespace

## 0.2.0(26-07-2020)

- Add option to toggle between showing only parameter name, type and name or
  only type, if type is available

## 0.1.5(17-05-2020)

- Remove the white spaces before and after the hint, to allow it to be fully
  customizable by changing the horizontal padding. Increase the default
  horizontal padding so decorations look like before the removal of white spaces.

## 0.1.4(15-05-2020)

- Add configuration for the vertical and horizontal padding of the decoration.

## 0.1.3(11-04-2020)

- New way of getting only the text containing php, old function was breaking if
  a php tag was in a comment/string. Refactoring.

## 0.1.2 (16-03-2020)

- Update README and fixed bug with hint only current line.

## 0.1.1 (15-03-2020)

- Update parser. Set status bar message after execution of a command.
  Separation. Grouping arguments by function, to avoid unnecessary calls to signature helper.

## 0.1.0 (15-03-2020)

- Now parameters are taken from SignatureHelpProvider and the Hover content is
  the fallback.

## 0.0.9 (14-03-2020)

- Added unique id to every update call, to cancel previous update call in case a
  call is still active when a new update call is made.

## 0.0.8 (14-03-2020)

- Option to show only arguments on current line now shows arguments in
  selection. If there is a large number of arguments to display, they will show
  once every an arbitrary number.

## 0.0.7 (13-03-2020)

- Update dev dependency "minimist" version

## 0.0.6 (13-03-2020)

- Added option to collapse hints when parameter name matches the variable name, option to show hints only for literals, option to show hints only for current line and changed the regex that extracts the parameters from hover content.

## 0.0.5 (12-03-2020)

- Add support for "@", "break/continue", "eval" and showing the ampersand for parameters passed by reference.

## 0.0.1 - 0.0.4 (12-03-2020)

- Initial release and fixes.
