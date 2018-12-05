const net = require('net');

class Server {
    constructor(tunnel) {
        this.tunnel = tunnel;
        this.connections = {};
        this.addr_map = {};

        this.tunnel.getServer = addr => {
            return this.connections[addr]
        }
    }

    static getAddr(socket) {
        let address = socket.remoteAddress;
        let port = socket.remotePort;
        return `${address}:${port}`;
    }

    static getHostName(headerBuffer) {
        let headerString = headerBuffer.toString();
        let arr = headerString.match(/host[^\r\n]+/gi);
        let host = '';
        if (arr) {
            host = arr[0].split(' ')[1];
            return host.split('.')[0];
        } else {
            return null;
        }
    }

    Start() {
        net.createServer(socket => {
            let addr = Server.getAddr(socket);
            this.addr_map[addr] = {
                host: null,
                header: true
            };
            socket.on('data', buffer => {
                let host;
                if (this.addr_map[addr].header) {
                    // 第一次，尝试获取请求头中的host信息
                    host = Server.getHostName(buffer);
                    this.connections[addr] = socket;
                    this.addr_map[addr].host = host;
                    this.addr_map[addr].header = false;
                } else {
                    host = this.addr_map[addr].host;
                }
                let tunnel = this.tunnel.getByHost(host);
                if (!tunnel) {
                    socket.write("HTTP/1.1 200 OK\r\n\r\nclient not online");
                    socket.destroy();
                    return;
                }
                let data = {
                    addr: addr,
                    buffer: buffer
                };
                //写入管道
                tunnel.emit('request', data)
            });

            socket.on('error', err => {
                console.log(err);
                delete this.connections[addr];
                delete this.addr_map[addr];
            });
            socket.on('close', () => {
                delete this.connections[addr];
                delete this.addr_map[addr];
            });
        }).listen(3737, '0.0.0.0');
    }
}

module.exports = Server;