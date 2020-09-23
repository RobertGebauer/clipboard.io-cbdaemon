const childProcess = require('child_process')
const {chunksToLinesAsync, chomp} = require('@rauschma/stringio');
var os = require("os")

async function echoReadable(readable) {
    let result = ""
    for await (const line of chunksToLinesAsync(readable)) {
        if (result.length > 0) {
            result += os.EOL
        }
      result += chomp(line)
    }
    return result
  }

module.exports = {
    copy: text => childProcess.spawn('clip').stdin.end(text),
    paste: () => {
        return echoReadable(childProcess.spawn('powershell', ['-command "Get-Clipboard"'], {windowsVerbatimArguments: true, stdio: ['ignore', 'pipe', process.stderr]}).stdout)
    }
};