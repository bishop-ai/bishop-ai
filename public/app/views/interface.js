angular.module('AI').controller('InterfaceCtrl', [
    '$scope',
    'socket',

    function ($scope,
              socket) {

        var voice;
        window.speechSynthesis.onvoiceschanged = function() {
            voice = window.speechSynthesis.getVoices().filter(function(voice) { return voice.name === 'Google UK English Male'; })[0];
        };

        $scope.message = "";
        $scope.transcript = [];
        $scope.audioFile = null;
        $scope.recording = false;

        socket.forward('response', $scope);
        $scope.$on('socket:response', function (ev, data) {
            $scope.audioFile = data.audio;
            if (data.message) {
                var msg = new SpeechSynthesisUtterance(data.message);
                msg.voice = voice;
                window.speechSynthesis.speak(msg);
                $scope.transcript.push({m: '> ' + data.message, ai: true});
            }
        });

        $scope.handleKeyPress = function (event) {
            if (event.which === 13 && $scope.message) {
                socket.emit('command', $scope.message);
                $scope.transcript.push({m: $scope.message + ' <', ai: false});
                $scope.message = "";
                event.preventDefault();
            }
        };

        var SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition ||
            window.oSpeechRecognition;

        if (window.webkitSpeechRecognition) {
            var recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = function (event) {
                console.log(event.results);

                var i;
                var finalTranscript = "";
                var interimTranscript = "";
                for (i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                console.log('Voice Match: ' + finalTranscript);
                socket.emit('command', finalTranscript);
                $scope.transcript.push({m: finalTranscript + ' $', ai: false});
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