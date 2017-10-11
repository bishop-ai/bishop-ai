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

        var hotWord = "bishop"; // Must be lowercase // TODO: Get this from the server and allow the server to update it at any time
        var useHotWord = true; // TODO: Allow this to be set by the user

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
                        speechService.speak(data.message);
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

        var listeningForHotWord = false;

        var stopListeningForHotWord = function () {
            speechService.stopListeningForHotWord();
            listeningForHotWord = false;
        };

        var listenForHotWord = function () {
            if (!listeningForHotWord && useHotWord && hotWord) {
                speechService.startListeningForHotWord(hotWord);
                listeningForHotWord = true;
            }
        };

        var listeningForCommand = false;

        var stopListeningForCommand = function () {
            $scope.recording = false;
            $scope.message = "";
            listenForHotWord();
            listeningForCommand = false;
        };

        var listenForCommand = function () {
            if (listeningForCommand) {
                return;
            }
            listeningForCommand = true;
            stopListeningForHotWord();
            $scope.recording = true;
            speechService.startListeningForCommand();
        };

        speechService.onCommandDetected($scope, function (event, transcript, isFinal) {
            if (!isFinal) {
                $scope.message = transcript;
            } else {
                if (transcript) {
                    console.log('Voice Match: ' + transcript);
                    socket.emit('command', {token : authenticationService.token, command: transcript});
                    $scope.transcript.push({html: null, m: transcript, ai: false});
                    messageSentTime = (new Date()).getTime();
                }

                stopListeningForCommand();
            }
        });

        speechService.onHotWordDetected($scope, function (event, transcript) {
            var command = null;
            if (transcript.toLowerCase().startsWith(hotWord + " ")) {
                command = transcript.substring(hotWord.length + 1).trim();
            } else if (transcript.toLowerCase().endsWith(" " + hotWord)) {
                command = transcript.substring(0, transcript.length - (hotWord.length + 1)).trim();
            }

            if (command) {
                console.log('Voice Match: ' + transcript);
                socket.emit('command', {token : authenticationService.token, command: command});
                $scope.transcript.push({html: null, m: transcript, ai: false});
                messageSentTime = (new Date()).getTime();
            } else {
                listenForCommand();
            }
        });

        $scope.toggleRecording = function () {
            if ($scope.recording) {
                speechService.stopListeningForCommand();
            } else {
                listenForCommand();
            }
        };

        listenForHotWord();

        $scope.$on("$destroy", function () {
            stopListeningForCommand();
            stopListeningForHotWord();
        });
    }
]);