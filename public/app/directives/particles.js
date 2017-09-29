angular.module('AI').directive('particles', [
    function () {
        return {
            restrict: 'A',
            scope: {
                'config': '=particles'
            },
            link: function (scope, elem) {

                scope.$watch("config", function () {
                    var config = angular.extend({
                        "particles": {
                            "number": {
                                "value": 40,
                                "density": {
                                    "enable": false,
                                    "value_area": 1000
                                }
                            },
                            "color": {
                                "value": "#aed0d0"
                            },
                            "shape": {
                                "type": "polygon",
                                "stroke": {
                                    "width": 0,
                                    "color": "#aed0d0"
                                },
                                "polygon": {
                                    "nb_sides": 6
                                }
                            },
                            "opacity": {
                                "value": 0.09,
                                "random": true,
                                "anim": {
                                    "enable": false,
                                    "speed": 0.1,
                                    "opacity_min": 0,
                                    "sync": false
                                }
                            },
                            "size": {
                                "value": 4,
                                "random": true,
                                "anim": {
                                    "enable": false,
                                    "speed": 80,
                                    "size_min": 0.1,
                                    "sync": false
                                }
                            },
                            "line_linked": {
                                "enable": true,
                                "distance": 300,
                                "color": "#aed0d0",
                                "opacity": 0.2,
                                "width": 1
                            },
                            "move": {
                                "enable": true,
                                "speed": 5,
                                "direction": "none",
                                "random": false,
                                "straight": false,
                                "out_mode": "bounce",
                                "bounce": false,
                                "attract": {
                                    "enable": true,
                                    "rotateX": 600,
                                    "rotateY": 1200
                                }
                            }
                        },
                        "interactivity": {
                            "detect_on": "canvas",
                            "events": {
                                "onhover": {
                                    "enable": false,
                                    "mode": "grab"
                                },
                                "onclick": {
                                    "enable": true,
                                    "mode": "repulse"
                                },
                                "resize": true
                            },
                            "modes": {
                                "grab": {
                                    "distance": 300,
                                    "line_linked": {
                                        "opacity": 0.5
                                    }
                                },
                                "bubble": {
                                    "distance": 800,
                                    "size": 10,
                                    "duration": 0.5,
                                    "opacity": 0.7,
                                    "speed": 0.1
                                },
                                "repulse": {
                                    "distance": 400,
                                    "duration": 0.3
                                },
                                "push": {
                                    "particles_nb": 4
                                },
                                "remove": {
                                    "particles_nb": 2
                                }
                            }
                        },
                        "retina_detect": true
                    }, scope.config);

                    particlesJS("particles-js", config);
                });

                scope.$on("fire", function () {
                    var canvas = elem.find("canvas")[0];
                    var bodyWidth = elem.width();
                    var bodyHeight = elem.height();
                    var randPosX = Math.floor((Math.random() * bodyWidth));
                    var randPosY = Math.floor((Math.random() * bodyHeight));

                    var particles = pJSDom[0].pJS;
                    particles.interactivity.mouse.pos_x = bodyWidth / 2;
                    particles.interactivity.mouse.pos_y = bodyHeight / 2;

                    var evt = new MouseEvent("click", {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(evt);

                    particles.fn.modes.removeParticles(5);

                    particles.interactivity.mouse.pos_x = randPosX;
                    particles.interactivity.mouse.pos_y = randPosY;
                    particles.fn.modes.pushParticles(5, particles.interactivity.mouse);
                });
            }
        };
    }
]);