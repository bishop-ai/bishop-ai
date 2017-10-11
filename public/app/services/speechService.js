angular.module('AI').factory('speechService', [
    '$rootScope',

    function ($rootScope) {

        // TODO: Move more speech handling here.

        var speechService = {
            voice: null,
            speechSynthesis: window.speechSynthesis,
            SpeechSynthesisUtterance: window.SpeechSynthesisUtterance,
            commandRecognition: null,
            hotWordRecognition: null,
            listeningForHotWord: false,
            hotWordListeners: [],
            commandListeners: []
        };

        if (speechService.speechSynthesis && speechService.SpeechSynthesisUtterance) {
            speechService.speechSynthesis.onvoiceschanged = function() {
                speechService.voice = speechService.speechSynthesis.getVoices().filter(function(voice) { return voice.name === 'Google UK English Male'; })[0];
            };
        }

        var capitalizeFirstLetter = function (string) {
            string = string.trim();
            if (string.length > 0) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            return string;
        };

        var initializeCommandRecognition = function () {
            if (!speechService.commandRecognition) {
                speechService.commandRecognition = new speechService.SpeechRecognition();
                speechService.commandRecognition.continuous = false;
                speechService.commandRecognition.lang = 'en-US';
                speechService.commandRecognition.interimResults = true;
            }
        };

        var initializeHotWordRecognition = function () {
            if (!speechService.hotWordRecognition) {
                speechService.hotWordRecognition = new speechService.SpeechRecognition();
                speechService.hotWordRecognition.continuous = true;
                speechService.hotWordRecognition.lang = 'en-US';
                speechService.hotWordRecognition.interimResults = false;
                speechService.hotWordRecognition.maxAlternatives = 1;
            }
        };

        var callHotWordListeners = function (transcript) {
            $rootScope.$apply(function () {
                $rootScope.$emit('speech-service-hot-word', transcript);
            });
        };

        var callCommandListeners = function (transcript, isFinal) {
            $rootScope.$apply(function () {
                $rootScope.$emit('speech-service-command', transcript, isFinal);
            });
        };

        speechService.speak = function (message) {
            if (this.speechSynthesis && this.SpeechSynthesisUtterance) {
                var msg = new this.SpeechSynthesisUtterance(message);
                msg.voice = this.voice;
                this.speechSynthesis.speak(msg);
            }
        };

        speechService.onHotWordDetected = function (scope, callback) {
            var handler = $rootScope.$on('speech-service-hot-word', callback);
            scope.$on('$destroy', handler);
        };

        speechService.onCommandDetected = function (scope, callback) {
            var handler = $rootScope.$on('speech-service-command', callback);
            scope.$on('$destroy', handler);
        };

        speechService.startListeningForCommand = function () {
            if (!this.SpeechRecognition) {
                console.log("Speech Recognition not supported");
                return;
            }

            initializeCommandRecognition();

            var transcript = "";

            var madeCall = false;

            this.commandRecognition.onresult = function (event) {
                var i;
                transcript = "";
                for (i = event.resultIndex; i < event.results.length; ++i) {
                    transcript += event.results[i][0].transcript;
                }

                if (transcript && !madeCall) {
                    callCommandListeners(transcript, false);
                }
            };

            var handleFinish = function () {
                speechService.commandRecognition.stop();
                if (!madeCall) {
                    if (transcript) {
                        transcript = capitalizeFirstLetter(transcript);
                        console.log("Command detected: " + transcript);
                    }
                    callCommandListeners(transcript, true);
                    madeCall = true;
                }
            };

            this.commandRecognition.onspeechend = handleFinish;
            this.commandRecognition.onend = handleFinish;
            this.commandRecognition.onerror = handleFinish;

            this.commandRecognition.start();
        };

        speechService.stopListeningForCommand = function () {
            if (this.commandRecognition) {
                this.commandRecognition.stop();
            }
        };

        speechService.startListeningForHotWord = function (hotWord) {
            if (!this.SpeechRecognition) {
                console.log("Speech Recognition not supported");
                return;
            }

            initializeHotWordRecognition();

            this.hotWordRecognition.onresult = function (event) {
                var last = event.results.length - 1;
                var transcript = event.results[last][0].transcript;

                if (transcript.toLowerCase().indexOf(hotWord) >= 0) {
                    transcript = capitalizeFirstLetter(transcript);
                    console.log("HotWord detected: " + transcript + ". Confidence: " + event.results[last][0].confidence);
                    callHotWordListeners(transcript);
                }
            };

            // Start it if it ends
            this.hotWordRecognition.onend = function() {
                if (this.listeningForHotWord) {
                    this.hotWordRecognition.start();
                }
            }.bind(this);

            this.listeningForHotWord = true;
            this.hotWordRecognition.start();
        };

        speechService.stopListeningForHotWord = function () {
            if (this.hotWordRecognition) {
                this.listeningForHotWord = false;
                this.hotWordRecognition.stop();
            }
        };

        speechService.SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition ||
            window.oSpeechRecognition;

        return speechService;
    }
]);