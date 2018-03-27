const nest = require('depnest')
const { h, Struct, Value } = require('mutant')
const addSuggest = require('suggest-box')
const pull = require('pull-stream')
const marksum = require('markdown-summary')
const MediumEditor = require('medium-editor').MediumEditor
const MediumToMD = require('medium-editor-markdown')
// const CustomHtml = require('medium-editor-custom-async')

exports.gives = nest('app.page.blogNew')

exports.needs = nest({
  'app.html.sideNav': 'first',
  'blob.html.input': 'first',
  'channel.async.suggest': 'first',
  'history.sync.push': 'first',
  'message.html.compose': 'first',
  'translations.sync.strings': 'first',
  'sbot.async.addBlob': 'first'
})

exports.create = (api) => {
  return nest('app.page.blogNew', blogNew)

  function blogNew (location) {
    const strings = api.translations.sync.strings()
    const getChannelSuggestions = api.channel.async.suggest()

    const meta = Struct({
      type: 'blog',
      channel: Value(),
      title: Value(),
      summary: Value(),
      text: Value('')
    })

    const mediumComposer = h('div.editor.Markdown', {
      'ev-input': e => {
      }
    })
    var filesById = {}
    const composer = initialiseDummyComposer({ filesById, meta, api })
    // NOTE we are bootstrapping off the message.html.compose logic
    //  - the mediumComposer feeds content into the composer, which the provides publishing
    //  - this works, but should be refactorer after more thought about generalised composer
    //    componentes have been done

    const channelInput = h('input', {
      'ev-input': e => meta.channel.set(e.target.value),
      value: meta.channel,
      placeholder: strings.channel
    })

    var page = h('Page -blogNew', [
      api.app.html.sideNav(location),
      h('div.content', [
        h('div.container', [
          h('div.field -channel', [
            h('div.label', strings.channel),
            channelInput
          ]),
          h('div.field -title', [
            h('div.label', strings.blogNew.field.title),
            h('input', {
              'ev-input': e => meta.title.set(e.target.value),
              placeholder: strings.blogNew.field.title
            })
          ]),
          h('div.field -summary', [
            h('div.label', strings.blogNew.field.summary),
            h('input', {
              'ev-input': e => meta.summary.set(e.target.value),
              placeholder: strings.blogNew.field.summary
            })
          ]),
          mediumComposer,
          AddFileButton({ api, filesById, meta, textArea: mediumComposer }),
          composer
        ])
      ])
    ])

    initialiseMedium({ page, el: mediumComposer, meta })
    initialiseChannelSuggests({ input: channelInput, suggester: getChannelSuggestions, meta })

    return page
  }
}

function AddFileButton ({ api, filesById, meta, textArea }) {
  // var textRaw = meta.text

  const fileInput = api.blob.html.input(file => {
    filesById[file.link] = file

    const isImage = file.type.match(/^image/)
    const imgPrefix = isImage ? '!' : ''
    const spacer = isImage ? '\n' : ' '
    const insertLink = spacer + imgPrefix + '[' + file.name + ']' + '(' + file.link + ')' + spacer

    const pos = textArea.selectionStart
    // var newText = textRaw().slice(0, pos) + insertLink + textRaw().slice(pos)
    // textArea.value = newText
    // textRaw.set(newText)

    // TODO pivot on image to insert link, or image
    const img = h('p', [
      h('img', {
        src: `http://localhost:8989/blobs/get/${encodeURIComponent(file.link)}`,
        alt: file.name
      })
    ])
    // TODO - insert where the mouse is yo
    textArea.appendChild(img)

    console.log('added:', file)
  })

  return fileInput
}

function initialiseDummyComposer ({ meta, api, filesById }) {
  return api.message.html.compose(
    {
      meta,
      // placeholder: strings.blogNew.actions.writeBlog,
      shrink: false,
      filesById,
      prepublish: function (content, cb) {
        var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(marksum.image(content.text))
        content.thumbnail = m && m[1]
        // content.summary = marksum.summary(content.text) // TODO Need a summary which doesn't trim the start

        var stream = pull.values([content.text])
        api.sbot.async.addBlob(stream, function (err, hash) {
          if (err) return cb(err)
          if (!hash) throw new Error('missing hash')
          content.blog = hash
          delete content.text
          cb(null, content)
        })
      }
    },
    (err, msg) => api.history.sync.push(err || { page: 'blogIndex' })
  )
}

function initialiseChannelSuggests ({ input, suggester, meta }) {
  addSuggest(input, (inputText, cb) => {
    inputText = inputText.replace(/^#/, '')
    var suggestions = suggester(inputText)
      .map(s => {
        s.value = s.value.replace(/^#/, '') // strip the defualt # prefix here
        return s
      })
      .map(s => {
        if (s.subtitle === 'subscribed') { s.subtitle = h('i.fa.fa-heart') } // TODO - translation-friendly subscribed
        return s
      })

    // HACK add the input text if it's not an option already
    if (!suggestions.some(s => s.title === inputText)) {
      suggestions.push({
        title: inputText,
        subtitle: h('i.fa.fa-plus-circle'),
        value: inputText
      })
    }

    cb(null, suggestions)
  }, {cls: 'PatchSuggest.-channelHorizontal'}) // WARNING hacking suggest-box cls

  input.addEventListener('suggestselect', (e) => {
    meta.channel.set(e.detail.value)
  })
}

function initialiseMedium ({ page, el, meta }) {
  var editor = new MediumEditor(el, {
    elementsContainer: page,
    toolbar: {
      allowMultiParagraphSelection: true,
      buttons: ['bold', 'italic', 'underline', 'anchor', 'h2', 'h3', 'quote'],
      diffLeft: 0,
      diffTop: -10,
      firstButtonClass: 'medium-editor-button-first',
      lastButtonClass: 'medium-editor-button-last',
      relativeContainer: null,
      standardizeSelectionStart: false,
      static: false,
      /* options which only apply when static is true */
      align: 'center',
      sticky: false,
      updateOnEmptySelection: false
    },
    extensions: {
      markdown: new MediumToMD(
        {
          toMarkdownOptions: {
            converters: [{
              filter: 'img',
              replacement: (content, node) => {
                var blob = decodeURIComponent(node.src.replace('http://localhost:8989/blobs/get/', ''))
                return `![${node.alt}](${blob})`
              }
            }]
          },
          events: ['input', 'change', 'DOMNodeInserted']
        },
        md => meta.text.set(md)
      )
    }
  })

  return editor
}
