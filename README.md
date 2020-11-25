# clipboard.io-daemon
The clipboard.io Daemon ist the local part of clipboard.io. It runs on the local machines, reads/writes the clipboard an cares for encryption.
## Read/Write clipboard
To read/write clipboar content the Daemon acts as a wrapper for environment specific clipboard access.
### Windows
To access clipboard in Windows the command "clip" is used to write to clipboard and the PowerShell command "Get-Clipboard" is used to retrieve clipboard content.
### Mac
On Mac the commands "pbcopy" and "pbpaste" are used.
## Encryption
The Daemon holds a private key to encrypt content and also a keyring with keys of accepted partners.
