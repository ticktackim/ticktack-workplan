const nest = require('depnest')
const { h, when, send, resolve, Value, computed } = require('mutant')
const assign = require('lodash/assign')
const ssbMentions = require('ssb-mentions')
const addSuggest = require('suggest-box')

exports.gives = nest('message.html.compose')

exports.needs = nest({
  'about.async.suggest': 'first',
  'blob.html.input': 'first',
  'channel.async.suggest': 'first',
  'emoji.async.suggest': 'first',
  'emoji.sync.names': 'first',
  'emoji.sync.url': 'first',
  'message.async.publish': 'first',
  'message.html.markdown': 'first',
  // 'message.html.confirm': 'first'
  'translations.sync.strings': 'first'
})

exports.create = function (api) {
  return nest('message.html.compose', compose)

  function compose (options, cb) {
    var {
      meta, // required
      placeholder,
      shrink = true,
      canAttach = true, canPreview = true,
      prepublish
    } = options

    const strings = api.translations.sync.strings()
    const getProfileSuggestions = api.about.async.suggest()
    const getChannelSuggestions = api.channel.async.suggest()
    const getEmojiSuggestions = api.emoji.async.suggest()

    placeholder = placeholder || strings.writeMessage

    var files = []
    var filesById = {}
    var textAreaFocused = Value(false)
    var focused = textAreaFocused
    var hasContent = Value(false)

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
      fileInput = h('input', { style: {visibility: 'hidden'} })

    var showPreview = Value(false)
    var previewBtn = h('Button',
      {
        className: when(showPreview, '-strong', '-subtle'),
        'ev-click': () => showPreview.set(!showPreview())
      }, 
      when(showPreview, strings.blogNew.actions.edit, strings.blogNew.actions.preview)
    )
    var preview = computed(textRaw, text => api.message.html.markdown(text))

    var publishBtn = h('Button -primary', { 'ev-click': publish }, strings.sendMessage)

    var actions = h('section.actions', [
      canAttach ? fileInput : '',
      canPreview ? previewBtn : '',
      publishBtn
    ])

    var composer = h('Compose', {
      classList: when(expanded, '-expanded', '-contracted')
    }, [
      when(showPreview, preview, textArea),
      actions
    ])

    addSuggest(textArea, (inputText, cb) => {
      const char = inputText[0]
      const wordFragment = inputText.slice(1)

      if (char === '@') cb(null, getProfileSuggestions(wordFragment))
      if (char === '#') cb(null, getChannelSuggestions(wordFragment))
      if (char === ':') cb(null, getEmojiSuggestions(wordFragment))
    }, {cls: 'PatchSuggest'})

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
      for(var k in content)
          content[k] = resolve(content[k])

      if (!content.channel) delete content.channel
      if (!mentions.length) delete content.mentions
      if (content.recps && content.recps.length === 0) delete content.recps

      if (typeof prepublish === 'function') {
        prepublish(content, function (err, content) {
          if(err) handleErr(err)
          else api.message.async.publish(content, done)
        })
      }
      else
        api.message.async.publish(content, done)

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
        publishBtn.disabled = false
        if (cb) cb(err)
        else throw err
      }
    }
  }
}


