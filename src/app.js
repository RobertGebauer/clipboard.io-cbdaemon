const clipboardy = require('clipboardy');
const io = require('socket.io')
const ne = require("nanoevents")
const uuid = require("uuid")
const getPort = require('get-port')
const open = require('open')
const args = require('minimist')(process.argv.slice(2), {
    default: {
        url: "https://clipscape.io"
    }
});

const emitter = ne.createNanoEvents()
const clipboardSessionId = uuid.v4()
const randomRoomId = uuid.v4()

getPort().then(port => {
    io(port, {}).on('connection', client => {
        client.on('helloClipboard', (uuid) => {
            if (uuid === clipboardSessionId) {
                const unbind = emitter.on("clipboard-changed", (text) => client.emit("clipboard-changed", text))
                client.on("disconnecting", () => unbind())
            }
        })

    })

    open(args.url + "/room/" + randomRoomId + "?sid=" + clipboardSessionId + "&sport=" + port)
})

let clipboard = undefined
setInterval(
    () => {
        clipboardy.read().then((text) => {
            if (clipboard !== text) {
                clipboard = text
                emitter.emit("clipboard-changed", text)
            }
        }).catch((e) => {
            // no-op by intention; only text supported
        })

    }, 500
)