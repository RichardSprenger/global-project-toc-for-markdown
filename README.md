# global-project-toc README

This extension can be used to create a Table of Contents for a markdown documentation repository.
It will create the global ToC in each file with the line `<!-- fileHierarchyPosition: <Position>   -->`.
The `<Position>` parameter defines the files position in the global context.
The `<Position>` parameter must look like this: `<TopLevel>.<SubLevel>.<SubSubLevel>. ... .<SubSubLevel>`
Example:
- First File <!-- fileHierarchyPosition: 1 -->
  - First Child File <!-- fileHierarchyPosition: 1.1 -->
  - Second Child File <!-- fileHierarchyPosition: 1.2 -->
- Second File <!-- fileHierarchyPosition: 2 -->
  - First Child File <!-- fileHierarchyPosition: 2.1 -->
  - Second Child File <!-- fileHierarchyPosition: 2.2 -->

The order number for the hierarchy must be separated by a `.`.

The part `; fileContentName: <Name>` is optional. 
It is used to define a different name for the file that is shown in the ToC.
If not provided the filename without the file ending `.md` will be displayed.
In the filename `-` or `_` will be replaced by a space.

The ToC will be created within the lines `<!-- beginnGlobalToC -->` and `<!-- endGlobalToC -->`.
The position of the toc will be by default under the `<!-- fileHierarchyPosition: <Position>   -->` line.
A different position can be defined by setting `<!-- beginnGlobalToC -->` at this position.

## Features

Current Features:
- Create a global ToC in each File

Future idears:
- Create a navigation at the bottom of the file to jump to the file next or previous in the toc.
- Create a configuration to define different parameters.
  - Change file types that are considered
  - Change text of headline
- Add option to automatically place string before of after toc.

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Currently not supported

## Known Issues

Please feel free get in touch if any issues come up.

## Release Notes

Initial release.
Currently only support for rudimentary creation of the ToC

### 1.0.0

Initial release

-----------------------------------------------------------------------------------------------------------
