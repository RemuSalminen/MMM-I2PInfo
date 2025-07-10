import { JSONRPCClient } from "json-rpc-2.0";

Module.register("MMM-I2PInfo", {
	// Setup Config
	defaults: {
		ip: "http://127.0.0.1",
		port: "7657",
		site: "/jsonrpc/",
		version: "1",
		password: "itoopie",
		interval: 1000,
	},

	/*// Get the I2P JSON RPC Caller
	getScripts: function() {
		return ['I2PControl.js']
	},*/

	//---// Functions //---//
	createRPCClient: function(URL) {
		const Client = new JSONRPCClient((request) =>
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

	Authenticate: async function() {
		const response = await this.Client.request("Authenticate", { API: version, Password: password });
		return response.Token;
	},

	RouterInfo: async function () {
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

	UpdateRouterInfo: async function() {
		const NewStats = await this.RouterInfo();

		this.Router = {
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

	},

	//---// MagicMirror Functions //---//
	loaded: async function(callback) {
		Log.log("Loading " + this.name);
		const URL = this.ip + ":" + this.port + this.site;
		Log.log("Url is " + URL);

		Log.log("Creating RPC Client...");
		this.Client = await this.createRPCClient(URL);
		Log.log("Authorizing...");
		this.Token = await this.Authenticate(Client);

		Log.log("Finished loading " + this.name);
		callback();
	},

	start: function() {
		setInterval(() => {
			this.UpdateRouterInfo();
			this.updateDom({
				options: {
					speed: this.interval / 4
				}
			})
		}, this.interval);
	},

	getDom: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "I2P";

		wrapper.appendChild(this.getDomHeader());

		return wrapper;
	},

	// DOM constructs
	getDomHeader: function() {
		const wrapper = document.createElement("div");
		wrapper.className = "Header";
		wrapper.innerHTML = "I2P" + " " + this.Version;

		return wrapper;
	}
});
