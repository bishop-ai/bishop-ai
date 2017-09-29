angular.module('AI').controller('InterfaceCtrl', [
    '$rootScope',
    '$scope',
    '$sanitize',
    '$timeout',
    'socket',

    function ($rootScope,
              $scope,
              $sanitize,
              $timeout,
              socket) {

        //var hotWord = "wheatley"; // TODO: Get this from the server and allow the server to update it at any time
        //var useHotWord = true; // TODO: Allow this to be set by the user

        var speechSynthesis = window.speechSynthesis;
        var SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

        var voice;
        if (speechSynthesis && SpeechSynthesisUtterance) {
            speechSynthesis.onvoiceschanged = function() {
                voice = speechSynthesis.getVoices().filter(function(voice) { return voice.name === 'Google UK English Male'; })[0];
            };
        }

        $scope.message = "";
        $scope.transcript = [];
        $scope.recording = false;

        var messageSentTime;
        var messageReceivedTime;

        $scope.shouldFade = function ($index) {
            var isLastMessage = $index === $scope.transcript.length - 1;
            var isSecondToLast = $index === $scope.transcript.length - 2;
            var isLastAi = $scope.transcript[$scope.transcript.length - 1].ai;

            return !((isLastMessage) || (isSecondToLast && isLastAi));
        };

        socket.forward('response', $scope);
        $scope.$on('socket:response', function (ev, data) {
            messageReceivedTime = (new Date()).getTime();

            var randomStartDelay = Math.floor(Math.random() * 400) + 200;
            var finishDelay = 40 * data.message.length;
            var startWriteDelay = 0;
            var finishWriteDelay = 0;

            if (messageReceivedTime - messageSentTime < (randomStartDelay + finishDelay)) {
                startWriteDelay = randomStartDelay - (messageReceivedTime - messageSentTime);
                finishWriteDelay = finishDelay - (messageReceivedTime - messageSentTime);
            } else if (messageReceivedTime - messageSentTime < finishDelay) {
                finishWriteDelay = finishDelay - (messageReceivedTime - messageSentTime);
            }

            var startWriting = function () {
                var message = {m: '', html: $sanitize('<span class="ellipsis-anim"><span>.</span><span>.</span><span>.</span></span>'), ai: true};
                $scope.transcript.push(message);

                var handleMessage = function () {
                    if (data.message) {

                        if (speechSynthesis && SpeechSynthesisUtterance) {
                            var msg = new SpeechSynthesisUtterance(data.message);
                            msg.voice = voice;
                            speechSynthesis.speak(msg);
                        }

                        message.m = data.message;
                        message.html = $sanitize(data.html);
                        $rootScope.$emit("fire");
                    }
                };

                if (finishWriteDelay) {
                    $timeout(handleMessage, finishWriteDelay);
                } else {
                    handleMessage();
                }
            };

            if (startWriteDelay) {
                $timeout(startWriting, startWriteDelay);
            } else {
                startWriting();
            }
        });

        $scope.handleKeyPress = function (event) {
            if (event.which === 13 && $scope.message) {
                socket.emit('command', $scope.message);
                $scope.transcript.push({m: $scope.message, ai: false});
                $scope.message = "";
                event.preventDefault();
                messageSentTime = (new Date()).getTime();
            }
        };

        var SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition ||
            window.oSpeechRecognition;

        if (SpeechRecognition) {
            var recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            var handleResult = function (event) {
                var i;
                var finalTranscript = "";
                var interimTranscript = "";
                for (i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                    $scope.message = event.results[i][0].transcript;
                }

                var isMatch = true;

                /*if (useHotWord) {
                 isMatch = false;
                 var trimmed = finalTranscript.trim().toLowerCase();
                 if (trimmed.startsWith(hotWord) || trimmed.endsWith(hotWord)) {

                 isMatch = true;
                 if (trimmed.startsWith(hotWord)) {
                 finalTranscript = trimmed.replace(new RegExp("^" + hotWord,"i"), "");
                 } else {
                 finalTranscript = trimmed.replace(new RegExp(hotWord + "$","i"), "");
                 }
                 }
                 }*/

                if (isMatch) {
                    console.log('Voice Match: ' + finalTranscript);
                    socket.emit('command', finalTranscript);
                    $scope.transcript.push({html: null, m: finalTranscript, ai: false});
                    messageSentTime = (new Date()).getTime();
                }

                $scope.message = "";
            };

            recognition.onresult = function (event) {
                $scope.$apply(function () {
                    handleResult(event);
                });
            };

            // Start it if it ends
            recognition.onend = function() {
                if ($scope.recording) {
                    recognition.start();
                }
            };
        }

        $scope.toggleRecording = function () {
            var isRecording = $scope.recording;
            $scope.recording = !$scope.recording;
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        };
    }
]);