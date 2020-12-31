const childProcess = require('child_process')
const execa = require('execa');
const iconv = require("iconv-lite")

const env = {
  ...process.env,
  LC_CTYPE: 'UTF-8'
};

module.exports = {
  copy: (text) => {
    options = {
      "encoding": "UTF8",
      "input": Buffer.from(text, "UTF-8")
    }
    
    execa('powershell -command "$INPUT | Set-Clipboard "', {...options, env } )
  },
  paste: () => {
    options = {
      "encoding": "UTF8"
    }
    
    const process = execa('powershell -command "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF8Encoding ; Get-Clipboard "', {...options, env } )
    
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