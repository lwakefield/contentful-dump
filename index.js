#!/usr/bin/env node

require('dotenv').config()
const contentful = require('contentful-management')

const ENV = process.env
const client = contentful.createClient({
    accessToken: ENV.CONTENTFUL_ACCESS_TOKEN
})

let space
const loadSpace = () => client.getSpace(ENV.CONTENTFUL_SPACE_ID)
    .then(v => space = v)

function paginate(fn) {
    const limit = 1000
    const entries = []
    const nextPage = () => {
        return fn({skip: entries.length, limit})
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

let entries
const loadEntries = () => paginate(space.getEntries)
    .then(v => entries = v)

let assets
const loadAssets = () => paginate(space.getAssets)
    .then(v => assets = v)

loadSpace()
    .then(() => Promise.all([loadEntries(), loadAssets()]))
    .then(() => process.stdout.write(JSON.stringify({entries, assets})))
