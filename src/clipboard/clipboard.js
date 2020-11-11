const windows = require('./windows.js')
const isWSL = require('is-wsl');

const platformLib = (() => {
    switch (process.platform) {
        case 'darwin':
            return undefined // TODO
        case 'win32':
            return windows
        case 'android':
            return undefined  // TODO
        default:
            // `process.platform === 'linux'` for WSL.
            if (isWSL) {
                return windows
            }

            return undefined
    }
})();

exports.write = text => {
	if (typeof text !== 'string') {
		throw new TypeError(`Expected a string, got ${typeof text}`);
	}

	platformLib.copy(text);
};

exports.read = () => platformLib.paste()