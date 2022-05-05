/*
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                               Description                                                   |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
| This script runs the primary RGB server controlling all LED matrixies. The program listens for UDP utf-8    |
| messages on port 8089. Specific colors are sent as hexadecimal ex. 0xFFFFFF for white or 0x00FF00 for green.|
| Note that not adhereing to this syntaxing will cause an error.                                              |
| On start pixel [0] turns green for 2000ms to signal that the program is running. In case of an error pixel  |
| [0] turns red for 1000ms.                                                                                   |
| After using settings(), a restart with restart() is necessary for the changes to take action.               |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
|                                                Commands                                                     |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
| Syntax                    | Example                    | Description                                        |
+─────────────────────────────────────────────────────────────────────────────────────────────────────────────+
| pixel(n,color)            | pixel(2,0xFFFFFF)          | Sets Nth pixel a certain color                     |
| stroke(n,m,color)         | stroke(2,6,0xFFFFFF)       | Fills from Nth pixel to Mth pixel a certain color  |
| clear()                   | clear()                    | Clears all pixels                                  |
| fill(color)               | fill(0xFFFFFF)             | Fills all pixels a certain color                   |
| settings(argument,value)  | settings(pixel_count,360)  | Edits data in settings.json                        |
| restart()                 | restart()                  | Restarts server                                    |
+───────────────────────────+────────────────────────────+────────────────────────────────────────────────────+
*/

// Settings
const fs = require('fs');
let settings = JSON.parse(fs.readFileSync('settings.json'));
var ledBrightness;
var ledCount;
readSettings();

// RGB
const ws281x = require('@gbkwiatt/node-rpi-ws281x-native');
const options = {
    dma: 10,
    freq: 800000,
    gpio: 18,
    invert: false,
    brightness: ledBrightness,
    stripType: ws281x.stripType.WS2812
};
const channel = ws281x(ledCount, options);
const colorArray = channel.array;

// UDP 
var dgram = require('dgram'); // Require dgram module.
var server = dgram.createSocket("udp4"); // Create udp server socket object.
var port = 8089; // UDP port
server.bind(port); // Make udp server listen on port.

// Functions
// pixel(n,color), Sets Nth pixel certain color
function pixel(n, color) {
    colorArray[n] = color;
    ws281x.render();
}

// stroke(n,m,color), Fills from Nth pixel to Mth pixel a certain color
function stroke(n, m, color) {
    for(var i=n; i <= m; i++) {
        colorArray[i] = color;
    }
    ws281x.render();
}

// clear(), Clears all pixels
function clear() {
    for(var i=0; i < colorArray.length; i++) {
        colorArray[i] = 0x000000;
    }
    ws281x.render();
}   

// fill(color), Fills all colors
function fill(color) {
    for(var i=0; i < colorArray.length; i++) {
        colorArray[i] = color;
    }
    ws281x.render();
}

// settings(argument, value), Edits settings
function setting(argument, value) {
    let settings = JSON.parse(fs.readFileSync('settings.json'));
    settings[argument] = value;
    settings = JSON.stringify(settings);
    readSettings();
    fs.writeFileSync('settings.json', settings);
}

// Closes script
function restart() {
    process.exit(0);
}

function readSettings() {
    ledBrightness = parseInt(settings["brightness"]);
    ledCount = parseInt(settings["pixel_count"]);
}



// On incoming message
server.on("message", function (message) {
    try {
        message = message.toString().replace(/ /g,''); // Replace all blank spaces
        console.log(message);
        message = message.replace(')',''); // Remove last parenthesis of command to make command more computer-friendly
        parsed_function = message.split("(")[0]; // Split command into specific function and content/values
        parsed_content = message.split("(")[1].split(","); // -||-

        switch (parsed_function) {
            case 'pixel':
                pixel(parsed_content[0],parsed_content[1]);
                break;
            case 'stroke':
                stroke(parsed_content[0],parsed_content[1],parsed_content[2]);
                break;
            case 'clear':
                clear();
                break;
            case 'fill':
                fill(parsed_content[0]);
                break;
            case 'settings':
                setting(parsed_content[0],parsed_content[1]);
                break;
            case 'restart':
                restart();
                break;
            default:
                console.log("Internal server error");
                // Visual signaling that error occurred
                colorArray[0] = 0xFF0000;
                ws281x.render();
                setTimeout(function () {
                    colorArray[0] = 0x000000;
                    ws281x.render();
                }, 1000)
        }
    }
    catch {
        console.log("Internal server error");

        // Visual signaling that error occurred
        colorArray[0] = 0xFF0000;
        ws281x.render();
        setTimeout(function () {
            colorArray[0] = 0x000000;
            ws281x.render();
        }, 1000)
    }  
});

// When udp server started and listening
server.on('listening', function () {
    // Get and print udp server listening ip address and port number in log consol 
    var address = server.address(); 
    console.log('UDP Server started and listening on ' + address.address + ":" + address.port);

    // Visual signaling that program is running
    colorArray[0] = 0x00FF00;
    ws281x.render();
    setTimeout(function () {
        colorArray[0] = 0x000000;
        ws281x.render();
    }, 2000)
});