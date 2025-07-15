const NodeHelper = require("node_helper");
const RPC = require("json-rpc-2.0");
const Log = require("logger");

const ClientDictionary = new Map();

module.exports = NodeHelper.create({
	socketNotificationReceived: async function(notification, payload) {
		switch (notification) {
			case "I2P_CreateClient&Authenticate":
				const url = payload.URL;
				const Client = this.createRPCClient(url);

				let version = payload.Version;
				let password = payload.Password;
				Log.info("Autheticating...");
				Log.debug("Version: "+version+" "+"Password: "+password);
				Log.debug("Client:");
				Log.debug(Client);
				const Token = await this.authenticate(Client, version, password);
				Log.info("Authenticated! Token: " + Token);

				ClientDictionary.set(Token, Client);

				this.sendSocketNotification("I2P_ClientCreated", { token: Token })
				break;
			case "I2P_FetchRouterInfo":
				//Log.debug("Dictionary:");
				//Log.debug(ClientDictionary);
				const TokenToFetch = payload.token;
				const ClientToFetch = ClientDictionary.get(TokenToFetch);

				Log.debug("Trying to access: "+payload.token);
				Log.debug("Found: "+ClientToFetch);

				// Fix initialization
				if (ClientToFetch == undefined) break;

				let RouterInfo = await this.FetchRouterInfo(ClientToFetch, TokenToFetch);

				this.sendSocketNotification("I2P_RouterInfoFetched", { token: TokenToFetch, routerInfo: RouterInfo })
				break;
			default:
				break;
		}
	},

	//---// Functions //---//
	createRPCClient: function(URL) {
		const Client = new RPC.JSONRPCClient((request) =>
			fetch(URL, {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify(request),
		}).then((response) => {
				if (response.status === 200) {
					return response
						.json()
						.then((RPCResponse) => Client.receive(RPCResponse));
				} else if (request.id !== undefined) {
					return Promise.reject(new Error(response.statusText));
				}
			})
		)

		return Client;
	},

	authenticate: async function(Client, version, password) {
		const request = { API: version, Password: password };
		//Log.debug(request);
		const response = await Client.request("Authenticate", request);
		return response.Token;
	},

	RouterInfo: async function (Client, Token) {
		const InfoRequest = {
			'i2p.router.status': null,
			'i2p.router.uptime': null,
			'i2p.router.version': null,
			'i2p.router.net.bw.inbound.1s': null,
			'i2p.router.net.bw.inbound.15s': null,
			'i2p.router.net.bw.outbound.1s': null,
			'i2p.router.net.bw.outbound.15s': null,
			'i2p.router.net.status': null,
			'i2p.router.net.tunnels.participating': null,
			'i2p.router.netdb.activepeers': null,
			'i2p.router.netdb.fastpeers': null,
			'i2p.router.netdb.highcapacitypeers': null,
			'i2p.router.netdb.isreseeding': null,
			'i2p.router.netdb.knownpeers': null,
			'Token': Token
		}

		const InfoJSON = await Client.request("RouterInfo", InfoRequest);
		return InfoJSON;
	},

	FetchRouterInfo: async function (Client, Token) {
		//Log.debug("Passed Client:");
		//Log.debug(Client);
		const NewStats = await this.RouterInfo(Client, Token);

		const RouterInfo = {
			netStatus: NewStats['i2p.router.net.status'],
			status: NewStats['i2p.router.status'],
			uptime: NewStats['i2p.router.uptime'],
			version: NewStats['i2p.router.version'],
			inbound1s: NewStats['i2p.router.net.bw.inbound.1s'],
			inbound15s: NewStats['i2p.router.net.bw.inbound.15s'],
			outbound1s: NewStats['i2p.router.net.bw.outbound.1s'],
			outbound15s: NewStats['i2p.router.net.bw.outbound.15s'],
			participating: NewStats['i2p.router.net.tunnels.participating'],
			activePeers: NewStats['i2p.router.netdb.activepeers'],
			fastPeers: NewStats['i2p.router.netdb.fastpeers'],
			highCapacityPeers: NewStats['i2p.router.netdb.highcapacitypeers'],
			knownPeers: NewStats['i2p.router.netdb.knownpeers'],
			isReseeding: NewStats['i2p.router.netdb.isreseeding']
		};

		Log.debug("RouterInfo:");
		Log.debug(RouterInfo);

		return RouterInfo;
	},
});
