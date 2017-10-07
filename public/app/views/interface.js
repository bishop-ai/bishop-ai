angular.module('AI').controller('InterfaceCtrl', [
    '$rootScope',
    '$scope',
    '$sanitize',
    '$timeout',
    'authenticationService',
    'socket',
    'speechService',

    function ($rootScope,
              $scope,
              $sanitize,
              $timeout,
              authenticationService,
              socket,
              speechService) {

        //var hotWord = "wheatley"; // TODO: Get this from the server and allow the server to update it at any time
        //var useHotWord = true; // TODO: Allow this to be set by the user

        $scope.message = "";
        $scope.transcript = [];
        $scope.recording = false;

        var messageSentTime;
        var messageReceivedTime;

        $scope.supportsSpeechRecognition = !!speechService.SpeechRecognition;

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

                        if (speechService.speechSynthesis && speechService.SpeechSynthesisUtterance) {
                            var msg = new speechService.SpeechSynthesisUtterance(data.message);
                            msg.voice = speechService.voice;
                            speechService.speechSynthesis.speak(msg);
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
                socket.emit('command', {token : authenticationService.token, command: $scope.message});
                $scope.transcript.push({m: $scope.message, ai: false});
                $scope.message = "";
                event.preventDefault();
                messageSentTime = (new Date()).getTime();
            }
        };

        if (speechService.SpeechRecognition) {
            var recognition = new speechService.SpeechRecognition();
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
                    socket.emit('command', {token : authenticationService.token, command: finalTranscript});
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