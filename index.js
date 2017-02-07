require('dotenv').config()
const contentful = require('contentful-management')

const ENV = process.env
const client = contentful.createClient({
    accessToken: ENV.CONTENTFUL_ACCESS_TOKEN
})

function loadEntries(space) {
    const limit = 1000
    const entries = []
    const nextPage = () => {
        return space.getEntries({skip: entries.length, limit})
        .then(page => {
            const items = page.items || []
            entries.push(...items)
            return items.length ?
                nextPage() :
                entries
        })
    }

    return nextPage()
}

client.getSpace(ENV.CONTENTFUL_SPACE_ID)
    .then(space => loadEntries(space))
    .then(entries => console.log(`loaded ${entries.length} entries`))

