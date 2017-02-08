#!/usr/bin/env node --harmony

require('dotenv').config()
const contentful = require('contentful-management')

const ENV = process.env
const client = contentful.createClient({
    accessToken: ENV.CONTENTFUL_ACCESS_TOKEN
})

let space
const loadSpace = () => client.getSpace(ENV.CONTENTFUL_SPACE_ID)
    .then(v => space = v)

async function paginate(fn) {
    const limit = 1000
    const entries = []
    let isDone = false
    while (!isDone) {
        const page = await fn({skip: entries.length, limit})
        const items = page.items || []
        entries.push(...items)
        isDone = !!items.length
    }
    return entries
}

loadSpace()
    .then(() => Promise.all([
        paginate(space.getEntries),
        paginate(space.getAssets),
        space.getRoles(),
        space.getLocales(),
        space.getWebhooks(),
    ]))
    .then(([entries, assets, roles, locales, webhooks]) =>
        process.stdout.write(JSON.stringify({entries, assets, roles, locales, webhooks}))
    )
