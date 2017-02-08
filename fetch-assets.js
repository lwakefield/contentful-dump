#!/usr/bin/env node
const request = require('request')
const {execSync} = require('child_process')
const {writeFileSync} = require('fs')

execSync('mkdir -p dump')

let input = ''
function run () {
    const assets = JSON.parse(input).assets
    const pendingRequests = []
    for (const asset of assets) {
        const localizedFiles = asset.fields.file
        for (const locale in localizedFiles) {
            const file = localizedFiles[locale]
            pendingRequests.push(
                fetchAndDump(`https:${file.url}`, `dump/${locale}_${asset.sys.id}`)
            )
        }
    }
    Promise.all(pendingRequests)
}

function fetchAndDump(url, path) {
    return new Promise((res, rej) => {
        request(url, (err, response, body) => {
            writeFileSync(path, body)
            res()
        })
    })
}

process.stdin.on('readable', () => {
    var chunk = process.stdin.read();
    if (chunk !== null) input += chunk.toString()
})

process.stdin.on('end', run);
