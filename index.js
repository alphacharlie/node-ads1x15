
// javascript/node  rewrite of the Adafruit ads1x15 python library...
var i2c = require('i2c'); 
var async = require('async');

// chip

IC_ADS1015 = 0x00
IC_ADS1115 = 0x01

// Pointer Register
ADS1015_REG_POINTER_MASK = 0x03
ADS1015_REG_POINTER_CONVERT = 0x00
ADS1015_REG_POINTER_CONFIG = 0x01
ADS1015_REG_POINTER_LOWTHRESH = 0x02
ADS1015_REG_POINTER_HITHRESH = 0x03

// Config Register
ADS1015_REG_CONFIG_OS_MASK = 0x8000
ADS1015_REG_CONFIG_OS_SINGLE = 0x8000 // Write: Set to start a single-conversion
ADS1015_REG_CONFIG_OS_BUSY = 0x0000 // Read: Bit = 0 when conversion is in progress
ADS1015_REG_CONFIG_OS_NOTBUSY = 0x8000 // Read: Bit = 1 when device is not performing a conversion
ADS1015_REG_CONFIG_MUX_MASK = 0x7000
ADS1015_REG_CONFIG_MUX_DIFF_0_1 = 0x0000 // Differential P = AIN0, N = AIN1 (default)
ADS1015_REG_CONFIG_MUX_DIFF_0_3 = 0x1000 // Differential P = AIN0, N = AIN3
ADS1015_REG_CONFIG_MUX_DIFF_1_3 = 0x2000 // Differential P = AIN1, N = AIN3
ADS1015_REG_CONFIG_MUX_DIFF_2_3 = 0x3000 // Differential P = AIN2, N = AIN3
ADS1015_REG_CONFIG_MUX_SINGLE_0 = 0x4000 // Single-ended AIN0
ADS1015_REG_CONFIG_MUX_SINGLE_1 = 0x5000 // Single-ended AIN1
ADS1015_REG_CONFIG_MUX_SINGLE_2 = 0x6000 // Single-ended AIN2
ADS1015_REG_CONFIG_MUX_SINGLE_3 = 0x7000 // Single-ended AIN3
ADS1015_REG_CONFIG_PGA_MASK = 0x0E00
ADS1015_REG_CONFIG_PGA_6_144V = 0x0000 // +/-6.144V range
ADS1015_REG_CONFIG_PGA_4_096V = 0x0200 // +/-4.096V range
ADS1015_REG_CONFIG_PGA_2_048V = 0x0400 // +/-2.048V range (default)
ADS1015_REG_CONFIG_PGA_1_024V = 0x0600 // +/-1.024V range
ADS1015_REG_CONFIG_PGA_0_512V = 0x0800 // +/-0.512V range
ADS1015_REG_CONFIG_PGA_0_256V = 0x0A00 // +/-0.256V range
ADS1015_REG_CONFIG_MODE_MASK = 0x0100
ADS1015_REG_CONFIG_MODE_CONTIN = 0x0000 // Continuous conversion mode
ADS1015_REG_CONFIG_MODE_SINGLE = 0x0100 // Power-down single-shot mode (default)
ADS1015_REG_CONFIG_DR_MASK = 0x00E0
ADS1015_REG_CONFIG_DR_128SPS = 0x0000 // 128 samples per second
ADS1015_REG_CONFIG_DR_250SPS = 0x0020 // 250 samples per second
ADS1015_REG_CONFIG_DR_490SPS = 0x0040 // 490 samples per second
ADS1015_REG_CONFIG_DR_920SPS = 0x0060 // 920 samples per second
ADS1015_REG_CONFIG_DR_1600SPS = 0x0080 // 1600 samples per second (default)
ADS1015_REG_CONFIG_DR_2400SPS = 0x00A0 // 2400 samples per second
ADS1015_REG_CONFIG_DR_3300SPS = 0x00C0 // 3300 samples per second (also 0x00E0)
ADS1115_REG_CONFIG_DR_8SPS = 0x0000 // 8 samples per second
ADS1115_REG_CONFIG_DR_16SPS = 0x0020 // 16 samples per second
ADS1115_REG_CONFIG_DR_32SPS = 0x0040 // 32 samples per second
ADS1115_REG_CONFIG_DR_64SPS = 0x0060 // 64 samples per second
ADS1115_REG_CONFIG_DR_128SPS = 0x0080 // 128 samples per second
ADS1115_REG_CONFIG_DR_250SPS = 0x00A0 // 250 samples per second (default)
ADS1115_REG_CONFIG_DR_475SPS = 0x00C0 // 475 samples per second
ADS1115_REG_CONFIG_DR_860SPS = 0x00E0 // 860 samples per second
ADS1015_REG_CONFIG_CMODE_MASK = 0x0010
ADS1015_REG_CONFIG_CMODE_TRAD = 0x0000 // Traditional comparator with hysteresis (default)
ADS1015_REG_CONFIG_CMODE_WINDOW = 0x0010 // Window comparator
ADS1015_REG_CONFIG_CPOL_MASK = 0x0008
ADS1015_REG_CONFIG_CPOL_ACTVLOW = 0x0000 // ALERT/RDY pin is low when active (default)
ADS1015_REG_CONFIG_CPOL_ACTVHI = 0x0008 // ALERT/RDY pin is high when active
ADS1015_REG_CONFIG_CLAT_MASK = 0x0004 // Determines if ALERT/RDY pin latches once asserted
ADS1015_REG_CONFIG_CLAT_NONLAT = 0x0000 // Non-latching comparator (default)
ADS1015_REG_CONFIG_CLAT_LATCH = 0x0004 // Latching comparator
ADS1015_REG_CONFIG_CQUE_MASK = 0x0003
ADS1015_REG_CONFIG_CQUE_1CONV = 0x0000 // Assert ALERT/RDY after one conversions
ADS1015_REG_CONFIG_CQUE_2CONV = 0x0001 // Assert ALERT/RDY after two conversions
ADS1015_REG_CONFIG_CQUE_4CONV = 0x0002 // Assert ALERT/RDY after four conversions
ADS1015_REG_CONFIG_CQUE_NONE = 0x0003 // Disable the comparator and put ALERT/RDY in high state (default)

// This is a javascript port of python, so use objects instead of dictionaries here 
// These simplify and clean the code (avoid the abuse of if/elif/else clauses)
var spsADS1115 = {
  8   : ADS1115_REG_CONFIG_DR_8SPS,
  16  : ADS1115_REG_CONFIG_DR_16SPS,
  32  : ADS1115_REG_CONFIG_DR_32SPS,
  64  : ADS1115_REG_CONFIG_DR_64SPS,
  128 : ADS1115_REG_CONFIG_DR_128SPS,
  250 : ADS1115_REG_CONFIG_DR_250SPS,
  475 : ADS1115_REG_CONFIG_DR_475SPS,
  860 : ADS1115_REG_CONFIG_DR_860SPS
};

var spsADS1015 = {
  128   : ADS1015_REG_CONFIG_DR_128SPS,
  250   : ADS1015_REG_CONFIG_DR_250SPS,
  490   : ADS1015_REG_CONFIG_DR_490SPS,
  920   : ADS1015_REG_CONFIG_DR_920SPS,
  1600  : ADS1015_REG_CONFIG_DR_1600SPS,
  2400  : ADS1015_REG_CONFIG_DR_2400SPS,
  3300  : ADS1015_REG_CONFIG_DR_3300SPS
};

// Dictionary with the programable gains

var pgaADS1x15 = {
  6144 : ADS1015_REG_CONFIG_PGA_6_144V,
  4096 : ADS1015_REG_CONFIG_PGA_4_096V,
  2048 : ADS1015_REG_CONFIG_PGA_2_048V,
  1024 : ADS1015_REG_CONFIG_PGA_1_024V,
  512  : ADS1015_REG_CONFIG_PGA_0_512V,
  256  : ADS1015_REG_CONFIG_PGA_0_256V
};

// set up I2C for ADS1015/ADS1115

function ads1x15(ic, address) {
  if(!(ic))
  {
    ic = IC_ADS1015;       // default to ads1015...
  }
  if(!(address))
  {
    address = 0x48;       // Address pin tied to ground gives us 1001000 (or 0x48)
  }

  if(!(ic == IC_ADS1015 | ic == IC_ADS1115))
  {
    throw "Error: not a supported device";
  }
  this.ic = ic; // 0 for ads1015, 1 for ads1115;
  this.address = address; //defaults to 0x48 for addr pin tied to ground
  this.pga = 6144; //set this to a sane default...
  this.wire = new i2c(address, { device : '/dev/i2c-1' } );   // Raspberry Pi2 uses I2c address 1... (change to '/dev/i2c-1' for old Pi 1)

}


// Gets a single-ended ADC reading from the specified channel in mV. \
// The sample rate for this mode (single-shot) can be used to lower the noise \
// (low sps) or to lower the power consumption (high sps) by duty cycling, \
// see datasheet page 14 for more info. \
// The pga must be given in mV, see page 13 for the supported values.


ads1x15.prototype.readADCSingleEnded = function(channel, pga, sps, callback) {

  var self  = this;

  if(!channel)
    channel = 0;
  if(!pga)
    pga = 6144;
  if(!sps)
    sps = 250;

  if(channel > 3 || channel < 0)
  {
    callback("Error: Channel must be between 0 and 3");
  }

// Disable comparator, Non-latching, Alert/Rdy active low
// traditional comparator, single-shot mode
  var config =  ADS1015_REG_CONFIG_CQUE_NONE | ADS1015_REG_CONFIG_CLAT_NONLAT | ADS1015_REG_CONFIG_CPOL_ACTVLOW | ADS1015_REG_CONFIG_CMODE_TRAD | ADS1015_REG_CONFIG_MODE_SINGLE;
   

// Set sample per seconds, defaults to 250sps
// If sps is in the dictionary (defined in init) it returns the value of the constant
// othewise it returns the value for 250sps. This saves a lot of if/elif/else code!

  if (self.ic == IC_ADS1015)
  {
    if(spsADS1015[sps])
    {
      config |= spsADS1015[sps];
    }
    else callback("ADS1x15: Invalid sps specified");
  }
  else
  {
    if (!(spsADS1115[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    else
    {
      config |= spsADS1115[sps];
    }
  }
  // Set PGA/voltage range, defaults to +-6.144V
  if (!(pgaADS1x15[pga]))
  {
    callback("ADS1x15: Invalid pga specified");
  }
  else
  {
    config |= pgaADS1x15[pga];
  }
  this.pga = pga

  // Set the channel to be converted
  if ( channel == 3)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
  }
  else if(channel == 2)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
  }
  else if(channel == 1)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
  }

  // Set 'start single-conversion' bit
  config |= ADS1015_REG_CONFIG_OS_SINGLE;

  // Write config register to the ADC
  var bytes = [(config >> 8) & 0xFF, config & 0xFF]
  self.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) {
    if(err)
    {
      console.log("We've got an Error, Lance Constable Carrot!: " + err.toString());
      callback(err);
    }

    // Wait for the ADC conversion to complete
    // The minimum delay depends on the sps: delay >= 1/sps
    // We add 0.1ms to be sure
    var delay = 1.0 /sps +0.0002;
    setTimeout(function() {
     // Read the conversion results
      self.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, function(err, res) {
        if(err)
        {
          console.log("We've got an Error, Lance Constable Carrot!: " + err.toString());
          callback(err);
        }
        var data = -0.1;
        if (self.ic == IC_ADS1015)
        {
          // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
          console.log('is ads1015');

          console.log('res0 = ' + res[0] + ', res1: ' + res[1]);
        
          var data = ( ((res[0] << 8) | (res[1] & 0xFF)) >> 4 ) * self.pga / 2048.0;
          callback(null, data);
      }
      else
      {
        console.log('is ads1115');
        // Return a mV value for the ADS1115
        // (Take signed values into account as well)
        data = -0.1;
        var val = (res[0] << 8) | (res[1])
        if (val > 0x7FFF)
        {
          data = (val - 0xFFFF) * pga / 32768.0;
        }
        else
        {
          data = ( (res[0] << 8) | (res[1]) ) * pga / 32768.0;
        }
        callback(null, data);
      }
    });
    }, delay);
  
  });

}


// Gets a differential ADC reading from channels chP and chN in mV. \
// The sample rate for this mode (single-shot) can be used to lower the noise \
// (low sps) or to lower the power consumption (high sps) by duty cycling, \
// see data sheet page 14 for more info. \
// The pga must be given in mV, see page 13 for the supported values.

ads1x15.prototype.readADCDifferential = function(chP, chN, pga, sps, callback) {

  var self = this;
  //set defaults if not provided
  if(!chP)
    chP = 0;
  if(!chN)
    chN = 1;
  if(!pga)
    pga=6144;
  if(!sps)
    sps=250;

  // Disable comparator, Non-latching, Alert/Rdy active low
  // traditional comparator, single-shot mode
  config = ADS1015_REG_CONFIG_CQUE_NONE | ADS1015_REG_CONFIG_CLAT_NONLAT | 
  ADS1015_REG_CONFIG_CPOL_ACTVLOW | ADS1015_REG_CONFIG_CMODE_TRAD | 
  ADS1015_REG_CONFIG_MODE_SINGLE;

  // Set channels
  if ( (chP == 0) & (chN == 1) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_0_1;
  }
  else if ( (chP == 0) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_0_3;
  }
  else if ( (chP == 2) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_2_3;
  }
  else if ( (chP == 1) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_1_3;
  }
  else
  {
    console.log( "ADS1x15: Invalid channels specified");
    callback("ADS1x15: Invalid channels specified");
  }

  // Set sample per seconds, defaults to 250sps
  // If sps is in the dictionary (defined in init()) it returns the value of the constant
  // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!
  if (this.ic == IC_ADS1015)
  {
    config |= spsADS1015[sps];
  }
    else
  {
    if (!(spsADS1115[sps]))
    {
      callback("ADS1x15: Invalid pga specified");
    }
    else
    {
      config |= spsADS1115[sps];
    }
  }
  // Set PGA/voltage range, defaults to +-6.144V
  if (!(pgaADS1x15[pga]))
  {
    callback("ADS1x15: Invalid pga specified");
  }
  else
  {
    config |= pgaADS1x15[pga];
    this.pga = pga;
  }
  // Set 'start single-conversion' bit
  config |= ADS1015_REG_CONFIG_OS_SINGLE;
  // Write config register to the ADC
  bytes = [(config >> 8) & 0xFF, config & 0xFF];
  self.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) {
    if(err)
    {
      callback("We've got an Error, Lance Constable Carrot!: " + err.toString());
    }
  });
  // Wait for the ADC conversion to complete
  // The minimum delay depends on the sps: delay >= 1/sps
  // We add 0.1ms to be sure

  delay = 1.0 / sps+0.0001;

  setTimeout(function() {
    self.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, function(err, res) {
      if (self.ic == IC_ADS1015)
      {
        // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
        var data = ( ((res[0] << 8) | (res[1] & 0xFF)) >> 4 ) * pga / 2048.0;
        callback(null, data);
      }
      else
      {
        // Return a mV value for the ADS1115
        // (Take signed values into account as well)
        var data = -1;
        var val = (res[0] << 8) | (res[1]);
        if (val > 0x7FFF)
        {
          data =  (val - 0xFFFF) * pga / 32768.0;
        }
        else
        {
          data =  ( (res[0] << 8) | (res[1]) ) * pga / 32768.0;
        }
        callback(null, data);
      }
    });
  }, delay);

}


// Gets a differential ADC reading from channels 0 and 1 in mV
// The sample rate for this mode (single-shot) can be used to lower the noise 
// (low sps) or to lower the power consumption (high sps) by duty cycling, 
// see data sheet page 14 for more info. 
// The pga must be given in mV, see page 13 for the supported values.

ads1x15.prototype.readADCDifferential01 = function(pga, sps, callback) {
  if(!pga)
    pga=6144;
  if(!sps)
    sps=250;

  return this.readADCDifferential(0, 1, pga, sps, callback);
}


// Gets a differential ADC reading from channels 0 and 3 in mV 
// The sample rate for this mode (single-shot) can be used to lower the noise 
// (low sps) or to lower the power consumption (high sps) by duty cycling, 
// see data sheet page 14 for more info. 
// The pga must be given in mV, see page 13 for the supported values.

ads1x15.prototype.readADCDifferential03 = function (pga, sps, callback) {
  if(!pga)
    pga=6144;
  if(!sps)
    sps=250;
  return this.readADCDifferential(0, 3, pga, sps, callback);
}


// Gets a differential ADC reading from channels 1 and 3 in mV 
// The sample rate for this mode (single-shot) can be used to lower the noise 
// (low sps) or to lower the power consumption (high sps) by duty cycling, 
// see data sheet page 14 for more info. 
// The pga must be given in mV, see page 13 for the supported values.

ads1x15.prototype.readADCDifferential13 = function(pga, sps, callback) {
  if(!pga)
    pga = 6144;
  if(!sps)
    sps = 250;

  return this.readADCDifferential(1, 3, pga, sps, callback);
}


// Gets a differential ADC reading from channels 2 and 3 in mV 
// The sample rate for this mode (single-shot) can be used to lower the noise 
// (low sps) or to lower the power consumption (high sps) by duty cycling,
// see data sheet page 14 for more info. 
// The pga must be given in mV, see page 13 for the supported values.

ads1x15.prototype.readADCDifferential23 = function(pga, sps, callback) { 
  if(!pga)
    pga = 6144;
  if(!sps)
    sps = 250;

  return this.readADCDifferential(2, 3, pga, sps, callback);
}


// Starts the continuous conversion mode and returns the first ADC reading 
// in mV from the specified channel. 
// The sps controls the sample rate. 
// The pga must be given in mV, see datasheet page 13 for the supported values. 
// Use getLastConversionResults() to read the next values and 
// stopContinuousConversion() to stop converting.

ads1x15.prototype.startContinuousConversion = function(channel, pga, sps, callback) {
  var self = this;

  if(!channel)
    channel = 0;
  if(!pga)
    pga = 6144;
  if(!sps)
    sps = 250;

  // Default to channel 0 with invalid channel, or return -1?
  if (channel > 3)
  {
    callback( "ADS1x15: Invalid channel specified, Lance Corporal Carrot!");
  }

  // Disable comparator, Non-latching, Alert/Rdy active low
  // traditional comparator, continuous mode
  // The last flag is the only change we need, page 11 datasheet

  config = ADS1015_REG_CONFIG_CQUE_NONE | ADS1015_REG_CONFIG_CLAT_NONLAT | 
  ADS1015_REG_CONFIG_CPOL_ACTVLOW | ADS1015_REG_CONFIG_CMODE_TRAD | 
  ADS1015_REG_CONFIG_MODE_CONTIN;

  // Set sample per seconds, defaults to 250sps
  // If sps is in the dictionary (defined in init()) it returns the value of the constant
  // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!
  if (this.ic == IC_ADS1015)
  {
    config |= spsADS1015[sps];
  }
  else
  {
    if (!(spsADS1115[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    else
    {
      config |= spsADS1115[sps];
    }
  }
  // Set PGA/voltage range, defaults to +-6.144V
  if (!(pgaADS1x15[pga]))
  {
    callback("ADS1x15: Invalid pga specified");
  }
  else
  {
    config |= pgaADS1x15[pga];
  }
  this.pga = pga;

  // Set the channel to be converted
  if (channel == 3)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
  }
  else if(channel == 2)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
  }
  else if(channel == 1)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
  }
  // Set 'start single-conversion' bit to begin conversions
  // No need to change this for continuous mode!
  config |= ADS1015_REG_CONFIG_OS_SINGLE;

  // Write config register to the ADC
  // Once we write the ADC will convert continously
  // we can read the next values using getLastConversionResult

  bytes = [(config >> 8) & 0xFF, config & 0xFF];
  self.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) {
    if(err)
    {
      callback("We've got an Error, Lance Constable Carrot!: " + err.toString());
    }
  });
  // Wait for the ADC conversion to complete
  // The minimum delay depends on the sps: delay >= 1/sps
  // We add 0.1ms to be sure

  delay = 1.0 / sps+0.0001;
  setTimeout(function() {
    self.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, function(err, res) {
      if (this.ic == IC_ADS1015)
      {
        // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
        var data =  ( ((res[0] << 8) | (res[1] & 0xFF)) >> 4 ) * pga / 2048.0;
        callback(null, data);
      }
      else
      {
        // Return a mV value for the ADS1115
        // (Take signed values into account as well)
        var data = -1;
        var val = (res[0] << 8) | (res[1]);
        if (val > 0x7FFF)
        {
          data =  (val - 0xFFFF) * pga / 32768.0;
        }
        else
        {
          data = ( (res[0] << 8) | (res[1]) ) * pga / 32768.0;
        }
        callback(null, data);
      }
    });
  }, delay);

  
}


// Stops the ADC's conversions when in continuous mode \
// and resets the configuration to its default value."

ads1x15.prototype.stopContinuousConversion = function(callback) {

  // Write the default config register to the ADC
  // Once we write, the ADC will do a single conversion and
  //  enter power-off mode.

  config = 0x8583; // Page 18 datasheet.
  bytes = [(config >> 8) & 0xFF, config & 0xFF];
  this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) {
    if(err)
    {
      console.log("Error: " + err);
      callback(err);
    }
    else return true;
  });
}

// Returns the last ADC conversion result in mV

ads1x15.prototype.getLastConversionResults = function(callback) {

  // Read the conversion results
  this.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, function(err, res) {
    if (this.ic == IC_ADS1015)
    {
      // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
      var data = ( ((res[0] << 8) | (res[1] & 0xFF)) >> 4 ) * this.pga / 2048.0;
      callback(null, data);
    }
    else
    {
      // Return a mV value for the ADS1115
      // (Take signed values into account as well)
      var data = -1;
      var val = (res[0] << 8) | (res[1])
      if (val > 0x7FFF)
      {
        data =  (val - 0xFFFF) * this.pga / 32768.0;
      }
      else
      {
        data =  ( (res[0] << 8) | (res[1]) ) * this.pga / 32768.0;
      }
    }
  });
}


// Starts the comparator mode on the specified channel, see datasheet pg. 15. 
// In traditional mode it alerts (ALERT pin will go low) when voltage exceeds 
// thresholdHigh until it falls below thresholdLow (both given in mV). 
// In window mode (traditionalMode=False) it alerts when voltage doesn't lie
// between both thresholds.
// In latching mode the alert will continue until the conversion value is read. 
// numReadings controls how many readings are necessary to trigger an alert: 1, 2 or 4.
// Use getLastConversionResults() to read the current value (which may differ 
// from the one that triggered the alert) and clear the alert pin in latching mode. 
// This function starts the continuous conversion mode. The sps controls 
// the sample rate and the pga the gain, see datasheet page 13. 

ads1x15.prototype.startSingleEndedComparator = function(channel, thresholdHigh, thresholdLow, pga, sps, activeLow, traditionalMode, latching, numReadings, callback) {
  if(!(pga))
    pga = 6144;
  if(!(sps))
    sps = 250;
  if(!(activeLow))
    activeLow = true;
  if(!(traditionalMode))
    traditionalMode = true;
  if(!(latching))
    latching = false;
  if(!(numReadings))
    numReadings = 1;

  // With invalid channel return -1
  if (channel > 3)
  {
     console.log("ADS1x15: Invalid channel specified");
     callback("ADS1x15: Invalid channel specified");
  }

  // Continuous mode
  config = ADS1015_REG_CONFIG_MODE_CONTIN;
  if (activeLow == false)
  {
    config |= ADS1015_REG_CONFIG_CPOL_ACTVHI;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CPOL_ACTVLOW;
  }
  if (traditionalMode == false)
  {
    config |= ADS1015_REG_CONFIG_CMODE_WINDOW;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CMODE_TRAD;
  }
  if (latching == true)
  {
    config |= ADS1015_REG_CONFIG_CLAT_LATCH;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CLAT_NONLAT;
  }
  if (numReadings == 4)
  {
    config |= ADS1015_REG_CONFIG_CQUE_4CONV;
  }
  else if(numReadings == 2)
  {
    config |= ADS1015_REG_CONFIG_CQUE_2CONV;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CQUE_1CONV;
  }
  // Set sample per seconds, defaults to 250sps
  // If sps is in the dictionary (defined in init()) it returns the value of the constant
  // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!
  if (this.ic == IC_ADS1015)
  {
    if (!(spsADS1015[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    config |= spsADS1015[sps];
  }
  else
  {
    if (!(spsADS1115[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    config |= spsADS1115[sps];
  }
  // Set PGA/voltage range, defaults to +-6.144V
  if (!(pgaADS1x15[pga]))
  {
    callback("ADS1x15: Invalid pga specified");
  }
  config |= pgaADS1x15[pga];
  this.pga = pga

  // Set the channel to be converted
  if (channel == 3)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
  }
  else if( channel == 2)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
  }
  else if(channel == 1)
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
  }

  // Set 'start single-conversion' bit to begin conversions
  config |= DS1015_REG_CONFIG_OS_SINGLE;

  // Write threshold high and low registers to the ADC
  // V_digital = (2^(n-1)-1)/pga*V_analog
  var thresholdHighWord = 0;

  if (this.ic == IC_ADS1015)
  {
    thresholdHighWORD = int(thresholdHigh*(2048.0/pga));
  }
  else
  {
    thresholdHighWORD = int(thresholdHigh*(32767.0/pga));
  }

  var bytes = [(thresholdHighWORD >> 8) & 0xFF, thresholdHighWORD & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_HITHRESH, bytes, function(err){
    if(err)
    {
      callback(err);
    }
  });
  var thresholdLowWORD = 0;

  if (this.ic == IC_ADS1015)
  {
    thresholdLowWORD = int(thresholdLow*(2048.0/pga));
  }
  else
  {
    thresholdLowWORD = int(thresholdLow*(32767.0/pga));
  }
  var bytes = [(thresholdLowWORD >> 8) & 0xFF, thresholdLowWORD & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_LOWTHRESH, bytes, function(err) { 
    if(err){
      callback(err);
    }
  });

  // Write config register to the ADC
  // Once we write the ADC will convert continously and alert when things happen,
  // we can read the converted values using getLastConversionResult
  bytes = [(config >> 8) & 0xFF, config & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) { 
    if(err){
      callback(err);
    }
  });
}

// Starts the comparator mode on the specified channel, see datasheet pg. 15. \
// In traditional mode it alerts (ALERT pin will go low) when voltage exceeds \
// thresholdHigh until it falls below thresholdLow (both given in mV). \
// In window mode (traditionalMode=False) it alerts when voltage doesn't lie\
// between both thresholds.\
// In latching mode the alert will continue until the conversion value is read. \
// numReadings controls how many readings are necessary to trigger an alert: 1, 2 or 4.\
// Use getLastConversionResults() to read the current value (which may differ \
// from the one that triggered the alert) and clear the alert pin in latching mode. \
// This function starts the continuous conversion mode. The sps controls \
// the sample rate and the pga the gain, see datasheet page 13. "

ads1x15.prototype.startDifferentialComparator = function(chP, chN, thresholdHigh, thresholdLow, pga, sps, activeLow, traditionalMode, latching, numReadings, callback) {
 if(!(pga))
    pga = 6144;
  if(!(sps))
    sps = 250;
  if(!(activeLow))
    activeLow = true;
  if(!(traditionalMode))
    traditionalMode = true;
  if(!(latching))
    latching = false;
  if(!(numReadings))
    numReadings = 1;

  // Continuous mode
  config = ADS1015_REG_CONFIG_MODE_CONTIN;
  if (activeLow==False)
  {
    config |= ADS1015_REG_CONFIG_CPOL_ACTVHI;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CPOL_ACTVLOW;
  }
  if (!traditionalMode)
  {
    config |= ADS1015_REG_CONFIG_CMODE_WINDOW;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CMODE_TRAD;
  }
  if (latching)
  {
    config |= ADS1015_REG_CONFIG_CLAT_LATCH;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CLAT_NONLAT;
  }
  if (numReadings==4) 
  {
    config |= ADS1015_REG_CONFIG_CQUE_4CONV;
  }
  else if(numReadings==2)
  {
    config |= ADS1015_REG_CONFIG_CQUE_2CONV;
  }
  else
  {
    config |= ADS1015_REG_CONFIG_CQUE_1CONV;
  }

  // Set sample per seconds, defaults to 250sps
  // If sps is in the dictionary (defined in init()) it returns the value of the constant
  // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!
  if (this.ic == IC_ADS1015)
  {
    if (!(spsADS1015[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    config |= spsADS1015[sps];
  }
  else
  {
    if (!(spsADS1115[sps]))
    {
      callback("ADS1x15: Invalid sps specified");
    }
    config |= spsADS1115[sps];
  }

  // Set PGA/voltage range, defaults to +-6.144V
  if (!(pgaADS1x15[pga]))
  {
     callback("ADS1x15: Invalid pga specified");
  }
  config |= pgaADS1x15[pga];
  this.pga = pga;

  // Set channels
  if ( (chP == 0) & (chN == 1) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_0_1;
  }
  else if ( (chP == 0) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_0_3;
  }
  else if ( (chP == 2) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_2_3;
  }
  else if ( (chP == 1) & (chN == 3) )
  {
    config |= ADS1015_REG_CONFIG_MUX_DIFF_1_3;
  }
  else
  {
    callback("ADS1x15: Invalid channels specified");
  }
  // Set 'start single-conversion' bit to begin conversions
  config |= ADS1015_REG_CONFIG_OS_SINGLE;

  // Write threshold high and low registers to the ADC
  // V_digital = (2^(n-1)-1)/pga*V_analog;

  var thresholdHighWORD = 0;
  if (this.ic == IC_ADS1015)
  {
    thresholdHighWORD = int(thresholdHigh*(2048.0/pga));
  } 
  else
  {
    thresholdHighWORD = int(thresholdHigh*(32767.0/pga));
  }
  var bytes = [(thresholdHighWORD >> 8) & 0xFF, thresholdHighWORD & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_HITHRESH, bytes, function(err) { 
    callback(err);
  });

  var thresholdLowWORD = 0;
  if (this.ic == IC_ADS1015)
  {
    thresholdLowWORD = int(thresholdLow*(2048.0/pga));
  }
  else
  {
    thresholdLowWORD = int(thresholdLow*(32767.0/pga));
  }
  bytes = [(thresholdLowWORD >> 8) & 0xFF, thresholdLowWORD & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_LOWTHRESH, bytes, function(err) { 
    if(err)
      callback(err);
  });

  // Write config register to the ADC
  // Once we write the ADC will convert continously and alert when things happen,
  // we can read the converted values using getLastConversionResult

  bytes = [(config >> 8) & 0xFF, config & 0xFF];

  this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, function(err) {
    if(err)
      callback(err);
  });
}

module.exports = ads1x15;
