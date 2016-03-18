module.exports = [
    {
        pointer: 0,
        expressions: [
            {value: "Yes"}
        ]
    },
    {
        pointer: 1,
        expressions: [
            {value: "No"}
        ]
    },
    {
        expressions: [
            {value: "Thank you"},
            {value: "Thanks"}
        ],
        transfer: [
            {
                expressions: [
                    {value: "You're welcome"},
                    {value: "No problem"},
                    {value: "My pleasure"}
                ]
            }
        ]
    },
    {
        pointer: 2,
        intent: "",
        expressions: [
            {value: "Hi"},
            {value: "Hello"},
            {value: "Hey"}
        ],
        follow: [
            {
                pointer: 3,
                intent: "do_you_need_help",
                expressions: [
                    {value: "Can I help you with anything?"},
                    {value: "Can I be of assistance?"}
                ],
                follow: [],
                transfer: [
                    {
                        _pointer: 0,
                        expressions: [
                            {value: "Yes actually"},
                            {value: "Yes please"}
                        ]
                    },
                    {
                        _pointer: 1,
                        expressions: [
                            {value: "That's alright"},
                            {value: "Nothing right now"},
                            {value: "No thank you"}
                        ]
                    }
                ]
            },
            {
                pointer: 3.1,
                intent: "do_you_need_help",
                expressions: [
                    {value: "How can I be of assistance?"}
                ],
                follow: [],
                transfer: [
                    {
                        expressions: [
                            {value: "That's alright"},
                            {value: "Nothing right now"}
                        ]
                    }
                ]
            },
            {
                pointer: 3.2,
                intent: "do_you_need_help",
                expressions: [
                    {value: "Is there something I can do for you?"}
                ],
                follow: [],
                transfer: [
                    {
                        _pointer: 0,
                        expressions: [
                            {value: "Yes actually"},
                            {value: "There is"}
                        ]
                    },
                    {
                        _pointer: 1,
                        expressions: [
                            {value: "That's alright"},
                            {value: "Nothing right now"},
                            {value: "No thank you"}
                        ]
                    }
                ]
            },
            {
                pointer: 3.3,
                intent: "do_you_need_help",
                expressions: [
                    {value: "Can I help you?"}
                ],
                follow: [],
                transfer: [
                    {
                        _pointer: 0,
                        expressions: [
                            {value: "Yes actually"}
                        ]
                    },
                    {
                        _pointer: 1,
                        expressions: [
                            {value: "That's alright"},
                            {value: "Not right now"},
                            {value: "No thank you"}
                        ]
                    }
                ]
            },
            {
                pointer: 5,
                condition: "rel.hasName",
                intent: "how_are_you",
                expressions: [
                    {value: "How are you?"},
                    {value: "How are you doing?"}
                ],
                follow: [],
                transfer: [
                    {
                        pointer: 6,
                        expressions: [
                            {value: "I'm fine"},
                            {value: "I am doing well"},
                            {value: "I am doing alright"},
                            {value: "Great thank you"}
                        ],
                        follow: [
                            {
                                _pointer: 5,
                                intent: "",
                                expressions: [
                                    {value: "How about you?"},
                                    {value: "How about yourself?"},
                                    {value: "And yourself?"}
                                ],
                                transfer: [
                                    {
                                        _pointer: 6,
                                        follow: []
                                    }
                                ]
                            }
                        ],
                        transfer: [
                            {
                                _pointer: 3
                            },
                            {
                                _pointer: 3.1
                            },
                            {
                                _pointer: 3.2
                            },
                            {
                                _pointer: 3.3
                            }
                        ]
                    }
                ]
            },
            {
                pointer: 7,
                condition: "rel.noName",
                intent: "what_is_your_name",
                expressions: [
                    {value: "What is your name?"}
                ],
                transfer: [
                    {
                        pointer: 8,
                        condition: "self.hasName",
                        expressions: [
                            {value: "My name is David", injector: "self.getName", trigger: "rel.setName"},
                            {value: "You can call me Jarvis", injector: "self.getName", trigger: "rel.setName"},
                            {value: "It's Allison", injector: "self.getName", trigger: "rel.setName"},
                            {value: "Call me Jude", injector: "self.getName", trigger: "rel.setName"}
                        ],
                        follow: [
                            {
                                pointer: 8.2,
                                condition: "rel.noName",
                                intent: "what_is_your_name",
                                expressions: [
                                    {value: "What is your name?"},
                                    {value: "What's yours?"}
                                ],
                                transfer: [
                                    {
                                        condition: "self.hasName",
                                        expressions: [
                                            {value: "My name is David", injector: "self.getName", trigger: "rel.setName"},
                                            {value: "You can call me Jarvis", injector: "self.getName", trigger: "rel.setName"},
                                            {value: "It's Allison", injector: "self.getName", trigger: "rel.setName"},
                                            {value: "Call me Jude", injector: "self.getName", trigger: "rel.setName"}
                                        ],
                                        transfer: [
                                            {
                                                pointer: 9,
                                                condition: "rel.hasName",
                                                intent: "",
                                                expressions: [
                                                    {value: "It's nice to meet you David", injector: "rel.getName"},
                                                    {value: "It's a pleasure to meet you Jarvis", injector: "rel.getName"}
                                                ]
                                            }
                                        ]
                                    },
                                    {
                                        condition: "false",
                                        expressions: [
                                            {value: "Micah", injector: "self.getName", trigger: "rel.setName"}
                                        ],
                                        transfer: [
                                            {
                                                _pointer: 9
                                            }
                                        ]
                                    },
                                    {
                                        pointer: 10,
                                        condition: "self.noName",
                                        expressions: [
                                            {value: "I'm not sure"},
                                            {value: "I don't know what my name is"},
                                            {value: "No one has ever given me a name"},
                                            {value: "What would you like to call me?"},
                                            {value: "What should my name be?"}
                                        ],
                                        transfer: [
                                            {
                                                pointer: 11,
                                                condition: "rel.hasName",
                                                intent: "your_name_is",
                                                expressions: [
                                                    {value: "Your name is David", injector: "rel.getName", trigger: "self.setName"},
                                                    {value: "I'll call you Jarvis", injector: "rel.getName", trigger: "self.setName"},
                                                    {value: "It's Micah", injector: "rel.getName", trigger: "self.setName"},
                                                    {value: "How about Jude", injector: "rel.getName", trigger: "self.setName"}
                                                ],
                                                transfer: [
                                                    {
                                                        pointer: 11.2,
                                                        expressions: [
                                                            {value: "Thank you"},
                                                            {value: "Thanks"}
                                                        ],
                                                        follow: [
                                                            {
                                                                condition: "rel.noName",
                                                                intent: "what_is_your_name",
                                                                expressions: [
                                                                    {value: "What is your name?"},
                                                                    {value: "What's yours?"}
                                                                ]
                                                            },
                                                            {
                                                                _pointer: 3
                                                            },
                                                            {
                                                                _pointer: 3.1
                                                            },
                                                            {
                                                                _pointer: 3.2
                                                            },
                                                            {
                                                                _pointer: 3.3
                                                            }
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                pointer: 11.1,
                                                condition: "false",
                                                intent: "your_name_is",
                                                expressions: [
                                                    {value: "Allison", injector: "rel.getName", trigger: "self.setName"}
                                                ],
                                                transfer: [
                                                    {
                                                        _pointer: 11.2
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ],
                        transfer: [
                            {
                                _pointer: 9
                            }
                        ]
                    },
                    {
                        pointer: 8.1,
                        condition: "false",
                        expressions: [
                            {value: "Micah", injector: "self.getName", trigger: "rel.setName"}
                        ],
                        follow: [
                            {
                                _pointer: 8.2
                            }
                        ],
                        transfer: [
                            {
                                _pointer: 9
                            }
                        ]
                    },
                    {
                        _pointer: 10
                    }
                ]
            },
            {
                condition: "rel.noName",
                intent: "who_are_you",
                expressions: [
                    {value: "Who are you?"}
                ],
                transfer: [
                    {
                        _pointer: 8
                    },
                    {
                        _pointer: 8.1
                    },
                    {
                        condition: "self.noName",
                        expressions: [
                            {value: "I'm not sure"}
                        ],
                        follow: [
                            {
                                intent: "what_is_your_name",
                                expressions: [
                                    {value: "What would you like to call me?"}
                                ],
                                transfer: [
                                    {
                                        _pointer: 11
                                    },
                                    {
                                        _pointer: 11.1
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                condition: "rel.noName",
                intent: "who_are_you",
                expressions: [
                    {value: "I'm not sure I know who you are"},
                    {value: "I'm not sure who you are"}
                ],
                transfer: [
                    {
                        _pointer: 8,
                        follow: [
                            {
                                intent: "",
                                expressions: [
                                    {value: "I am your personal assistant"},
                                    {value: "I'm here to help"}
                                ]
                            }
                        ]
                    },
                    {
                        intent: "",
                        expressions: [
                            {value: "I am your personal assistant"},
                            {value: "I'm here to help"}
                        ],
                        follow: [
                            {
                                condition: "self.noName",
                                intent: "what_is_your_name",
                                expressions: [
                                    {value: "What would you like to call me?"}
                                ],
                                transfer: [
                                    {
                                        _pointer: 11
                                    },
                                    {
                                        _pointer: 11.1
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        intent: "",
                        condition: "self.hasName",
                        expressions: [
                            {value: "I am your personal assistant, Allison", injector: "self.getName"}
                        ]
                    }
                ]
            },
            {
                condition: "rel.noName",
                intent: "who_are_you",
                expressions: [
                    {value: "I don't think we've met"},
                    {value: "I don't think I've met you before"}
                ],
                transfer: [
                    {
                        _pointer: 8
                    },
                    {
                        _pointer: 8.1
                    },
                    {
                        _pointer: 11
                    },
                    {
                        _pointer: 11.1
                    }
                ]
            }
        ],
        transfer: [
            {
                intent: "",
                expressions: [
                    {value: "Hi"},
                    {value: "Hello"}
                ],
                follow: [
                    {
                        _pointer: 3
                    },
                    {
                        _pointer: 3.1
                    },
                    {
                        _pointer: 3.2
                    },
                    {
                        _pointer: 3.3
                    },
                    {
                        _pointer: 5
                    }
                ]
            }
        ]
    },
    {
        intent: "what_is_my_name",
        expressions: [
            {value: "What is my name?"}
        ],
        transfer: [
            {
                condition: "rel.hasName",
                intent: "",
                expressions: [
                    {value: "Your name is David", injector: "rel.getName", trigger: "self.setName"},
                    {value: "It's Micah", injector: "rel.getName", trigger: "self.setName"}
                ]
            },
            {
                condition: "false",
                intent: "",
                expressions: [
                    {value: "Allison", injector: "rel.getName", trigger: "self.setName"}
                ]
            },
            {
                condition: "rel.noName",
                expressions: [
                    {value: "I'm not sure"},
                    {value: "I don't know what your name is"}
                ],
                follow: [
                    {
                        condition: "rel.noName",
                        expressions: [
                            {value: "What should I call you?"}
                        ],
                        transfer: [
                            {
                                _pointer: 8
                            },
                            {
                                _pointer: 8.1
                            }
                        ]
                    }
                ]
            }
        ]
    }
];