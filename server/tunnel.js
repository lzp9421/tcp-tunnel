const SocketIo = require('socket.io');

class Tunnel {
    constructor(port) {
        this.io = new SocketIo(port || 3838);
        this.tunnel = {};
    }

    getByHost(host) {
        return this.tunnel[host];
    }

    static auth(token) {
        return token;
    }

    Start() {
        this.io.on('connection', (socket) => {
            let token = socket.handshake.query.token;
            let host = Tunnel.auth(token);
            if (!host) {
                // tode : 剔掉
                socket.emit('close', '认证失败');
                return false;
            }
            if (this.tunnel[host]) {
                socket.emit('close', '您在已在另外一个客户端登录，请不要重复登录');
                // 已存在 剔掉
                return false;
            }
            console.log(host + '连接成功');
            this.tunnel[host] = socket;
            socket.on('response', data => {
                let server = this.getServer(data.addr);
                if (typeof server === 'object') {
                    server.write(data.buffer);
                }
            });
            socket.on('response/end', data => {
                let server = this.getServer(data.addr);
                if (typeof server === 'object') {
                    server.end();
                }
            });
            socket.on('disconnect', () => {
                delete this.tunnel[host];
            });
            socket.on('error', (error) => {
                console.log(error)
            });
        });
        return true;
    }
}

module.exports = Tunnel;