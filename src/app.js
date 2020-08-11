const clipboardy = require('clipboardy');
const io = require('socket.io')
const ne = require("nanoevents")
const uuid = require("uuid")
const getPort = require('get-port')
const open = require('open')
const ung = require("unique-names-generator")
const args = require('minimist')(process.argv.slice(2), {
    default: {
        url: "https://clipscape.io",
        sessionId: uuid.v4()
    }
});

const emitter = ne.createNanoEvents()
const clipboardSessionId = args.sessionId
const randomRoomId = ung.uniqueNamesGenerator({
    dictionaries: [ung.colors, ung.animals],
    length: 2,
    separator: "",
    style: "capital"
})

getPort({port: 3000}).then(port => {
    io(port, {}).on('connection', client => {
        client.on('hello-clipboard', (uuid) => {
            if (uuid == clipboardSessionId) {
                const unbind = emitter.on("clipboard-changed", (text) => client.emit("clipboard-changed", text))
                client.on("disconnecting", () => unbind())
            }
        })

        client.on('change-clipboard', (data) => {
            if (!!data.text && data.sessionId == clipboardSessionId) {
                clipboard = data.text
                clipboardy.write(data.text)
            }
        })
    })

    open(args.url + "/room/" + randomRoomId + "?sid=" + clipboardSessionId + "&sport=" + port)
})

let clipboard = undefined

const clipboardPollFunction = () => {
    clipboardy.read().then((text) => {
        if (clipboard !== text) {
            clipboard = text
            emitter.emit("clipboard-changed", text)
        }
    }).catch((e) => {
        // no-op by intention
    }).finally(() => {
        setTimeout(clipboardPollFunction, 1000)
    })
}

clipboardPollFunction()