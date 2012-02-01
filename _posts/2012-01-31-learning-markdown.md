---
layout: post
title: "Learning Markdown"
category: learning
tags: ["markdown", "learning"]
---
{% include JB/setup %}

In which I teach myself Markdown
================================

This is my Jekyll based blog, hosted on Github. As, all content in Jekyll is written in Markdown, 
I've decided to take this opportunity to teach myself/document as many parts of markdown as I can.

(This has been borrowed heavily from documentation found on [Daring Fireball](http://daringfireball.net/projects/markdown/basics))

Headers
-------

There appear to be various ways to create header elements in Markdown:

### &lt;h1>

* &lt;h1> elements can be created by printing strings of ==== characters under a line that should be enclosed in &lt;h1> tags.
* Alternatively, any lines that are preceded by a singled # character will be wrapped in &lt;h1> tags.
* Finally, since Markdown can consist of html itself, anything wrapped in &lt;h1> tags will be interpreted as such.

### &lt;h2>

* Similarly, &lt;h2> elements can be created by printing strings of ------ characters under a line that should be enclosed in &lt;h2> tags.
* Alternatively, any lines that are preceded by two # characters (i.e. - ##) will be wrapped in &lt;h2> tags.
* Once again, regular &lt;h2> tags can be used since Markdown allows html.

_** From hence forward, just know that html can be used anywhere in Markdown_

### &lt;h3>

* Finally, &lt;h3 any lines that are immediately preceded by three # characters (i.e. - ###) will be wrapped in &lt;h3> tags.

### blockquotes

Any sequence of lines that all begin with the character > followed by a space will be wrapped in blockquotes, like this:

> ### _Note:_
>
> Any other special characters that are accounted for at the beginning of lines will still work within the context of blockquotes

### italics

Any set of characters that are surrounded by underscore, or asterisk characters will be _italicized_ like *this*

### bold

Any of set of characters that are surrounded by two underscore, or asterisk characters will be __boldicized__ like **this**

### both bold and italics

Use three underscores or asterisk characters for both ___bold___ and ***italics***

### unordered list

Any lines that begin with one of these characters will be part of an unordered list ___(asterisk, plus, minus)___

* Astericks
* can be used (*)

+ As can 
+ plus signs (+)

- minus signs (-)
- can as well

_** Note: you can mix and match..._ ___YAH!!!___

### ordered list

Any lines preceded by a digit followed by a period will be numbered. Doesn't have to start with one:

4. Picking it up late
5. In the list ordering
6. Game

### paragraphs in lists

Also, paragraphs can be utilized within the lists through the use of indentation, like this:

*   paragraph 1

    paragraph 2

*   paragraph 3

### links

Pretty straightforward, the hyperlink text should be enclosed in square brackets ([]) and then the hyperlink should immediately follow it enclosed in parentheses. [Example](http://example.com)

### reference style links

Pretty sweet, you can embed links that can be referenced later in the document by, again, wrapping the hyperlink text in square brackets and then immediately following it with the reference text. Like this:

    Sites that I frequently visit include [Hacker News][1], [Life Hacker][2], and [Engadget][3]
    
    ... Other text goes here ...
    
    * [1]: http://news.ycombinator.com
    * [2]: http://lifehacker.com
    * [3]: http://engadget.com
    
Note that the reference can be numbers or text, though the text is case insensitive.

### images

Image tags work like hyperlinks, only the square brackets are preceded by an exclamation point, and the brackets would contain the alt text associated with the image tag. references work here as well. Would look like this:

    ![Nice](/path_to/nice_image.png)
    
### code

I see myself using this one often. I already have several times in this post! :)
Any lines indented by a hard tab or four spaces will be wrapped in a &lt;code> block which will basically escape it from being processed by the markdown parser (and also give it nice formatting on the page). Would really be handy for code blocks.
On a related note, I should figure out how to add code blocks that provide syntax highlighting features for commonly used programming languages.

    ### Testing code block
    So, this is an example of what can be done using code blocks
    * All
    + of
    - this
    1. Will be escaped.
    
Thus, the first blog post is completed.