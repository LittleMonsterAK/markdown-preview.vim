import React from 'react'
import Head from 'next/head'
import io from 'socket.io-client'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const MARKDOWN_STYLE = './pages/markdown.css'
const HLJS_STYLE = '../node_modules/highlight.js/styles/github.css'

// eslint-disable-next-line
const HLJSStyle = preval`
      const fs = require('fs')
      module.exports = fs.readFileSync("${HLJS_STYLE}").toString()
    `
// eslint-disable-next-line
const MARKDOWNStyle = preval`
      const fs = require('fs')
      module.exports = fs.readFileSync("${MARKDOWN_STYLE}").toString()
    `
const style = `
${MARKDOWNStyle}
${HLJSStyle}
`
export default class PreviewPage extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      content: ''
    }

    this.md = new MarkdownIt({
      // Enable HTML tags in source
      html: true,
      // Use '/' to close single tags (<br />).
      // This is only for full CommonMark compatibility.
      xhtmlOut: true,
      // Convert '\n' in paragraphs into <br>
      breaks: false,
      // CSS language prefix for fenced blocks. Can be
      // useful for external highlighters.
      langPrefix: 'language-',
      // Autoconvert URL-like text to links
      linkify: true,
      // Enable some language-neutral replacement + quotes beautification
      typographer: true,
      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: '“”‘’',
      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externally.
      // If result starts with <pre... internal wrapper is skipped.
      highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(lang, str).value
          } catch (__) {}
        }

        return '' // use external default escaping
      }
    })
  }

  componentDidMount () {
    const socket = io({
      query: {
        bufnr: window.location.pathname.split('/')[2]
      }
    })

    window.socket = socket

    socket.on('refresh_content', ({ cursor, content }) => {
      console.log('refresh: ', cursor, content)
      this.setState({
        cursor,
        content: this.md.render(content.join('\n'))
      })
    })

    socket.on('connect', () => {
      console.log('connect success')
    })

    socket.on('disconnect', () => {
      console.log('disconnect')
    })

    socket.on('close', () => {
      window.close()
    })
  }

  render () {
    const { content } = this.state
    return (
      <React.Fragment>
        <Head>
          <title>preview page</title>
          <style
            dangerouslySetInnerHTML={{
              __html: style
            }}
          />
        </Head>
        <section
          className="markdown-body"
          dangerouslySetInnerHTML={{
            __html: content
          }}
        />
      </React.Fragment>
    )
  }
}
