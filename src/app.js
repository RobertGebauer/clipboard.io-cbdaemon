const clipboardy = require('clipboardy');
const io = require('socket.io')
const ne = require("nanoevents")
const uuid = require("uuid")
const getPort = require('get-port')
const open = require('open')
const ung = require("unique-names-generator");
const KeyManager = require('./KeyManager');
const _ = require("lodash")
const args = require('minimist')(process.argv.slice(2), {
    default: {
        url: "https://clipscape.io",
        sessionId: uuid.v4(),
        debug: false
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

let clientCount = 0

getPort({ port: 3000 }).then(port => {
    io(port, {}).on('connection', client => {
        // client is an application that connects to this to be informed about clipboard changes or
        // to trigger a clipboard change; typically, this is the clipscape.io web application

        client.on('hello-clipboard', (data) => {
            if (data.sid == clipboardSessionId) {
                // someone sent "hello" with known UUID
                clientCount++

                // init key manager
                const keyManager = new KeyManager()
                keyManager.init(data.pkey).then((keys) => {

                    // register client for clipboard changes
                    const unbind = emitter.on("clipboard-changed", (text) => {
                        keyManager.encrypt(text).then((encryptedText) => {
                            client.emit("clipboard-changed", encryptedText)
                        })
                    })

                    // and unbind if client disconnects
                    client.on("disconnecting", () => { 
                        unbind() 
                        clientCount--

                        if (clientCount === 0) {
                            process.exit(0)
                        }
                    })

                    // signal client ready-status with keys
                    // TODO may be bad idea to send private key back to client...
                    client.emit("hello-client", keys)

                    // allow clipboard changes triggered from client
                    client.on('change-clipboard', (data) => {
                        if (!!data.content && data.sessionId == clipboardSessionId) {
                            keyManager.decrypt(data.content).then((text) => {
                                clipboard = text
                                clipboardy.write(text)
                            })
                        }
                    })

                    // accept partner changes from client
                    client.on("foreign-keys", (partnerPublicKeys) => {
                        keyManager.replaceForeignKeyManagers(partnerPublicKeys)
                    })
                })
            }
        })
    })

    let url = args.url + "/room/" + randomRoomId + "?sid=" + clipboardSessionId + "&sport=" + port
    if (!!args.debug) {
        url += "&debug=1"
    }
    open(url)
})

// local var to save current clipboard to be able to detect changes
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