module.exports = {
  title: 'Learn WebGL',
  description: 'Learn WebGL step by step.',
  host: 'localhost',
  port: 8000,
  markdown: {
    config: md => {
      md.use(require("markdown-it-katex"));
    }
  },
  themeConfig: {
    sidebar: [
      '/',
      {
        title: '入门',
        children: [
          ['/01-Get-Started/01-Hello-Triangle.html', '你好，三角形'],
          ['/01-Get-Started/02-Shaders.html', '着色器'],
          ['/01-Get-Started/03-Textures.html', '纹理']
        ]
      }
    ]
  }
}