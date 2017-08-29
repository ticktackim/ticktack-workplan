const nest = require('depnest')
const { h } = require('mutant')

exports.needs = nest({
  'about.html.image': 'first',
  'app.html.link': 'first'
})

exports.gives = nest('about.html.avatar')

exports.create = function (api) {
  return nest('about.html.avatar', feed => {
    const Link = api.app.html.link

    return Link(
      { page: 'userShow', feed },
      api.about.html.image(feed)
    )
    
  })
}

