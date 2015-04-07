node-ads1x15
=========

A library providing access to ADS1015 and ADS1115 I2C analog to digital converters on Raspberry Pi. Basically a javascript port of the python library from Adafruit.

## Installation

  npm install node-ads1x15 --save

## Usage

  var ads1x15 = require('node-ads1x15');
  var chip = 0; //0 for ads1015, 1 for ads1115
  var adc = new ads1x15(chip); //optionally i2c address as (chip, address) but only if addr pin NOT tied to ground...
  var channel = 0; //channel 0, 1, 2, or 3...
  var samplesPerSecond = '250'; // see index.js for allowed values for your chip
  var progGainAmp = '4096'; // see index.js for allowed values for your chip

  //somewhere to store our reading 
  var reading  = 0;
  if(!adc.busy)
  {
    adc.readADCSingleEnded(channel, samplesPerSecond, progGainAmp, function(err, data) { 
      if(err)
      {
        //logging / troubleshooting code goes here...
        throw err;
      }
      // if you made it here, then the data object contains your reading!
      reading = data;
      // any other data processing code goes here...
    );
  }
  
## Tests

  none (yet)

## Contributing

  contact info@boffinry.org with any bugs.

## Release History

* 1.0.0 Initial release
  1.0.1 added adc.busy flag to prevent user from grabbing a reading from a previous request