// /** 
// * @description Mesh Agent Transport Module - using websocket relay
// * @author Ylian Saint-Hilaire
// * @version v0.0.1f
// */

// // Construct a MeshServer agent direction object
// var CreateAgentRedirect = function (meshserver, module, serverPublicNamePort, authCookie, rauthCookie, domainUrl) {
//     var obj = {};
//     obj.m = module; // This is the inner module (Terminal or Desktop)
//     module.parent = obj;
//     obj.meshserver = meshserver;
//     obj.authCookie = authCookie;
//     obj.rauthCookie = rauthCookie;
//     obj.State = 0; // 0 = Disconnected, 1 = Connected, 2 = Connected to server, 3 = End-to-end connection.
//     obj.nodeid = null;
//     obj.options = null;
//     obj.socket = null;
//     obj.connectstate = -1;
//     obj.tunnelid = Math.random().toString(36).substring(2); // Generate a random client tunnel id
//     obj.protocol = module.protocol; // 1 = SOL, 2 = KVM, 3 = IDER, 4 = Files, 5 = FileTransfer
//     obj.onStateChanged = null;
//     obj.ctrlMsgAllowed = true;
//     obj.attemptWebRTC = false;
//     obj.webRtcActive = false;
//     obj.webrtcconfig = null;
//     obj.webSwitchOk = false;
//     obj.webchannel = null;
//     obj.webrtc = null;
//     obj.debugmode = 0;
//     obj.serverIsRecording = false;
//     obj.urlname = 'meshrelay.ashx';
//     obj.latency = { lastSend: null, current: -1, callback: null };
//     if (domainUrl == null) { domainUrl = '/'; }

//     // Console Message
//     obj.consoleMessage = null;
//     obj.onConsoleMessageChange = null;

//     // Session Metadata
//     obj.metadata = null;
//     obj.onMetadataChange = null;

//     // Private method
//     //obj.debug = function (msg) { console.log(msg); }

//     // Display websocket or webrtc data to the console
//     function logData(e, name) {
//         if (typeof e.data == 'object') {
//             var view = new Uint8Array(e.data), cmd = (view[0] << 8) + view[1], cmdsize = (view[2] << 8) + view[3];
//             console.log(name + ' binary data', cmd, cmdsize, e.data.byteLength, buf2hex(e.data).substring(0, 24));
//         } else if (typeof e.data == 'string') {
//             console.log(name + ' string data', e.data.length, e.data);
//         } else {
//             console.log(name + ' unknown data', e.data);
//         }
//     }

//     obj.Start = function (nodeid) {
//         var url2, url = window.location.protocol.replace('http', 'ws') + '//' + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/' + obj.urlname + '?browser=1&p=' + obj.protocol + (nodeid ? ('&nodeid=' + nodeid) : '') + '&id=' + obj.tunnelid;
//         //if (serverPublicNamePort) { url2 = window.location.protocol.replace('http', 'ws') + '//' + serverPublicNamePort + '/meshrelay.ashx?id=' + obj.tunnelid; } else { url2 = url; }
//         if ((authCookie != null) && (authCookie != '')) { url += '&auth=' + authCookie; }
//         if ((urlargs != null) && (urlargs.slowrelay != null)) { url += '&slowrelay=' + urlargs.slowrelay; }
//         obj.nodeid = nodeid;
//         obj.connectstate = 0;
//         console.log('[MeshCentral] [1] MeshCentral Relay  -- Connecting...');
//         obj.socket = new WebSocket(url);
//         obj.socket.binaryType = 'arraybuffer';
//         obj.socket.onopen = obj.xxOnSocketConnected;
//         obj.socket.onmessage = obj.xxOnMessage;
//         //obj.socket.onmessage = function (e) { logData(e, 'WebSocket'); obj.xxOnMessage(e); }
//         obj.socket.onerror = function (e) { /* console.error(e); */ }
//         obj.socket.onclose = obj.xxOnSocketClosed;
//         obj.xxStateChange(1);
//         if (obj.meshserver != null) {
//             var rurl = '*' + domainUrl + 'meshrelay.ashx?p=' + obj.protocol + '&nodeid=' + nodeid + '&id=' + obj.tunnelid;
//             if ((rauthCookie != null) && (rauthCookie != '')) { rurl += ('&rauth=' + rauthCookie); }
//             obj.meshserver.send({ action: 'msg', type: 'tunnel', nodeid: obj.nodeid, value: rurl, usage: obj.protocol });
//             //obj.debug('Agent Redir Start: ' + url);
//         }
//     }

//     obj.xxOnSocketConnected = function () {
//         if (obj.debugmode == 1) { console.log('onSocketConnected'); }
//         //obj.debug('Agent Redir Socket Connected');
//         console.log('[MeshCentral] [2] MeshCentral Relay  -- Connected');
//         if (!obj.latency.lastSend) {
//             obj.latency.lastSend = setInterval(function () {
//                 if (obj.latency.current == -1) {
//                     clearInterval(obj.latency.lastSend);
//                     obj.latency.lastSend = null;
//                 } else {
//                     obj.sendCtrlMsg(JSON.stringify({ ctrlChannel: 102938, type: "rtt", time: (new Date().getTime()) }));
//                 }
//             }, 10000);
//         }
//         obj.sendCtrlMsg(JSON.stringify({ ctrlChannel: 102938, type: "rtt", time: (new Date().getTime()) }));
//         obj.xxStateChange(2);
//     }

//     // Called to pass websocket control messages
//     obj.xxOnControlCommand = function (msg) {
//         var controlMsg;
//         try { controlMsg = JSON.parse(msg); } catch (e) { return; }
//         if (controlMsg.ctrlChannel != '102938') { if (obj.m.ProcessData) { obj.m.ProcessData(msg); } else { console.log(msg); } return; }
//         if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirRecv', controlMsg); }
//         if (controlMsg.type == 'console') {
//             obj.setConsoleMessage(controlMsg.msg, controlMsg.msgid, controlMsg.msgargs, controlMsg.timeout);
//         } else if (controlMsg.type == 'metadata') {
//             obj.metadata = controlMsg;
//             if (obj.onMetadataChange) obj.onMetadataChange(obj.metadata);
//         } else if ((controlMsg.type == 'rtt') && (typeof controlMsg.time == 'number')) {
//             obj.latency.current = (new Date().getTime()) - controlMsg.time;
//             if (obj.latency.callback != null) { obj.latency.callback(obj.latency.current); }
//         } else if (obj.webrtc != null) {
//             if (controlMsg.type == 'answer') {
//                 obj.webrtc.setRemoteDescription(new RTCSessionDescription(controlMsg), function () { /*console.log('WebRTC remote ok');*/ }, obj.xxCloseWebRTC);
//             } else if (controlMsg.type == 'webrtc0') {
//                 obj.webSwitchOk = true; // Other side is ready for switch over
//                 performWebRtcSwitch();
//             } else if (controlMsg.type == 'webrtc1') {
//                 obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc2"}'); // Confirm we got end of data marker, indicates data will no longer be received on websocket.
//             } else if (controlMsg.type == 'webrtc2') {
//                 // TODO: Resume/Start sending data over WebRTC
//             }
//         } else if (controlMsg.type == 'ping') { // if we get a ping, respond with a pong.
//             obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"pong"}');
//         }
//     }

//     // Set the console message
//     obj.setConsoleMessage = function (str, id, args, timeout) {
//         if (obj.consoleMessage == str) return;
//         obj.consoleMessage = str;
//         obj.consoleMessageId = id;
//         obj.consoleMessageArgs = args;
//         obj.consoleMessageTimeout = timeout;
//         if (obj.onConsoleMessageChange) { obj.onConsoleMessageChange(obj, obj.consoleMessage, obj.consoleMessageId); }
//     }

//     obj.sendCtrlMsg = function (x) { if (obj.ctrlMsgAllowed == true) { if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirSend', typeof x, x); } try { obj.socket.send(x); } catch (ex) { } } }

//     function performWebRtcSwitch() {
//         if ((obj.webSwitchOk == true) && (obj.webRtcActive == true)) {
//             obj.latency.current = -1; // RTT will no longer be calculated when WebRTC is enabled
//             obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc0"}'); // Indicate to the meshagent that it can start traffic switchover
//             obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc1"}'); // Indicate to the meshagent that data traffic will no longer be sent over websocket.
//             // TODO: Hold/Stop sending data over websocket
//             if (obj.onStateChanged != null) { obj.onStateChanged(obj, obj.State); }
//         }
//     }

//     obj.xxOnMessage = function (e) {
//         //console.log('Recv', e.data, e.data.byteLength, obj.State);
//         if (obj.State < 3) {
//             if ((e.data == 'c') || (e.data == 'cr')) {
//                 if (e.data == 'cr') { obj.serverIsRecording = true; }
//                 if (obj.options != null) { delete obj.options.action; obj.options.type = 'options'; try { obj.sendCtrlMsg(JSON.stringify(obj.options)); } catch (ex) { } }
//                 try { obj.socket.send(obj.protocol); } catch (ex) { }
//                 obj.xxStateChange(3);

//                 // Track seen candidate types to avoid duplicate logs
//                 var _seenStun = false, _seenTurn = false;
//                 // Timers for ICE stall detection
//                 var _iceGatherTimer = null, _iceCheckTimer = null;

//                 if (obj.attemptWebRTC == true) {
//                     // Try to get WebRTC setup
//                     var configuration = obj.webrtcconfig; //{ "iceServers": [ { 'urls': 'stun:stun.cloudflare.com:3478' }, { 'urls': 'stun:stun.l.google.com:19302' } ] };
//                     console.log('[MeshCentral] [3] MeshCentral WebRTC -- Connecting (Relay active, attempting peer upgrade)...');
//                     if (typeof RTCPeerConnection !== 'undefined') { obj.webrtc = new RTCPeerConnection(configuration); }
//                     else if (typeof webkitRTCPeerConnection !== 'undefined') { obj.webrtc = new webkitRTCPeerConnection(configuration); }
//                     if ((obj.webrtc != null) && (obj.webrtc.createDataChannel)) {
//                         obj.webchannel = obj.webrtc.createDataChannel('DataChannel', {}); // { ordered: false, maxRetransmits: 2 }
//                         obj.webchannel.binaryType = 'arraybuffer';
//                         obj.webchannel.onmessage = obj.xxOnMessage;
//                         //obj.webchannel.onmessage = function (e) { logData(e, 'WebRTC'); obj.xxOnMessage(e); }
//                         obj.webchannel.onopen = function () {
//                             obj.webRtcActive = true;
//                             // Detect actual connection type using ICE stats
//                             if (obj.webrtc && obj.webrtc.getStats) {
//                                 obj.webrtc.getStats(null).then(function (stats) {
//                                     var logged = false;
//                                     stats.forEach(function (report) {
//                                         if (!logged && report.type === 'candidate-pair' && report.state === 'succeeded') {
//                                             var local = stats.get(report.localCandidateId);
//                                             var remote = stats.get(report.remoteCandidateId);
//                                             var localType = local ? (local.candidateType || local.type || '') : '';
//                                             var remoteType = remote ? (remote.candidateType || remote.type || '') : '';
//                                             if (localType === 'relay' || remoteType === 'relay') {
//                                                 console.log('[MeshCentral] [6] TURN Peer-to-Peer      -- Connected (traffic via TURN relay server)');
//                                             } else if (localType === 'srflx' || remoteType === 'srflx' || localType === 'prflx' || remoteType === 'prflx') {
//                                                 console.log('[MeshCentral] [6] STUN Peer-to-Peer      -- Connected (NAT traversal, direct peer)');
//                                             } else {
//                                                 console.log('[MeshCentral] [6] Direct Peer-to-Peer    -- Connected (LAN)');
//                                             }
//                                             logged = true;
//                                         }
//                                     });
//                                     if (!logged) { console.log('[MeshCentral] [6] Direct Peer-to-Peer    -- Connected (LAN)'); }
//                                 }).catch(function () {
//                                     console.log('[MeshCentral] [6] MeshCentral WebRTC   -- Connected');
//                                 });
//                             } else {
//                                 console.log('[MeshCentral] [6] MeshCentral WebRTC   -- Connected');
//                             }
//                             performWebRtcSwitch();
//                         };
//                         obj.webchannel.onclose = function (event) { if (obj.webRtcActive) { console.log('[MeshCentral] Session Disconnected -- WebRTC DataChannel closed (tab inactive or network dropped)'); obj.Stop(); } }
//                         // Helper: send the offer once (guarded so it is only sent once)
//                         var _offerSent = false;
//                         function sendWebRtcOffer() {
//                             if (_offerSent) return;
//                             _offerSent = true;
//                             if (_iceGatherTimer) { clearTimeout(_iceGatherTimer); _iceGatherTimer = null; }
//                             try { obj.sendCtrlMsg(JSON.stringify(obj.webrtcoffer)); } catch (ex) { }
//                         }

//                         obj.webrtc.onicecandidate = function (e) {
//                             if (e.candidate == null) {
//                                 // End-of-candidates signal — send the offer now
//                                 sendWebRtcOffer();
//                             } else {
//                                 var c = e.candidate.candidate || '';
//                                 if (!_seenStun && (c.indexOf(' srflx ') !== -1 || c.indexOf(' prflx ') !== -1)) {
//                                     _seenStun = true;
//                                     console.log('[MeshCentral] [4] STUN WebRTC          -- Candidate found (checking NAT traversal)...');
//                                 }
//                                 if (!_seenTurn && c.indexOf(' relay ') !== -1) {
//                                     _seenTurn = true;
//                                     console.log('[MeshCentral] [5] TURN WebRTC          -- Candidate found (relay server available)...');
//                                 }
//                                 obj.webrtcoffer.sdp += ('a=' + e.candidate.candidate + '\r\n'); // New candidate, add it to the SDP
//                             }
//                         }
//                         obj.webrtc.oniceconnectionstatechange = function () {
//                             if (obj.webrtc != null) {
//                                 var s = obj.webrtc.iceConnectionState;
//                                 if (s === 'checking') {
//                                     console.log('[MeshCentral]     STUN/TURN WebRTC    -- Checking candidates...');
//                                     // Guard: if ICE stays in "checking" for 25 s, abandon WebRTC and keep relay
//                                     if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); }
//                                     _iceCheckTimer = setTimeout(function () {
//                                         _iceCheckTimer = null;
//                                         if (obj.webrtc && obj.webrtc.iceConnectionState === 'checking') {
//                                             console.log('[MeshCentral] [!] STUN/TURN WebRTC    -- Timed out in "checking" (TURN unreachable or credentials invalid), staying on Relay.');
//                                             obj.xxCloseWebRTC();
//                                         }
//                                     }, 25000);
//                                 } else if (s === 'connected' || s === 'completed') {
//                                     if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); _iceCheckTimer = null; }
//                                     console.log('[MeshCentral]     STUN/TURN WebRTC    -- ICE connected (' + s + ')');
//                                 } else if (s === 'disconnected') {
//                                     // 'disconnected' is a TRANSIENT state — do NOT close immediately.
//                                     // It often recovers on its own within a few seconds.
//                                     // Only close if it was the active transport and does NOT recover.
//                                     if (obj.webRtcActive == true) {
//                                         console.log('[MeshCentral]     WebRTC ICE         -- Temporarily disconnected, waiting to recover...');
//                                         setTimeout(function () {
//                                             if (obj.webrtc && (obj.webrtc.iceConnectionState === 'disconnected' || obj.webrtc.iceConnectionState === 'failed')) {
//                                                 console.log('[MeshCentral] [-] WebRTC Disconnected  -- Could not recover, tearing down session.');
//                                                 obj.Stop();
//                                             }
//                                         }, 6000); // Give 6 seconds to recover
//                                     }
//                                     // If WebRTC was not yet active (still negotiating), just wait for 'failed'.
//                                 } else if (s === 'failed') {
//                                     if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); _iceCheckTimer = null; }
//                                     // 'failed' is the TRUE terminal state — now we give up on WebRTC.
//                                     if (_seenTurn) {
//                                         console.log('[MeshCentral]     TURN WebRTC          -- Failed (all relay candidates exhausted)');
//                                     } else if (_seenStun) {
//                                         console.log('[MeshCentral]     STUN WebRTC          -- Failed (NAT traversal blocked)');
//                                     }
//                                     console.log('[MeshCentral] [-] MeshCentral Relay    -- WebRTC failed, staying on relay');
//                                     obj.xxCloseWebRTC();
//                                 }
//                             }
//                         }
//                         obj.webrtc.createOffer(function (offer) {
//                             // Got the offer — set local description and start ICE gathering
//                             obj.webrtcoffer = offer;
//                             obj.webrtc.setLocalDescription(offer, function () {
//                                 // Safety net: if end-of-candidates never fires, send the offer after 20s anyway
//                                 _iceGatherTimer = setTimeout(function () {
//                                     _iceGatherTimer = null;
//                                     console.log('[MeshCentral] [!] ICE Gathering       -- Timed out waiting for all candidates, sending offer with gathered candidates...');
//                                     sendWebRtcOffer();
//                                 }, 20000);
//                             }, obj.xxCloseWebRTC);
//                         }, obj.xxCloseWebRTC, { mandatory: { OfferToReceiveAudio: false, OfferToReceiveVideo: false } });
//                     }
//                 } else {
//                     // No WebRTC — pure relay
//                     console.log('[MeshCentral] [3] Relay MeshCentral      -- Active (WebRTC disabled/failed)');
//                 }

//                 return;
//             }
//         }

//         // Control messages, most likely WebRTC setup 
//         //console.log('New data', e.data.byteLength);
//         if (typeof e.data == 'string') {
//             if (e.data[0] == '~') { obj.m.ProcessData(e.data); } else { obj.xxOnControlCommand(e.data); }
//         } else {
//             // Send the data to the module
//             if (obj.m.ProcessBinaryCommand) {
//                 // If only 1 byte
//                 if ((cmdAccLen == 0) && (e.data.byteLength < 4)) return; // Ignore any commands less than 4 bytes.

//                 // Send as Binary Command
//                 if (cmdAccLen != 0) {
//                     // Accumulator is active
//                     var view = new Uint8Array(e.data);
//                     cmdAcc.push(view);
//                     cmdAccLen += view.byteLength;
//                     //console.log('Accumulating', cmdAccLen);
//                     if (cmdAccCmdSize <= cmdAccLen) {
//                         var tmp = new Uint8Array(cmdAccLen), tmpPtr = 0;
//                         for (var i in cmdAcc) { tmp.set(cmdAcc[i], tmpPtr); tmpPtr += cmdAcc[i].byteLength; }
//                         //console.log('AccumulatorCompleted');
//                         obj.m.ProcessBinaryCommand(cmdAccCmd, cmdAccCmdSize, tmp);
//                         cmdAccCmd = 0, cmdAccCmdSize = 0, cmdAccLen = 0, cmdAcc = [];
//                     }
//                 } else {
//                     // Accumulator is not active
//                     var view = new Uint8Array(e.data), cmd = (view[0] << 8) + view[1], cmdsize = (view[2] << 8) + view[3];
//                     if ((cmd == 27) && (cmdsize == 8)) { cmd = (view[8] << 8) + view[9]; cmdsize = (view[5] << 16) + (view[6] << 8) + view[7]; view = view.slice(8); }
//                     //console.log(cmdsize, view.byteLength);
//                     if (cmdsize != view.byteLength) {
//                         //console.log('AccumulatorRequired', cmd, cmdsize, view.byteLength);
//                         cmdAccCmd = cmd; cmdAccCmdSize = cmdsize; cmdAccLen = view.byteLength, cmdAcc = [view];
//                     } else {
//                         obj.m.ProcessBinaryCommand(cmd, cmdsize, view);
//                     }
//                 }
//             } else if (obj.m.ProcessBinaryData) {
//                 // Send as Binary
//                 obj.m.ProcessBinaryData(new Uint8Array(e.data));
//             } else {
//                 // Send as Text
//                 if (e.data.byteLength < 16000) { // Process small data block
//                     obj.m.ProcessData(String.fromCharCode.apply(null, new Uint8Array(e.data))); // This will stack overflow on Chrome with 100k+ blocks.
//                 } else { // Process large data block
//                     var bb = new Blob([new Uint8Array(e.data)]), f = new FileReader();
//                     f.onload = function (e) { obj.m.ProcessData(e.target.result); };
//                     f.readAsBinaryString(bb);
//                 }
//             }
//         }
//     };

//     // Command accumulator, this is used for WebRTC fragmentation
//     var cmdAccCmd = 0, cmdAccCmdSize = 0, cmdAccLen = 0, cmdAcc = [];

//     obj.sendText = function (x) {
//         if (typeof x != 'string') { x = JSON.stringify(x); } // Turn into a string if needed
//         obj.send(encode_utf8(x)); // Encode UTF8 correctly
//     }

//     obj.send = function (x) {
//         //obj.debug('Agent Redir Send(' + obj.webRtcActive + ', ' + x.length + '): ' + rstr2hex(x));
//         //console.log('Agent Redir Send(' + obj.webRtcActive + ', ' + x.length + '): ' + ((typeof x == 'string')?x:rstr2hex(x)));
//         if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirSend', typeof x, x.length, (x[0] == '{') ? x : rstr2hex(x).substring(0, 64)); }
//         try {
//             if (obj.socket != null && obj.socket.readyState == WebSocket.OPEN) {
//                 if (typeof x == 'string') {
//                     if (obj.debugmode == 1) {
//                         var b = new Uint8Array(x.length), c = [];
//                         for (var i = 0; i < x.length; ++i) { b[i] = x.charCodeAt(i); c.push(x.charCodeAt(i)); }
//                         if (obj.webRtcActive == true) { obj.webchannel.send(b.buffer); } else { obj.socket.send(b.buffer); }
//                         //console.log('Send', c);
//                     } else {
//                         var b = new Uint8Array(x.length);
//                         for (var i = 0; i < x.length; ++i) { b[i] = x.charCodeAt(i); }
//                         if (obj.webRtcActive == true) { obj.webchannel.send(b.buffer); } else { obj.socket.send(b.buffer); }
//                     }
//                 } else {
//                     //if (obj.debugmode == 1) { console.log('Send', x); }
//                     if (obj.webRtcActive == true) { obj.webchannel.send(x); } else { obj.socket.send(x); }
//                 }
//             }
//         } catch (ex) { }
//     }

//     obj.xxOnSocketClosed = function () {
//         //obj.debug('Agent Redir Socket Closed');
//         //if (obj.debugmode == 1) { console.log('onSocketClosed'); }
//         console.log('[MeshCentral] [-] MeshCentral Relay    -- Disconnected (tab active: ' + !document.hidden + ')');
//         obj.Stop(1);
//     }

//     obj.xxStateChange = function (newstate) {
//         if (obj.State == newstate) return;
//         obj.State = newstate;
//         obj.m.xxStateChange(obj.State);
//         if (obj.onStateChanged != null) obj.onStateChanged(obj, obj.State);
//     }

//     // Close the WebRTC connection, should be called if a problem occurs during WebRTC setup.
//     obj.xxCloseWebRTC = function () {
//         if (obj.webchannel != null) { try { obj.webchannel.close(); } catch (e) { } obj.webchannel = null; }
//         if (obj.webrtc != null) { try { obj.webrtc.close(); } catch (e) { } obj.webrtc = null; }
//         obj.webRtcActive = false;
//     }

//     obj.Stop = function (x) {
//         if (obj.debugmode == 1) { console.log('stop', x); }
//         if (obj.State != 0) { console.log('Executing obj.Stop(), tearing down session.'); }

//         // Clean up WebRTC
//         obj.xxCloseWebRTC();

//         // clear RTT timer
//         obj.latency.current = -1;

//         //obj.debug('Agent Redir Socket Stopped');
//         obj.connectstate = -1;
//         if (obj.socket != null) {
//             try { if (obj.socket.readyState == 1) { obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"close"}'); } } catch (ex) { } // If connected, send the close command
//             try { if (obj.socket.readyState <= 1) { obj.socket.close(); } } catch (ex) { } // If connecting or connected, close the websocket
//             obj.socket = null;
//         }
//         obj.xxStateChange(0);
//     }

//     // Buffer is an ArrayBuffer
//     function buf2hex(buffer) { return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join(''); }

//     return obj;
// }

/** 
* @description Mesh Agent Transport Module - using websocket relay
* @author Ylian Saint-Hilaire
* @version v0.0.1f
* @patched v0.1.4 - Key fixes:
*   1. Strip "a=ice-options:trickle" from offer SDP — signals vanilla ICE to agent
*   2. Remove duplicate candidates (browser embeds them; we were appending again)
*   3. Handle trickle-style answer from agent via addIceCandidate if needed
*/

var CreateAgentRedirect = function (meshserver, module, serverPublicNamePort, authCookie, rauthCookie, domainUrl) {
    var obj = {};
    obj.m = module;
    module.parent = obj;
    obj.meshserver = meshserver;
    obj.authCookie = authCookie;
    obj.rauthCookie = rauthCookie;
    obj.State = 0;
    obj.nodeid = null;
    obj.options = null;
    obj.socket = null;
    obj.connectstate = -1;
    obj.tunnelid = Math.random().toString(36).substring(2);
    obj.protocol = module.protocol;
    obj.onStateChanged = null;
    obj.ctrlMsgAllowed = true;
    obj.attemptWebRTC = false;
    obj.webRtcActive = false;
    obj.webrtcconfig = null;
    obj.webSwitchOk = false;
    obj.webchannel = null;
    obj.webrtc = null;
    obj.debugmode = 0;
    obj.serverIsRecording = false;
    obj.urlname = 'meshrelay.ashx';
    obj.latency = { lastSend: null, current: -1, callback: null };
    if (domainUrl == null) { domainUrl = '/'; }

    obj.consoleMessage = null;
    obj.onConsoleMessageChange = null;
    obj.metadata = null;
    obj.onMetadataChange = null;

    function logData(e, name) {
        if (typeof e.data == 'object') {
            var view = new Uint8Array(e.data), cmd = (view[0] << 8) + view[1], cmdsize = (view[2] << 8) + view[3];
            console.log(name + ' binary data', cmd, cmdsize, e.data.byteLength, buf2hex(e.data).substring(0, 24));
        } else if (typeof e.data == 'string') {
            console.log(name + ' string data', e.data.length, e.data);
        } else {
            console.log(name + ' unknown data', e.data);
        }
    }

    obj.Start = function (nodeid) {
        var url = window.location.protocol.replace('http', 'ws') + '//' + window.location.host + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/' + obj.urlname + '?browser=1&p=' + obj.protocol + (nodeid ? ('&nodeid=' + nodeid) : '') + '&id=' + obj.tunnelid;
        if ((authCookie != null) && (authCookie != '')) { url += '&auth=' + authCookie; }
        if ((urlargs != null) && (urlargs.slowrelay != null)) { url += '&slowrelay=' + urlargs.slowrelay; }
        obj.nodeid = nodeid;
        obj.connectstate = 0;
        console.log('[MeshCentral] [1] MeshCentral Relay  -- Connecting...');
        obj.socket = new WebSocket(url);
        obj.socket.binaryType = 'arraybuffer';
        obj.socket.onopen = obj.xxOnSocketConnected;
        obj.socket.onmessage = obj.xxOnMessage;
        obj.socket.onerror = function (e) { }
        obj.socket.onclose = obj.xxOnSocketClosed;
        obj.xxStateChange(1);
        if (obj.meshserver != null) {
            var rurl = '*' + domainUrl + 'meshrelay.ashx?p=' + obj.protocol + '&nodeid=' + nodeid + '&id=' + obj.tunnelid;
            if ((rauthCookie != null) && (rauthCookie != '')) { rurl += ('&rauth=' + rauthCookie); }
            obj.meshserver.send({ action: 'msg', type: 'tunnel', nodeid: obj.nodeid, value: rurl, usage: obj.protocol });
        }
    }

    obj.xxOnSocketConnected = function () {
        if (obj.debugmode == 1) { console.log('onSocketConnected'); }
        console.log('[MeshCentral] [2] MeshCentral Relay  -- Connected');
        if (!obj.latency.lastSend) {
            obj.latency.lastSend = setInterval(function () {
                if (obj.latency.current == -1) { clearInterval(obj.latency.lastSend); obj.latency.lastSend = null; }
                else { obj.sendCtrlMsg(JSON.stringify({ ctrlChannel: 102938, type: "rtt", time: (new Date().getTime()) })); }
            }, 10000);
        }
        obj.sendCtrlMsg(JSON.stringify({ ctrlChannel: 102938, type: "rtt", time: (new Date().getTime()) }));
        obj.xxStateChange(2);
    }

    obj.xxOnControlCommand = function (msg) {
        var controlMsg;
        try { controlMsg = JSON.parse(msg); } catch (e) { return; }
        if (controlMsg.ctrlChannel != '102938') { if (obj.m.ProcessData) { obj.m.ProcessData(msg); } else { console.log(msg); } return; }
        if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirRecv', controlMsg); }
        if (controlMsg.type == 'console') {
            obj.setConsoleMessage(controlMsg.msg, controlMsg.msgid, controlMsg.msgargs, controlMsg.timeout);
        } else if (controlMsg.type == 'metadata') {
            obj.metadata = controlMsg;
            if (obj.onMetadataChange) obj.onMetadataChange(obj.metadata);
        } else if ((controlMsg.type == 'rtt') && (typeof controlMsg.time == 'number')) {
            obj.latency.current = (new Date().getTime()) - controlMsg.time;
            if (obj.latency.callback != null) { obj.latency.callback(obj.latency.current); }
        } else if (obj.webrtc != null) {
            if (controlMsg.type == 'answer') {
                console.log('[MeshCentral]     WebRTC Answer received from agent, applying...');
                var rawLines = (controlMsg.sdp || '').split(/\r\n|\r|\n/);
                console.log('[MeshCentral]     Raw answer SDP (' + rawLines.length + ' lines):');
                for (var li = 0; li < rawLines.length; li++) {
                    if (rawLines[li]) { console.log('[MeshCentral]     SDP[' + li + ']: ' + rawLines[li]); }
                }
                // var cleanLines = [];
                // var hasPublicCandidate = false;
                // for (var li = 0; li < rawLines.length; li++) {
                //     var cl = rawLines[li];
                //     if (!cl.startsWith('a=candidate:')) continue;
                //     // Private ranges: 10.x, 172.16-31.x, 192.168.x
                //     if (cl.indexOf(' typ host') !== -1 || cl.indexOf(' typ srflx') !== -1 || cl.indexOf(' typ relay') !== -1) {
                //         var ipMatch = cl.match(/\s(\d+\.\d+\.\d+\.\d+)\s+\d+\s+typ/);
                //         if (ipMatch) {
                //             var ip = ipMatch[1];
                //             var isPrivate = (
                //                 ip.startsWith('10.') ||
                //                 ip.startsWith('192.168.') ||
                //                 ip.startsWith('172.') && (function () { var b = parseInt(ip.split('.')[1]); return b >= 16 && b <= 31; })() ||
                //                 ip === '0.0.0.0' || ip === '127.0.0.1'
                //             );
                //             if (!isPrivate) { hasPublicCandidate = true; break; }
                //         }
                //     }
                // }

                // if (!hasPublicCandidate) {
                //     console.log('[MeshCentral] [!] WebRTC ABORTED -- Agent has only private/LAN candidates (192.168.x.x).');
                //     console.log('[MeshCentral] [!] Chrome Private Network Access policy blocks TURN relay to private IPs.');
                //     console.log('[MeshCentral] [!] Staying on WebSocket relay (fully functional).');
                //     obj.xxCloseWebRTC();
                //     return;
                // }

                // var cleanAnswerSdp = cleanLines.join('\r\n') + '\r\n';
                // console.log('[MeshCentral]     Rewritten answer SDP:');
                // cleanAnswerSdp.split('\r\n').forEach(function (l, i) { if (l) console.log('[MeshCentral]     SDP[' + i + ']: ' + l); });

                // var cleanAnswer = { type: 'answer', sdp: cleanAnswerSdp };
                var cleanAnswer = { type: 'answer', sdp: controlMsg.sdp };
                obj.webrtc.setRemoteDescription(new RTCSessionDescription(cleanAnswer), function () {
                    console.log('[MeshCentral]     Remote description set OK.');
                    // Dump stats after 5s and 15s to see what pairs are being tried
                    setTimeout(function () {
                        if (!obj.webrtc) return;
                        obj.webrtc.getStats(null).then(function (stats) {
                            console.log('[MeshCentral]     === 5s Stats Dump ===');
                            stats.forEach(function (report) {
                                if (report.type === 'candidate-pair') {
                                    var local = stats.get(report.localCandidateId);
                                    var remote = stats.get(report.remoteCandidateId);
                                    console.log('[MeshCentral]     Pair: ' + report.state
                                        + ' L=' + (local ? local.candidateType + ' ' + local.address + ':' + local.port : '?')
                                        + ' R=' + (remote ? remote.candidateType + ' ' + remote.address + ':' + remote.port : '?')
                                        + ' sent=' + (report.bytesSent || 0) + ' recv=' + (report.bytesReceived || 0)
                                        + ' requests=' + (report.requestsSent || 0) + ' responses=' + (report.responsesReceived || 0));
                                }
                            });
                        });
                    }, 5000);
                }, function (e) {
                    console.log('[MeshCentral] [!] setRemoteDescription failed: ' + e + ' — closing WebRTC.');
                    obj.xxCloseWebRTC();
                });
            } else if (controlMsg.type == 'candidate') {
                // Handle trickle candidate from agent (some agent versions send these)
                if (controlMsg.candidate != null) {
                    try { obj.webrtc.addIceCandidate(new RTCIceCandidate(controlMsg.candidate)); } catch (ex) { }
                }
            } else if (controlMsg.type == 'webrtc0') {
                obj.webSwitchOk = true;
                performWebRtcSwitch();
            } else if (controlMsg.type == 'webrtc1') {
                obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc2"}');
            } else if (controlMsg.type == 'webrtc2') {
                // TODO: Resume/Start sending data over WebRTC
            }
        } else if (controlMsg.type == 'ping') {
            obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"pong"}');
        }
    }

    obj.setConsoleMessage = function (str, id, args, timeout) {
        if (obj.consoleMessage == str) return;
        obj.consoleMessage = str; obj.consoleMessageId = id;
        obj.consoleMessageArgs = args; obj.consoleMessageTimeout = timeout;
        if (obj.onConsoleMessageChange) { obj.onConsoleMessageChange(obj, obj.consoleMessage, obj.consoleMessageId); }
    }

    obj.sendCtrlMsg = function (x) {
        if (obj.ctrlMsgAllowed == true) {
            if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirSend', typeof x, x); }
            try { obj.socket.send(x); } catch (ex) { }
        }
    }

    function performWebRtcSwitch() {
        if ((obj.webSwitchOk == true) && (obj.webRtcActive == true)) {
            obj.latency.current = -1;
            obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc0"}');
            obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"webrtc1"}');
            if (obj.onStateChanged != null) { obj.onStateChanged(obj, obj.State); }
        }
    }

    // Build a vanilla-ICE SDP from a complete local description.
    // - Removes "a=ice-options:trickle" so the agent knows this is a complete offer
    // - Deduplicates a=candidate lines (browser may already embed them; we don't re-add)
    // Replace buildVanillaIceSDP with this version that also
    // downgrades the offer m= line to old DTLS/SCTP format for the agent
    function buildVanillaIceSDP(baseSdp) {
        var lines = baseSdp.split(/\r\n|\r|\n/);
        var seen = {};
        var out = [];
        var inApp = false;
        for (var i = 0; i < lines.length; i++) {
            var l = lines[i];
            if (!l) continue;

            // Strip trickle
            if (l === 'a=ice-options:trickle') {
                console.log('[MeshCentral]     SDP: stripped a=ice-options:trickle (vanilla ICE mode)');
                continue;
            }

            // Detect application section
            if (l.startsWith('m=')) { inApp = l.startsWith('m=application'); }

            if (inApp) {
                // Downgrade modern offer m= line to old format the agent understands
                // NEW: m=application 9 UDP/DTLS/SCTP webrtc-datachannel
                // OLD: m=application 9 DTLS/SCTP 5000
                if (l.match(/^m=application\s+\d+\s+UDP\/DTLS\/SCTP\s+webrtc-datachannel/i)) {
                    console.log('[MeshCentral]     SDP: downgrading offer m=application to old DTLS/SCTP format for agent');
                    out.push('m=application 9 DTLS/SCTP 5000');
                    continue;
                }
                // Replace modern a=sctp-port with old a=sctpmap
                if (l.match(/^a=sctp-port:/i)) {
                    var port = l.split(':')[1];
                    console.log('[MeshCentral]     SDP: replacing a=sctp-port with a=sctpmap for agent');
                    out.push('a=sctpmap:' + port + ' webrtc-datachannel 1024');
                    continue;
                }
                // Remove a=max-message-size — agent doesn't understand it
                if (l.match(/^a=max-message-size:/i)) {
                    console.log('[MeshCentral]     SDP: removed a=max-message-size for agent compat');
                    continue;
                }
            }

            // Deduplicate candidate lines
            if (l.startsWith('a=candidate:')) {
                if (seen[l]) continue;
                seen[l] = true;
            }

            out.push(l);
        }
        return out.join('\r\n') + '\r\n';
    }

    obj.xxOnMessage = function (e) {
        if (obj.State < 3) {
            if ((e.data == 'c') || (e.data == 'cr')) {
                if (e.data == 'cr') { obj.serverIsRecording = true; }
                if (obj.options != null) { delete obj.options.action; obj.options.type = 'options'; try { obj.sendCtrlMsg(JSON.stringify(obj.options)); } catch (ex) { } }
                try { obj.socket.send(obj.protocol); } catch (ex) { }
                obj.xxStateChange(3);

                var _seenStun = false, _seenTurn = false;
                var _iceCheckTimer = null;

                if (obj.attemptWebRTC == true) {
                    var configuration = obj.webrtcconfig;
                    console.log('[MeshCentral] [3] MeshCentral WebRTC -- Connecting (Relay active, attempting peer upgrade)...');
                    if (typeof RTCPeerConnection !== 'undefined') { obj.webrtc = new RTCPeerConnection(configuration); }
                    else if (typeof webkitRTCPeerConnection !== 'undefined') { obj.webrtc = new webkitRTCPeerConnection(configuration); }

                    if ((obj.webrtc != null) && (obj.webrtc.createDataChannel)) {
                        obj.webchannel = obj.webrtc.createDataChannel('DataChannel', {});
                        obj.webchannel.binaryType = 'arraybuffer';
                        obj.webchannel.onmessage = obj.xxOnMessage;
                        obj.webchannel.onopen = function () {
                            obj.webRtcActive = true;
                            if (obj.webrtc && obj.webrtc.getStats) {
                                obj.webrtc.getStats(null).then(function (stats) {
                                    var logged = false;
                                    stats.forEach(function (report) {
                                        if (!logged && report.type === 'candidate-pair' && report.state === 'succeeded') {
                                            var local = stats.get(report.localCandidateId);
                                            var remote = stats.get(report.remoteCandidateId);
                                            var localType = local ? (local.candidateType || local.type || '') : '';
                                            var remoteType = remote ? (remote.candidateType || remote.type || '') : '';
                                            if (localType === 'relay' || remoteType === 'relay') {
                                                console.log('[MeshCentral] [6] TURN Peer-to-Peer      -- Connected (traffic via TURN relay server)');
                                            } else if (localType === 'srflx' || remoteType === 'srflx' || localType === 'prflx' || remoteType === 'prflx') {
                                                console.log('[MeshCentral] [6] STUN Peer-to-Peer      -- Connected (NAT traversal, direct peer)');
                                            } else {
                                                console.log('[MeshCentral] [6] Direct Peer-to-Peer    -- Connected (LAN)');
                                            }
                                            logged = true;
                                        }
                                    });
                                    if (!logged) { console.log('[MeshCentral] [6] Direct Peer-to-Peer    -- Connected (LAN)'); }
                                }).catch(function () { console.log('[MeshCentral] [6] MeshCentral WebRTC   -- Connected'); });
                            }


                            else {
                                console.log('[MeshCentral] [6] MeshCentral WebRTC   -- Connected');
                            }
                            performWebRtcSwitch();
                        };
                        obj.webchannel.onclose = function () { if (obj.webRtcActive) { console.log('[MeshCentral] Session Disconnected -- WebRTC DataChannel closed'); obj.Stop(); } };

                        var _gatherDone = false;
                        var _gatherTimer = null;

                        function sendVanillaOffer() {
                            if (_gatherDone) return;

                            _gatherDone = true;
                            if (_gatherTimer) { clearTimeout(_gatherTimer); _gatherTimer = null; }
                            if (!obj.webrtc || !obj.webrtc.localDescription) {
                                console.log('[MeshCentral]     sendVanillaOffer: webrtc already closed, aborting.');
                                return;
                            }
                            // Get the final local description (browser has embedded candidates by now)
                            var finalSdp = buildVanillaIceSDP(obj.webrtc.localDescription.sdp);
                            var offer = { type: 'offer', sdp: finalSdp };

                            // Count what we have
                            var nHost = (finalSdp.match(/typ host/g) || []).length;
                            var nStun = (finalSdp.match(/typ srflx/g) || []).length + (finalSdp.match(/typ prflx/g) || []).length;
                            var nTurn = (finalSdp.match(/typ relay/g) || []).length;
                            console.log('[MeshCentral] [5b] Sending vanilla-ICE offer — host:' + nHost + ' stun:' + nStun + ' turn:' + nTurn + ' (trickle stripped)');
                            if (nTurn === 0) { console.log('[MeshCentral] [!] WARNING: No TURN candidate in final SDP — agent cannot fall back to TURN relay.'); }

                            try { obj.sendCtrlMsg(JSON.stringify(offer)); } catch (ex) { }
                        }

                        obj.webrtc.onicecandidate = function (e) {
                            if (e.candidate == null) {
                                console.log('[MeshCentral]     ICE gathering complete (end-of-candidates).');
                                sendVanillaOffer();
                            } else {
                                var c = e.candidate.candidate || '';
                                if (!_seenStun && (c.indexOf(' srflx ') !== -1 || c.indexOf(' prflx ') !== -1)) {
                                    _seenStun = true;
                                    console.log('[MeshCentral] [4] STUN WebRTC          -- Candidate found...');
                                }
                                if (!_seenTurn && c.indexOf(' relay ') !== -1) {
                                    _seenTurn = true;
                                    console.log('[MeshCentral] [5] TURN WebRTC          -- Candidate found...');
                                }
                                // Do NOT append to SDP manually — browser handles this via localDescription
                            }
                        };

                        obj.webrtc.oniceconnectionstatechange = function () {
                            if (obj.webrtc != null) {
                                var s = obj.webrtc.iceConnectionState;
                                console.log('[MeshCentral]     ICE state changed → ' + s);
                                if (obj.webrtc.getStats) {
                                    obj.webrtc.getStats(null).then(function (stats) {
                                        stats.forEach(function (report) {
                                            if (report.type === 'candidate-pair') {
                                                var local = stats.get(report.localCandidateId);
                                                var remote = stats.get(report.remoteCandidateId);
                                                console.log('[MeshCentral]     CandidatePair state=' + report.state
                                                    + ' local=' + (local ? local.candidateType + '/' + local.protocol + '/' + local.address : '?')
                                                    + ' remote=' + (remote ? remote.candidateType + '/' + remote.protocol + '/' + remote.address : '?')
                                                    + ' nominated=' + report.nominated
                                                    + ' bytesSent=' + (report.bytesSent || 0));
                                            }
                                            if (report.type === 'local-candidate' || report.type === 'remote-candidate') {
                                                console.log('[MeshCentral]     Candidate [' + report.type + '] '
                                                    + report.candidateType + ' ' + report.protocol + ' '
                                                    + report.address + ':' + report.port);
                                            }
                                        });
                                    }).catch(function (e) { console.log('[MeshCentral]     getStats failed: ' + e); });
                                }
                                if (s === 'checking') {
                                    console.log('[MeshCentral]     STUN/TURN WebRTC    -- Checking candidates...');
                                    if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); }
                                    _iceCheckTimer = setTimeout(function () {
                                        _iceCheckTimer = null;
                                        if (obj.webrtc && obj.webrtc.iceConnectionState === 'checking') {
                                            console.log('[MeshCentral] [!] STUN/TURN WebRTC    -- Timed out in "checking", staying on Relay.');
                                            obj.xxCloseWebRTC();
                                        }
                                    }, 25000);
                                } else if (s === 'connected' || s === 'completed') {
                                    if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); _iceCheckTimer = null; }
                                    console.log('[MeshCentral]     STUN/TURN WebRTC    -- ICE connected (' + s + ')');
                                } else if (s === 'disconnected') {
                                    if (obj.webRtcActive == true) {
                                        console.log('[MeshCentral]     WebRTC ICE         -- Temporarily disconnected, waiting to recover...');
                                        setTimeout(function () {
                                            if (obj.webrtc && (obj.webrtc.iceConnectionState === 'disconnected' || obj.webrtc.iceConnectionState === 'failed')) {
                                                console.log('[MeshCentral] [-] WebRTC Disconnected  -- Could not recover, tearing down session.');
                                                obj.Stop();
                                            }
                                        }, 6000);
                                    }
                                } else if (s === 'failed') {
                                    if (_iceCheckTimer) { clearTimeout(_iceCheckTimer); _iceCheckTimer = null; }
                                    if (_seenTurn) { console.log('[MeshCentral]     TURN WebRTC          -- Failed (all relay candidates exhausted)'); }
                                    else if (_seenStun) { console.log('[MeshCentral]     STUN WebRTC          -- Failed (NAT traversal blocked)'); }
                                    console.log('[MeshCentral] [-] MeshCentral Relay    -- WebRTC failed, staying on relay');
                                    obj.xxCloseWebRTC();
                                }
                            }
                        };

                        obj.webrtc.createOffer(function (offer) {
                            obj.webrtcoffer = offer;
                            obj.webrtc.setLocalDescription(offer, function () {
                                // Wait for full ICE gather. Browser updates localDescription live.
                                // 8s timeout as safety net — TURN typically arrives in <200ms.
                                _gatherTimer = setTimeout(function () {
                                    _gatherTimer = null;
                                    console.log('[MeshCentral] [!] ICE Gathering       -- 8s timeout, sending with whatever was gathered...');
                                    sendVanillaOffer();
                                }, 8000);
                            }, obj.xxCloseWebRTC);
                        }, obj.xxCloseWebRTC, { mandatory: { OfferToReceiveAudio: false, OfferToReceiveVideo: false } });
                    }
                } else {
                    console.log('[MeshCentral] [3] Relay MeshCentral      -- Active (WebRTC disabled)');
                }

                return;
            }
        }

        if (typeof e.data == 'string') {
            if (e.data[0] == '~') { obj.m.ProcessData(e.data); } else { obj.xxOnControlCommand(e.data); }
        } else {
            if (obj.m.ProcessBinaryCommand) {
                if ((cmdAccLen == 0) && (e.data.byteLength < 4)) return;
                if (cmdAccLen != 0) {
                    var view = new Uint8Array(e.data);
                    cmdAcc.push(view); cmdAccLen += view.byteLength;
                    if (cmdAccCmdSize <= cmdAccLen) {
                        var tmp = new Uint8Array(cmdAccLen), tmpPtr = 0;
                        for (var i in cmdAcc) { tmp.set(cmdAcc[i], tmpPtr); tmpPtr += cmdAcc[i].byteLength; }
                        obj.m.ProcessBinaryCommand(cmdAccCmd, cmdAccCmdSize, tmp);
                        cmdAccCmd = 0; cmdAccCmdSize = 0; cmdAccLen = 0; cmdAcc = [];
                    }
                } else {
                    var view = new Uint8Array(e.data), cmd = (view[0] << 8) + view[1], cmdsize = (view[2] << 8) + view[3];
                    if ((cmd == 27) && (cmdsize == 8)) { cmd = (view[8] << 8) + view[9]; cmdsize = (view[5] << 16) + (view[6] << 8) + view[7]; view = view.slice(8); }
                    if (cmdsize != view.byteLength) {
                        cmdAccCmd = cmd; cmdAccCmdSize = cmdsize; cmdAccLen = view.byteLength; cmdAcc = [view];
                    } else {
                        obj.m.ProcessBinaryCommand(cmd, cmdsize, view);
                    }
                }
            } else if (obj.m.ProcessBinaryData) {
                obj.m.ProcessBinaryData(new Uint8Array(e.data));
            } else {
                if (e.data.byteLength < 16000) {
                    obj.m.ProcessData(String.fromCharCode.apply(null, new Uint8Array(e.data)));
                } else {
                    var bb = new Blob([new Uint8Array(e.data)]), f = new FileReader();
                    f.onload = function (e) { obj.m.ProcessData(e.target.result); };
                    f.readAsBinaryString(bb);
                }
            }
        }
    };

    var cmdAccCmd = 0, cmdAccCmdSize = 0, cmdAccLen = 0, cmdAcc = [];

    obj.sendText = function (x) {
        if (typeof x != 'string') { x = JSON.stringify(x); }
        obj.send(encode_utf8(x));
    }

    obj.send = function (x) {
        if ((typeof args != 'undefined') && args.redirtrace) { console.log('RedirSend', typeof x, x.length, (x[0] == '{') ? x : rstr2hex(x).substring(0, 64)); }
        try {
            if (obj.socket != null && obj.socket.readyState == WebSocket.OPEN) {
                if (typeof x == 'string') {
                    if (obj.debugmode == 1) {
                        var b = new Uint8Array(x.length), c = [];
                        for (var i = 0; i < x.length; ++i) { b[i] = x.charCodeAt(i); c.push(x.charCodeAt(i)); }
                        if (obj.webRtcActive == true) { obj.webchannel.send(b.buffer); } else { obj.socket.send(b.buffer); }
                    } else {
                        var b = new Uint8Array(x.length);
                        for (var i = 0; i < x.length; ++i) { b[i] = x.charCodeAt(i); }
                        if (obj.webRtcActive == true) { obj.webchannel.send(b.buffer); } else { obj.socket.send(b.buffer); }
                    }
                } else {
                    if (obj.webRtcActive == true) { obj.webchannel.send(x); } else { obj.socket.send(x); }
                }
            }
        } catch (ex) { }
    }

    obj.xxOnSocketClosed = function () {
        console.log('[MeshCentral] [-] MeshCentral Relay    -- Disconnected (tab active: ' + !document.hidden + ')');
        obj.Stop(1);
    }

    obj.xxStateChange = function (newstate) {
        if (obj.State == newstate) return;
        obj.State = newstate;
        obj.m.xxStateChange(obj.State);
        if (obj.onStateChanged != null) obj.onStateChanged(obj, obj.State);
    }

    obj.xxCloseWebRTC = function () {
        if (obj.webchannel != null) { try { obj.webchannel.close(); } catch (e) { } obj.webchannel = null; }
        if (obj.webrtc != null) { try { obj.webrtc.close(); } catch (e) { } obj.webrtc = null; }
        obj.webRtcActive = false;
    }

    obj.Stop = function (x) {
        if (obj.debugmode == 1) { console.log('stop', x); }
        if (obj.State != 0) { console.log('Executing obj.Stop(), tearing down session.'); }
        obj.xxCloseWebRTC();
        obj.latency.current = -1;
        obj.connectstate = -1;
        if (obj.socket != null) {
            try { if (obj.socket.readyState == 1) { obj.sendCtrlMsg('{"ctrlChannel":"102938","type":"close"}'); } } catch (ex) { }
            try { if (obj.socket.readyState <= 1) { obj.socket.close(); } } catch (ex) { }
            obj.socket = null;
        }
        obj.xxStateChange(0);
    }

    function buf2hex(buffer) { return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join(''); }

    return obj;
}