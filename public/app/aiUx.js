angular.module('AI').directive('aiUx', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'source': '=aiUx'
            },
            link: function (scope, elem) {

                var audio = elem.find('audio');
                var canvas = elem.find('canvas');

                var FFT_SIZE = 512;
                var TYPE = {
                    'lounge': 'renderLounge'
                };

                /**
                 * @description
                 * Visualizer constructor.
                 *
                 * @param {Object} cfg
                 */
                function Visualizer(cfg) {
                    this.loop = cfg.loop || false;
                    this.audio = cfg.audio || {};
                    this.canvas = cfg.canvas || {};
                    this.canvasCtx = this.canvas.getContext('2d') || null;
                    this.author = this.audio.getAttribute('data-author') || '';
                    this.ctx = null;
                    this.analyser = null;
                    this.sourceNode = null;
                    this.frequencyData = [];
                    this.style = cfg.style || 'lounge';
                    this.barWidth = cfg.barWidth || 2;
                    this.barHeight = cfg.barHeight || 2;
                    this.barSpacing = cfg.barSpacing || 5;
                    this.barColor = cfg.barColor || '#ffffff';
                    this.shadowBlur = cfg.shadowBlur || 10;
                    this.shadowColor = cfg.shadowColor || '#ffffff';
                    this.font = cfg.font || ['12px', 'Helvetica'];
                    this.gradient = null;
                }

                /**
                 * @description
                 * Set current audio context.
                 *
                 * @return {Object}
                 */
                Visualizer.prototype.setContext = function () {
                    try {
                        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                        return this;
                    } catch (e) {
                        console.info('Web Audio API is not supported.', e);
                    }
                };

                /**
                 * @description
                 * Set buffer analyser.
                 *
                 * @return {Object}
                 */
                Visualizer.prototype.setAnalyser = function () {
                    this.analyser = this.ctx.createAnalyser();
                    this.analyser.smoothingTimeConstant = 0.6;
                    this.analyser.fftSize = FFT_SIZE;
                    return this;
                };

                /**
                 * @description
                 * Set frequency data.
                 *
                 * @return {Object}
                 */
                Visualizer.prototype.setFrequencyData = function () {
                    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
                    return this;
                };

                /**
                 * @description
                 * Set source buffer and connect processor and analyser.
                 *
                 * @return {Object}
                 */
                Visualizer.prototype.setBufferSourceNode = function () {
                    this.sourceNode = this.ctx.createBufferSource();
                    this.sourceNode.loop = this.loop;
                    this.sourceNode.connect(this.analyser);
                    this.sourceNode.connect(this.ctx.destination);

                    this.sourceNode.onended = function () {
                        this.sourceNode.disconnect();
                        this.sourceNode = this.ctx.createBufferSource();
                    }.bind(this);

                    return this;
                };

                /**
                 * @description
                 * Set canvas gradient color.
                 *
                 * @return {Object}
                 */
                Visualizer.prototype.setCanvasStyles = function () {
                    this.gradient = this.canvasCtx.createLinearGradient(0, 0, 0, 300);
                    this.gradient.addColorStop(1, this.barColor);
                    this.canvasCtx.fillStyle = this.gradient;
                    this.canvasCtx.shadowBlur = this.shadowBlur;
                    this.canvasCtx.shadowColor = this.shadowColor;
                    this.canvasCtx.font = this.font.join(' ');
                    this.canvasCtx.textAlign = 'center';
                    return this;
                };

                /**
                 * @description
                 * Load sound file.
                 */
                Visualizer.prototype.loadSound = function (src) {
                    var req = new XMLHttpRequest();
                    req.open('GET', src, true);
                    req.responseType = 'arraybuffer';
                    this.canvasCtx.fillText('Loading...', this.canvas.width / 2 + 10, this.canvas.height / 2);

                    req.onload = function () {
                        audio.find('source').attr('src', src);
                        this.ctx.decodeAudioData(req.response, this.playSound.bind(this), function (e) {
                            console.log('Error Decoding Audio: ' + e);
                        });
                    }.bind(this);

                    req.send();
                };

                /**
                 * @description
                 * Play sound from the given buffer.
                 *
                 * @param  {Object} buffer
                 */
                Visualizer.prototype.playSound = function (buffer) {
                    this.setBufferSourceNode();
                    this.sourceNode.buffer = buffer;
                    this.sourceNode.start(0);
                    this.renderFrame();
                };

                /**
                 * @description
                 * Render frame on canvas.
                 */
                Visualizer.prototype.renderFrame = function () {
                    requestAnimationFrame(this.renderFrame.bind(this));
                    this.analyser.getByteFrequencyData(this.frequencyData);

                    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

                    this.renderByStyleType();
                };

                /**
                 * @description
                 * Render frame by style type.
                 *
                 * @return {Function}
                 */
                Visualizer.prototype.renderByStyleType = function () {
                    return this[TYPE[this.style]]();
                };

                /**
                 * @description
                 * Render lounge style type.
                 */
                Visualizer.prototype.renderLounge = function () {
                    var cx = this.canvas.width / 2;
                    var cy = this.canvas.height / 2;
                    var radius = 140;
                    var maxBarNum = Math.floor((radius * 2 * Math.PI) / (this.barWidth + this.barSpacing));
                    var slicedPercent = Math.floor((maxBarNum * 25) / 100);
                    var barNum = maxBarNum - slicedPercent;
                    var freqJump = Math.floor(this.frequencyData.length / maxBarNum);

                    for (var i = 0; i < barNum; i++) {
                        var amplitude = this.frequencyData[i * freqJump];
                        var alfa = (i * 2 * Math.PI ) / maxBarNum;
                        var beta = (3 * 45 - this.barWidth) * Math.PI / 180;
                        var x = 0;
                        var y = radius - (amplitude / 12 - this.barHeight);
                        var w = this.barWidth;
                        var h = amplitude / 6 + this.barHeight;

                        this.canvasCtx.save();
                        this.canvasCtx.translate(cx + this.barSpacing, cy + this.barSpacing);
                        this.canvasCtx.rotate(alfa - beta);
                        this.canvasCtx.fillRect(x, y, w, h);
                        this.canvasCtx.restore();
                    }
                };

                var visualizer = new Visualizer({
                    loop: false,
                    audio: audio[0],
                    canvas: canvas[0],
                    style: 'lounge',
                    barWidth: 2,
                    barHeight: 2,
                    barSpacing: 7,
                    barColor: '#cafdff',
                    shadowBlur: 20,
                    shadowColor: '#ffffff',
                    font: ['12px', 'Helvetica']
                });

                visualizer
                    .setContext()
                    .setAnalyser()
                    .setFrequencyData()
                    .setCanvasStyles();

                visualizer.renderFrame();

                var handleClick = function () {
                    $('#input')[0].focus();
                };
                elem.on('click', handleClick);

                scope.$watch('source', function (val, oldVal) {
                    if (val && val !== oldVal) {
                        visualizer.loadSound(val);
                    }
                    scope.source = null;
                });

                scope.$on('$destroy', function () {
                    elem.off('click', handleClick);
                });
            }
        };
    }
]);