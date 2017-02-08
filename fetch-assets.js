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

    const start = new Date()

    let fetched = 0
    for (const asset of assets) {
        const localizedFiles = asset.fields.file
        for (const locale in localizedFiles) {
            const file = localizedFiles[locale]
            try {
            const data = await fetch(`https:${file.url}`)
            writeFileSync(`${args.output}/${locale}_${asset.sys.id}`, data)
            } catch (e) {
                debug(`Error:`, e)
            }
            debug(`Fetched ${++fetched} / ${count}: ${file.fileName}`)
        }
    }

    const elapsed = (new Date()) - start
    const size = execSync('du -h').toString().split(/\s/)[0]

    debug(`Fetched ${size} in ${elapsed / (60 * 60)}m`)
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
            if (err || response.statusCode !== 200) {
                return rej(err, response)
            }

            return res(body)
        })
    })
}

function debug() {
    args.verbose && console.log(...arguments)
}

init()
    .then(input => run(input))
