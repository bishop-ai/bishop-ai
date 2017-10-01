angular.module('AI').factory('speechService', [

    function () {

        // TODO: Move more speech handling here.

        var speechService = {
            voice: null,
            speechSynthesis: window.speechSynthesis,
            SpeechSynthesisUtterance: window.SpeechSynthesisUtterance
        };

        if (speechService.speechSynthesis && speechService.SpeechSynthesisUtterance) {
            speechService.speechSynthesis.onvoiceschanged = function() {
                speechService.voice = speechService.speechSynthesis.getVoices().filter(function(voice) { return voice.name === 'Google UK English Male'; })[0];
            };
        }

        speechService.SpeechRecognition = window.SpeechRecognition ||
            window.webkitSpeechRecognition ||
            window.mozSpeechRecognition ||
            window.msSpeechRecognition ||
            window.oSpeechRecognition;

        return speechService;
    }
]);