const nest = require('depnest')
const { h, when, send, resolve, Value, computed } = require('mutant')
const assign = require('lodash/assign')
const ssbMentions = require('ssb-mentions')
const addSuggest = require('suggest-box')

exports.gives = nest('message.html.compose')

exports.needs = nest({
  'about.async.suggest': 'first',
  'blob.html.input': 'first',
  // 'channel.async.suggest': 'first',
  'emoji.sync.names': 'first',
  'emoji.sync.url': 'first',
  'message.async.publish': 'first',
  'message.html.markdown': 'first',
  // 'message.html.confirm': 'first'
  'translations.sync.strings': 'first'
})

exports.create = function (api) {
  return nest('message.html.compose', compose)

  function compose ({ shrink = true, meta, prepublish, placeholder }, cb) {
    const strings = api.translations.sync.strings()
    placeholder = placeholder || strings.writeMessage

    var files = []
    var filesById = {}
    var channelInputFocused = Value(false)
    var textAreaFocused = Value(false)
    var focused = computed([channelInputFocused, textAreaFocused], (a, b) => a || b)
    var hasContent = Value(false)
    var getProfileSuggestions = api.about.async.suggest()
    // var getChannelSuggestions = api.channel.async.suggest()

    var blurTimeout = null

    var expanded = computed([shrink, focused, hasContent], (shrink, focused, hasContent) => {
      if (!shrink || hasContent) return true

      return focused
    })

    var textRaw = Value('')
    var textArea = h('textarea', {
      'ev-input': () => textRaw.set(textArea.value),
      'ev-blur': () => {
        clearTimeout(blurTimeout)
        blurTimeout = setTimeout(() => textAreaFocused.set(false), 200)
      },
      'ev-focus': send(textAreaFocused.set, true),
      placeholder
    })
    textRaw(text => hasContent.set(!!text))

    textArea.publish = publish // TODO: fix - clunky api for the keyboard shortcut to target

    var fileInput
    if(!meta.recps) {
      fileInput = api.blob.html.input(file => {
        files.push(file)
        filesById[file.link] = file

        var embed = file.type.match(/^image/) ? '!' : ''
        var spacer = embed ? '\n' : ' '
        var insertLink = spacer + embed + '[' + file.name + ']' + '(' + file.link + ')' + spacer

        var pos = textArea.selectionStart
        var newText = textRaw().slice(0, pos) + insertLink + textRaw().slice(pos)
        textArea.value = newText
        textRaw.set(newText)

        console.log('added:', file)
      })

      fileInput.onclick = () => hasContent.set(true)
    }
    // if fileInput is null, send button moves to the left side
    // and we don't want that.
    else
      fileInput = h('span')

    var showPreview = Value(false)
    var previewBtn = h('Button',
      {
        className: when(showPreview, '-primary'),
        'ev-click': () => showPreview.set(!showPreview())
      }, 
      when(showPreview, strings.blogNew.actions.edit, strings.blogNew.actions.preview)
    )
    var preview = computed(textRaw, text => api.message.html.markdown(text))

    var publishBtn = h('Button -primary', { 'ev-click': publish }, strings.sendMessage)

    var actions = h('section.actions', [
      fileInput,
      previewBtn,
      publishBtn
    ])

    var composer = h('Compose', {
      classList: when(expanded, '-expanded', '-contracted')
    }, [
      when(showPreview, preview, textArea),
      actions
    ])

    // TODO replace with patch-suggest
    addSuggest(textArea, (inputText, cb) => {
      if (inputText[0] === '@') {
        cb(null, getProfileSuggestions(inputText.slice(1)))
      // } else if (inputText[0] === '#') {
      //   cb(null, getChannelSuggestions(inputText.slice(1)))
      } else if (inputText[0] === ':') {
        // suggest emojis
        var word = inputText.slice(1)
        if (word[word.length - 1] === ':') {
          word = word.slice(0, -1)
        }
        // TODO: when no emoji typed, list some default ones
        cb(null, api.emoji.sync.names().filter(function (name) {
          return name.slice(0, word.length) === word
        }).slice(0, 100).map(function (emoji) {
          return {
            image: api.emoji.sync.url(emoji),
            title: emoji,
            subtitle: emoji,
            value: ':' + emoji + ':'
          }
        }))
      }
    }, {cls: 'SuggestBox'})

    return composer

    // scoped

    function publish () {
      publishBtn.disabled = true
      const text = resolve(textRaw)

      const mentions = ssbMentions(text).map(mention => {
        // merge markdown-detected mention with file info
        var file = filesById[mention.link]
        if (file) {
          if (file.type) mention.type = file.type
          if (file.size) mention.size = file.size
        }
        return mention
      })

      var content = assign({}, resolve(meta), {
        text,
        mentions
      })

      if (!content.channel) delete content.channel
      if (!mentions.length) delete content.mentions
      if (content.recps && content.recps.length === 0) delete content.recps

      try {
        if (typeof prepublish === 'function') {
          content = prepublish(content)
        }
      } catch (err) {
        publishBtn.disabled = false
        handleErr(err)
      }

      return api.message.async.publish(content, done)
      // return api.message.html.confirm(content, done)

      function done (err, msg) {
        publishBtn.disabled = false
        if (err) handleErr(err)
        else if (msg) { 
          textRaw.set('')
          textArea.value = ''
        }
        if (cb) cb(err, msg)
      }

      function handleErr (err) {
        if (cb) cb(err)
        else throw err
      }
    }
  }
}

