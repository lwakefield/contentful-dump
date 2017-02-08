#!/usr/bin/env node --harmony

const request = require('request')
const {execSync} = require('child_process')
const {writeFileSync} = require('fs')
const parser = new (require('argparse').ArgumentParser)

let args
function init () {
    parser.addArgument(
        ['-o', '--output'],
        {
            defaultValue: 'dump',
            help: 'Path to dump into'
        }
    )
    parser.addArgument(
        ['-v', '--verbose'],
        {action: 'storeTrue'}
    )
    args = parser.parseArgs()

    execSync(`mkdir -p ${args.output}`)

    return new Promise((res, rej) => {
        let input = ''
        process.stdin.on('readable', () => {
            var chunk = process.stdin.read();
            if (chunk !== null) input += chunk.toString()
        })

        process.stdin.on('end', () => res(input));
    })
}


async function run (input) {
    const assets = JSON.parse(input).assets
    const count = getAssetCount(assets)
    debug(`Fetching ${count} assets`)

    let fetched = 0
    for (const asset of assets) {
        const localizedFiles = asset.fields.file
        for (const locale in localizedFiles) {
            const file = localizedFiles[locale]
            const data = await fetch(`https:${file.url}`)
            writeFileSync(`${args.output}/${locale}_${asset.sys.id}`, data)
            debug(`Fetched ${fetched++} / ${count}`)
        }
    }
}

function getAssetCount(assets) {
    let count = 0
    for (const asset of assets) {
        count += Object.keys(asset.fields.file || {}).length
    }
    return count
}

function fetch (url) {
    return new Promise((res, rej) => {
        request(url, (err, response, body) => {
            if (err) return rej(err)
            res(body)
        })
    })
}

function debug(str) {
    args.verbose && console.log(str)
}

init()
    .then(input => run(input))
