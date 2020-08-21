import { createServer } from 'net';
import dotenv from 'dotenv';

dotenv.config();
const port: any = process.env.PORT ? process.env.PORT : 8097;

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
    sock.on('data', function (data) {
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
        } else if (!body.command) {
            const response = JSON.stringify({
                message: 'Please send commnad in json body',
                body,
            });
            console.log(response);
            sock.write(response + '\r\n');
        } else {
            // const command = body.command
            sock.write(JSON.stringify(body));
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
