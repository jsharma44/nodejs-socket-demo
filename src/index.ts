import { createServer } from 'net';
import dotenv from 'dotenv';
import QrCode from './Controller/QrCode';
import CryptoJS from 'crypto-js';
import express, { Request, Response } from 'express';
dotenv.config();
const port: any = process.env.PORT ? process.env.PORT : 8097;
// Create Express server
const app = express();
// error handling for non exsistent routes
app.get('/', async (req: Request, res: Response) => {
    const products = ['Americano', 'Latte', 'Cappuccino'];
    const amounts = [1580, 1620, 1780, 1920, 1280];
    const Amount = amounts[Math.floor(Math.random() * amounts.length)];
    const product_name = products[Math.floor(Math.random() * products.length)];

    const rand = digit => {
        switch (digit) {
            case 16:
                return Math.floor(
                    1000000000000000 + Math.random() * 9000000000000000
                );

            default:
                return Math.floor(100000 + Math.random() * 900000);
        }
    };
    const str = JSON.stringify({
        vmc_no: 33333,
        qr_type: 'all',
        product_name,
        product_id: rand(16),
        Amount,
        order_no: rand(16),
    });
    const qrcode = await QrCode.generateQR(str);
    res.redirect(`https://jplofttechnologies.in/welcome.html?q=${qrcode}`);
});

app.listen(8000, () => {
    console.log('App is running at http://localhost:%d in %s mode', 8000);
});

//define host and port to run the server
const host = process.env.HOST ? process.env.HOST : 'localhost';
//Create an instance of the server
const server = createServer(onClientConnection);
//Start listening with the server on given port and host.
server.listen(port, host, () => {
    console.log(`Server started on port ${port} at ${host}`);
});

const parseBody = (body: any) => {
    try {
        body = JSON.parse(body);
    } catch (error) {
        //
    }

    return body;
};

const isType = (type: string, val: any) =>
    val.constructor.name.toLowerCase() === type.toLowerCase();

//Declare connection listener function
function onClientConnection(sock) {
    //Log when a client connnects.
    console.log(`${sock.remoteAddress}:${sock.remotePort} Connected`);
    //Listen for data from the connected client.
    sock.on('data', async function (data) {
        const body = parseBody(data);
        const isObject = isType('object', body);
        console.log('isObject', isObject);

        if (!isObject) {
            const command = `${body}`;
            const response = JSON.stringify({
                message: 'Please send a valid json object',
                body: command.trim(),
            });
            console.log(response);
            sock.write(response + '\r\n');
        } else if (!body.cmd) {
            const response = JSON.stringify({
                message: 'Please send cmd in json body',
                cmd: body,
            });
            console.log(response);
            sock.write(response + '\r\n');
        } else {
            const cmd = body.cmd;

            switch (cmd) {
                case 'qrcode':
                    const vmc_no = body.vmc_no;
                    const qr_type = body.qr_type;
                    const product_name = body.product_name;
                    const product_id = body.product_id;
                    const Amount = body.Amount;
                    const order_no = body.order_no;

                    if (
                        !vmc_no &&
                        qr_type &&
                        product_name &&
                        product_id &&
                        Amount &&
                        order_no
                    ) {
                        const response = JSON.stringify({
                            message: `Please send following
                            “cmd”:”qrcode”,
                            “vmc_no”:33333,
                            “qr_type”:”wx_pub”|”alipay”|...,
                            “product_name”:”Latte”,
                            “product_id”:801,
                            “Amount”:1580,
                            “order_no”:”xxx..xx”}
                            `,
                            cmd: body,
                        });
                        console.log(response);
                        sock.write(response + '\r\n');
                    } else {
                        const string = CryptoJS.AES.encrypt(
                            JSON.stringify({
                                vmc_no,
                                qr_type,
                                product_name,
                                product_id,
                                Amount,
                                order_no,
                            }),
                            'secret'
                        ).toString();
                        const qrcode = `https://jplofttechnologies.in/pay.html?q=${string}`;
                        const qrcode_image = await QrCode.generateQR(qrcode);
                        console.log(' md5String', string);
                        console.log('qrcode', qrcode);
                        const response = JSON.stringify({
                            cmd: 'qrcode_r',
                            vmc_no,
                            qr_type,
                            product_name,
                            qrcode,
                            Amount,
                            qrcode_image: qrcode_image,
                            order_no,
                        });
                        console.log(response);
                        sock.write(response + '\r\n');
                    }
                    break;

                default:
                    const response = JSON.stringify({
                        message: 'This command is not available',
                        cmd: body,
                    });
                    console.log(response);
                    sock.write(response + '\r\n');
                    break;
            }
        }
    });
    //Handle client connection termination.
    sock.on('close', function () {
        console.log(
            `${sock.remoteAddress}:${sock.remotePort} Terminated the connection`
        );
    });
    //Handle Client connection error.
    sock.on('error', function (error) {
        console.error(
            `${sock.remoteAddress}:${sock.remotePort} Connection Error ${error}`
        );
    });
}
