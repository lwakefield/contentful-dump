#!/usr/bin/env node --harmony

require('dotenv').config()
const contentful = require('contentful-management')

const ENV = process.env
const client = contentful.createClient({
    accessToken: ENV.CONTENTFUL_ACCESS_TOKEN
})

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

async function run () {
    const space = await client.getSpace(ENV.CONTENTFUL_SPACE_ID)
    const [
        entries,
        assets,
        roles,
        locales,
        webhooks
    ] = await Promise.all([
        paginate(space.getEntries),
        paginate(space.getAssets),
        space.getRoles(),
        space.getLocales(),
        space.getWebhooks(),
    ])

    process.stdout.write(JSON.stringify({entries, assets, roles, locales, webhooks}))
}

run()
