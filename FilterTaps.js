var contextClass = null,
	context = null,
	source = null,
	filterBank = null;

var filterGainHandler = function(e) {
	var fraction = parseFloat(e.value) / parseFloat(e.max),
		factor = Math.pow(fraction, 2),
		gainStage = filterBank.gainStages[+e.getAttribute('data-gainstage')];

	gainStage.gain.setValueAtTime(factor, context.currentTime);
}

var wetDryHandler = function(e) {
	var val = parseFloat(e.value),
		max = parseFloat(e.max),
		fraction = parseFloat(val / max),
		wetFactor = Math.pow(fraction, 2),
		dryFactor = Math.pow((1 - fraction), 2);

	if (val == 0) {
		wetFactor = 0;
		dryFactor = 1;
	} else if (val == 1) {
		wetFactor = 1;
		dryFactor = 0;
	}

	filterBank.wetGain.gain.setValueAtTime(wetFactor, context.currentTime);
	filterBank.dryGain.gain.setValueAtTime(dryFactor, context.currentTime);
}

document.addEventListener('DOMContentLoaded', function() {
    contextClass = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);

    if (contextClass) {
        context = new contextClass();
    }

	source = context.createMediaElementSource(document.getElementById('source'));

	filterBank = new ResonantFilterBank(context);

	source.connect(filterBank.audioIn);
	filterBank.connect(context.destination);
});

// first we're going to want a class for a delay line, so that when we're
// constructing the FilterTaps we can just instantiate a bunch of DelayLines

var DelayLine = (function(context) {

	var DelayLine = function(context) {
		this.context = context;
		this.audioIn = this.context.createGain();
		this.audioOut = this.context.createGain();
		this.delay = this.context.createDelay();
		this.filter = this.context.createBiquadFilter();

		this.init();
	}

	DelayLine.prototype.constructor = DelayLine;

	DelayLine.prototype.init = function() {
		// init function
		var self = this,
			context = self.context;

		self.audioIn.connect(self.delay);
		self.delay.connect(self.filter);
		self.filter.connect(self.audioOut);
		self.audioOut.connect(context.destination);
	}

	DelayLine.prototype.connect = function(node) {
		this.audioOut.connect(node);
	}

	return DelayLine;

})();

var FilterTaps = (function(context) {

	var FilterTaps = function(context) {
		// constructor
		this.context = context;
		this.delayLines = [];
		this.audioIn = this.context.createGain();
		this.audioOut = this.context.createGain();
		this.

		this.init();
	}

	FilterTaps.prototype.constructor = FilterTaps;

	FilterTaps.prototype.init = function() {
		var self = this,
			context = self.context;

		// init;
	}

	FilterTaps.prototype.connect = function(node) {
		this.audioOut.connect(node);
	}

	return FilterTaps;

})();

var ResonantFilterBank = (function(context) {

	var ResonantFilterBank = function(context) {
		this.context = context;
		this.filters = [];
		this.gainStages = [];
		this.audioIn = this.context.createGain();
		this.audioOut = this.context.createGain();
		this.wetGain = this.context.createGain();
		this.dryGain = this.context.createGain();
		this.compressor = this.context.createDynamicsCompressor();

		this.init();
	}

	ResonantFilterBank.prototype.constructor = ResonantFilterBank;

	ResonantFilterBank.prototype.init = function() {
		var self = this,
			context = self.context;

		self.wetGain.gain.setValueAtTime(0, context.currentTime);
		self.dryGain.gain.setValueAtTime(1, context.currentTime);
		self.compressor.threshold.setValueAtTime(-56, context.currentTime);

		self.compressor.connect(self.wetGain);
		self.audioIn.connect(self.dryGain);
		self.wetGain.connect(self.audioOut);
		self.dryGain.connect(self.audioOut);
		self.audioOut.connect(context.destination);

		self.makeFilters();
	}

	ResonantFilterBank.prototype.makeFilters = function() {
		var self = this,
			context = self.context,
			bands = [0, 37, 50, 75, 100, 250, 250, 250, 400, 600, 800, 1200, 1600, 1400],
			baseFreq = 88,
			baseQ = 400;

		var makeFilter = function(i, band) {
			var filter = context.createBiquadFilter(),
				filterType = "bandpass",
				freq = baseFreq + band,
				q = baseQ,
				gain = 0;

			if (i == 0 || i == (bands.length - 1)) {
				q = 30;
				filterType = (i == 0) ? "lowpass" : "highpass";
			} else {
				gain = 20;
			}

			filter.type = filterType;
			filter.gain.setValueAtTime(gain, context.currentTime);
			filter.Q.setValueAtTime(q, context.currentTime);
			filter.frequency.setValueAtTime(freq, context.currentTime);
			self.audioIn.connect(filter);

			return filter;
		}

		var makeGainStage = function() {
			var gainStage = context.createGain();

			gainStage.gain.setValueAtTime(0, context.currentTime);
			gainStage.connect(self.compressor);

			return gainStage;
		}

		for (var i = 0, ii=bands.length; i < ii; i++) {
			var band = bands[i],
				filter = makeFilter(i, band),
				gainStage = makeGainStage();

			filter.connect(gainStage);

			self.filters.push(filter);
			self.gainStages.push(gainStage);
		}
	}

	ResonantFilterBank.prototype.connect = function(node) {
		this.audioOut.connect(node);
	}
	
	return ResonantFilterBank;

})();