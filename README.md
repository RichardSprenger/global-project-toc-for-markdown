# global-project-toc README

This extension will helps you to create a file structure in mark down to navigate between markdown files.

## Features

### Current Features
#### TableOfConetens for global file structure
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

If the HierarchyPosition number equals to `0` this file will be used as the root and not displayed in the toc.
But a new line with `⬅️ Back to Overview` will be created pointing to this file

The part `; fileContentName: <Name>` is optional.    
It is used to define a different name for the file that is shown in the ToC.   
If not provided the filename without the file ending `.md` will be displayed.   
In the filename `-` or `_` will be replaced by a space.   

The ToC will be created within the lines `<!-- beginnGlobalToC -->` and `<!-- endGlobalToC -->`.   
The position of the toc will be by default under the `<!-- fileHierarchyPosition: <Position>   -->` line.   
A different position can be defined by setting `<!-- beginnGlobalToC -->` at this position.   

### Footer navigation to next and previous files
The command `CTRL` + `SHIFT` + `P` + `Create the Footer` will create a navigation div to navigate to the previous and to the next file in the hierarchy provided by the information above.
If `<!-- footerPosition -->` is found in the file, command will replace this and the next two lines with the footer.
If it is not found the footer will be created at the end of the file.

### Future ideas:
- Create a configuration to define different parameters.
  - Change file types that are considered
  - Change text of headline
- Add option to automatically place string before of after toc.

## Extension Settings

Currently not supported

## Source

[GitHub Repository](https://github.com/RichardSprenger/global-project-toc-for-markdown)

## Known Issues

Please feel free get in touch if any issues come up.

## Release Notes

Initial release.
Currently only support for rudimentary creation of the ToC

### 1.0.0

Initial release

-----------------------------------------------------------------------------------------------------------
