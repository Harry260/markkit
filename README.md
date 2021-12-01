# markkit ![beta](https://img.shields.io/badge/-beta-blue)
By installing marrkit to your html file, This allows you to render markdown with just a `<mark-down>` tag. You can also fetch file form remote file with `src` attribute. This also fixes all the relative urls from remote file!

##  🪛 Installation
Installing marrkit to your project is just easy! Just add these line at the end of the `<body>` tag!

```js
<script src="https://cdn.jsdelivr.net/gh/Harry260/marrkit/marrkit.js"></script>

// Minified Version
<script src="https://cdn.jsdelivr.net/gh/Harry260/marrkit/marrkit.min.js"></script>
```

## ⚙️ Usage
Using this is simple than anything. Just follow these steps

- `<mark-down></mark-down>` 
- Create attribut `src` and pass the value as any remote markdown file 
- You can also use this by passing text inside this tag. eg `<mark-down># Heading</mark-down>`

## 📕 Examples
#### Example 1
```
<mark-down src="https://raw.githubusercontent.com/Harry260/bobthebot/main/README.md"></mark-down>
```

#### Example 2
```
# Lorem Ipsum
Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

[By Harry](https://harrytom.ml/)
```

## 💪 Made with

- [marked.js](https://github.com/markedjs/marked) for rendering markdown
- [sindresorhus/github-markdown-css](https://github.com/sindresorhus/github-markdown-css) default styles for rendered markdown

##  🙏 Support

 ⭐ Start this repo if you like this! <br><br>
 [![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J16V6AZ)
