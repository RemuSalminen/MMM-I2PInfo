# MMM-I2PInfo
MagicMirror<sup>2</sup> module that displays Statistics from a running I2P
Instance.

## Screenshot

## Installation
### Install
Clone the repository into your modules directory. You also need to Install all
the Dependencies.

```bash
cd <MAGICMIRROR>/modules
git clone https://github.com/RemuSalminen/MMM-I2PInfo
npm install
```

### Update
Go to the Module's directory and pull the latest version. Then update all npm
Dependencies.

```bash
cd <MAGICMIRROR>/modules/MMM-I2PInfo
git pull
npm install
```

## Configuration/Usage
The module has the following default Configuration:

```js
	{
		module: "MMM-I2PInfo",
		position: "bottom_left",
		config: {
			ip: "http://127.0.0.1",
			port: "7657",
			site: "/jsonrpc/",
			version: 1,
			password: "itoopie",
			interval: 1000
		}
	},
```
Option | Description
:--------:|:----------:
`ip` | ip of the I2P Instance
`port` | Port to access the JSONRPC server from
`site` | Page of the JSONRPC server
`version` | API Version
`password` | API Password
`interval` | How often to update the Statistics

## Dependencies
- JSONRPC requests are made with [json-rpc-2.0](https://www.npmjs.com/package/json-rpc-2.0)
