const Tunnel = require('./server/tunnel');
const Server = require('./server/server');

let tunnel = new Tunnel(3838);
if (!tunnel.Start()) {
    console.log('通道建立失败');
} else {
    let server = new Server(tunnel);
    server.Start();
}
