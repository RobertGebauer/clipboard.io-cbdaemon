const execa = require('execa');
const iconv = require("iconv-lite")

const env = {
  ...process.env,
  LC_CTYPE: 'UTF-8'
};

module.exports = {
  copy: (text) => {
    options = {
      "input": Buffer.from(text, "UTF16")
    }

    execa("clip", {...options, env })
  },
  paste: () => {
    options = { }
    
    const process = execa('powershell -command "[console]::InputEncoding = [console]::OutputEncoding = New-Object System.Text.UTF16Encoding  ; Get-Clipboard "', {...options, env } )
    
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