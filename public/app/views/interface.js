angular.module('AI').controller('InterfaceCtrl', [
    '$scope',
    'socket',

    function ($scope,
              socket) {

        $scope.message = "";
        $scope.transcript = [];
        $scope.audioFile = null;
        $scope.recording = false;

        socket.forward('response', $scope);
        $scope.$on('socket:response', function (ev, data) {
            $scope.audioFile = data.audio;
            $scope.transcript.unshift({m: data.message, ai: true});
        });

        $scope.handleKeyPress = function (event) {
            if (event.which === 13) {
                socket.emit('command', $scope.message);
                $scope.transcript.unshift({m: '> ' + $scope.message, ai: false});
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
                $scope.transcript.unshift({m: '$ ' + finalTranscript, ai: false});
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