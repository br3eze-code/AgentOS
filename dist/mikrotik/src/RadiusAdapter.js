"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RadiusAdapter = void 0;
const dgram_1 = __importDefault(require("dgram"));
const crypto_1 = __importDefault(require("crypto"));
const kernel_1 = require("@agentclaw/kernel");
// RADIUS Attribute types (subset)
const RADIUS_ATTRS = {
    USER_NAME: 1,
    USER_PASSWORD: 2,
    NAS_IP_ADDRESS: 4,
    NAS_PORT: 5,
    FRAMED_IP_ADDRESS: 8,
    CALLED_STATION_ID: 30,
    CALLING_STATION_ID: 31,
    NAS_IDENTIFIER: 32,
    ACCT_STATUS_TYPE: 40,
    ACCT_INPUT_OCTETS: 42,
    ACCT_OUTPUT_OCTETS: 43,
    ACCT_SESSION_ID: 44,
    ACCT_SESSION_TIME: 46,
    REPLY_MESSAGE: 18,
};
const RADIUS_CODES = {
    ACCESS_REQUEST: 1,
    ACCESS_ACCEPT: 2,
    ACCESS_REJECT: 3,
    ACCOUNTING_REQUEST: 4,
    ACCOUNTING_RESPONSE: 5,
};
/**
 * RadiusAdapter — simple RADIUS Auth + Accounting server.
 * Validates voucher codes from the AgentOS DB.
 * Auth: validates voucher code as username + password.
 * Accounting: updates session bytes/time in DB.
 */
class RadiusAdapter {
    server;
    port;
    secret;
    constructor(port = 1812, secret = 'agentclaw-secret') {
        this.port = port;
        this.secret = secret;
    }
    start() {
        this.server = dgram_1.default.createSocket('udp4');
        this.server.on('message', async (msg, rinfo) => {
            try {
                await this.handlePacket(msg, rinfo);
            }
            catch (err) {
                kernel_1.logger.error(`RADIUS error: ${err.message}`);
            }
        });
        this.server.on('error', (err) => {
            kernel_1.logger.error(`RADIUS server error: ${err.message}`);
        });
        this.server.bind(this.port, () => {
            kernel_1.logger.info(`RADIUS server listening on port ${this.port}`);
        });
    }
    stop() {
        this.server?.close();
    }
    async handlePacket(msg, rinfo) {
        if (msg.length < 20)
            return;
        const code = msg.readUInt8(0);
        const id = msg.readUInt8(1);
        const authenticator = msg.slice(4, 20);
        const attrs = this.parseAttributes(msg.slice(20));
        if (code === RADIUS_CODES.ACCESS_REQUEST) {
            await this.handleAuth(attrs, id, authenticator, rinfo);
        }
        else if (code === RADIUS_CODES.ACCOUNTING_REQUEST) {
            await this.handleAccounting(attrs, id, authenticator, rinfo);
        }
    }
    // ----------------------------------------------------------------
    // Authentication
    // ----------------------------------------------------------------
    async handleAuth(attrs, id, authenticator, rinfo) {
        const username = attrs.get(RADIUS_ATTRS.USER_NAME)?.toString('utf8') || '';
        const encryptedPass = attrs.get(RADIUS_ATTRS.USER_PASSWORD);
        if (!username) {
            this.sendReject(id, authenticator, 'Missing username', rinfo);
            return;
        }
        const db = (0, kernel_1.getFirestore)();
        const snap = await db.collection('vouchers').where('code', '==', username).limit(1).get();
        if (snap.empty) {
            kernel_1.logger.warn(`RADIUS AUTH REJECT: voucher not found "${username}"`);
            this.sendReject(id, authenticator, 'Voucher not found', rinfo);
            return;
        }
        const voucher = snap.docs[0].data();
        if (voucher.status === 'EXPIRED' || voucher.status === 'CANCELLED') {
            this.sendReject(id, authenticator, `Voucher ${voucher.status.toLowerCase()}`, rinfo);
            return;
        }
        const now = new Date();
        if (voucher.validUntil && voucher.validUntil.toDate && voucher.validUntil.toDate() < now) {
            this.sendReject(id, authenticator, 'Voucher expired', rinfo);
            return;
        }
        // Verify password if provided (standard RADIUS PAP uses MD5 XOR with secret)
        // For this simple adapter, we expect User-Password to be the same as the voucher code
        if (encryptedPass && encryptedPass.length > 0) {
            // PAP decryption: first 16 bytes XOR md5(secret + authenticator)
            const md5 = crypto_1.default.createHash('md5').update(Buffer.concat([Buffer.from(this.secret), authenticator])).digest();
            const decrypted = Buffer.alloc(16);
            for (let i = 0; i < 16 && i < encryptedPass.length; i++) {
                decrypted[i] = encryptedPass[i] ^ md5[i];
            }
            const passStr = decrypted.toString('utf8').replace(/\0/g, '');
            if (passStr !== username) {
                kernel_1.logger.warn(`RADIUS AUTH REJECT: Invalid password for voucher "${username}"`);
                this.sendReject(id, authenticator, 'Invalid password', rinfo);
                return;
            }
        }
        kernel_1.logger.info(`RADIUS AUTH ACCEPT: ${username}`);
        this.sendAccept(id, authenticator, rinfo);
    }
    // ----------------------------------------------------------------
    // Accounting
    // ----------------------------------------------------------------
    async handleAccounting(attrs, id, authenticator, rinfo) {
        const username = attrs.get(RADIUS_ATTRS.USER_NAME)?.toString('utf8') || '';
        const statusType = attrs.get(RADIUS_ATTRS.ACCT_STATUS_TYPE)?.readUInt32BE(0) || 0;
        const sessionId = attrs.get(RADIUS_ATTRS.ACCT_SESSION_ID)?.toString('utf8') || '';
        const inputOctets = attrs.get(RADIUS_ATTRS.ACCT_INPUT_OCTETS)?.readUInt32BE(0) || 0;
        const outputOctets = attrs.get(RADIUS_ATTRS.ACCT_OUTPUT_OCTETS)?.readUInt32BE(0) || 0;
        // Support for 64-bit accounting (Gigawords)
        const inputGiga = attrs.get(52)?.readUInt32BE(0) || 0; // Acct-Input-Gigawords
        const outputGiga = attrs.get(53)?.readUInt32BE(0) || 0; // Acct-Output-Gigawords
        const totalInput = BigInt(inputGiga) * BigInt(Math.pow(2, 32)) + BigInt(inputOctets);
        const totalOutput = BigInt(outputGiga) * BigInt(Math.pow(2, 32)) + BigInt(outputOctets);
        const db = (0, kernel_1.getFirestore)();
        const vSnap = await db.collection('vouchers').where('code', '==', username).limit(1).get();
        if (vSnap.empty)
            return;
        const voucherId = vSnap.docs[0].id;
        const sessionSnap = await db.collection('sessions')
            .where('voucherId', '==', voucherId)
            .where('status', '==', 'ACTIVE')
            .limit(1).get();
        if (!sessionSnap.empty) {
            const sessionDoc = sessionSnap.docs[0];
            if (statusType === 2) {
                // Stop
                await sessionDoc.ref.update({
                    status: 'ENDED',
                    endTime: new Date(),
                    bytesUp: totalOutput.toString(),
                    bytesDown: totalInput.toString(),
                });
                kernel_1.logger.info(`RADIUS ACCT STOP: ${username} (↑${totalOutput} ↓${totalInput})`);
            }
            else {
                // Start or interim
                await sessionDoc.ref.update({
                    bytesUp: totalOutput.toString(),
                    bytesDown: totalInput.toString(),
                });
                kernel_1.logger.debug(`RADIUS ACCT UPDATE: ${username} (↑${totalOutput} ↓${totalInput})`);
            }
        }
        // Always send accounting response
        this.sendAccountingResponse(id, authenticator, rinfo);
    }
    // ----------------------------------------------------------------
    // Packet Builders
    // ----------------------------------------------------------------
    sendAccept(id, authenticator, rinfo) {
        const attrs = this.buildAttr(RADIUS_ATTRS.REPLY_MESSAGE, Buffer.from('Welcome to AgentOS'));
        this.send(RADIUS_CODES.ACCESS_ACCEPT, id, authenticator, attrs, rinfo);
    }
    sendReject(id, authenticator, msg, rinfo) {
        const attrs = this.buildAttr(RADIUS_ATTRS.REPLY_MESSAGE, Buffer.from(msg));
        this.send(RADIUS_CODES.ACCESS_REJECT, id, authenticator, attrs, rinfo);
    }
    sendAccountingResponse(id, authenticator, rinfo) {
        this.send(RADIUS_CODES.ACCOUNTING_RESPONSE, id, authenticator, Buffer.alloc(0), rinfo);
    }
    send(code, id, reqAuthenticator, attributes, rinfo) {
        const length = 20 + attributes.length;
        const response = Buffer.alloc(length);
        response.writeUInt8(code, 0);
        response.writeUInt8(id, 1);
        response.writeUInt16BE(length, 2);
        // Response authenticator = MD5(code + id + length + req_auth + attrs + secret)
        const md5Input = Buffer.concat([
            Buffer.from([code, id]),
            Buffer.from([length >> 8, length & 0xff]),
            reqAuthenticator,
            attributes,
            Buffer.from(this.secret, 'utf8'),
        ]);
        const md5 = crypto_1.default.createHash('md5').update(md5Input).digest();
        md5.copy(response, 4);
        attributes.copy(response, 20);
        this.server.send(response, rinfo.port, rinfo.address);
    }
    buildAttr(type, value) {
        const length = 2 + value.length;
        const buf = Buffer.alloc(length);
        buf.writeUInt8(type, 0);
        buf.writeUInt8(length, 1);
        value.copy(buf, 2);
        return buf;
    }
    parseAttributes(buf) {
        const attrs = new Map();
        let offset = 0;
        while (offset < buf.length - 1) {
            const type = buf.readUInt8(offset);
            const len = buf.readUInt8(offset + 1);
            if (len < 2 || offset + len > buf.length)
                break;
            attrs.set(type, buf.slice(offset + 2, offset + len));
            offset += len;
        }
        return attrs;
    }
}
exports.RadiusAdapter = RadiusAdapter;
//# sourceMappingURL=RadiusAdapter.js.map