# global-project-toc README

This extension will helps you to create a file structure in mark down to navigate between markdown files.

## Features

### TableOfConetens for global file structure
The command `CTRL` + `SHIFT` + `P` + `Create the Header` will create a table of contents for the project in each File.  
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

### Write the project structure to file
The command `CTRL` + `SHIFT` + `P` + `Write project structure to file` will write the project structure that is displayed in each file to a yml file.
Afterwards the file can be used to load the project structure

### Future ideas:
- Update the `<!-- fileHierarchyPosition:  -->` in each file based on the structure provided in the structure file

## Source

[GitHub Repository](https://github.com/RichardSprenger/global-project-toc-for-markdown)

## Known Issues

Please feel free get in touch if any issues come up.

## Release Notes

Initial release.
Currently only support for rudimentary creation of the ToC and footer

### 0.0.1

Initial release


### 0.0.2

Added support to generate footer

### 0.0.3

Fixed Bug in Footer generation
Fixed Bug in BackToRoot link

### 0.0.4

Added configuration parameters
Added functionality to read project structure from file

### 0.0.5

Fixed Bug in generation of Footer
Changed parameters in config

-----------------------------------------------------------------------------------------------------------
