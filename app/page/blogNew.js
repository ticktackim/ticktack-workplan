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
  'channel.async.suggest': 'first',
  'history.sync.push': 'first',
  'message.html.compose': 'first',
  'translations.sync.strings': 'first',
  'sbot.async.addBlob': 'first'
})

exports.create = (api) => {
  var contentHtmlObs

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

    const mediumComposer = h('div.editor', {
      'ev-input': e => {
      }
    })
    const composer = api.message.html.compose(
      {
        meta,
        placeholder: strings.blogNew.actions.writeBlog,
        shrink: false,
        prepublish: function (content, cb) {
          var m = /\!\[[^]+\]\(([^\)]+)\)/.exec(marksum.image(content.text))
          content.thumbnail = m && m[1]
          // content.summary = marksum.summary(content.text) // Need a summary whihch doesn't trim the start

          var stream = pull.values([content.text])
          delete content.text
          api.sbot.async.addBlob(stream, function (err, hash) {
            if (err) return cb(err)
            if (!hash) throw new Error('missing hash')
            content.blog = hash
            cb(null, content)
          })
        }
      },
      (err, msg) => api.history.sync.push(err || { page: 'blogIndex' })
    )

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
          h('Button', {
            'ev-click': () => {
              var img = h('img', { src: 'http://localhost:8989/blobs/get/%264TKyoyZmjjtpPvwiSR%2BGQIgrJs8o6XmzfUDZ5p1PP30%3D.sha256' })
              // var e = MediumEditor.getEditorFromElement(mediumComposer)
              // e.serialize()['element-0'].value
              mediumComposer.appendChild(img)
            }
          }, 'Add Image'),
          composer
        ])
      ])
    ])

    function initialiseMedium () {
      new MediumEditor(mediumComposer, {
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
          markdown: new MediumToMD (
            {
              toMarkdownOptions: {
                converters: [{
                  filter: 'img',
                  replacement: (content, node) => {
                    var blob = decodeURIComponent(node.src.replace('http://localhost:8989/blobs/get/', ''))
                    return `![](${blob})`
                  }
                }]
              },
              events: ['input', 'change', 'DOMNodeInserted']
            },
            md => meta.text.set(md)
          )
        }
      })
    }
    initialiseMedium()

    addSuggest(channelInput, (inputText, cb) => {
      inputText = inputText.replace(/^#/, '')
      var suggestions = getChannelSuggestions(inputText)
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

    channelInput.addEventListener('suggestselect', (e) => {
      meta.channel.set(e.detail.value)
    })

    return page
  }
}
