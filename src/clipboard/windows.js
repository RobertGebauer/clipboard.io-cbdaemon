const childProcess = require('child_process')
const execa = require('execa');

const env = {
  ...process.env,
  LC_CTYPE: 'UTF-8'
};

module.exports = {
  copy: text => childProcess.spawn('clip').stdin.end(text),
  paste: () => {
    options = {
      "encoding": "UTF8"
    }
    
    const process = execa('powershell -command "$OutputEncoding = [console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding ; Get-Clipboard"', {...options, env } )
    
    return new Promise((resolve, reject) => {
      process.then(result => {
        if (result instanceof Error) {
          reject()
        } else {
          resolve(result.stdout)
        }
      })
    })
  }
};