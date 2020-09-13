const kbpgp = require("kbpgp")
const _ = require("lodash")
const uuid = require("uuid")

/**
 * Manager class to handle everything with encryption. Stores own and foreigns keys and provides capabilites
 * to encrypt for foreign keys and to decrypt for own key.
 */
class KeyManager {
    constructor() {
        this.keyManager = undefined
        this.foreignKeyManagers = []
    }

    /**
     * Initializes this by creating the instance for own key manager.
     * 
     * @param {String} givenKey (optional) given private key to initialize own key manager with; if not given 
     * a new key manager with new keys will be created.
     */
    init(givenKey) {
        return new Promise((resolve, reject) => {
            if (!!givenKey) {
                kbpgp.KeyManager.import_from_armored_pgp({
                    armored: givenKey
                }, (err, keyManager) => {
                    if (!!err) {
                        // loading did not work; try without given key
                        this.init()
                    } else {
                        // loaded -> init
                        this.keyManager = keyManager
                        this._exportAndResolveKeys(keyManager, resolve)
                    }
                });
            } else {
                // no given key -> generate new
                kbpgp.KeyManager.generate_rsa({ userid: uuid.v4() }, (err, keyManager) => {
                    keyManager.sign({}, (err) => {
                        this.keyManager = keyManager
                        this._exportAndResolveKeys(keyManager, resolve)
                    })
                })
            }
        })
    }

    _exportAndResolveKeys(keyManager, resolve) {
        keyManager.export_pgp_public({}, function (err, pgp_public) {
            keyManager.export_pgp_private({}, (err, pgp_private) => {
                resolve({
                    publicKey: pgp_public,
                    privateKey: pgp_private
                })
            })
        })
    }

    /**
     * Encrypts the given text for all known foreign keys.
     * 
     * @param {String} text The text to encrypt.
     */
    encrypt(text) {
        return new Promise((resolve, reject) => {
            if (this.foreignKeyManagers.length > 0) {
                kbpgp.box({
                    msg: text,
                    encrypt_for: this.foreignKeyManagers
                }, (err, encryptedText) => {
                    if (!!err) {
                        reject(err)
                    } else {
                        resolve(encryptedText)
                    }
                })
            }
        })
    }

    /**
     * Decrypts the given text for own key manager.
     * 
     * @param {String} encryptedText Text to decrypt.
     */
    decrypt(encryptedText) {
        return new Promise((resolve, reject) => {
            kbpgp.unbox({
                keyfetch: this.keyManager,
                armored: encryptedText
            }, (err, literals) => {
                if (!!err) {
                    reject(err)
                } else {
                    resolve(literals[0].toString())
                }
            })
        })
    }

    /**
     * Replaces the list of foreign keys with the given one (by creating key managers for each key)
     * @param {String[]} foreignPublicKeys Given foreign public keys.
     */
    replaceForeignKeyManagers(foreignPublicKeys) {
        // TODO race condition may appear on subsequent calls
        this.foreignKeyManagers = []

        _.each(foreignPublicKeys, (k) => {
            kbpgp.KeyManager.import_from_armored_pgp({
                armored: k
            }, (err, keyManager) => {
                if (!err) {
                    this.foreignKeyManagers.push(keyManager)
                }
            })
        })
    }
}

module.exports = KeyManager