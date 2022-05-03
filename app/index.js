// UDP 
var dgram = require('dgram'); // Require dgram module.
var server = dgram.createSocket("udp4"); // Create udp server socket object.
server.bind(8089); // Make udp server listen on port 8089.

// Settings
const fs = require('fs');
let settings = JSON.parse(fs.readFileSync('settings.json'));
ledBrightness = settings["brightness"];
ledCount = settings["pixel_count"];

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

// Visual signaling that program is running
colorArray[0] = 0x00FF00;
setTimeout(function () {
    colorArray[0] = 0x000000;
}, 500)


// Functions
function pixel(n, color) {
    colorArray[n] = color;
    ws281x.render();
}

function clear() {
    array1.map(function(x) {  
        return '#000000'
      });
    ws281x.render();
}   

function setting(argument, value) {
    let settings = JSON.parse(fs.readFileSync('settings.json'));
    settings[argument] = value;
    settings = JSON.stringify(settings);
    fs.writeFileSync('student-2.json', settings);
}

// When udp server receive message.
server.on("message", function (message) {

    message = message.replace(/ /g,'');
    message = message.replace(')','');
    parsed_function = message.split("(")[0];
    parsed_content = message.split("(")[1].split(",");

    console.log(message);
    console.log(parsed_function);
    console.log(parsed_content);

    try {
        switch (parsed_function) {
            case 'pixel': // pixel(n,color), Sets Nth pixel certain color
                pixel(parsed_content[0],parsed_content[1]);
                break;
            case 'clear': // clear(), Clears all pixels
                clear();
                break;
            case 'settings': // settings(argument, value), Edits settings
                setting(parsed_content[0],parsed_content[1]);
                break;
        }
    }
    catch {
        console.log("Internal server error");
        // Visual signaling that error occurred
        colorArray[0] = 0xFF0000;
        setTimeout(function () {
            colorArray[0] = 0x000000;
        }, 500)
    }  
});

// When udp server started and listening.
server.on('listening', function () {
    // Get and print udp server listening ip address and port number in log console. 
    var address = server.address(); 
    console.log('UDP Server started and listening on ' + address.address + ":" + address.port);
});