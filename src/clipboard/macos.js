const execa = require('execa')

const env = {
    ...process.env,
    LC_CTYPE: 'UTF-8'
};

module.exports = {
    copy: text => { 
        const stdin = execa('pbcopy', { env }).stdin
        stdin.write(text)
        stdin.end()
    
    },
    paste: options => {
        const process = execa('pbpaste', { ...options, env })
        
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