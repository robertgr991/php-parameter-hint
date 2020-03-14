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

## 0.0.9 (15-03-2020)

- Now parameters are taken from SignatureHelpProvider and the Hover content is
  the fallback.
